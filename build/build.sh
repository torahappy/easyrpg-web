#!/bin/bash

set -eo pipefail

# Thanks, Ghabry! (Reference: https://community.easyrpg.org/t/how-to-build-web-version-of-easyrpg-player/1009)

echo "installing build dependencies......"

pushd /

apt update
apt install -y python3-venv git build-essential python3 curl unzip automake pkg-config libtool cmake vim ripgrep python3-pip
apt upgrade -y

python3 -m venv venv

. /venv/bin/activate

pip3 install meson ninja

popd

echo "duplicationg EasyRPG repo......"

pushd /easyrpg

./clone.sh

popd

. ./patch.sh

echo "building EasyRPG dependencies......"

pushd /easyrpg/buildscripts/emscripten

export PKG_CONFIG="$(which pkg-config)"

patch_deps_pre
./1_download_library.sh
patch_deps
./2_build_toolchain.sh
./3_cleanup.sh

popd

echo "building EasyRPG and LCF......"

pushd /easyrpg/Player

pushd lib

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
