#!/usr/bin/env bash

throw() { echo "[-] fatal: $1"; exit 1; }

[[ -z "$(which docker)" ]] && throw "docker is missing!";

pushd "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && cd .. && pwd )" || throw;

docker build -t ipod-music-exporter \
	--build-arg http_proxy --build-arg https_proxy \
	. || throw;

echo "[+] build via docker success!";

