const Areas = {
	BASEMENT : "Basement",
}

const ItemType = {
	EQUIPMENT : "Equipment",
	COMPONENT : "Component",
	CONSUMABLE : "Consumable",
	MONEY : "Money",
	NONE : "None",
	MISC : "Misc.",
	CHEMICAL : "Chemical",
}

const ItemRarity = {
	COMMON : 0,
	UNCOMMON: 1,
	RARE : 2,
}

const Actions = {
	NONE : "None",
	SCAVENGE: "Scavenging...",
	FIGHT : "Fighting...",
	TALK : "Talking...",
	GRAB : "Picking Up...",
	BUTCHER : "Butchering...",
	DROP : "Dropping...",
}

const Items = {
	0 : new Item("stone",0.03,0.5,ItemType.COMPONENT, "a"),
	1 : new Item("plank",0.15,0.4,ItemType.COMPONENT, "a"),
	2 : new Item("trash",0.01,0.1,ItemType.COMPONENT, "some"),
	3 : new Item("key",0.01,0.1,ItemType.COMPONENT, "a"),
	4 : new Item("wristpad",0,0.1,ItemType.MISC,"a"),
	5 : new Item("bottle of ammonia",0,0.5,ItemType.CHEMICAL,"a"),
	6 : new Item("ashtray",0,0,ItemType.MISC,"an"),
	7 : new Item("resistor",0,0,ItemType.COMPONENT,"a"),
	8 : new Item("rat tail",0.15,0.5,ItemType.MISC,"a")
}

//I'd love to make a variable that is a dictionary to generate monsters by name -- so
//enemy = Enemies["rat"] would make a new copy of HostileEnemy("rat",10,1200,10,0,5,1,8)
//as all "rats" should ahve the same stats.

var player;

//************************
//all the template objects
//************************

//is this the right way to handle a player object? or would I just var player = function() {}?
function Player() {
	this.name = "You"
	this.hp = 10;
	this.maxhp = this.hp;
	this.lasthit = 0,
	this.area = null,
	this.inventory = {},
	this.currentAction = Actions.NONE,
	this.actionTarget = null,
	this.actionTime = [0,0], //[start,finish]
	this.scavFound = {}, //list of places and what you found there
	this.dodge = 14,
	this.spd = 2000,
	this.stats = {
		brawn : 7,
		brains : 7,
		cool : 7,
		senses : 7,
		reflexes : 7,
		endurance : 7,
	},
	this.skills = {
		fists : 0,
		scavenge : 0,
		blades : 0,
		clubs : 0,
		pistols : 0,
		medic : 0,
		craft : 0,
		focus : 0,
	},
	this.addScavengeFind = function(item) {
		//tabulates the list of items you've found for the scav discovery table
		var areaName = player.area.name;
		if (areaName in player.scavFound) {
			if (!player.scavFound[areaName].includes(item)) {
				player.scavFound[areaName].push(item);
			}
		}
		else {
			player.scavFound[areaName] = [item];
		}
		refreshScavTable();
	}
	this.addInventory = function(item) {
		if (item in player.inventory) {
			player.inventory[item] += 1;
		}
		else {
			player.inventory[item] = 1
		}
		refreshInventory();
	}
	this.dropItem = function(item) {
		player.inventory[item] -= 1;
		if (player.inventory[item] == 0) {
			delete player.inventory[item];
		}
		player.area.addFloorItem(item);
		refreshInventory();
	}
	//combat stuff, these will get fleshed out later by factoring in stats....
	this.getHit = function() {
		return 50;
	}
	this.getDodge = function() {
		return this.dodge
	}
	this.getDmg = function() {
		return 3;
	}
	this.getSoak = function() {
		return 0;
	}
	this.getSpd = function() {
		return this.spd;
	}
	this.die = function() {
		addLog("Sorry you died, here's your life back for now, since those rats aren't balanced.");
		this.hp = 10;
		this.lasthit = 0;
	}
}

function Area(name, description, scavTime, money, moneyPercent, scavMax, scavRepop, actions, mobs) {
	this.name = name;
	this.description = description;
	this.scavTime = scavTime;
	this.comDrops = [];
	this.uncDrops = [];
	this.rareDrops = [];
	this.scavTable = []; //list of all the stuff the player can CURRENTLY scav (not the full list of scav'able things)
	this.scavTableMax = scavMax;
	this.scavTableRepopNum = scavRepop;
	this.floorItems = [];
	this.floorDeadThings = [];
	this.canScav = actions[0];
	this.canFight = actions[1];
	this.canTalk = actions[2];
	this.mobs = [new HostileEnemy("rat",10,1200,10,0,5,1,8),new HostileEnemy("rat",10,1200,10,0,5,1,8),new HostileEnemy("rat",10,1200,10,0,5,1,8)]
	this.addFloorItem = function(item) {
		this.floorItems.push(item);
		refreshAreaFloor();
	}
	this.removeFloorItem = function(loc) {
		this.floorItems.splice(loc,1);
		refreshAreaFloor();
	}
	this.addScavDrop = function(item) { //[item, weighed%]
		if (item[1] == ItemRarity.RARE) {
			this.rareDrops.push(item[0])
		}
		else if (item[1] == ItemRarity.UNCOMMON) {
			this.uncDrops.push(item[0]);
		}
		else {
			this.comDrops.push(item[0]);
		}
	}
	this.addDeadThings = function(body) {
		this.floorDeadThings.push(body);
		refreshDeadThings();
	}
	this.removeDeadThing = function(loc) {
		this.floorDeadThings.splice(loc,1);
		refreshDeadThings();
	}
	this.repopScav = function(numTimes) {
		//adds a number of items to the scav table based on how long it's been, UP to the maximum number of items that it can hold.
		//roll an item rarity -- 70% common, 25% uncommon, 5% rare
		for (i=0;i<numTimes;i++) {
			var rand = Math.floor(Math.random() * 101);
			var haveRare = this.rareDrops.length > 0;
			var haveUnc = this.uncDrops.length > 0;
			if (haveRare && rand <= 5) {
				this.scavTable.push(this.rareDrops[Math.floor(Math.random()*this.rareDrops.length)]);
			}
			else if (haveUnc && rand <= 30) {
				this.scavTable.push(this.uncDrops[Math.floor(Math.random()*this.uncDrops.length)]);
			}
			else {
				this.scavTable.push(this.comDrops[Math.floor(Math.random()*this.comDrops.length)]);
			}
		}
	}
	this.getScavengeDrop = function() {
		//If this is empty, return nothing
		//TODO: add in a chance to fail at scav'ing, DIFFERENT from no items;
		if (this.scavTable.length > 0) {
			return this.scavTable.pop();
		}
		else {
			return null;
		}
	}
	this.cleanUp = function() {
		//roll through enemy list, remove ones that HP = 0;
		for (i=0;i<this.mobs.length;i++) {
			if (this.mobs[i].hp == 0) {
				this.mobs.splice(i,1);
			}
		}
		refreshMobs();
	}
}

function Item(name, value, weight, type, article) {
  this.name = name;
  this.value = value;
  this.weight = weight;
  this.type = type;
	this.article = article;
}

function HostileEnemy(name,hp,spd,dodge,soak,hit,dmg,part) {
	//these are the things you can attack, they have stats
	this.name = name;
	this.hp = hp;
	this.maxhp = hp;
	this.lasthit = 0;
	this.spd = spd;
	this.dodge = dodge;
	this.soak = soak;
	this.hit = hit;
	this.dmg = dmg;
	this.part = part;
	this.currentAction = Actions.NONE;
	this.actionTime = [0,0];
	this.actionTarget = null;
	this.getHit = function() {
		return this.hit;
	}
	this.getDodge = function() {
		return this.dodge;
	}
	this.getDmg = function() {
		return this.dmg;
	}
	this.getSoak = function() {
		return this.soak;
	}
	this.getSpd = function() {
		return this.spd;
	}
	this.getXP = function() {
		return 1;
	}
	this.die = function() {
		player.area.addDeadThings(this);
		addLog("You killed the " + this.name + "! Awarded " + this.getXP() + "XP!");
	}
	this.butcher = function() {
		return this.part;
	}
}

//*****************
//Game running code
//*****************

var repopArea = function() {
	//TODO: this will eventually repopulate areas with scavenges and monsters based off elapsed time
}

function setupGame() {
	//I feel like this is a terrible way to initialize your game....
	player = new Player();
	document.getElementById("defaultOpen").click(); //make sure a tab starts open
	d = "You find yourself in a dimly lit basement.";
	var newlvl = new Area(Areas.BASEMENT,d, 30000,100,25,10,5, [true, true, false]);
	//in form of [ItemID,probability]
	newlvl.addScavDrop([0,0])
	newlvl.addScavDrop([1,1]);
	newlvl.addScavDrop([2,2]);
	newlvl.repopScav(5);
	player.area = newlvl;
	player.addInventory(4);
	player.area.addFloorItem(5);
	player.area.addFloorItem(6);
	player.area.addFloorItem(7);
	refreshMobs();
	refreshStats();
	refreshActions();
	refreshScavTable();
	refreshHpBars();
	loadGame();
	window.mainLoop = setInterval(gameLoop, 10);
}

function gameLoop() {
	if (player.actionTime[1] < Date.now()) { //we finished our action!
		if (player.currentAction == Actions.SCAVENGE) {
			scavenge();
		}
		if (player.currentAction == Actions.FIGHT) {
			combat(player,player.actionTarget);
		}
		if (player.currentAction == Actions.GRAB) {
			var itemID = player.area.floorItems[player.actionTarget];
			player.addInventory(itemID);
			player.area.removeFloorItem(player.actionTarget);
			var item = Items[itemID];
			addLog("You pick up " + item.article + " " + item.name + ".")
		}
		if (player.currentAction == Actions.BUTCHER) {
			var deadThing = player.area.floorDeadThings[player.actionTarget];
			var part = deadThing.butcher();
			player.addInventory(part);
			player.area.removeDeadThing(player.actionTarget);
			var item = Items[part];
			addLog("You hack off " + item.article + " " + item.name + " from the " + deadThing.name + ".");
		}
		if (player.currentAction == Actions.DROP) {
			//drop an item based off ItemID
			player.dropItem(player.actionTarget);
			var item = Items[player.actionTarget];
			addLog("You dropped " +  item.article + " " + item.name + " on the floor.");
		}
		if (player.currentAction != Actions.FIGHT) {
			//fight is the only constant repeat...
			player.currentAction = Actions.NONE;
		}
	}
	//check if enemies need to fight
	for (var i=0;i<player.area.mobs.length;i++) {
		if (player.area.mobs[i].currentAction == Actions.FIGHT && player.area.mobs[i].actionTime[1] < Date.now()) {
			combat(player.area.mobs[i],player);
		}
	}
	saveGame();
	refreshActionProgressBar();
}

function combat(attacker, defender) {
	//checks combat actions
	target = attacker.actionTarget;
	hit = attacker.getHit() + roll(3,6);
	if (hit >= defender.getDodge()) {
		dmg = Math.max(0,attacker.getDmg()-defender.getSoak())
		defender.hp = Math.max(defender.hp - dmg, 0);
		defender.lasthit = dmg;
		addLog(attacker.name + " hit the " + defender.name + " for " + dmg.toString() + " damage!");
	}
	else {
		defender.lasthit = 0;
		addLog(attacker.name + " missed!");
	}
	attacker.actionTime[0] = Date.now();
	attacker.actionTime[1] = Date.now()+attacker.getSpd();
	//engage them in combat if we haven't
	if (defender.currentAction == Actions.NONE) {
		console.log("fight me bich");
		defender.currentAction = Actions.FIGHT;
		defender.actionTime[0] = Date.now();
		defender.actionTime[1] = Date.now() + defender.getSpd();
	}
	if (defender.hp == 0) {
		attacker.currentAction = Actions.NONE;
		defender.currentAction = Actions.NONE;
		defender.die();
		player.area.cleanUp();
	}
	refreshHpBars();
}

//is there a better state machine strictire for this kind of system??
function startAction(action,target) {
	//called whenever a player clicks on a "link"
	if (action == "scav") {
		if (player.currentAction == Actions.NONE) {
			player.currentAction = Actions.SCAVENGE;
			player.actionTime[0] = Date.now();
			player.actionTime[1] = Date.now() + 500;
			addLog("You start scavenging...");
		}
		else if (player.currentAction == Actions.SCAVENGE) {
			player.currentAction = Actions.NONE;
			addLog("You stop scavenging.");
		}
	}
	else if (action == "attack") {
		if (player.currentAction == Actions.NONE) {
			player.currentAction = Actions.FIGHT;
			player.actionTarget = player.area.mobs[target];
			player.actionTime[0] = Date.now();
			player.actionTime[1] = Date.now()+player.spd;
			addLog("You launch an attack!");
		}
		else if (player.currentAction == Actions.FIGHT) {
			addLog("You have to finish this fight first!");
		}
	}
	else if (action == "grab") {
		if (player.currentAction == Actions.NONE) {
			player.currentAction = Actions.GRAB;
			player.actionTarget = target;
			player.actionTime[0] = Date.now();
			player.actionTime[1] = Date.now() + 100;
		}
	}
	else if (action == "butcher") {
		if (player.currentAction == Actions.NONE) {
			player.currentAction = Actions.BUTCHER;
			player.actionTarget = target;
			player.actionTime[0] = Date.now();
			player.actionTime[1] = Date.now() + 10000;
			addLog("You start butchering the carcass...");
		}
		else if (player.currentAction == Actions.BUTCHER) {
			player.currentAction = Actions.NONE;
			addLog("You stop butchering.");
		}
	}
	else if (action == "drop") {
		if (player.currentAction == Actions.NONE) {
			player.currentAction = Actions.DROP;
			player.actionTarget = target;
			player.actionTime[0] = Date.now();
			player.actionTime[1] = Date.now() + 100;
		}
	}
}

function scavenge() {
	var newitem = player.area.getScavengeDrop(); //this returns a numberID
	if (newitem != null) {
		player.addScavengeFind(newitem);
		player.addInventory(newitem);
		addLog("You dig around the ground and find a " + Items[newitem].name + "!");
	}
	else {
		addLog("You search around, but it looks like there's nothing here.");
	}
}

function addLog(s) {
	var table = document.getElementById("logTable");
	var row = table.insertRow(0);
	var cell = row.insertCell(0);
	cell.innerHTML = s;
}

function loadGame() {
	//this will eventually have the save/load code when I'm far enough along that it makes sense
}

function saveGame() {
	//this will eventually have the save code when I'm far enough along that it makes sense
}

//********************
//Make the game pretty
//********************

function refreshMobs() {
	var ele = document.getElementById("mobs");
	ele.innerHTML = "<p><h3> Hostile Creatures</h3></p>";
	if (player.area.mobs.length > 0) {
		for (var i=0;i<player.area.mobs.length;i++) {
				ele.innerHTML += "<span id='yellowtxt'>[ </span><span onClick=\"startAction('attack'," + i.toString() +")\" class='link'>Attack</span><span id='yellowtxt'> ] </span>Rat [<span class='greenBar' id='greenBarHE"+i+"'></span><span class='redBar' id='redBarHE"+i+"'></span><span class='greyBar' id='greyBarHE"+i+"'></span>] [<span id='hpHE"+i+"'></span>/<span id='hpMaxHE"+i+"'></span>]</br>";
		}
	}
	else {
		ele.innerHTML += "No monsters seem to be here</br>"
	}
}

function refreshStats() {
	var ele = document.getElementById("brawnStat");
	ele.innerHTML = player.stats.brawn.toFixed(2).toString();
	ele = document.getElementById("brainStat");
	ele.innerHTML = player.stats.brains.toFixed(2).toString();
	ele = document.getElementById("coolStat");
	ele.innerHTML = player.stats.cool.toFixed(2).toString();
	ele = document.getElementById("senseStat");
	ele.innerHTML = player.stats.senses.toFixed(2).toString();
	ele = document.getElementById("reflexStat");
	ele.innerHTML = player.stats.reflexes.toFixed(2).toString();
	ele = document.getElementById("endStat");
	ele.innerHTML = player.stats.endurance.toFixed(2).toString();
}

function refreshActions() {
//hide the ones you can't do
	var scavLink = document.getElementById("scavAction");
	if (player.area.canScav) {
		scavLink.innerText = "Scavenge";
	}
	else {
		scavLink.innerText = "";
	}
}

function refreshScavTable() {
	var table = document.getElementById("scavTable");
	table.innerHTML = "";
	var row = table.insertRow(0);
	row.setAttribute("id", "heading");
	row.innerHTML = "<td>Common Items</td><td>??</td><td>??</td>";
	var drops = player.area.comDrops.concat(player.area.uncDrops, player.area.rareDrops);
	for (i=0;i < drops.length; i++) {
		var itemID = drops[i];
		var areaName = player.area.name;
		row = table.insertRow(-1);
		var cell1 = row.insertCell(-1);
		var cell2 = row.insertCell(-1);
		var cell3 = row.insertCell(-1);
		if (areaName in player.scavFound && player.scavFound[areaName].includes(itemID)) {
			cell1.innerHTML = Items[itemID].name;
		}
		else {
			cell1.innerHTML = "???"
		}
		cell2.innerHTML = "???"
		cell3.innerHTML = "???"
	}
}

function refreshHpBars() {
	//player
	document.getElementById("playerHP").innerHTML = player.hp;
	document.getElementById("playerHPmax").innerHTML = player.maxhp;
	var greenHP = Math.floor(player.hp/player.maxhp*20);
	var redHP = Math.floor(player.lasthit/player.maxhp*20);
	var greyHP = 20-greenHP-redHP;
	document.getElementById("greenBarHP").innerHTML = "|".repeat(greenHP)
	document.getElementById("redBarHP").innerHTML = "*".repeat(redHP);
	document.getElementById("greyBarHP").innerHTML = "-".repeat(greyHP);
	//hostilemobs
	for (var i=0;i<player.area.mobs.length;i++) {
		mob = player.area.mobs[i];
		document.getElementById("hpHE"+i).innerHTML = mob.hp;
		document.getElementById("hpMaxHE"+i).innerHTML = mob.maxhp;
		var greenHP = Math.floor(mob.hp/mob.maxhp*20);
		var redHP = Math.floor(mob.lasthit/mob.maxhp*20);
		var greyHP = 20-greenHP-redHP;
		document.getElementById("greenBarHE"+i).innerHTML = "|".repeat(greenHP);
		document.getElementById("redBarHE"+i).innerHTML = "*".repeat(redHP);
		document.getElementById("greyBarHE"+i).innerHTML = "-".repeat(greyHP);
	}
}

function refreshActionProgressBar() {
	var actionTxt = document.getElementById("action");
	if (player.currentAction == Actions.NONE) {
		actionTxt.innerHTML = "None!"
		document.getElementById("greenBar").innerHTML = "";
		document.getElementById("greyBar").innerHTML = "-".repeat(20);
	}
	else {
		actionTxt.innerHTML = player.currentAction;
		var percentDone = Math.floor((Date.now() - player.actionTime[0])/(player.actionTime[1] - player.actionTime[0])*20);
		var percentLeft = 20-percentDone;
		document.getElementById("greenBar").innerHTML = "|".repeat(percentDone)
		document.getElementById("greyBar").innerHTML = "-".repeat(percentLeft)
	}
}

function refreshAreaFloor() {
	//fix the floor text
	ele = document.getElementById("floorItems")
	ele.innerHTML = "";
	if (player.area.floorItems.length > 0) {
		ele.innerHTML += "You see "
		for (var i=0;i<player.area.floorItems.length;i++) {
			var item = Items[player.area.floorItems[i]]
			if (i+1 == player.area.floorItems.length) {
				ele.innerHTML += "and "
			}
			ele.innerHTML += item.article + " <span onClick=\"startAction('grab',"+i.toString()+")\" class='link'>" + item.name + "</span>, "
		}
		ele.innerHTML = ele.innerHTML.slice(0,-2);
		ele.innerHTML += " on the floor."
	}
}

function refreshDeadThings() {
	ele = document.getElementById("floorDead")
	ele.innerHTML = "";
	if (player.area.floorDeadThings.length > 0) {
		ele.innerHTML += "You see the corpse"
		if (player.area.floorDeadThings.length > 1) {
			ele.innerHTML += "s"
		}
		ele.innerHTML += " of "
		for (var i=0;i<player.area.floorDeadThings.length;i++) {
			deadThing = player.area.floorDeadThings[i];
			ele.innerHTML += "a <span onClick=\"startAction('butcher',"+i.toString()+")\" class='link'>" + deadThing.name + "</span>, "
		}
		ele.innerHTML = ele.innerHTML.slice(0,-2);
		ele.innerHTML += " on the floor."
	}
}

function refreshInventory() {
	//makes an array in this form
	//inv = {
	//   "misc" : [[0,1],[2,1],[5,1]],
	//   "clothing" : [[1,1]],
	//}
	//where [itemID,count]
	var inv = {}
	console.log(player.inventory);
	for (const [itemID, num] of Object.entries(player.inventory)) {
		//player.inventory is a dictionary in form [itemID,num]
		category = Items[itemID].type;
		if (category in inv) {
			inv[category].push([Items[itemID].name,num,itemID]);
		}
		else {
			inv[category] = [[Items[itemID].name,num,itemID]];
		}
	}
	//now we have to print it out
	ele = document.getElementById("inventory");
	ele.innerHTML = "<h3>Inventory</h3>"
	for (const [cat, item] of Object.entries(inv)) {
		ele.innerHTML += "<p><span id='yellowtxt'>" + cat + "</span></p>"
		for (i=0;i<inv[cat].length;i++) {
			ele.innerHTML += "[" + inv[cat][i][1] + "] <span onClick=\"startAction('drop'," + inv[cat][i][2].toString() +")\" class='link'>" + inv[cat][i][0] + "</span></br>"
		}

	}
}

//*************************
//Misc functions that exist
//*************************
function msToTime(duration) {
    var milliseconds = parseInt((duration%1000)/100)
        , seconds = parseInt((duration/1000)%60)
        , minutes = parseInt((duration/(1000*60))%60)
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;
    return minutes + ":" + seconds;
} //not used but might later?

function openTab(evt, tab) {
    // Declare all variables
    var i, tabcontent, tablinks;

    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(tab).style.display = "block";
    evt.currentTarget.className += " active";
}

function roll(n,d) {
	result = 0
	for (var i=0;i<n;i++) {
		result += Math.floor(Math.random() * d) + 1;
	}
	return result;
}
