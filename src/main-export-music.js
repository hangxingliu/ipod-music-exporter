#!/usr/bin/env node
//@ts-check

const fs = require('fs');
const path = require('path');

const INPUT_MANIFEST = 'all-ipod-music.json';
const DEFAULT_FILENAME = '{index} - {artist} - {title}';

main(process.argv.slice(2)).catch(fatal);

function usage() {
	console.log([
		``,
		`  Usage: ${path.basename(process.argv[1])} [...options] <target-dir>`,
		``,
		`  Options:`,
		``,
		`    -n, --name <filename>      format for filename ("${DEFAULT_FILENAME}" by default)`,
		`        --overwrite            overwrite target file if it is existed`,
		``,
		`  Filename variables:`,
		``,
		`    {album}, {artist}, {title}`,
		``,
	].join('\n'));
	process.exit(0);
}

function fatal(msg) {
	if (msg && msg.message)
		msg = msg.message;
	console.error(`[-] fatal: ${msg}\nscript exit with code 1`);
	process.exit(1);
}

function normalizeFilename(fileName = '') {
	// https://github.com/sindresorhus/filename-reserved-regex/blob/master/index.js
	fileName = fileName.replace(/[<>:"\/\\|?*\x00-\x1F]/g, '');
	if (fileName.match(/^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i))
		throw new Error(`invalid file name "${fileName}"`);
	return fileName;
}

function getFileName(trackObj, format = '') {
	// Example trackObj:
	// { "index": 1,
	//   "album": "Sex Appeal (Max Farenthide Remix)",
	//   "artist": "Bueno Clinic/Mike W.",
	//   "path": "/iPod_Control/Music/F10/QSGI.mp3",
	//   "playcount": 60,
	//   "playcount2": 60,
	//   "title": "Sex Appeal (Max Farenthide Remix)" }
	if (!trackObj)
		throw new Error(`trackObj is falsy!`);
	const extName = path.extname(trackObj.path);
	const name = format.replace(/\{(\w+)\}/g, (_, it) => trackObj[it] || '');
	return normalizeFilename(`${name}${extName}`);
}


async function main(argv = []) {
	let targetWorkspace = '';
	let fileNameFormat = DEFAULT_FILENAME;
	let enabledOverwrite = false;
	let alwaysFilename = false;

	if (argv.length < 1) usage();
	for (let i = 0; i < argv.length; i++) {
		const arg = String(argv[i]);
		if (!alwaysFilename) {
			if (arg === '-h' || arg === '--help') usage();
			if (arg === '--') {
				alwaysFilename = true;
				continue;
			}
			if (arg === '--overwrite') {
				enabledOverwrite = true;
				continue;
			}
			if (arg === '-n' || arg === '--name' || arg.startsWith('--name=')) {
				const format = arg.startsWith('--name=') ? arg.slice('--name'.length) : argv[i++];
				if (!format)
					throw new Error(`an format string should be followed by -n|--name`);
				fileNameFormat = format;
				continue;
			}
			if (arg.startsWith('-'))
				throw new Error(`unknown option: ${arg}`);
		}
		targetWorkspace = arg;
	}

	if (!fs.existsSync(targetWorkspace))
		throw new Error(`${targetWorkspace} is not existed!`);
	if (!fs.statSync(targetWorkspace).isDirectory())
		throw new Error(`${targetWorkspace} is not a directory!`);

	let manifest = {};
	try {
		const ctx = fs.readFileSync(INPUT_MANIFEST, 'utf8');
		manifest = JSON.parse(ctx);
	} catch (err) {
		throw new Error(`load ${INPUT_MANIFEST} failed!`);
	}

	console.log(`[~] export info`);
	console.log(`      from:     ${manifest.mount}`);
	console.log(`      to:       ${targetWorkspace}`);
	console.log(`      playlist: ${manifest.playlist.length}`);
	console.log(``);

	for (const playlist of manifest.playlist) {
		const { tracks, master, podcast, name } = playlist;
		if (master) {
			console.log(`[~] skiped ${name} (master playlist)`)
			continue;
		}
		console.log(`[.] ${name}${podcast ? ' (podcast)' : ''} (${tracks.length} tracks) ...`);
		const targetDir = path.join(targetWorkspace, normalizeFilename(name));
		if (!fs.existsSync(targetDir))
			fs.mkdirSync(targetDir);

		let i = 1;
		let copied = 0;
		for (const track of tracks) {
			const targetFileName =
				getFileName(Object.assign({}, track, { index: i++ }), fileNameFormat);
			const sourceFilePath = path.join(manifest.mount, track.path);
			const targetFilePath = path.join(targetDir, targetFileName);
			track.target = path.join(playlist.name, targetFileName);

			if (fs.existsSync(targetFilePath) && !enabledOverwrite)
				continue;
			if (!fs.existsSync(sourceFilePath))
				throw new Error(`${sourceFilePath} is not existed! (${JSON.stringify(track)})`);

			fs.copyFileSync(sourceFilePath, targetFilePath);
			copied++;
		}
		console.log(`[~] copied ${copied} files`)
	}

	const targetManifest = path.join(targetWorkspace, INPUT_MANIFEST);
	console.log(`[.] writing manifest file: ${targetManifest}`);
	const manifestJSON = JSON.stringify(manifest, null, '\t');
	fs.writeFileSync(targetManifest, manifestJSON);
	console.log(`[~] writed manifest into file`);

	console.log(`[+] exported to ${targetWorkspace}`)
}

