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
updateMixers();
updateEasles();
updateHistory();
updateLibrary();
$("#remainingPts").html(`Points Remaining - ${gameData.ptsRemaining()}`);
setInterval(mainLoop, 10);
setInterval(updateMixerBars, 10);
setInterval(saveGame,1000);

function mainLoop() {
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