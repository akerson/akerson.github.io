"use strict";

const hexletters = ["0","1","2","3","4","5","6","7","8","9","A","B","C","D","E","F"];
let counter = 0;

class UnlockedColors {
    constructor(id,name) {
        this.id = id;
        this.name = name;
        this.found = false;
    }
    createSave() {
        const save = {};
        save.id = this.id;
        save.found = this.found;
        return save;
    }
    loadSave(save) {
        this.found = save.found;
    }
}

class Mixer {
    constructor() {
        this.time = 0;
        this.color1 = null;
        this.color2 = null;
        this.properties = [];
        this.maxProperties = 0;
        this.count = counter;
        counter++;
    }
    createSave() {
        const save = {};
        save.time = this.time;
        save.color1 = this.color1;
        save.color2 = this.color2;
        save.properties = this.properties;
        save.maxProperties = this.maxProperties;
        return save;
    }
    loadSave(save) {
        this.time = save.time;
        this.color1 = save.color1;
        this.color2 = save.color2;
        this.properties = save.properties;
        this.maxProperties = save.maxProperties;
    }
    addTime(ms) {
        if (!this.color1 || !this.color2) {
            this.time = 0;
            return;
        }
        this.time += ms;
        while (this.time >= this.maxTime()) {
            this.time -= this.maxTime();
            this.mixColor();
        }
    }
    maxTime() {
        return this.properties.includes("Fast") ? 1000 : 2000;
    }
    addColor(color) {
        if (!this.color1) this.color1 = color;
        else if (!this.color2) this.color2 = color;
    }
    removeColor(position) {
        if (position === 0) this.color1 = null;
        else if (position === 1) this.color2 = null;
    }
    hasSpace() {
        return !this.color1 || !this.color2;
    }
    mixColor() {
        let result = [];
        let mutateChance = 0.05;
        if (this.properties.includes("Low Mutate")) mutateChance = 0.025;
        if (this.properties.includes("High Mutate")) mutateChance = 0.2;
        for (let i=0;i<6;i++) {
            if (this.properties.includes(`Hold ${i+1} Left`)) {
                result += this.color1[i];
                continue;
            }
            if (this.properties.includes(`Hold ${i+1} Right`)) {
                result += this.color2[i];
                continue;
            }
            const randNum = Math.random();
            if (randNum < mutateChance) result += hexletters[Math.floor(Math.random() * hexletters.length)];
            else if (randNum < (1-mutateChance)/2) result += this.color1[i];
            else result += this.color2[i];
        }
        gameData.mixedColor(result);
    }
    addProperty(property) {
        if (this.properties.length >= this.maxProperties) return;
        if (this.properties.includes(property)) return;
        this.properties.push(property);
        UITrigger.mixerProperty = this.count;
    }
    removeProperty(property) {
        if (this.properties.length === 0) return;
        this.properties = this.properties.filter(p=>p !== property);
        UITrigger.mixerProperty = this.count;
    }
    buyPropertySlot() {
        if (this.maxProperties >= 4) return;
        if (gameData.ptsRemaining() < 1) return;
        this.maxProperties++;
        UITrigger.mixerProperty = this.count;
        UITrigger.pointsRefresh = true;
    }
}

const gameData = {
    colorGoals : [],
    history : [],
    historyMax : 50,
    easel : [],
    easelMax : 10,
    mixers : [],
    mixersMax : 10,
    colorLibrary : [],
    lastTime : Date.now(),
    boughtProperties : [],
    createSave() {
        const save = {};
        save.mixers = this.mixers.map(m=>m.createSave());
        save.colorLibrary = this.colorLibrary.map(cl=>cl.createSave());
        save.easel = this.easel;
        return save;
    },
    loadSave(save) {
        console.log(save);
        save.mixers.forEach(mixSave => {
            const m = new Mixer();
            m.loadSave(mixSave);
            this.mixers.push(m);
        });
        save.colorLibrary.forEach(chSave => {
            const ch = this.findColor(chSave.id);
            ch.loadSave(chSave);
        });
        this.easel = save.easel;
    },
    findColor(id) {
        return this.colorLibrary.find(c=>c.id === id);
    },
    addTime(ms) {
        this.mixers.forEach(mixer => mixer.addTime(ms));
    },
    mixedColor(color) {
        //unlock a color
        const unlock = this.colorLibrary.find(c=>c.id === color);
        if (unlock && !unlock.found) {
            unlock.found = true;
            UITrigger.libraryChange = true;
            UITrigger.pointsRefresh = true;
        }
        //add to history
        this.history.unshift(color);
        if (this.history.length < this.historyMax) return UITrigger.historyChange = true;;
        this.history.pop();
        UITrigger.historyChange = true;
    },
    addMixColor(color) {
        const slot = this.mixers.find(m=>m.hasSpace());
        if (!slot) return;
        slot.addColor(color);
    },
    removeMix(mixer,position) {
        const mix = this.mixers.find(m=>m.count === mixer);
        if (!mix) return;
        mix.removeColor(position);
    },
    addEasel(color) {
        if (this.easel.includes(color)) return;
        if (this.easel.length >= this.easelMax) return;
        this.easel.push(color);
    },
    removeEasel(color) {
        this.easel = this.easel.filter(c=>c !== color);
    },
    ptsSpent() {
        return this.mixers.length+this.boughtProperties.length*6+this.mixers.map(m=>m.maxProperties).reduce((a,b)=>a+b);
    },
    ptsRemaining() {
        return this.colorLibrary.filter(c=>c.found).length - this.ptsSpent();
    },
    purchaseMixer() {
        if (this.ptsRemaining() <= 0) return;
        this.mixers.push(new Mixer());
        UITrigger.mixerChange = true;
        UITrigger.pointsRefresh = true;
    },
    //property stuff
    removeProperty(mixerid,property) {
        const mix = this.mixers.find(m=>m.count === mixerid);
        if (!mix) return;
        mix.removeProperty(property);
    },
    addProperty(mixerid,property) {
        const mix = this.mixers.find(m=>m.count === mixerid);
        if (!mix) return;
        mix.addProperty(property);
    },
    buyPropertySlot(mixerid,property) {
        const mix = this.mixers.find(m=>m.count === mixerid);
        if (!mix) return;
        mix.buyPropertySlot(property);
    },
    buyProperty(mixerid,property) {
        if (this.boughtProperties.includes(property)) return;
        if (this.ptsRemaining() <= 5) return;
        this.boughtProperties.push(property);
        UITrigger.mixerProperty = mixerid;
        UITrigger.pointsRefresh = true;
    }
}

function cheat() {
    gameData.colorLibrary.forEach(c=>c.found=true);
    UITrigger.libraryChange = true;
    UITrigger.pointsRefresh = true;
}