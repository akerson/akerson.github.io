//this is a dictionary of all the game variables
//to call any of them, just use dot annotation --
//eg: game.ore will return the current ore!
let game = null;

const itemDB = {
    "Knife" : new Item("Knife",5000,5,0,10), //this will be a list of the cost in resources
    "Club" : new Item("Club",15000,0,7,25),
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
    this.canCraft = {
        "Knife" : true,
        "Club" : true,
    };
    this.lastTime = Date.now();
    this.canCraftlots = {
        "slot1" : [null,0],
        "slot2" : [null,0],
        "slot3" : [null,0],
        "slot4" : [null,0],
        "slot5" : [null,0],
    }
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
    for (const [slot, properties] of Object.entries(game.canCraftlots)) {
        if (properties[0] == null) {
            return true;
        }
    }
    return false;
}

function initialize() {
    game = new Game();
    //this will make the function go FOREVER until they close the browser, every 10 ms
    loadGame();
    refreshMoney();
    refreshcanCraft();
    window.mainLoop = setInterval(gameLoop, 10);
}

function refreshcanCraft() {
    //this is how we display stuff. the "get element by id" looks for any elements in the HTML that have that id
    //this pulls up the div (which is a fancy way of saying area of text) at line 11
    //so we can manipulate it and add stuff!
    const canCraftDiv = document.getElementById('crafts');
    for (const [craft, canCraft] of Object.entries(game.canCraft)) {
        if (canCraft) {
            const button = canCraftDiv.appendChild(document.createElement('button'));
            button.innerText = craft;
            //() => is fancy notation for run that function
            button.onclick = () => addCraft(craft);
        }
    };
}

function refreshResources() {
    const resourcesDiv = document.getElementById('resources');
    resourcesDiv.innerHTML = ""; //clear it
    for (const [res, amts] of Object.entries(game.resources)) {
        s = res + ": " + Math.floor(amts[0]) + "/" + amts[1] //we need math.floor so we don't get 1.958718175711
        //spans are just text fields, like divs (except don't new line...);
        const resourceSpan = resourcesDiv.appendChild(document.createElement('span'));
        resourceSpan.innerText = s;
        resourcesDiv.appendChild(document.createElement('br'));
    };
}


function addCraft(craft) {
    //we first check to make sure you have the resources for it -- if we do, get rid of that amount from your stash and add it to the craft list
    if (game.openSlot() && itemDB[craft].oreCost <= game.resources["Ore"][0] && itemDB[craft].woodCost <= game.resources["Wood"][0]) {
        //we have enough!!
        game.addResource(-1*itemDB[craft].oreCost,"Ore");
        game.addResource(-1*itemDB[craft].woodCost,"Wood");
        game.addCraft(craft);
    }
}


function gameLoop() {
    //here we need to add resources based off how much time has passed as well as lower craft tiems
    //it's important to add "ticks" this way rather than through setinterval because if the game is
    //open but not focused setinterval won't trigger, so this allows us to "catch up"
    const timePassed = Date.now() - game.lastTime; //this is time passed in ms
    game.lastTime = Date.now();
    game.addResource(timePassed/500,"Ore");
    game.addResource(timePassed/500,"Wood");
    refreshResources();
    refreshcanCraftlots();
    saveGame();
}

function refreshcanCraftlots() {
    //llop through slots, see if we can do something about it
    for (let i=1;i<6;i++) {
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

function saveGame () {
    const gameSave = JSON.stringify(game);
    window.localStorage.setItem('gameSave', gameSave);
}

function loadGame() {
    const savegame = JSON.parse(window.localStorage.getItem('gameSave'));
    if (savegame) {
        if (typeof savegame.money !== "undefined") game.money = savegame.money;
        if (typeof savegame.resources !== "undefined") game.resources = savegame.resources;
        if (typeof savegame.canCraft !== "undefined") game.canCraft = savegame.canCraft;
        if (typeof savegame.lastTime !== "undefined") game.lastTime = savegame.lastTime;
        if (typeof savegame.canCraftlots !== "undefined") game.canCraftlots = savegame.canCraftlots;     
    }

}
