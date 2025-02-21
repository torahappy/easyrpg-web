#!/bin/bash

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

function patch_deps_pre () {
    echo "Patching dependencies list..."
    pushd "$SCRIPT_DIR/buildscripts"
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
    popd
}

function patch_player () {
    echo "Patching Player..."
    pushd "$SCRIPT_DIR/Player"
    popd
}
