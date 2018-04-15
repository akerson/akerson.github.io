

const ItemType = {
	EQUIPMENT : "Equipment",
	COMPONENT : "Component",
	CONSUMABLE : "Consumable",
	MONEY : "Money",
	NONE : "None",
	MISC : "Misc.",
	CHEMICAL : "Chemical",
	CORPSE : "Corpse",
}

const ItemRarity = {
	COMMON : 0,
	UNCOMMON: 1,
	RARE : 2,
}

const EquipSlots = {
	HEAD : "head",
	FACE : "face",
	CHEST : "chest",
	HAND : "hand",
	LEG : "leg",
	FEET : "foot",
	MH : "mainHand",
	OH : "offHand",
}

const Actions = {
	NONE : ["None","None"],
	SCAVENGE: ["Scavenging...","Scavenge"],
	FIGHT : ["Fighting...","Fight"],
	TALK : ["Talking...","Talk"],
	GRAB : ["Picking Up...","Pick Up"],
	BUTCHER : ["Butchering...","Butcher"],
	DROP : ["Dropping...","Drop"],
	SIT : ["Sitting down...","Sit"],
	STAND : ["Standing up...","Stand"],
	USE : ["Using item...","Use"],
	MOVE : ["Moving...","Move"],
	EQUIP : ["Equipping...","Equip"],
	UNEQUIP : ["Unequipping...","Unequip"],
	CUDDLE : ["Cuddling...","Cuddle"],
}

const ItemDB = {
	1 : new Item("plank",0.15,0.4,ItemType.COMPONENT, "a","planks","A wooden plank, in fairly decent condition. Could probably fashion as a makeshift weapon."),
	2 : new Item("pile of trash",0.01,0.1,ItemType.COMPONENT, "a", "piles of trash","Someone didn't take the trash out prior to the apocalypse. Or it was a pile made after trash collection was no longer a thing."),
	3 : new Item("key",0.01,0.1,ItemType.COMPONENT, "a","keys","A strange metal key, probably used to lock (or unlock) some door or device."),
	4 : new Item("wristpad",0,0.1,ItemType.MISC,"a", "wristpads", "A thick wristwatch with an integrated keyboard and mini-LCD. A credit chip is attached to the left side of the wristpad, next to the clock display, with a few wires leading into your bare skin.  You've had it your whole life, so you never really noticed until just now how disturbing and occasionally itchy that is."),
	5 : new Item("bottle of ammonia",0,0.5,ItemType.CHEMICAL,"a", "bottles of ammonia", "A bottle of NH3. Probably used to clean things in a previous time."),
	6 : new Item("ashtray",0,0,ItemType.MISC,"an", "ashtrays", "A worn out ashtray, which looks like it held it's fair share of cigarettes in its day."),
	7 : new Item("resistor",0,0,ItemType.COMPONENT,"a", "resistors", "A small electrical component used in various electronics."),
	8 : new Item("rat tail",0.15,0.5,ItemType.MISC,"a", "rat tails", "The cut off tail of a rat (you savage!)"),
	9 : new Item("stone",0.03,0.5,ItemType.COMPONENT, "a","stones","A small stone, probably leftover debris from the crumbling infrastructure."),
	10 : new Item("cinderblock",0.15,0.5,ItemType.MISC,"a", "cinderblocks", "A large, slightly crumbling, cinder block. It's heavy!"),
	11 : new Item("packet of sugar",0.15,0.5,ItemType.CHEMICAL,"a", "packets of sugar", "A small packet of white crystals, and not the meth kind. You think it was used in cooking."),
	12 : new Item("dead rat",0.15,0.5,ItemType.CORPSE,"a","dead rats","The lifeless body of a dead rat. Haven't you seen a dead rat before?"),
}

const Enemies = {
	RAT : "rat",
}

const mapGenerator = (() => {
	this.maps = [
		{
	    type: Areas.BASEMENT,
	    map: [
			["d`.`","d`.`","d`.`","d`.`","d`.`","d`.`","d`.`","d`.`","d`.`","d`.`"],
			["d`.`","d`.`","d`.`","d`.`","d`.`","d`.`","d`.`","d`.`","d`.`","d`.`"],
			["d`.`","d`.`","d`.`","d`.`","d`.`","d`.`","d`.`","d`.`","d`.`","d`.`"],
			["d`.`","d`.`","d`.`","d`.`","b||","r^^","d`.`","d`.`","d`.`","d`.`"],
			["d`.`","d`.`","d`.`","d`.`","b|'","bo|","d`.`","d`.`","d`.`","d`.`"],
			["d`.`","d`.`","d`.`","d`.`","bL.","b,]","d`.`","d`.`","d`.`","d`.`"],
			["d`.`","d`.`","d`.`","d`.`","d`.`","d`.`","d`.`","d`.`","d`.`","d`.`"],
			["d`.`","d`.`","d`.`","d`.`","d`.`","d`.`","d`.`","d`.`","d`.`","d`.`"],
			["d`.`","d`.`","d`.`","d`.`","d`.`","d`.`","d`.`","d`.`","d`.`","d`.`"],
			["d`.`","d`.`","d`.`","d`.`","d`.`","d`.`","d`.`","d`.`","d`.`","d`.`"],
		],
	},
	// other enemies
	];
	return (typeParam,x,y) => {
	  const foundMap = this.maps.find(({ type }) => type === typeParam).map;
		const newMap = JSON.parse(JSON.stringify(foundMap)); //this is a fast way to make a copy not a reference to the map
		const mapSizeX = newMap[0].length;
		const mapSizeY = newMap.length;
		//locate the center x and center y that still is a 5x5
		//bump out the sides and splice
		const xAdj = x-Math.max(0,x+3-mapSizeX)-Math.min(0,x-3);
		const yAdj = y-Math.max(0,y+3-mapSizeY)-Math.min(0,y-3);
		newMap[y][x] = "p()";
		return (newMap.slice(yAdj-3,yAdj+4).map( function(row){ return row.slice(xAdj-3,xAdj+4); }));
	}
})();

let player = null;
let examine = null;

function itemPrep() {
	//this changes all the items out of their generic functions
	//wristpad
	ItemDB[1].actions.push(Actions.EQUIP);
	ItemDB[1].actions.push(Actions.UNEQUIP);
	ItemDB[1].slot = EquipSlots.MH;
	ItemDB[1].spd = 1200;
	ItemDB[1].raw = [2,3];
	ItemDB[4].actions = [Actions.USE];
	ItemDB[4].use = function() {
		var time = new Date();
		addLog("Your credit chip shows: $500");
		addLog("The time is: " + time.getHours() + ":" + time.getMinutes());
		addLog("Your wristpad boots up.");
	}
	player.addInventory(4);
	ItemDB[12].actions.push(Actions.BUTCHER);
	ItemDB[12].butcher = function(area) {
		player.addInventory(8);
		if (area === "floor") {
			player.area.removeFloorItem(12);
		}
		else if (area === "inventory") {
			player.removeInventory(12);
		}
		addLog("You butchered the rat and managed to get 1 rat tail.");
	}
}

//************************
//constructors
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
	}
	this.equip = {
		"head" : 0,
		"face" : 0,
		"chest" : 0,
		"hand" : 0,
		"leg" : 0,
		"foot" : 0,
		"mainHand" : 0,
		"offHand" : 0,
	}
}

Player.prototype.addInventory = function(item) {
	//returns a FULL item. If the item is unqiue, just add it. If it isn't, find the copy with it and add it.
	if (item in this.inventory) {
		this.inventory[item] += 1;
	}
	else {
		this.inventory[item] = 1;
	}
	refreshInventory();
}

Player.prototype.removeInventory = function(item) {
	this.inventory[item] -= 1;
	if (this.inventory[item] === 0) {
		delete this.inventory[item];
	}
	refreshInventory();
}

Player.prototype.dropItem = function(item) {
	this.removeInventory(item);
	this.area.addFloorItem(item);
	refreshInventory();
}

Player.prototype.getHit = function() {
	return 50;
}

Player.prototype.getDodge = function() {
	return this.dodge
}

Player.prototype.getDmg = function() {
	const item = player.equip["mainHand"]
	if (item === 0) {
		return 1;
	}
	else {
		return Math.floor(Math.random()) + 2  ;
	}
}

Player.prototype.getSoak = function() {
	return 0;
}

Player.prototype.getSpd = function() {
	const item = player.equip["mainHand"]
	if (item === 0) {
		return 1000;
	}
	else {
		return ItemDB[item].spd;
	}
}

Player.prototype.die = function() {
	addCombatLog("Sorry you died, here's your life back for now, since those rats aren't balanced.");
	this.hp = 10;
	this.lasthit = 0;
}

Player.prototype.equipItem = function(itemID) {
	const someitem = ItemDB[itemID];
	if (this.equip[someitem.slot] !== 0) this.unequipItem(itemID);
	this.equip[someitem.slot] = itemID;
	addLog("You equip your " + someitem.name + ".");
}

Player.prototype.unequipItem = function(itemID) {
	const someitem = ItemDB[itemID];
	this.equip[someitem.slot] = 0;
	this.addInventory(itemID);
	addLog("You unequip your " + someitem.name + ".");
}



function Item(name, value, weight, type, article, plural, description) {
	this.name = name;
  	this.value = value;
  	this.weight = weight;
  	this.type = type;
	this.article = article;
	this.plural = plural;
	this.description = description;
	this.actions = [Actions.GRAB,Actions.DROP];
}


function examineBox() {
	this.examining = null;
	this.itemname = null;
	this.description = null;
	this.actions = null;
	this.actionFrom = null;
	this.availableActions = {
		"floor" : [Actions.GRAB,Actions.BUTCHER, Actions.EQUIP],
		"inventory" : [Actions.DROP,Actions.USE,Actions.BUTCHER,Actions.EQUIP],
		"mob" : [Actions.FIGHT, Actions.CUDDLE],
		"gear" : [Actions.UNEQUIP],
	}
	this.update = function(area,itemID) {
		if (area === "inventory" || area === "floor") {
			this.examining = itemID;
			this.itemname = ItemDB[itemID].name;
			this.description = ItemDB[itemID].description;
			this.actions = [];
			this.actionFrom = area;
			this.availableActions[area].forEach((action,_) => {
				if (ItemDB[itemID].actions.includes(action)) {
					this.actions.push(action);
				}
			});
		}
		else if (area === "mob") {
			this.examining = player.area.mobs[itemID];
			this.itemname = this.examining.name;
			this.description = this.examining.description;
			this.actions = [];
			this.actionFrom = area;
			this.availableActions[area].forEach((action,_) => {
				if (this.examining.actions.includes(action)) {
					this.actions.push(action);
				}
			});
		}
		else if (area === "gear") {
			//figure out the piece of gear by name and then add it's ID
			for (const [slot, gear] of Object.entries(player.equip)) {
				if (gear !== 0) {
					const name = ItemDB[gear].name;
					if (itemID === name) {
						//that's the one we clicked on!
						this.examining = gear;
						this.itemname = name;
						this.description = ItemDB[gear].description
						this.actions = [];
						this.actionFrom = area;
						this.availableActions[area].forEach((action,_) => {
							console.log(action,ItemDB[gear].actions);
							if (ItemDB[gear].actions.includes(action)) {
								console.log("success?");
								this.actions.push(action);
							}
						});
					}
				}
			};
		}
		document.getElementById("defaultOpen").click();
		clearLog();
		refreshExamineBox();
	}
	this.clear = function() {
		this.examining = null;
		this.itemnname = null;
		this.description = null;
		this.actions = null;
		refreshExamineBox();
	}
}

//**********
//Generator?
//**********



function formattedItem(item,num) {
	const name = ItemDB[item].name;
	const plural = ItemDB[item].plural;
	const article = ItemDB[item].article;
	if (!num) {
		return "no " + plural;
	}
	if (num === 0) return "";
	if (num === 1) return article + " " + name;
	const ones = ["","one","two","three","four","five","six","seven","eight","nine"]
	const tens = ["ten","eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen","eightteen","nineteen"]
	const big = ["","","twenty","thirty","fourty","fifty","sixty","seventy","eighty","ninety","one hundred"];
	if (num < 10) return ones[num] + " " + plural;
	if (num < 20) return tens[num-10] + " " + plural;
	const bigNum = Math.floor(num/10);
	const bigNumRemainder = num%10;
	let hyphen = "-";
	if (bigNumRemainder === 0) hyphen = "";
	return big[bigNum] + hyphen + ones[bigNumRemainder] + " " + plural;
}

//*****************
//Game running code
//*****************

const repopArea = function() {
	//TODO: this will eventually repopulate areas with scavenges and monsters based off elapsed time

}

function setupGame() {
	//I feel like this is a terrible way to initialize your game....
	player = new Player();
	examine = new examineBox();
	document.getElementById("defaultOpen").click(); //make sure a tab starts open
	itemPrep();
	LoadAreas();
	refreshMobs();
	refreshAreaFloor();
	refreshStats();
	refreshActions();
	refreshExits();
	loadGame();
	refreshMiniMap();
	refreshHeader();
	addListeners();
	refreshGear();
	refreshHP();
	window.mainLoop = setInterval(gameLoop, 10);
}

function gameLoop() {
	if (player.actionTime[1] < Date.now()) { //we finished our action!
		if (player.currentAction === Actions.MOVE) {
			examine.clear();
			player.area = player.actionTarget;
			refreshMobs();
			refreshAreaFloor();
			refreshActions();
			refreshExits();
			refreshMiniMap();
			refreshHeader();
		}
		if (player.currentAction === Actions.SCAVENGE) {
			scavenge();
		}
		if (player.currentAction === Actions.FIGHT) {
			player.actionTime[0] = Date.now();
			player.actionTime[1] = Date.now() + 1500;
			combatLoop();
		}
		if (player.currentAction === Actions.GRAB) {
			//grab an item from the floor with the right ID
			player.addInventory(player.actionTarget);
			player.area.removeFloorItem(player.actionTarget);
			if (!(player.actionTarget in player.area.floorItems)) {
				//aka no more items on the floor
			}
			addLog("You pick up " + formattedItem(player.actionTarget,1) + ".")
			refreshExamineBox();
		}
		if (player.currentAction === Actions.BUTCHER) {
			const deadThingID = player.actionTarget;
			const item = ItemDB[deadThingID];
			item.butcher(player.actionLocation);
			refreshExamineBox();
		}
		if (player.currentAction === Actions.DROP) {
			//drop an item based off ItemID
			player.dropItem(player.actionTarget);
			const item = ItemDB[player.actionTarget];
			addLog("You dropped " +  item.article + " " + item.name + " on the floor.");
			refreshExamineBox();
		}
		if (player.currentAction === Actions.SIT) {
			player.hp = Math.min(player.maxhp, player.hp + 1);
			refreshHP();
			player.lasthit = 0;
			player.actionTime[0] = Date.now();
			player.actionTime[1] = Date.now() + 5000;
			addLog("You feel a little refreshed! +1 HP");
		}
		if (player.currentAction != Actions.FIGHT && player.currentAction != Actions.SIT) {
			//fight is the only constant repeat...
			player.currentAction = Actions.NONE;
		}
	}
	saveGame();
	refreshActionProgressBar();
}

const combatTime = {
	playerTimer : 0,
	enemyTimer : 0,
}

function combatLoop() {
	//whoever's timer is lower attacks this round, player wins tie
	let attacker = null;
	let defender = null;
	console.log(combatTime.playerTimer,combatTime.enemyTimer)
	if (combatTime.playerTimer <= combatTime.enemyTimer) {
		attacker = player;
		defender = player.actionTarget;
		combatTime.playerTimer += player.getSpd();
	}
	else {
		attacker = player.actionTarget;
		defender = player;
		combatTime.enemyTimer += player.actionTarget.getSpd();
	}
	//checks combat actions
	hit = attacker.getHit() + roll(3,6);
	if (hit >= defender.getDodge()) {
		dmg = Math.max(0,attacker.getDmg()-defender.getSoak());
		defender.hp = Math.max(defender.hp - dmg, 0);
		defender.lasthit = dmg;
		addCombatLog(attacker.name + " hit " + defender.name + " for " + dmg.toString() + " damage!");
	}
	else {
		defender.lasthit = 0;
		addCombatLog(attacker.name + " missed!");
	}
	if (defender.hp === 0) {
		attacker.currentAction = Actions.NONE;
		defender.die();
		player.area.cleanUp();
	}
	refreshCombatHP(player.actionTarget);
}

function exitSomewhere(target) {
	if (player.currentAction === Actions.NONE) {
		console.log(target,player.area.exits);
		for (let i=0;i<player.area.exits.length;i++) {
			if (target === player.area.exits[i][0]) {
				player.actionTarget = player.area.exits[i][1];
				startAction(Actions.MOVE[1]);
				return;
			}
		}
		addLog("You can't go that direction!");
	}
}
//is there a better state machine strictire for this kind of system??
function startAction(action,location) {
	//called whenever a player clicks on a "link"
	if (player.currentAction === Actions.SIT) {
		player.currentAction = Actions.NONE;
		player.area.swapSitStand();;
		addLog("You stand up.");
	}
	if (action === Actions.MOVE[1]) {
		if (player.currentAction === Actions.NONE) {
			player.currentAction = Actions.MOVE;
			player.actionTarget = AreaDB[player.actionTarget];
			player.actionTime[0] = Date.now();
			player.actionTime[1] = Date.now() + 1000;
		}
	}
	else if (action === Actions.SCAVENGE[1]) {
		if (player.currentAction === Actions.NONE) {
			player.currentAction = Actions.SCAVENGE;
			player.actionTime[0] = Date.now();
			player.actionTime[1] = Date.now() + 500;
			examine.clear();
			addLog("You start scavenging...");
		}
		else if (player.currentAction === Actions.SCAVENGE) {
			player.currentAction = Actions.NONE;
			addLog("You stop scavenging.");
		}
	}
	else if (action === Actions.FIGHT[1]) {
		if (player.currentAction === Actions.NONE) {
			player.currentAction = Actions.FIGHT;
			player.actionTarget = examine.examining;
			refreshCombatHP(player.actionTarget);
			document.getElementById("combatPane").click();
			clearCombatLog();
			addCombatLog("You launch an attack!");
			combatTime.playerTimer = player.getSpd()*1.25;
			combatTime.enemyTimer = player.actionTarget.getSpd();
			player.actionTime[0] = Date.now();
			player.actionTime[1] = Date.now() + 1500;
			console.log(player.actionTarget);
		}
		else if (player.currentAction === Actions.FIGHT) {
			addLog("You have to finish this fight first!");
		}
	}
	else if (action === Actions.GRAB[1]) {
		if (player.currentAction === Actions.NONE) {
			player.currentAction = Actions.GRAB;
			player.actionTarget = examine.examining;
			player.actionTime[0] = Date.now();
			player.actionTime[1] = Date.now() + 100;
		}
	}
	else if (action === Actions.BUTCHER[1]) {
		if (player.currentAction === Actions.NONE) {
			player.currentAction = Actions.BUTCHER;
			player.actionTarget = examine.examining;
			player.actionLocation = examine.actionFrom;
			player.actionTime[0] = Date.now();
			player.actionTime[1] = Date.now() + 10000;
			addLog("You start butchering the carcass...");
		}
		else if (player.currentAction === Actions.BUTCHER) {
			player.currentAction = Actions.NONE;
			addLog("You stop butchering.");
		}
	}
	else if (action === Actions.DROP[1]) {
		if (player.currentAction === Actions.NONE) {
			player.currentAction = Actions.DROP;
			player.actionTarget = examine.examining;
			player.actionTime[0] = Date.now();
			player.actionTime[1] = Date.now() + 100;
		}
	}
	else if (action === Actions.SIT[1]) {
		//replace area with STAND
		if (player.currentAction === Actions.NONE) {
			player.currentAction = Actions.SIT;
			player.actionTarget = player;
			player.actionTime[0] = Date.now();
			player.actionTime[1] = Date.now() + 5000;
			player.area.swapSitStand();
			examine.clear();
			addLog("You sit down.");
		}
	}
	else if (action === Actions.STAND[1]) {
		if (player.currentAction === Actions.SIT) {
			player.currentAction = Actions.STAND;
			player.actionTarget = player;
			player.actionTime[0] = Date.now();
			player.actionTime[1] = Date.now() + 100;
			player.area.swapSitStand();
			examine.clear();
			addLog("You stand up.");
		}
	}
	else if (action === Actions.USE[1]) {
		if (player.currentAction === Actions.NONE) {
			player.actionTarget = examine.examining;
			ItemDB[examine.examining].use();
		}
	}
	else if (action === Actions.EQUIP[1]) {
		if (player.currentAction === Actions.NONE) {
			player.actionTarget = examine.examining;
			player.equipItem(examine.examining);
			if (location === "floor") {
				player.area.removeFloorItem(player.actionTarget);
			}
			else if (location === "inventory") {
				player.removeInventory(player.actionTarget);
			}
		}
		refreshGear();
		refreshExamineBox();
	}
	else if (action === Actions.UNEQUIP[1]) {
		if (player.currentAction === Actions.NONE) {
			player.actionTarget = examine.examining;
			player.unequipItem(examine.examining);
		}
	}
	else if (action === Actions.CUDDLE[1]) {
		addLog("You cuddle the rat.");
		addLog("The rat cuddles you back.")
	}
	refreshGear();
	refreshExamineBox();
}

function scavenge() {
	const newitem = player.area.getScavengeDrop(); //this returns a numberID
	if (!newitem) {
		addLog("You search around, but it looks like there's nothing here.");
		return;
	}
	player.addInventory(newitem);
	addLog("You dig around the ground and find a " + ItemDB[newitem].name + "!");
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

function addLog(s) {
const logDiv = document.getElementById('examineResult');
logDiv.appendChild(document.createElement('div')).textContent = s;
}

function addCombatLog(s) {
	const logDiv = document.getElementById('attackLog');
	logDiv.appendChild(document.createElement('div')).textContent = s;
}

function clearCombatLog() {
	document.getElementById('attackLog').innerHTML = "";
}

function refreshMobs() {
  const mobsDiv = document.getElementById('mobHeader');
	mobsDiv.innerHTML = "";
	if (player.area.mobs.length === 0) {
		return;
	}

	player.area.mobs.forEach((mob,i)=> {

		const mobName = mobsDiv.appendChild(document.createElement('span'));
		mobName.classList.add("link");
		mobName.setAttribute("mobnum",i);
		if (i===0) {
			mobName.innerText = mob.areaname.charAt(0).toUpperCase() + mob.areaname.slice(1) + mob.name;
		}
		else {
			mobName.innerText = mob.areaname + mob.name;
		}
		let delimiter = ""
		if (i+2 === player.area.mobs.length) {
			if (player.area.mobs.length === 2) {
				delimiter = document.createTextNode(" and ");
			}
			else {
				delimiter = document.createTextNode(", and ");
			}
		}
		else {
			delimiter = document.createTextNode(", ");
		}
		mobsDiv.appendChild(delimiter);
	});
	mobsDiv.removeChild(mobsDiv.lastChild);
	if (player.area.mobs.length === 1) {
		mobsDiv.innerHTML += " is standing here.";
	}
	else {
		mobsDiv.innerHTML += " are standing here.";
	}
}

function refreshStats() {
	document.getElementById("brawnStat").textContent = player.stats.brawn.toFixed(2).toString();
	document.getElementById("brainStat").textContent = player.stats.brains.toFixed(2).toString();
	document.getElementById("coolStat").textContent = player.stats.cool.toFixed(2).toString();
	document.getElementById("senseStat").textContent = player.stats.senses.toFixed(2).toString();
	document.getElementById("reflexStat").textContent = player.stats.reflexes.toFixed(2).toString();
	document.getElementById("endStat").textContent = player.stats.endurance.toFixed(2).toString();
}

function refreshActions() {
	const actionDiv = document.getElementById("actions");
	actionDiv.innerHTML = "";
	return (() => {
		if (player.area.actions.length === 0) {
			actionDiv.textContent = 'No actions available here.';
			return;
		}
		actionDiv.innerHTML = "<span class='yellowtxt'>[ Actions: </span>";
		player.area.actions.forEach((action,i) => {
			const actionSpan = actionDiv.appendChild(document.createElement('span'));
			actionSpan.classList.add("link");
			actionSpan.textContent = action[1];
			const delimiter = document.createTextNode(", ");
			actionDiv.appendChild(delimiter);
		});
		actionDiv.removeChild(actionDiv.lastChild);
		actionDiv.innerHTML += "<span class='yellowtxt'> ]</span>";
	})();
}

function refreshExits() {
	const exitDiv = document.getElementById("exits");
	exitDiv.innerHTML = "";
	if (player.area.exits.length === 0) {
		exitDiv.textContent = 'No available exits.';
		return;
	}
	exitDiv.innerHTML = "<span class='yellowtxt'>[ Exits: </span>";
	player.area.exits.forEach((exitText,_) => {
		const exitSpan = exitDiv.appendChild(document.createElement('span'));
		exitSpan.classList.add("link");
		exitSpan.setAttribute("exit",exitText[0]);
		exitSpan.textContent = exitText[0];
		const delimiter = document.createTextNode(", ");
		exitDiv.appendChild(delimiter);
	});
	exitDiv.removeChild(exitDiv.lastChild);
	exitDiv.innerHTML += "<span class='yellowtxt'> ]</span>";
}

function addListeners() {
	document.addEventListener('keyup', (e) => {
		if (e.keyCode === 87) exitSomewhere("north");
		else if (e.keyCode === 65) exitSomewhere("west");
		else if (e.keyCode === 83) exitSomewhere("south");
		else if (e.keyCode === 68) exitSomewhere("east");
	});
	const exitDiv = document.getElementById('exits');
  exitDiv.addEventListener('click', (e) => {
    if (!e.target.classList.contains("link")) return;
		const exitNum = e.target.getAttribute("exit");
		exitSomewhere(exitNum);
  });
	const actionDiv = document.getElementById("actions");
	actionDiv.addEventListener('click', (e) => {
		if (!e.target.classList.contains("link")) return;
    const index = [...actionDiv.children].indexOf(e.target);
    startAction([...actionDiv.children][index].textContent, index);
  });
	const mobsDiv = document.getElementById('mobs');
  mobsDiv.addEventListener('click', (e) => {
		if (!e.target.classList.contains("link")) return;
		const mobNum = e.target.getAttribute("mobnum");
    examine.update("mob",mobNum);
  });
	const floorDiv = document.getElementById("floorItems");
	floorDiv.addEventListener('click', (e) => {
		if (!e.target.classList.contains("link")) return;
		const itemID = e.target.getAttribute("itemID");
    examine.update("floor",itemID);
  });
	const invDiv = document.getElementById("inventory");
	invDiv.addEventListener('click', (e) => {
		if (!e.target.classList.contains("link")) return;
		const itemID = e.target.getAttribute("itemID");
    	examine.update("inventory",itemID);
	});
	const examDiv = document.getElementById("examine");
	examDiv.addEventListener('click', (e) => {
		if (!e.target.classList.contains("link")) return;
		startAction(e.target.textContent,examine.actionFrom);
	});
	const gearDiv = document.getElementById("gear");
	gearDiv.addEventListener('click', (e) => {
		if (!e.target.classList.contains("link")) return;
		examine.update("gear",e.target.textContent);
	});	
}

function refreshActionProgressBar() {
	const actionTxt = document.getElementById("action");
	actionTxt.innerHTML = player.currentAction[0];
	if (player.currentAction === Actions.NONE) {
		document.getElementById("yellowBar").innerHTML = "";
		document.getElementById("greyBar").innerHTML = "-".repeat(20);
	}
	else {
		const percentDone = Math.floor((Date.now() - player.actionTime[0])/(player.actionTime[1] - player.actionTime[0])*20);
		const percentLeft = 20-percentDone;
		document.getElementById("yellowBar").innerHTML = "|".repeat(percentDone)
		document.getElementById("greyBar").innerHTML = "-".repeat(percentLeft)
	}
}

function refreshAreaFloor() {
	//fix the floor text
	const floorDiv = document.getElementById("floorItems")
	floorDiv.innerHTML = "";
	let empty = true;
	floorDiv.textContent += "You see ";
	let i = 0;
	for (const [itemID, count] of Object.entries(player.area.floorItems)) {
		empty = false;
		const itemSpan = floorDiv.appendChild(document.createElement('span'));
		itemSpan.classList.add("link");
		itemSpan.setAttribute("itemID",itemID)
		itemSpan.textContent = formattedItem(itemID,count);
		let delimiter = ""
		if (i+2 === Object.keys(player.area.floorItems).length) { //second last element needs the and
			if (Object.keys(player.area.floorItems).length === 2) {
				delimiter = document.createTextNode(" and ");
			}
			else {
				delimiter = document.createTextNode(", and ");
			}
		}
		else {
			delimiter = document.createTextNode(", ");
		}
		floorDiv.appendChild(delimiter);
		i++;
	};
	if (empty) {
		floorDiv.textContent = "There is nothing on the floor."
	}
	else {
		floorDiv.removeChild(floorDiv.lastChild);
		floorDiv.innerHTML += " on the floor."
	}
}

function refreshInventory() {
	//inventory is a list of items, their count is in count property.
	//dictionary for headers, fancy it during generation
	sortedInventory = {};
	for (const [itemID, count] of Object.entries(player.inventory)) {
		item = ItemDB[itemID];
		if (item.type in sortedInventory) {
			sortedInventory[item.type].push([itemID,count]);
		}
		else {
			sortedInventory[item.type] = [[itemID,count]];
		}
	}
	//now we have to print it out
	const invDiv = document.getElementById("inventory");
	invDiv.innerHTML = "<h3>Inventory</h3></br>";
	for (const [category, itemList] of Object.entries(sortedInventory)) {
		const headerDiv = invDiv.appendChild(document.createElement('div'));
		headerDiv.classList.add("yellowtxt");
		headerDiv.innerHTML = category;
		itemList.forEach((item,_) => {
			const itemSpan = invDiv.appendChild(document.createElement('div'));
			itemSpan.classList.add('link');
			itemSpan.setAttribute("itemID",item[0]);
			itemSpan.textContent = formattedItem(item[0],item[1]);
			itemSpan.id = "inv" + item.id;
		})
	}
}

function refreshMiniMap() {
	//takes an array of array, splits off the first character as the td class and the other two as the guts and outputs a table
	const mapR = player.area.map;
	const mapDiv = document.getElementById("area-map");
	mapDiv.innerHTML = "";
	const mapTable = mapDiv.appendChild(document.createElement('table'));
	mapTable.classList.add('whiteborder');
	mapR.forEach((rowC) => {
		const row = mapTable.insertRow(-1);
		rowC.forEach((txt) => {
			const cellClass = txt.charAt(0);
			const cellContent = txt.slice(-2);
			const cell = row.insertCell(-1);
			cell.className = cellClass;
			cell.textContent = cellContent;
		});
	});
}

function refreshHeader() {
	const areaName = document.getElementById("area-name");
	const areaSub = document.getElementById("area-sub");
	const areaDesc = document.getElementById("area-desc");
	areaName.textContent = player.area.name;
	areaSub.textContent = player.area.area;
	areaDesc.textContent = player.area.description;
}

function refreshExamineBox() {
	const examDiv = document.getElementById("examineMain");
	examDiv.innerHTML = "<h3>Examine</h3></br>"
	if (!examine.examining) {
		examDiv.innerHTML += "Nothing currently selected.";
		return;
	}

	const examName = examDiv.appendChild(document.createElement('div'));
	examName.classList.add('yellowtxt');
	examName.textContent = examine.itemname;
	const examDesc = examDiv.appendChild(document.createElement('div'));
	examDesc.textContent = examine.description;

	examDiv.appendChild(document.createElement('p'));

	let num = 0;
	const countText = examDiv.appendChild(document.createElement('div'));

	if (examine.actionFrom == "floor" && examine.examining in player.area.floorItems) {
		num = player.area.floorItems[examine.examining];
		if (num == 1) countText.textContent = "There is " + formattedItem(examine.examining,num) + " on the floor here."
		else countText.innerHTML = "There are " + formattedItem(examine.examining,num) + " on the floor here."
	}
	else if (examine.actionFrom === "inventory" && examine.examining in player.inventory) {
		num = player.inventory[examine.examining];
		if (num == 1) countText.textContent = "There is " + formattedItem(examine.examining,num) + " in your inventory."
		else countText.innerHTML = "There are " + formattedItem(examine.examining,num) + " in your inventory."
	}
	else if (examine.actionFrom === "mob" || examine.actionFrom === "gear") {
		num = 1;
	}

 examDiv.appendChild(document.createElement('p'));

	const actionDiv = examDiv.appendChild(document.createElement('div'));
	actionDiv.innerHTML = "<span class='yellowtxt'>[ Actions: </span>";
	if (num > 0) {
		examine.actions.forEach((action,_) => {
			const actionSpan = actionDiv.appendChild(document.createElement('span'));
			actionSpan.classList.add("link");
			actionSpan.textContent = action[1];
			const delimiter = document.createTextNode(", ");
			actionDiv.appendChild(delimiter);
		});
		actionDiv.removeChild(actionDiv.lastChild);
	}
	else {
		actionDiv.appendChild(document.createElement('span')).textContent = "None Available";
	}
	actionDiv.innerHTML += "<span class='yellowtxt'> ]</span>";
}

function clearLog() {
	//clear the bottom part
	document.getElementById('examineResult').innerHTML = "";
}

function refreshCombatHP(enemy) {
	const attackDiv = document.getElementById('attackHeading');
	attackDiv.innerHTML = "";
	attackDiv.appendChild(document.createElement('h3')).textContent = 'Attack';

	attackDiv.appendChild(document.createElement('p'));
	const playerStats = attackDiv.appendChild(document.createElement('div'))
	playerStats.innerHTML = "You:&nbsp;&nbsp;&nbsp;[";
	const playerGreenHP = playerStats.appendChild(document.createElement('span'));
	playerGreenHP.classList.add("greenBarHP");
	const hp1 = Math.floor(player.hp/player.maxhp*20);
	playerGreenHP.textContent = "|".repeat(hp1);
	const playerRedHP = playerStats.appendChild(document.createElement('span'));
	playerRedHP.classList.add("redBarHP");
	const hp2 = Math.floor(player.lasthit/player.maxhp*20)
	playerRedHP.textContent = "*".repeat(hp2);
	const playergreyHP = playerStats.appendChild(document.createElement('span'));
	playergreyHP.classList.add("greyBarHP");
	playergreyHP.textContent = "*".repeat(20-hp1-hp2);
	playerStats.innerHTML += "] [" + player.hp + "/" + player.maxhp + "]"

	const enemyStats = attackDiv.appendChild(document.createElement('div'))
	enemyStats.innerHTML = "Enemy: [";
	const enemyGreenHP = enemyStats.appendChild(document.createElement('span'));
	enemyGreenHP.classList.add("greenBarHP");
	const hp3 = Math.floor(enemy.hp/enemy.maxhp*20);
	enemyGreenHP.textContent = "|".repeat(hp3);
	const enemyRedHP = enemyStats.appendChild(document.createElement('span'));
	enemyRedHP.classList.add("redBarHP");
	const hp4 = Math.floor(enemy.lasthit/enemy.maxhp*20)
	enemyRedHP.textContent = "*".repeat(hp4);
	const enemygreyHP = enemyStats.appendChild(document.createElement('span'));
	enemygreyHP.classList.add("greyBarHP");
	enemygreyHP.textContent = "*".repeat(20-hp3-hp4);
	enemyStats.innerHTML += "] [" + enemy.hp + "/" + enemy.maxhp + "]"
	refreshHP();
}

function refreshGear() {
	const gearDiv = document.getElementById('gear');
	gearDiv.innerHTML = "";
	gearDiv.appendChild(document.createElement('h3')).textContent = 'Gear';
	gearDiv.appendChild(document.createElement('p'));
	const gearTable = gearDiv.appendChild(document.createElement('table'))
	gearTable.classList.add("gearTable");
	const row = gearTable.insertRow(-1);
	row.classList.add('heading');
	const bpCell = row.insertCell(-1);
	bpCell.innerHTML = "Bodypart"
	bpCell.setAttribute("width","100px")
	row.insertCell(-1).innerHTML = "Armor";
	row.insertCell(-1).innerHTML = "Soak";
	for (const [gearSlot, equippedItem] of Object.entries(player.equip)) {
		if (gearSlot != "mainHand" && gearSlot != "offHand") {
			const iRow = gearTable.insertRow(-1);
			iRow.insertCell(-1).innerHTML = gearSlot;
			if (equippedItem > 0) {
				iRow.insertCell(-1).innerHTML = ItemDB[equippedItem].name;
			}
		}
	}
	const wRowHead = gearTable.insertRow(-1);
	wRowHead.classList.add('heading');
	wRowHead.insertCell(-1).innerHTML = "Weapon"
	wRowHead.insertCell(-1).innerHTML = "Raw"
	wRowHead.insertCell(-1).innerHTML = "Spd"
	const wRow = gearTable.insertRow(-1);
	if (player.equip["mainHand"] == 0) {
		wRow.insertCell(-1).innerHTML = "Fist"
		wRow.insertCell(-1).innerHTML = "1-1"
		wRow.insertCell(-1).innerHTML = "1.0"
	}
	else {
		const weapon = ItemDB[player.equip["mainHand"]];
		const weaponTD = wRow.insertCell(-1)
		weaponTD.classList.add("link");
		weaponTD.innerHTML = weapon.name;
		wRow.insertCell(-1).innerHTML = weapon.raw[0] + "-" + weapon.raw[1];
		wRow.insertCell(-1).innerHTML = weapon.spd;
	}
}

function refreshHP() {
	const hp = Math.floor(player.hp/player.maxhp*20);
	document.getElementById('pHealth').textContent = "|".repeat(hp)
	document.getElementById('pMissingHealth').textContent = "-".repeat(20-hp)
}

//*************************
//Misc functions that exist
//*************************
function msToTime(duration) {
    const milliseconds = parseInt((duration%1000)/100)
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
	var result = 0
	for (var i=0;i<n;i++) {
		result += Math.floor(Math.random() * d) + 1;
	}
	return result;
}
