let urlParams = new URLSearchParams(location.search);
let gameName = urlParams.has("game") ? urlParams.get("game") : "default";
let dbPrefix = urlParams.has("game") ? urlParams.get("game") + "/" : "";

let debugstat = false;

document.getElementById('debugfile').addEventListener('click', function () {
  const num = document.getElementById("debugnumber").value;
  if (!num.match(/^\d{1,2}$/)) {
    alert("invalid save slot id")
    return
  }
  easyrpgPlayer.api.uploadSavegame(num)
})

document.getElementById('debugexportone').addEventListener('click', function () {
  const num = document.getElementById("debugnumber_exportone").value;
  if (!num.match(/^\d{1,2}$/)) {
    alert("invalid save slot id")
    return
  }
  easyrpgPlayer.api.downloadSavegame(num)
})

document.getElementById('debugexec').addEventListener("click", () => {
  let command = document.getElementById('debugta').value;
  server_put_log(command)
  try {
    let r = JSON.stringify(eval(command))
    alert(r)
    server_put_log(r)
  } catch (e) {
    alert(e)
    server_put_log(e)
  }
})

function getSaveFile (filename) {
  return new Promise((res, rej) => {
    easyrpgPlayer.saveFs.loadLocalEntry('/easyrpg/' + dbPrefix + 'Save/' + filename, (fs_err, fs_res) => {
      if (fs_err !== null) {
          rej(fs_err)
      } else {
          res(fs_res)
      }
    })
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
      bak.file(filename, sav.contents, {date: sav.timestamp})
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
    document.getElementById('debugbox-outer').style.display = "none"
    debugbox.style.display = "none"
    canvas.focus();
  } else {
    document.getElementById('debugbox-outer').style.display = "block"
    debugbox.style.display = "block"
  }

  debugstat = !debugstat
})

