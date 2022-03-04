"use strict";

//setup!
fixedColors.forEach((value,key) => {
    gameData.colorLibrary.push(new UnlockedColors(key,value));
});
gameData.findColor("000000").found = true;
gameData.findColor("FFFFFF").found = true;
gameData.easel.push("000000");
gameData.easel.push("FFFFFF");
updateMixers();
updateEasles();
updateHistory();
updateLibrary();
setInterval(mainLoop, 10);
setInterval(updateMixerBars, 10);

function mainLoop() {
    const deltaTime = Date.now()-gameData.lastTime;
    gameData.lastTime = Date.now();
    gameData.addTime(deltaTime);
}