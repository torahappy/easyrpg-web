#!/bin/bash

set -eu

. ./commits.sh

if [ ! -d buildscripts ]; then
  git clone https://github.com/EasyRPG/buildscripts
fi
pushd buildscripts
git pull
git reset --hard $BUILDSCRIPTS_COMMIT
git clean -dfx
popd

if [ ! -d Player ]; then
  git clone https://github.com/EasyRPG/Player
fi
pushd Player
git pull
git reset --hard $PLAYER_COMMIT
git clean -dfx

mkdir -p lib
pushd lib
if [ ! -d liblcf ]; then
  git clone https://github.com/EasyRPG/liblcf
fi
pushd liblcf
git pull
git reset --hard $LCF_COMMIT
git clean -dfx
popd
popd

popd
