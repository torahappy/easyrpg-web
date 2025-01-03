let urlParams = new URLSearchParams(location.search);
let gameName = urlParams.has("game") ? urlParams.get("game") : "default";
let dbPrefix = urlParams.has("game") ? urlParams.get("game") + "/" : "";

let debugstat = false;

document.getElementById('debugfile').addEventListener('change', function () {
  const f = this.files[0];
  const reader = new FileReader();
  const num = document.getElementById("debugnumber").value;
  if (!num.match(/^\d\d$/)) {
    alert("invalid save slot id")
    return
  }
  reader.onload = () => {
    setSaveFile(num, reader.result)
  };
  reader.readAsArrayBuffer(f);
})

document.getElementById('debugexec').addEventListener("click", () => {
  let command = document.getElementById('debugta').value;
  try {
    let r = JSON.stringify(eval(command))
    alert(r)
    fetch("/api/put_log", {
      headers: {
	"Content-Type": "application/json"	
      },
      method: "POST",
      body: JSON.stringify({text: command + "\n\n==========\n\n" + r + "\n\n==========\n==========\n\n", reset: false})
    })
  } catch (e) {
    alert(e)
    fetch("/api/put_log", {
      headers: {
	"Content-Type": "application/json"	
      },
      method: "POST",
      body: JSON.stringify({text: command + "\n\n==========\n\n" + e.message + "\n\n==========\n==========\n\n", reset: false})
    })
  }
  document.getElementById('debugta').value = ""
})

function setSaveFile (num, data) {
  return new Promise((res, rej) => {
    let req = indexedDB.open("/easyrpg/" + dbPrefix + "Save");
    req.onsuccess = (e) => {
      let db = e.target.result;
      let trans1 = db.transaction("FILE_DATA", "readwrite");
      let objectStore1 = trans1.objectStore("FILE_DATA");
      let req2 = objectStore1.put({contents: new Uint8Array(data), mode: 33206, timestamp: new Date()}, "/easyrpg/" + dbPrefix + "Save/Save" + num + ".lsd");
      req2.onsuccess = () => {
	      alert("import success")
	      res()
      }
      req2.onerror = rej
    };
    req.onerror = rej
  })
}

function getSaveFile (filename) {
  return new Promise((res, rej) => {
    let req1 = indexedDB.open("/easyrpg/" + dbPrefix + "Save");
    req1.onsuccess = (e2) => {
      let db = e2.target.result;
      let trans1 = db.transaction("FILE_DATA", "readonly");
      let objectStore1 = trans1.objectStore("FILE_DATA");
      let req2 = objectStore1.get("/easyrpg/" + dbPrefix + "Save/" + filename);              
      req2.onsuccess = () => {
        res(req2.result)
      };
      req2.onerror = rej
    };
    req1.onerror = rej
  })
}

document.getElementById('debugexport').addEventListener("click", async () => {
  let zip = new JSZip();
  let rootDir = "backup-" + gameName + "-" + Date.now(); 
  let bak = zip.folder(rootDir);
  for (let i = 0; i < 100; i++) {
    let filename;
    if (i < 10) {
      filename = "Save0" + i + ".lsd"
    } else {
      filename = "Save" + i + ".lsd"
    }

    try {

      let sav = await getSaveFile(filename)
      bak.file(filename, sav.contents)

    } catch (e) {
    }
  }
  let content = await bak.generateAsync({type:"blob"})
  
  saveAs(content, rootDir + ".zip");
})

document.getElementById('reloadaudio').addEventListener('click', () => {
  easyrpgPlayer.SDL2.audioContext.resume()
})

document.getElementById('debugbtninner').addEventListener("click", () =>{
  if (debugstat) {
    // enableListeners("window", "keydown")
    debugbox.style.display = "none"
    canvas.focus();
  } else {
    // disableListeners("window", "keydown")
    debugbox.style.display = "block"
  }

  debugstat = !debugstat
})

