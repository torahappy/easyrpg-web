#!/bin/bash

docker run --rm -v $PWD:/easyrpg ubuntu bash -c "cd /easyrpg; ./build.sh"
