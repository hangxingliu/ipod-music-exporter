#!/usr/bin/env bash

throw() { echo "[-] fatal: $1"; exit 1; }

pushd "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && cd .. && pwd )" || throw;

mkdir -p build || throw;
pushd build || throw;
cmake .. || throw;
make || throw;

echo "[+] build done!";
