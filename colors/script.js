"use strict";
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
        this.autoEasel = false;
        this.autoEaselFilter = "******";
        this.autoEaselOn = true;
        this.colorFlip = false;
        counter++;
    }
    createSave() {
        const save = {};
        save.time = this.time;
        save.color1 = this.color1;
        save.color2 = this.color2;
        save.properties = this.properties;
        save.maxProperties = this.maxProperties;
        save.autoEasel = this.autoEasel;
        save.autoEaselFilter = this.autoEaselFilter;
        save.autoEaselOn = this.autoEaselOn;
        save.mixedColors = this.mixedColors;
        save.startTime = this.startTime;
        return save;
    }
    loadSave(save) {
        this.time = save.time;
        this.color1 = save.color1;
        this.color2 = save.color2;
        this.properties = save.properties;
        this.maxProperties = save.maxProperties;
        if (save.autoEasel) this.autoEasel = save.autoEasel;
        if (save.autoEaselFilter) this.autoEaselFilter = save.autoEaselFilter;
        if (save.autoEaselOn) this.autoEaselOn = save.autoEaselOn;
        if (save.mixedColors) this.mixedColors = save.mixedColors;
        if (save.startTime) this.startTime = save.startTime;
    }
    addTime(ms) {
        if (!this.color1 || !this.color2) {
            this.time = 0;
            return;
        }
        this.time += ms;
        if (this.time >= this.maxTime()) UITrigger.colorFlip.push(this);
        while (this.time >= this.maxTime()) {
            this.time -= this.maxTime();
            this.mixColor();
        }
    }
    maxTime() {
        return this.properties.includes("Fast") ? 2000 : 4000;
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
        let result = "";
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
        //add to the easel if you can
        if (this.autoEasel && this.autoEaselOn) {
            let res = 0;
            for (let i=0;i<6;i++) {
                if (this.autoEaselFilter[i] === "*" || this.autoEaselFilter[i] === result[i]) res++
            }
            if (res === 6) gameData.addEasel(result);
        }
        this.mixedColors++;
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
    buyAutoEasel() {
        if (this.autoEasel) return;
        if (gameData.ptsRemaining() < 1) return;
        this.autoEasel = true;
        UITrigger.mixerChange = true;
        UITrigger.pointsRefresh = true;
    }
    autoEaselFilterAdjust(idx,c) {
        this.autoEaselFilter = setCharAt(this.autoEaselFilter,idx,c);
        UITrigger.mixerChange = true;
        UITrigger.autoEasel = this.count;
    }
    autoEaselEnable() {
        this.autoEaselOn = !this.autoEaselOn;
        UITrigger.mixerChange = true;
        UITrigger.autoEasel = this.count;
    }
    clearMixer() {
        this.color1 = null;
        this.color2 = null;
        this.properties = [];
        this.autoEaselFilter = "******";
        this.autoEaselOn = false;
    }
    applySettings(color1,color2,properties,autofilter,filteron) {
        this.color1 = color1;
        this.color2 = color2;
        this.autoEaselFilter = autofilter;
        this.autoEaselOn = filteron;
        for (let i=0;i<this.maxProperties;i++) {
            if (!properties[i]) break;
            this.properties[i] = properties[i];
        }
    }
}

const gameData = {
    history : [],
    historyMax : 50,
    easel : [],
    easelMax : 5,
    mixers : [],
    mixersMax : 10,
    colorLibrary : [],
    paused : false,
    lastTime : Date.now(),
    boughtProperties : [],
    startTime : Date.now(),
    mixedColors : 0,
    createSave() {
        const save = {};
        save.mixers = this.mixers.map(m=>m.createSave());
        save.colorLibrary = this.colorLibrary.map(cl=>cl.createSave());
        save.easel = this.easel;
        save.easelMax = this.easelMax;
        save.boughtProperties = this.boughtProperties;
        save.starTime = this.startTime;
        save.mixedColors = this.mixedColors;
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
        if (save.easelMax) this.easelMax = save.easelMax;
        if (save.boughtProperties) this.boughtProperties = save.boughtProperties;
        if (save.startTime) this.startTime = save.startTime;
        if (save.mixedColors) this.mixedColors = save.mixedColors;
    },
    findColor(id) {
        return this.colorLibrary.find(c=>c.id === id);
    },
    addTime(ms) {
        if (this.paused) return;
        this.mixers.forEach(mixer => mixer.addTime(ms));
    },
    mixedColor(color) {
        //unlock a color
        this.mixedColors++;
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
        UITrigger.easleChange = true;
    },
    removeEasel(color) {
        this.easel = this.easel.filter(c=>c !== color);
    },
    ptsSpent() {
        return this.mixers.length+this.boughtProperties.length*6+this.mixers.map(m=>m.maxProperties).reduce((a,b)=>a+b)+Math.floor(this.easelMax/5)+this.mixers.filter(m=>m.autoEasel).length;
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
        if (this.ptsRemaining() < 6) return;
        this.boughtProperties.push(property);
        UITrigger.mixerProperty = mixerid;
        UITrigger.pointsRefresh = true;
    },
    buyEasel() {
        if (this.ptsRemaining() <= 0) return;
        if (this.easelMax >= 25) return;
        this.easelMax += 5;
        UITrigger.easleChange = true;
        UITrigger.pointsRefresh = true;
    },
    buyAutoEasel(mixerid) {
        const mix = this.mixers.find(m=>m.count === mixerid);
        mix.buyAutoEasel();
    },
    autoEaselFilterAdjust(mixerid,position,character) {
        const mix = this.mixers.find(m=>m.count === mixerid);
        mix.autoEaselFilterAdjust(position,character);
    },
    autoEaselEnable(mixerid) {
        const mix = this.mixers.find(m=>m.count === mixerid);
        mix.autoEaselEnable(); 
    },
    clearMixers() {
        this.mixers.forEach(m=>m.clearMixer());
        UITrigger.mixerChange = true;
    },
    propogateFirst() {
        const mix = this.mixers[0];
        this.mixers.forEach(m=>m.applySettings(mix.color1,mix.color2,mix.properties,mix.autoEaselFilter,mix.autoEaselOn));
        UITrigger.mixerChange = true;
    }
}

function cheat() {
    gameData.colorLibrary.forEach(c=>c.found=true);
    UITrigger.libraryChange = true;
    UITrigger.pointsRefresh = true;
}

function setCharAt(str,index,chr) {
    if(index > str.length-1) return str;
    return str.substring(0,index) + chr + str.substring(index+1);
}