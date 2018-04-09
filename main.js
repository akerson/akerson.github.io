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
}

const Enemies = {
	RAT : "rat",
}

const mapGenerator = (() => {
	this.maps = [
		{
	    type: Areas.BASEMENT,
	    map: [
				["d:(","d:(","d:(","d:(","d:(","d:("],
				["d:(","d:(","d:(","d:(","d:(","d:("],
				["d:(","d:(","d:(","r^^","d:(","d:("],
				["d:(","d:(","d:(","b|o","d:(","d:("],
				["d:(","d:(","b[-","b/]","d:(","d:("],
				["d:(","d:(","d:(","d:(","d:(","d:("],
				["d:(","d:(","d:(","d:(","d:(","d:("],
			],
		},
	// other enemies
];
	return (typeParam,x,y) => {
	  const foundMap = this.maps.find(({ type }) => type === typeParam).map;
		const mapSizeX = foundMap[0].length;
		const mapSizeY = foundMap.length;
		//locate the center x and center y that still is a 5x5
		//bump out the sides and splice
		const xAdj = x-Math.max(0,x+2-mapSizeX)-Math.min(0,x-2);
		const yAdj = y-Math.max(0,y+2-mapSizeY)-Math.min(0,y-2);
		foundMap[y][x] = "p()";
		return (foundMap.slice(yAdj-2,yAdj+3).map( function(row){ return row.slice(xAdj-2,xAdj+3); }));
	}
})();

let player = null;
let examine = null;

function itemPrep() {
	//this changes all the items out of their generic functions
	//wristpad
	ItemDB[4].actions = [Actions.USE];
	ItemDB[4].use = function() {
		var time = new Date();
		addLog("Your credit chip shows: $500");
		addLog("The time is: " + time.getHours() + ":" + time.getMinutes());
		addLog("Your wristpad boots up.");
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
	}
}

Player.prototype.addScavengeFind = function(item) {
	//tabulates the list of items you've found for the scav discovery table
	const areaName = this.area.name;
	if (areaName in player.scavFound) {
		if (!this.scavFound[areaName].includes(item)) {
			this.scavFound[areaName].push(item);
		}
	}
	else {
		this.scavFound[areaName] = [item];
	}
	refreshScavTable();
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

Player.prototype.dropItem = function(item) {
	this.inventory[item] -= 1;
	if (this.inventory[item] === 0) {
		delete this.inventory[item];
	}
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
	return 3;
}

Player.prototype.getSoak = function() {
	return 0;
}

Player.prototype.getSpd = function() {
	return this.spd;
}

Player.prototype.die = function() {
	addLog("Sorry you died, here's your life back for now, since those rats aren't balanced.");
	this.hp = 10;
	this.lasthit = 0;
}

function LoadAreas() {
	const area = new Area(Areas.BASEMENT)
	area.area = "Basement Corner (basement)"
	area.description = "The air is musky, with debris scattered around the dirt floor. This dark space is very familiar, although you can't remember why you'd find it that way."
	area.comDrops = [9];
	area.uncDrops = [1];
	area.rareDrops = [2];
	area.repopScav(5);
	area.floorItems = [5,6,7];
	area.addEnemy(enemyGenerator(Enemies.RAT));
	area.addEnemy(enemyGenerator(Enemies.RAT));
	area.addEnemy(enemyGenerator(Enemies.RAT));
	area.map = mapGenerator(Areas.BASEMENT,2,4);
	area.actions = [Actions.SIT,Actions.SCAVENGE];

	player.area = area;
}

function Area(name) {
	this.name = name;
	this.comDrops = [];
	this.uncDrops = [];
	this.rareDrops = [];
	this.scavTable = []; //list of all the stuff the player can CURRENTLY scav (not the full list of scav'able things)
	this.floorItems = [];
	this.floorDeadThings = [];
	this.mobs = [];
}

Area.prototype.addFloorItem = function(item) {
	this.floorItems.push(item);
	refreshAreaFloor();
}

Area.prototype.swapSitStand = function() {
	for (let i=0;i<this.actions.length;i++) {
		if (this.actions[i][0] === Actions.SIT[0]) {
			this.actions[i] = Actions.STAND;
			break;
		}
		else if (this.actions[i][0] === Actions.STAND[0]) {
			this.actions[i] = Actions.SIT;
			break;
		}
	}
	refreshActions();
}

Area.prototype.removeFloorItem = function(item) {
	this.floorItems.forEach((invItem,i) => {
		if (item == invItem) {
			this.floorItems.splice(i,i+1);
			return;
		}
	});
	refreshAreaFloor();
}

Area.prototype.addScavDrop = function(item) { //[item, weighed%]
	if (item[1] === ItemRarity.RARE) {
		this.rareDrops.push(item[0])
	}
	else if (item[1] === ItemRarity.UNCOMMON) {
		this.uncDrops.push(item[0]);
	}
	else {
		this.comDrops.push(item[0]);
	}
}

Area.prototype.addEnemy = function(enemy) {
	this.mobs.push(enemy);
}

Area.prototype.addDeadThings = function(body) {
	this.floorDeadThings.push(body);
	refreshDeadThings();
}

Area.prototype.removeDeadThing = function(loc) {
	this.floorDeadThings.splice(loc,1);
	refreshDeadThings();
}

Area.prototype.repopScav = function(numTimes) {
	//adds a number of items to the scav table based on how long it's been, UP to the maximum number of items that it can hold.
	//roll an item rarity -- 70% common, 25% uncommon, 5% rare
	for (i=0;i<numTimes;i++) {
		const rand = Math.floor(Math.random() * 101);
		const haveRare = this.rareDrops.length > 0;
		const haveUnc = this.uncDrops.length > 0;
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

Area.prototype.getScavengeDrop = function() {
	//If this is empty, return nothing
	//TODO: add in a chance to fail at scav'ing, DIFFERENT from no items;
	if (this.scavTable.length > 0) {
		return this.scavTable.pop();
	}
	else {
		return null;
	}
}

Area.prototype.cleanUp = function() {
	//roll through enemy list, remove ones that HP = 0;
	for (i=0;i<this.mobs.length;i++) {
		if (this.mobs[i].hp === 0) {
			this.mobs.splice(i,1);
		}
	}
	refreshMobs();
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
}

HostileEnemy.prototype.getHit = function() {
	return this.hit;
}

HostileEnemy.prototype.getDodge = function() {
	return this.dodge;
}

HostileEnemy.prototype.getDmg = function() {
	return this.dmg;
}

HostileEnemy.prototype.getSoak = function() {
	return this.soak;
}
HostileEnemy.prototype.getSpd = function() {
	return this.spd;
}
HostileEnemy.prototype.getXP = function() {
	return 1;
}
HostileEnemy.prototype.die = function() {
	player.area.addDeadThings(this);
	addLog("You killed the " + this.name + "! Awarded " + this.getXP() + "XP!");
}
HostileEnemy.prototype.butcher = function() {
	return this.part;
}

function examineBox() {
	this.examining = null;
	this.itemname = null;
	this.description = null;
	this.actions = null;
	this.availableActions = {
		"floor" : [Actions.GRAB],
		"inventory" : [Actions.DROP,Actions.USE],
	}
	this.update = function(area,itemID) {
		this.examining = itemID;
		this.itemname = ItemDB[itemID].name;
		this.description = ItemDB[itemID].description;
		this.actions = [];
		this.availableActions[area].forEach((action,_) => {
			console.log(ItemDB[itemID].actions);
			if (ItemDB[itemID].actions.includes(action)) {
				this.actions.push(action);
			}
		});
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

//this could be factored into area but I wanted to keep it separated
function enemyGenerator(type) {
	if (type === Enemies.RAT) {
		return new HostileEnemy("Rat",10,1200,10,0,5,1,8);
	}
}

function formattedItem(item,num) {
	const name = ItemDB[item].name;
	const plural = ItemDB[item].plural;
	const article = ItemDB[item].article;
	if (num === 0) return "";
	if (num === 1) return article + " " + name;
	const ones = ["","one","two","three","four","five","six","seven","eight","nine"]
	const tens = ["eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen","eightteen","ninetine"]
	const big = ["","","twenty","thirty","fourty","fifty","sixty","seventy","eighty","ninety","one hundred"];
	if (num < 10) return ones[num] + " " + plural;
	if (num < 20) return tens[num-10] + " " + plural;
	bigNum = Math.floor(num/10);
	bigNumRemainder = num%10;
	const hyphen = "-";
	if (bigNumRemainer === 0) hyphen = "";
	return big[bigNum] + hyphen + ones[bigNumRemainer] + " " + plural;
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
	refreshStats();
	refreshActions();
	refreshScavTable();
	refreshHpBars();
	loadGame();
	refreshMiniMap();
	refreshHeader();
	addListeners();
	window.mainLoop = setInterval(gameLoop, 10);
}

function gameLoop() {
	if (player.actionTime[1] < Date.now()) { //we finished our action!
		if (player.currentAction === Actions.SCAVENGE) {
			scavenge();
		}
		if (player.currentAction === Actions.FIGHT) {
			combat(player,player.actionTarget);
		}
		if (player.currentAction === Actions.GRAB) {
			//grab an item from the floor with the right ID
			player.addInventory(player.actionTarget);
			player.area.removeFloorItem(player.actionTarget);
			addLog("You pick up " + formattedItem(player.actionTarget,1) + ".")
			examine.clear();
		}
		if (player.currentAction === Actions.BUTCHER) {
			const deadThing = player.area.floorDeadThings[player.actionTarget];
			const part = deadThing.butcher();
			player.addInventory(part);
			player.area.removeDeadThing(player.actionTarget);
			const item = ItemDB[part];
			addLog("You hack off " + item.article + " " + item.name + " from the " + deadThing.name + ".");
		}
		if (player.currentAction === Actions.DROP) {
			//drop an item based off ItemID
			player.dropItem(player.actionTarget);
			const item = ItemDB[player.actionTarget];
			addLog("You dropped " +  item.article + " " + item.name + " on the floor.");
			examine.clear();
		}
		if (player.currentAction === Actions.SIT) {
			player.hp = Math.min(player.maxhp, player.hp + 1);
			refreshHpBars();
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
	//check if enemies need to fight
	for (var i=0;i<player.area.mobs.length;i++) {
		if (player.area.mobs[i].currentAction === Actions.FIGHT && player.area.mobs[i].actionTime[1] < Date.now()) {
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
		dmg = Math.max(0,attacker.getDmg()-defender.getSoak());
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
	if (defender.currentAction === Actions.NONE) {
		defender.currentAction = Actions.FIGHT;
		defender.actionTime[0] = Date.now();
		defender.actionTime[1] = Date.now() + defender.getSpd();
	}
	if (defender.hp === 0) {
		attacker.currentAction = Actions.NONE;
		defender.currentAction = Actions.NONE;
		defender.die();
		player.area.cleanUp();
	}
	refreshHpBars();
}

function fightsomething(target) {
	console.log(target, player.area.mobs[target]);
	player.actionTarget = player.area.mobs[target];
	startAction(Actions.FIGHT[1]);
}
//is there a better state machine strictire for this kind of system??
function startAction(action) {
	//called whenever a player clicks on a "link"
	if (action === Actions.SCAVENGE[1]) {
		if (player.currentAction === Actions.NONE) {
			player.currentAction = Actions.SCAVENGE;
			player.actionTime[0] = Date.now();
			player.actionTime[1] = Date.now() + 500;
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
			player.actionTime[0] = Date.now();
			player.actionTime[1] = Date.now()+player.spd;
			addLog("You launch an attack!");
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
			addLog("You stand up.");
		}
	}
	else if (action === Actions.USE[1]) {
		if (player.currentAction === Actions.NONE) {
			player.actionTarget = examine.examining;
			ItemDB[examine.examining].use();
		}
	}
}

function scavenge() {
	const newitem = player.area.getScavengeDrop(); //this returns a numberID
	if (!newitem) {
		addLog("You search around, but it looks like there's nothing here.");
		return;
	}
	player.addScavengeFind(newitem);
	player.addInventory(newitem);
	addLog("You dig around the ground and find a " + ItemDB[newitem].name + "!");
}

function addLog(s) {
	const table = document.getElementById("logTable");
	const row = table.insertRow(0);
	const cell = row.insertCell(0);
	cell.textContent = s;
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
  const mobsDiv = document.getElementById('mobHeader');
	mobsDiv.innerHTML = "";
	mobsDiv.appendChild(document.createElement('h3')).textContent = 'Hostile Creatures';
  const mobsContainer = mobsDiv.appendChild(document.createElement('div'));
	const mobsList = document.getElementById('mobList');
  return (() => {
    if (player.area.mobs.length === 0) {
      mobsList.textContent = 'No monsters seem to be here';
      return;
    }
    mobsList.innerHTML = '';
    player.area.mobs.forEach((mob, i) => {
      // each monster has a line break before and after, so better to use a div:
      const mobContainer = mobsList.appendChild(document.createElement('div'));
			const lContainer = mobContainer.appendChild(document.createElement('span'));
			lContainer.classList.add("yellowtxt");
			lContainer.textContent = "[ ";
			const attackContainer = mobContainer.appendChild(document.createElement('span'));
			attackContainer.classList.add("link");
			attackContainer.textContent = "Attack";
			attackContainer.setAttribute("mobnum",i);
			const rContainer = mobContainer.appendChild(document.createElement('span'));
			rContainer.classList.add("yellowtxt");
			rContainer.textContent = " ] ";
			const mobName = mobContainer.appendChild(document.createElement('span'));
      mobName.innerHTML = mob.name;
			mobContainer.innerHTML += " ["
			const greenBar = mobContainer.appendChild(document.createElement('span'));
			greenBar.classList.add("greenBar");
			greenBar.id = "greenBarHE" + i.toString()
			const redBar = mobContainer.appendChild(document.createElement('span'));
			redBar.classList.add("redBar");
			redBar.id = "redBarHE" + i.toString();
			const greyBar = mobContainer.appendChild(document.createElement('span'));
			greyBar.classList.add("greyBar");
			greyBar.id = "greyBarHE" + i.toString();
			mobContainer.innerHTML += "] ["
			const hpCurrent = mobContainer.appendChild(document.createElement('span'));
			hpCurrent.id = "hpHE" + i.toString();
			mobContainer.innerHTML += "/";
			const hpMax = mobContainer.appendChild(document.createElement('span'));
			hpMax.id = "hpMaxHE" + i.toString();
			mobContainer.innerHTML += "]"
    });
  })();
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

function addListeners() {
	const actionDiv = document.getElementById("actions");
	actionDiv.addEventListener('click', (e) => {
		if (!e.target.classList.contains("link")) return;
    const index = [...actionDiv.children].indexOf(e.target);
    startAction([...actionDiv.children][index].textContent, index);
  });
	const mobsDiv = document.getElementById('mobList');
  mobsDiv.addEventListener('click', (e) => {
    if (!e.target.classList.contains("link")) return;
		const mobNum = e.target.getAttribute("mobnum");
		fightsomething(mobNum);
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
		startAction(e.target.textContent, 0);
	});
}

function refreshScavTable() {
	const table = document.getElementById("scavTable");
	table.innerHTML = "";
	let row = table.insertRow(0);
	row.setAttribute("id", "heading");
	row.innerHTML = "<td>Common Items</td><td>??</td><td>??</td>";
	const drops = player.area.comDrops.concat(player.area.uncDrops, player.area.rareDrops);
	for (var i=0;i < drops.length; i++) {
		const itemID = drops[i];
		const areaName = player.area.name;
		row = table.insertRow(-1);
		const cell1 = row.insertCell(-1);
		const cell2 = row.insertCell(-1);
		const cell3 = row.insertCell(-1);
		if (areaName in player.scavFound && player.scavFound[areaName].includes(itemID)) {
			cell1.innerHTML = ItemDB[itemID].name;
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
	const greenHP = Math.floor(player.hp/player.maxhp*20);
	const redHP = Math.floor(player.lasthit/player.maxhp*20);
	const greyHP = 20-greenHP-redHP;
	document.getElementById("greenBarHP").innerHTML = "|".repeat(greenHP)
	document.getElementById("redBarHP").innerHTML = "*".repeat(redHP);
	document.getElementById("greyBarHP").innerHTML = "-".repeat(greyHP);
	//hostilemobs
	for (var i=0;i<player.area.mobs.length;i++) {
		const mob = player.area.mobs[i];
		document.getElementById("hpHE"+i).innerHTML = mob.hp;
		document.getElementById("hpMaxHE"+i).innerHTML = mob.maxhp;
		const greenHP = Math.floor(mob.hp/mob.maxhp*20);
		const redHP = Math.floor(mob.lasthit/mob.maxhp*20);
		const greyHP = 20-greenHP-redHP;
		document.getElementById("greenBarHE"+i).innerHTML = "|".repeat(greenHP);
		document.getElementById("redBarHE"+i).innerHTML = "*".repeat(redHP);
		document.getElementById("greyBarHE"+i).innerHTML = "-".repeat(greyHP);
	}
}

function refreshActionProgressBar() {
	const actionTxt = document.getElementById("action");
	actionTxt.innerHTML = player.currentAction[0];
	if (player.currentAction === Actions.NONE) {
		document.getElementById("greenBar").innerHTML = "";
		document.getElementById("greyBar").innerHTML = "-".repeat(20);
	}
	else {
		const percentDone = Math.floor((Date.now() - player.actionTime[0])/(player.actionTime[1] - player.actionTime[0])*20);
		const percentLeft = 20-percentDone;
		document.getElementById("greenBar").innerHTML = "|".repeat(percentDone)
		document.getElementById("greyBar").innerHTML = "-".repeat(percentLeft)
	}
}

function refreshAreaFloor() {
	//fix the floor text
	const floorDiv = document.getElementById("floorItems")
	floorDiv.innerHTML = "";
	return (() => {
		if (player.area.floorItems.length > 0) {
			floorDiv.textContent += "You see ";
			player.area.floorItems.forEach((item,i) => {
				const itemSpan = floorDiv.appendChild(document.createElement('span'));
				itemSpan.classList.add("link");
				itemSpan.setAttribute("itemID",item)
				itemSpan.textContent = formattedItem(item,1);
				let delimiter = ""
				if (i+2 === player.area.floorItems.length) { //second last element needs the and
					if (player.area.floorItems.length === 2) {
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
			});
			floorDiv.removeChild(floorDiv.lastChild);
			floorDiv.innerHTML += " on the floor."
		}
		else {
			floorDiv.textContent += "There is nothing on the floor."
		}
	})();
}

function refreshDeadThings() {
	const ele = document.getElementById("floorDead")
	ele.innerHTML = "";
	if (player.area.floorDeadThings.length > 0) {
		ele.innerHTML += "You see the corpse"
		if (player.area.floorDeadThings.length > 1) {
			ele.innerHTML += "s"
		}
		ele.innerHTML += " of "
		for (var i=0;i<player.area.floorDeadThings.length;i++) {
			const deadThing = player.area.floorDeadThings[i];
			ele.innerHTML += "a <span onClick=\"startAction('butcher',"+i.toString()+")\" class='link'>" + deadThing.name + "</span>, "
		}
		ele.innerHTML = ele.innerHTML.slice(0,-2);
		ele.innerHTML += " on the floor."
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
	invDiv.innerHTML = "";
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
	const mapDiv = document.getElementById("area-map-table");
	mapDiv.innterHTML = "";
	mapR.forEach((rowC) => {
		const row = mapDiv.insertRow(-1);
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
	const examDiv = document.getElementById("examine");
	examDiv.innerHTML = "";
	if (!examine.examining) {
		examDiv.textContent = "Nothing currently selected.";
		return;
	}
	const examName = examDiv.appendChild(document.createElement('div'));
	examName.classList.add('yellowtxt');
	examName.textContent = examine.itemname;
	const examDesc = examDiv.appendChild(document.createElement('div'));
	examDesc.textContent = examine.description;
	examDiv.appendChild(document.createElement('p'));
	const actionDiv = examDiv.appendChild(document.createElement('div'));
	actionDiv.innerHTML = "<span class='yellowtxt'>[ Actions: </span>";
	examine.actions.forEach((action,_) => {
		const actionSpan = actionDiv.appendChild(document.createElement('span'));
		actionSpan.classList.add("link");
		actionSpan.textContent = action[1];
		const delimiter = document.createTextNode(", ");
		actionDiv.appendChild(delimiter);
	});
	actionDiv.removeChild(actionDiv.lastChild);
	actionDiv.innerHTML += "<span class='yellowtxt'> ]</span>";
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
