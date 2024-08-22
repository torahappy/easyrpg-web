# easyrpg-web

A custom build script for EasyRPG Player for the web, with advanced features such as batch download save files, various utility functions, and better button configuration.

## How to build

Prebuilt binaries (the `index.js` file and `easyrpg-player.wasm` file) are included in the `www` directory in this repository. For reference, here is a example build procedure using Docker.

1. `cd build`
2. `docker run --rm -it -v $PWD:/easyrpg ubuntu`
3. `cd /easyrpg`
4. `bash ./build.sh`
5. `exit`
6. `bash ./copy.sh`

Finally, serve `www` using a HTTP(S) server like nginx. You can also setup the API server and proxy it to `/api` in the HTTP(S) server.

## How to play a game

1. Place the game files in `www/games/<gamename>`.
2. `cd www/games/<gamename>`
3. `../../../gencache/gencache`
4. Serve the `www` directory using some HTTP(S) server.
5. Access to `www/index.html?game=<gamename>` via a modern web browser.

## Set up api

You can setup an API server for debugging log (other features such as cloud save data syncing may be added later). The server will start on port 9001. See `nginx.conf.example` for an example proxy configuration.

1. `cd api`
2. `python -m venv venv`
3. `venv/bin/python3 -m pip install -r requirements.txt`
4. `bash ./start.sh`

## License

This program is licensed under GPLv3.

See `COPYING` for more information.
