"use strict";

//setup!
fixedColors.forEach((value,key) => {
    gameData.colorLibrary.push(new UnlockedColors(key,value));
});
const gameFile = JSON.parse(localStorage.getItem("rgblender"));
if (!gameFile) {
    gameData.findColor("000000").found = true;
    gameData.findColor("FFFFFF").found = true;
    gameData.easel.push("000000");
    gameData.easel.push("FFFFFF");
    gameData.mixers.push(new Mixer());
}
else gameData.loadSave(gameFile);
setInterval(mainLoop, 10);
setInterval(updateMixerBars, 10);
setInterval(saveGame,1000);

function mainLoop() {
    if (gameData.gameEnd) return;
    const deltaTime = Date.now()-gameData.lastTime;
    gameData.lastTime = Date.now();
    gameData.addTime(deltaTime);
}

function saveGame() {
    localStorage.setItem("rgblender",JSON.stringify(gameData.createSave()));
}

function clearSave() {
    localStorage.removeItem("rgblender");
    location.reload();
}

function exportSave() {
    const saveFile = btoa(JSON.stringify(gameData.createSave()));
    const b = new Blob([saveFile],{type:"text/plain;charset=utf-8"});
    saveAs(b, "RGBlender_save.txt");
}

function importSave() {
    let saveInput = prompt("Paste your save below");
    if (!saveInput) return;
    const text = atob(saveInput);
    const saveFile = JSON.parse(text); // THIS IS ONLY FOR TESTING FOR A FAKE SAVE
    gameData.loadSave(saveFile)
    UITrigger.historyChange = true;
    UITrigger.easleChange = true;
    UITrigger.mixerChange = true;
    UITrigger.libraryChange = true;
    UITrigger.pointsRefresh = true;
    UITrigger.gameEnd = true;
}

$("#importSave").on("click",e=>{
    e.preventDefault();
    importSave();
    $("#clearSave").html("Clear Save");
    $("#helpBox").hide();
})

$("#exportSave").on("click",e=>{
    e.preventDefault();
    exportSave();
    $("#clearSave").html("Clear Save");
    $("#helpBox").hide();
})

$("#clearSave").on('click',e=>{
    if ($("#clearSave").html() === "Clear Save") {
        $("#clearSave").html("Are you sure?");
        return;
    }
    e.preventDefault();
    clearSave();
})