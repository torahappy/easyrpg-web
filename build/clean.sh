#!/bin/bash

pushd buildscripts
git reset --hard
git clean -dfx >/dev/null 2>&1
popd

pushd Player
git reset --hard
git clean -dfx >/dev/null 2>&1
rm -rf lib
popd
