# Export iPod Music

Export music in your iPod.

## Build

Install Qt and Node.js development environment.

Check the [Dockerfile](Dockerfile) for get information of dependencies and building steps.

### Run Docker behind the proxy 

```
docker build -t ipod-music-exporter \
	--build-arg http_proxy=http://192.168.1.1:8000 \
	--build-arg https_proxy=http://192.168.1.1:8000 \
	.
```

## Usage

Example:

``` bash
# export a manifest json: all-ipod-music.json
./build/export-manifest /media/hangxingliu/iPodOfHangxingliu

# export music files according to all-ipod-music.json
./build/export-music.js /home/hangxingliu/Music/iPod
```

## Author

[Liu Yue (@hangxingliu)](https://github.com/hangxingliu)

## License

[GPL-3.0](LICENSE)
