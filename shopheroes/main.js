//this is a dictionary of all the game variables
//to call any of them, just use dot annotation --
//eg: game.ore will return the current ore!
let game = null;

const itemDB = {
    "Knife" : new Item("Knife",5000,5,0,10), //this will be a list of the cost in resources
    "Club" : new Item("Club",15000,0,7,25),
    "Longsword" : new Item("Longsword",10000,15,5,35),
    "Bastard Sword" : new Item("Bastard Sword",25000,25,10,105),
    "Sawblade" : new Item("Sawbalde",35000,50,25,1200),
    "Bloopinator" : new Item("Bloopinator",55000,100,100,2000),
}

function Item(name,timeToCraft,oreCost,woodCost,value) {
    this.name = name;
    this.timeToCraft = timeToCraft;
    this.oreCost = oreCost;
    this.woodCost = woodCost;
    this.value = value;
}

function Game() {
    this.money = 0;
    this.resources = {
        "Ore" : [0,10], //the first number is your current, the second is your total
        "Wood" : [0,15],
    };
    //this is a table of the items in the game, and if you have them unlocked
    this.totalCraft = {
        "Knife" : 0,
        "Club" : 0,
        "Longsword" : 0,
        "Bastard Sword" : 0,
        "Sawblade" : 0,
        "Bloopinator" : 0,
    };
    this.lastTime = Date.now();
    this.canCraftlots = {
        "slot1" : [null,0],
        "slot2" : [null,0],
        "slot3" : [null,0],
        "slot4" : [null,0],
        "slot5" : [null,0],
        "slot6" : [null,0],
    }
    this.haveResource = {
        "Ore" : true,
        "Wood" : false,
    }
    this.boughtSlots = 0;
    this.boughtMaxOre = 0;
    this.boughtOreSpeed = 0;
    this.boughtMaxWood = 0;
    this.boughtWoodSpeed = 0;
};

//this adds the function to the Game object, we call it like this --
//Game.addResource(10,Resources.ORE) to say add 10 ore to the player
Game.prototype.addResource = function(amt,type) {
    this.resources[type][0] += amt;
    this.resources[type][0] = Math.min(this.resources[type][0],this.resources[type][1]); //enforce the cap!
    this.resources[type][0] = Math.max(this.resources[type][0],0); //keep it positive
}

Game.prototype.addCraft = function(craft) {
    for (const [slot, properties] of Object.entries(game.canCraftlots)) {
        if (properties[0] == null) {
            properties[0] = craft;
            properties[1] = Date.now();
            break; //this STOPS the loop, since
        }
    }
}

Game.prototype.collect = function(slot) {
    const itemName = game.canCraftlots[slot][0];
    const money = itemDB[itemName].value;
    game.money += money;
    game.canCraftlots[slot] = [null,0];
    refreshMoney();
}

Game.prototype.openSlot = function() {
    for (let i=1;i<this.boughtSlots+2;i++) {
        const slot = "slot"+i;
        if (this.canCraftlots[slot][0] == null) {
            return true;
        }
    }
    return false;
}

Game.prototype.getUpgradeCost = function(type) {
    if (type === "MoreSlots") return Math.floor(40*Math.pow(this.boughtSlots+1,1.75));
    if (type === "OreSpeed") return Math.floor(10*Math.pow(1.25,this.boughtOreSpeed));
    if (type === "MoreOre") return Math.floor(10*Math.pow(this.boughtMaxOre+1,1.5));
    if (type === "WoodSpeed") return Math.floor(10*Math.pow(1.25,this.boughtWoodSpeed));
    if (type === "MoreWood") return Math.floor(10*Math.pow(this.boughtMaxWood+1,1.5));
    if (type === "buyWood") return 200;
}

Game.prototype.buyUpgrade = function(type) {
    const cost = this.getUpgradeCost(type);
    if (type === "MoreSlots") {
        if (this.money >= cost) {
            this.money -= cost;
            this.boughtSlots += 1;
            revealSlots();
        }
    }
    if (type === "OreSpeed") {
        if (this.money >= cost) {
            this.money -= cost;
            this.boughtOreSpeed += 1;
        }
    }
    if (type === "MoreOre") {
        if (this.money >= cost) {
            this.money -= cost;
            this.boughtMaxOre += 1;
            this.resources["Ore"][1] += 5;
        }
    }
    if (type === "WoodSpeed") {
        if (this.money >= cost) {
            this.money -= cost;
            this.boughtWoodSpeed += 1;
        }
    }
    if (type === "MoreWood") {
        if (this.money >= cost) {
            this.money -= cost;
            this.boughtMaxWood += 1;
            this.resources["Wood"][1] += 5;
        }
    }
    if (type === "buyWood") {
        if (this.money >= cost) {
            this.money -= cost;
            this.haveResource["Wood"] = true;
        }
    }
    refreshUpgrades();
    refreshMoney();
}

function initialize() {
    game = new Game();
    //this will make the function go FOREVER until they close the browser, every 10 ms
    loadGame();
    refreshMoney();
    refreshcanCraft();
    revealSlots();
    refreshUpgrades();
    window.mainLoop = setInterval(gameLoop, 10);
}

function refreshcanCraft() {
    //this is how we display stuff. the "get element by id" looks for any elements in the HTML that have that id
    //this pulls up the div (which is a fancy way of saying area of text) at line 11
    //so we can manipulate it and add stuff!
    const canCraftDiv = document.getElementById('crafts');
    canCraftDiv.innerHTML = "";
    for (const [craft, craftCount] of Object.entries(game.totalCraft)) {
        const button = canCraftDiv.appendChild(document.createElement('button'));
        button.innerText = craft;
        button.onclick = () => addCraft(craft);
        const cost = canCraftDiv.appendChild(document.createElement('span'));
        console.log(craft);
        if (itemDB[craft].oreCost > 0) cost.textContent += " Ore: " + itemDB[craft].oreCost
        if (itemDB[craft].woodCost > 0) cost.textContent += " Wood: " + itemDB[craft].woodCost
        canCraftDiv.appendChild(document.createElement('br'));
        if (craftCount < 10) {
            return; //stop loading items if you haven't crafted 10 of the last one!!
        }
    };
}

function refreshResources() {
    const resourcesDiv = document.getElementById('resources');
    resourcesDiv.innerHTML = ""; //clear it
    for (const [res, amts] of Object.entries(game.resources)) {
        s = res + ": " + Math.floor(amts[0]) + "/" + amts[1] //we need math.floor so we don't get 1.958718175711
        //spans are just text fields, like divs (except don't new line...);
        if (game.haveResource[res]) {
            const resourceSpan = resourcesDiv.appendChild(document.createElement('span'));
            resourceSpan.innerText = s;
            resourcesDiv.appendChild(document.createElement('br'));
        }
    };
}


function addCraft(craft) {
    //we first check to make sure you have the resources for it -- if we do, get rid of that amount from your stash and add it to the craft list
    if (game.openSlot() && itemDB[craft].oreCost <= game.resources["Ore"][0] && itemDB[craft].woodCost <= game.resources["Wood"][0]) {
        //we have enough!!
        game.addResource(-1*itemDB[craft].oreCost,"Ore");
        game.addResource(-1*itemDB[craft].woodCost,"Wood");
        game.addCraft(craft);
        game.totalCraft[craft] += 1;
        refreshcanCraft();
    }
}


function gameLoop() {
    //here we need to add resources based off how much time has passed as well as lower craft tiems
    //it's important to add "ticks" this way rather than through setinterval because if the game is
    //open but not focused setinterval won't trigger, so this allows us to "catch up"
    const timePassed = Date.now() - game.lastTime; //this is time passed in ms
    game.lastTime = Date.now();
    if (game.haveResource["Ore"]) game.addResource(timePassed/(500-4*game.boughtOreSpeed),"Ore");
    if (game.haveResource["Wood"]) game.addResource(timePassed/(500-4*game.boughtWoodSpeed),"Wood");
    refreshResources();
    refreshcanCraftlots();
    saveGame();
}

function refreshcanCraftlots() {
    //llop through slots, see if we can do something about it
    for (let i=1;i<7;i++) {
        const slot = "slot" + i;
        const name = game.canCraftlots[slot][0];
        const starTime = game.canCraftlots[slot][1];
        const slotSpan = document.getElementById(slot);
        const slotButton = document.getElementById(slot+"button");
        if (name == null) {
            slotSpan.textContent = "Nothing";
            slotButton.classList.add("hidden");
        }
        else {
            const timePassed = Date.now() - starTime;
            const timeLeft = Math.max(0,itemDB[name].timeToCraft - timePassed);
            if (timeLeft === 0) {
                slotSpan.textContent = name;
                slotButton.classList.remove("hidden");
            }
            else {
                slotButton.classList.add("hidden");
                const prettyTime = Math.floor(timeLeft/100)/10
                slotSpan.textContent = name + " (" + prettyTime + ")";
            }
        }
    }
}

function refreshMoney() {
    document.getElementById("money").innerText = "$" + game.money;
}

function revealSlots() {
    for (let i=1;i<game.boughtSlots+2;i++) {
        console.log(i);
        const slot = "slot" + i + "div";
        const slotSpan = document.getElementById(slot);
        slotSpan.classList.remove("hidden");
    }
}

function saveGame () {
    const gameSave = JSON.stringify(game); //stringify turns an object literally into a string, since localstorage only holds strings.
    window.localStorage.setItem('gameSave_19APR2018', gameSave);
}

function loadGame() {
    const savegame = JSON.parse(window.localStorage.getItem('gameSave_19APR2018'));
    if (savegame) {
        if (typeof savegame.money !== "undefined") game.money = savegame.money;
        if (typeof savegame.resources !== "undefined") game.resources = savegame.resources;
        if (typeof savegame.totalCraft !== "undefined") game.totalCraft = savegame.totalCraft;
        if (typeof savegame.lastTime !== "undefined") game.lastTime = savegame.lastTime;
        if (typeof savegame.canCraftlots !== "undefined") game.canCraftlots = savegame.canCraftlots;
        if (typeof savegame.haveResource !== "undefined") game.haveResource = savegame.haveResource;
        if (typeof savegame.boughtSlots !== "undefined") game.boughtSlots = savegame.boughtSlots;
        if (typeof savegame.boughtMaxOre !== "undefined") game.boughtMaxOre = savegame.boughtMaxOre;
        if (typeof savegame.boughtOreSpeed !== "undefined") game.boughtOreSpeed = savegame.boughtOreSpeed;
        if (typeof savegame.boughtMaxWood !== "undefined") game.boughtMaxWood = savegame.boughtMaxWood;
        if (typeof savegame.boughtWoodSpeed !== "undefined") game.boughtWoodSpeed = savegame.boughtWoodSpeed;
    }
}

function refreshUpgrades() {
    const slotButton = document.getElementById('MoreSlots');
    const woodButton = document.getElementById('buyWood');
    const woodSpeedButton = document.getElementById('WoodSpeed');
    const moreWoodButton = document.getElementById('MoreWood');
    const oreSpeedbutton = document.getElementById('OreSpeed');
    const moreOreButton = document.getElementById('MoreOre');
    if (game.boughtSlots >= 5) {
        slotButton.classList.add("hidden");
    }
    if (game.haveResource["Wood"]) {
        woodButton.classList.add("hidden");
        woodSpeedButton.classList.remove("hidden");
        moreWoodButton.classList.remove("hidden");
    }
    if (game.boughtOreSpeed > 100) {
        oreSpeedbutton.classList.add("hidden");
    }
    if (game.boughtWoodSpeed > 100) {
        boughtWoodSpeed.classList.add("hidden");
    }
    //refresh texts
    slotButton.innerHTML = "More Craftslots</br>$"+game.getUpgradeCost("MoreSlots");
    woodButton.innerHTML = "Wood Access</br>$"+game.getUpgradeCost("buyWood");
    woodSpeedButton.innerHTML = "Wood Refill Speed</br>$"+game.getUpgradeCost("WoodSpeed");
    moreWoodButton.innerHTML = "Max Wood</br>$"+game.getUpgradeCost("MoreWood");
    oreSpeedbutton.innerHTML = "Ore Refill Speed</br>$"+game.getUpgradeCost("OreSpeed");
    moreOreButton.innerHTML =  "Max Ore</br>$"+game.getUpgradeCost("MoreOre");
}