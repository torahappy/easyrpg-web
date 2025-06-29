#!/bin/bash

set -eu

. ./commits.sh

if [ ! -d buildscripts ]; then
  git clone https://github.com/EasyRPG/buildscripts
fi
pushd buildscripts
git clean -dfx
git reset --hard
git fetch
git checkout $BUILDSCRIPTS_COMMIT
git clean -dfx
popd

if [ ! -d Player ]; then
  git clone https://github.com/EasyRPG/Player
fi
pushd Player
git clean -dfx
git reset --hard
git fetch
git checkout $PLAYER_COMMIT
git clean -dfx

mkdir -p lib
pushd lib
if [ ! -d liblcf ]; then
  git clone https://github.com/EasyRPG/liblcf
fi
pushd liblcf
git clean -dfx
git reset --hard
git fetch
git checkout $LCF_COMMIT
git clean -dfx
popd
popd

popd
