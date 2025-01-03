#!/bin/python3

from fastapi import FastAPI, APIRouter

import os

from pydantic import BaseModel

app = FastAPI(docs_url="/api/docs", openapi_url="/api/openapi.json")

class LogItem(BaseModel):
    reset: bool | None = None
    text: str = ""

basepath = os.path.abspath(os.path.dirname(__file__))

@app.post("/api/put_log")
def read_item(data: LogItem):
    if data.reset:
        mode = "w"
    else:
        mode = "a"
    with open(os.path.join(basepath, "logs", "log.txt"), mode) as f:
        f.write(data.text)
    return {"result": "success"}

