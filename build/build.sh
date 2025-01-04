#!/bin/bash

# Thanks, Ghabry! (Reference: https://community.easyrpg.org/t/how-to-build-web-version-of-easyrpg-player/1009)

# sudo semanage fcontext -a -t container_file_t "$PWD(/.*)?"
# sudo restorecon -R $PWD
# docker run --rm -it -v $PWD:/easyrpg ubuntu
# bash ./build.sh

set -eo pipefail

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

function patch_deps_pre () {
    echo "Patching dependencies list..."
    pushd "$SCRIPT_DIR/buildscripts"
    patch -p1 < "$SCRIPT_DIR/patches/patch-savannah.patch"
    shared/ini2sh.py
    popd
}

function patch_deps () {
    echo "Patching dependencies..."
    pushd "$SCRIPT_DIR/buildscripts"
    popd
}

function patch_lcf () {
    echo "Patching LCF..."
    pushd "$SCRIPT_DIR/Player/lib/liblcf"
    patch -p1 < "$SCRIPT_DIR/patches/patch-dbbit-swap.patch"
    popd
}

function patch_player () {
    echo "Patching Player..."
    pushd "$SCRIPT_DIR/Player"
    popd
}

pushd /

apt update
apt install -y python3-venv git build-essential python3 curl unzip automake pkg-config libtool cmake vim ripgrep python3-pip
apt upgrade -y

python3 -m venv venv

. /venv/bin/activate

pip3 install meson ninja

popd

pushd /easyrpg/buildscripts/emscripten

export PKG_CONFIG="$(which pkg-config)"

patch_deps_pre
./1_download_library.sh
patch_deps
./2_build_toolchain.sh
./3_cleanup.sh

popd

pushd /easyrpg/Player

rm -rf lib

mkdir lib

pushd lib

git clone https://github.com/EasyRPG/liblcf

patch_lcf

popd

patch_player

export TOOLCHAIN_DIR=$PWD/../buildscripts/emscripten/
cmake . -GNinja -Bbuild \
  -DCMAKE_TOOLCHAIN_FILE=$TOOLCHAIN_DIR/emsdk-portable/upstream/emscripten/cmake/Modules/Platform/Emscripten.cmake \
  -DCMAKE_FIND_ROOT_PATH_MODE_LIBRARY=BOTH \
  -DCMAKE_FIND_ROOT_PATH_MODE_INCLUDE=BOTH \
  -DCMAKE_FIND_ROOT_PATH_MODE_PACKAGE=BOTH \
  -DCMAKE_PREFIX_PATH="$TOOLCHAIN_DIR" \
  -DCMAKE_INSTALL_PREFIX=output -DCMAKE_BUILD_TYPE=Release \
  -DPLAYER_BUILD_LIBLCF=ON \
  -DPLAYER_JS_BUILD_SHELL=ON

cmake --build build --target install

popd
