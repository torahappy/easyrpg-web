#!/bin/python3

from datetime import datetime
from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from pydantic import BaseModel
from fastapi.staticfiles import StaticFiles
from typing import Union

import re
import os
import json

basepath = os.path.abspath(os.path.dirname(__file__))

app = FastAPI(docs_url="/api/docs", openapi_url="/api/openapi.json")

class LogItem(BaseModel):
    reset: bool | None = None
    text: str = ""

def check_game_id(gameId: str):
    if not re.match( r"^[0-9a-zA-Z\-\_]+$", gameId):
        raise HTTPException(400, "invalid character in gameId")

def check_slot_id(slotId: int):
    if slotId > 999 or slotId < 0:
        raise HTTPException(400, "slotId sould be between 0 and 999")

filenamePattern = re.compile(r'\d{1,20}_\d{1,3}')

def check_filename(fn: str):
    if not filenamePattern.match(fn):
        raise HTTPException(400, "invalid backup filename")

backupsPath = os.path.join(basepath, "backups")

@app.get("/api/list_backup/{gameId}")
def list_backup(gameId: str):
    check_game_id(gameId)
    l = os.listdir(os.path.join(backupsPath, gameId))
    return { "result": [x for x in l if filenamePattern.match(x)] }

@app.get("/api/get_backup/{gameId}/{fn}")
def get_backup(gameId: str, fn: str):
    check_game_id(gameId)
    check_filename(fn)
    return FileResponse(os.path.join(backupsPath, gameId, fn), filename=fn)

@app.post("/api/put_backup/{gameId}/{slotId}")
async def put_backup(gameId: str, slotId: int, file: UploadFile):
    check_game_id(gameId)
    check_slot_id(slotId)
    now_time = datetime.now()
    ts = now_time.strftime('%s')
    fn = '%s_%s' % (ts, slotId)
    data = await file.read()
    with open(os.path.join(backupsPath, gameId, fn), 'wb') as f:
        f.write(data)
    return { "result": "success", "timestamp": ts, "slotId": slotId, "filename": fn }

soundfontsPath = os.path.join(basepath, "soundfonts")

@app.post("/api/put_soundfont")
async def put_soundfont(file: UploadFile):
    if file.filename is None or not file.filename.endswith('.sf2'):
        raise HTTPException(400, 'invalid filename (input file should be end with .sf2)')
    with open(os.path.join(soundfontsPath, file.filename), 'wb') as f:
        f.write(await file.read())
    return { "result": "success" }

class SetSoundFontItem(BaseModel):
    filename: Union[str, None]

@app.post("/api/set_soundfont")
async def set_soundfont(item: SetSoundFontItem):
    filename = item.filename
    txtPath = os.path.join(soundfontsPath, 'default.txt')
    if filename is None:
        os.remove(txtPath)
        return { "result": "success" }
    if not os.path.exists(os.path.join(soundfontsPath, filename)):
        raise HTTPException(400, 'soundfont file not found')
    with open(txtPath, 'w') as f:
        f.write(filename)
    return { "result": "success" }

@app.get("/api/list_soundfont")
async def set_soundfont():
    txtPath = os.path.join(soundfontsPath, 'default.txt')
    if not os.path.exists(txtPath):
        filename = None
    else:
        with open(txtPath) as f:
            filename = f.read()
    return { "result": [x for x in os.listdir(soundfontsPath) if x != 'default.txt'], "current": filename }

@app.post("/api/put_log")
def put_log(data: LogItem):
    if data.reset:
        mode = "w"
    else:
        mode = "a"
    with open(os.path.join(basepath, "logs", "log.txt"), mode) as f:
        f.write(data.text)
    return {"result": "success"}

@app.get("/api/get_log")
def get_log():
    if os.path.exists(os.path.join(basepath, "logs", "log.txt")):
        with open(os.path.join(basepath, "logs", "log.txt")) as f:
            result = f.read()
        return { "result": result }
    else:
        raise HTTPException(404, "Log data not found")

@app.get("/api/get_log_html", response_class=HTMLResponse)
def get_log_html():
    if os.path.exists(os.path.join(basepath, "logs", "log.txt")):
        with open(os.path.join(basepath, "logs", "log.txt")) as f:
            result = f.read()
        return "<style>* { padding: 0; margin: 0; }\n html, body { width: 100% } \n pre { display: block; white-space: pre-wrap; font-size: 18px; word-break: break-all; padding: 1em; }</style><pre>" + result + "<pre>"
    else:
        raise HTTPException(404, "Log data not found")

@app.get("/{file_path:path}")
async def function(file_path: str):
    if file_path == "":
        file_path = "index.html"

    if file_path.endswith('/easyrpg.soundfont'):
        txtPath = os.path.join(soundfontsPath, 'default.txt')
        if not os.path.exists(txtPath):
            raise HTTPException(404, 'not found')
        else:
            with open(txtPath) as f:
                filename = f.read()
            if os.path.exists(os.path.join(soundfontsPath, filename)):
                return FileResponse(os.path.join(soundfontsPath, filename))
            else:
                raise HTTPException(404, 'not found')

    path = os.path.join(basepath, '..', 'www', f"{file_path}")

    if not os.path.exists(path):
        raise HTTPException(404, 'not found')

    if file_path.endswith('/index.json'):
        j = json.load(open(path))
        txtPath = os.path.join(soundfontsPath, 'default.txt')
        if os.path.exists(txtPath):
            j['cache']['easyrpg.soundfont'] = 'easyrpg.soundfont'
        elif 'easyrpg.soundfont' in j['cache']:
            del j['cache']['easyrpg.soundfont']
        response = JSONResponse(j)
    else:
        response = FileResponse(path)

    if file_path.endswith('.js') or file_path.endswith('.json'):
        response.headers.append('Cache-Control', 'max-age=1')

    return response

