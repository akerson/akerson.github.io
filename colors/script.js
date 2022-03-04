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
        this.count = counter;
        counter++;
    }
    createSave() {
        const save = {};
        save.color1 = this.color1;
        save.color2 = this.color2;
        save.time = this.time;
        return save;
    }
    loadSave(save) {
        this.time = save.time;
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
        return 2000;
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
        for (let i=0;i<6;i++) {
            if (Math.random() < 0.05) result += hexletters[Math.floor(Math.random() * hexletters.length)];
            else if (Math.random() < 0.525) result += this.color1[i]; // it's 0.525 since it's splitting the remaining 0.95
            else result += this.color2[i];
        }
        gameData.mixedColor(result);
    }
}

const gameData = {
    colorGoals : [],
    history : [],
    historyMax : 15,
    easel : [],
    easelMax : 5,
    mixers : [new Mixer()],
    colorLibrary : [],
    lastTime : Date.now(),
    createSave() {
        const save = {};
        save.mixers = [];
        save.colorLibrary = [];
        this.slots.forEach(s=>save.slots.push(s.createSave()));
        this.mixers.forEach(m=>save.mixers.push(m.createSave()));
        this.colorLibrary.forEach(ch=>save.colorLibrary.push(ch.createSave()));
    },
    loadSave(save) {
        save.slots.forEach(slotSave => {
            const s = new Slot(slotSave.id);
            s.loadSave(slotSave);
            this.slots.push(s);
        });
        save.mixers.forEach(mixSave => {
            const m = new Mixer();
            m.loadSave(mixSave);
            this.mixers.push(m);
        });
        save.colorLibrary.forEach(chSave => {
            const ch = this.findColor(chSave.id);
            ch.loadSave(chSave);
        });
    },
    findColor(id) {
        return this.colorLibrary.find(c=>c.id === id);
    },
    addTime(ms) {
        this.mixers.forEach(mixer => mixer.addTime(ms));
    },
    mixedColor(color) {
        //unlock a color
        const unlock = this.colorGoals.find(c=>c.id === color);
        if (unlock !== undefined) unlock.findIt();
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
    }
}
