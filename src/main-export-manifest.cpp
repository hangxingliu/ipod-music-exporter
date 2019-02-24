#include <iostream>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <libintl.h>
#include <locale.h>
#include <QtCore>
#include <gpod/itdb.h>

using namespace std;

const QString MANIFEST_FILE("all-ipod-music.json");

[[ noreturn ]] void usage(const char* _bin) {
    auto bin = QFileInfo(QString(_bin)).baseName().toStdString();
    cout << "Usage: " << bin << " <mountpoint>\n\n";
    exit(0);
}

static void parsePlaylist(Itdb_Track *track, QJsonArray &results) {
    QJsonObject jsonTrack;
    if (track->ipod_path) jsonTrack["path"] = QString(track->ipod_path).replace(":", "/");
    if (track->title) jsonTrack["title"] = track->title;
    if (track->artist) jsonTrack["artist"] = track->artist;
    if (track->album) jsonTrack["album"] = track->album;
    jsonTrack["playcount"] = (int) track->playcount;
    jsonTrack["playcount2"] = (int) track->playcount2;
    results.push_back(jsonTrack);
}

static void parsePlayList(Itdb_Playlist *playlist, QJsonArray &results) {
    QJsonObject jsonPlaylist;
    QJsonArray jsonTracks;
    jsonPlaylist["name"] = QString(playlist->name);

    if (itdb_playlist_is_mpl(playlist)) {
        jsonPlaylist["master"] = true;
        cout << "[.] master play list: " << playlist->name;
    } else if (itdb_playlist_is_podcasts(playlist)) {
        jsonPlaylist["podcast"] = true;
        cout << "[.] podcast play list: " << playlist->name;
    } else {
        cout << "[.] normal play list: " << playlist->name;
    }

    cout << "  tracks: " << g_list_length(playlist->members) << "\n";
    GList *it;
    for (it = playlist->members; it != nullptr; it = it->next)
        parsePlaylist((Itdb_Track *) it->data, jsonTracks);

    jsonPlaylist["tracks"] = jsonTracks;
    results.push_back(jsonPlaylist);
}

int main(int argc, char *argv[]) {
    setlocale(LC_ALL, "en_US.utf8");

    if(argc < 2)
        usage(argv[0]);

    QString mountPoint = argv[1];

    GError *error = nullptr;
    Itdb_iTunesDB *itdb;

    itdb = itdb_parse(mountPoint.toStdString().c_str(), &error);
    if (error) {
        cerr << "[-] error: itdb_parse failed: " << (error->message ? error->message : "") << "\n";
        g_error_free(error);
        error = nullptr;
    }

    QJsonArray jsonPlayLists;
    if (itdb) {
        cout << "[~] parsed itdb:\n"
                << "     file name:      " << itdb->filename << "\n"
                << "     playList count: " << g_list_length(itdb->playlists) << "\n";

        GList *it;
        for (it = itdb->playlists; it != nullptr; it = it->next)
            parsePlayList((Itdb_Playlist *) it->data, jsonPlayLists);

        itdb_free(itdb);
    }


    QJsonObject jsonRoot;
    jsonRoot["mount"] = mountPoint;
    jsonRoot["playlist"] = jsonPlayLists;

    QJsonDocument jsonDoc(jsonRoot);
    QFile manifestFile(MANIFEST_FILE);
    if (!manifestFile.open(QIODevice::WriteOnly)) {
        cerr << "[-] fatal: save manifest file to " << MANIFEST_FILE.toStdString() << " failed!"
            << "(can not open as QIODevice::WriteOnly)";
        return 1;
    }
    manifestFile.write(jsonDoc.toJson());
    cout << "[+] manifest has been saved in " << MANIFEST_FILE.toStdString() << "\n";
    return 0;
}
