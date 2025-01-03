#!/bin/python3

from datetime import datetime
from fastapi import FastAPI, Response, UploadFile, HTTPException
from fastapi.responses import FileResponse, HTMLResponse
from pydantic import BaseModel
from fastapi.staticfiles import StaticFiles

import re
import os

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


app.mount("/", StaticFiles(directory=os.path.join(basepath, '..', 'www'), html=True), name="static")
