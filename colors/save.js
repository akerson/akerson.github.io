"use strict";

function ExportSave() {
    const saveFile = createSaveExport();
    $("#exportSaveText").val(saveFile);
}

function ImportSaveButton() {
    stopSave = true;
    const unpako = atob($('#importSaveText').val());
    const saveFile = JSON.parse(pako.ungzip(unpako,{ to: 'string' }));
    localStorage.setItem('ffgs1', saveFile);
    location.reload();
}

function saveGame(ms) {
    saveTime += ms;
    if (saveTime < 5000) return;
    saveTime = 0;
    if (stopSave) return;
    localStorage.setItem('ffgs1', createSave());
}

function forceDownload() {
    const saveFile = localStorage.getItem("ffgs1");
    const b = new Blob([saveFile],{type:"text/plain;charset=utf-8"});
    saveAs(b, "ForgeAndFortuneSave.txt");
}
