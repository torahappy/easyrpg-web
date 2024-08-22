#!/bin/bash

# sudo semanage fcontext -a -t container_file_t "$PWD(/.*)?"
# sudo restorecon -R $PWD
# docker run --rm -it -v $PWD:/easyrpg ubuntu
# bash ./build.sh

set -eu

apt update
apt install -y git build-essential python3 curl unzip automake pkg-config libtool cmake meson vim ripgrep
apt upgrade -y

cd /easyrpg/buildscripts/emscripten

export PKG_CONFIG="$(which pkg-config)"

./0_build_everything.sh

cd /easyrpg/Player

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
