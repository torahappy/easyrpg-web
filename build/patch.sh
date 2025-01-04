#!/bin/bash

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
