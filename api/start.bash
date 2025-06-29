#!/bin/bash

set -euo pipefail

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

cd "$SCRIPT_DIR"

if [ ! -d ./venv ]; then
  python3 -m venv venv
  venv/bin/pip3 install -r ./requirements.txt
fi

if [ ! -d ./soundfonts ]; then
  mkdir soundfonts
fi

venv/bin/python -m fastapi dev --port=9000 --host=0.0.0.0 server.py
