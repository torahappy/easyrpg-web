#!/bin/bash

docker run --rm -v $PWD:/easyrpg ubuntu:noble bash -c "cd /easyrpg; ./build.sh"
