const Areas = {
	BASEMENT : "Basement",
	BASEMENT1 : "Basement1",
	BASEMENT2 : "Basement2",
	BASEMENT3 : "Basement3",
	BASEMENT4 : "Basement4",
	BASEMENT5 : "Basement5",
}

const AreaDB = {
	"Basement" : new Area(Areas.BASEMENT),
	"Basement1" : new Area(Areas.BASEMENT1),
	"Basement2" : new Area(Areas.BASEMENT2),
	"Basement3" : new Area(Areas.BASEMENT3),
	"Basement4" : new Area(Areas.BASEMENT4),
	"Basement5" : new Area(Areas.BASEMENT5),
}

function LoadAreas() {
	AreaDB[Areas.BASEMENT].area = "Southwest Corner (basement)"
	AreaDB[Areas.BASEMENT].description = "The air is musky, with debris scattered around the dirt floor. This dark space is very familiar, although you can't remember why you'd find it that way."
	AreaDB[Areas.BASEMENT].comDrops = [9];
	AreaDB[Areas.BASEMENT].uncDrops = [1];
	AreaDB[Areas.BASEMENT].rareDrops = [2];
	AreaDB[Areas.BASEMENT].repopScav(5);
	AreaDB[Areas.BASEMENT].floorItems = {5:1,6:1,7:1};
	AreaDB[Areas.BASEMENT].addEnemy(enemyGenerator(Enemies.RAT));
	AreaDB[Areas.BASEMENT].addEnemy(enemyGenerator(Enemies.RAT));
	AreaDB[Areas.BASEMENT].addEnemy(enemyGenerator(Enemies.RAT));
	AreaDB[Areas.BASEMENT].map = mapGenerator(Areas.BASEMENT,4,5);
	AreaDB[Areas.BASEMENT].actions = [Actions.SIT,Actions.SCAVENGE];
	AreaDB[Areas.BASEMENT].exits = [["north",Areas.BASEMENT1],["east",Areas.BASEMENT3]];

	AreaDB[Areas.BASEMENT1].area = "Basement West Wall (basement)"
	AreaDB[Areas.BASEMENT1].description = "Dirt makes up the whole floor. To the north you see a cramped hole that you might be able to squeeze in."
	AreaDB[Areas.BASEMENT1].comDrops = [9];
	AreaDB[Areas.BASEMENT1].uncDrops = [1];
	AreaDB[Areas.BASEMENT1].rareDrops = [2];
	AreaDB[Areas.BASEMENT1].repopScav(5);
	AreaDB[Areas.BASEMENT1].floorItems = {1:1,2:1};
	AreaDB[Areas.BASEMENT1].addEnemy(enemyGenerator(Enemies.RAT));
	AreaDB[Areas.BASEMENT1].map = mapGenerator(Areas.BASEMENT,4,4);
	AreaDB[Areas.BASEMENT1].actions = [Actions.SIT,Actions.SCAVENGE];
	AreaDB[Areas.BASEMENT1].exits = [["north",Areas.BASEMENT5],["south",Areas.BASEMENT],["east",Areas.BASEMENT2]];

	AreaDB[Areas.BASEMENT2].area = "Basement Corner (basement)"
	AreaDB[Areas.BASEMENT2].description = "The air is musky, with debris scattered around the dirt floor. This dark space is very familiar, although you can't remember why you'd find it that way."
	AreaDB[Areas.BASEMENT2].comDrops = [9];
	AreaDB[Areas.BASEMENT2].uncDrops = [1];
	AreaDB[Areas.BASEMENT2].rareDrops = [2];
	AreaDB[Areas.BASEMENT2].repopScav(4);
	AreaDB[Areas.BASEMENT2].floorItems = {5:4};
	AreaDB[Areas.BASEMENT2].map = mapGenerator(Areas.BASEMENT,5,4);
	AreaDB[Areas.BASEMENT2].actions = [Actions.SIT,Actions.SCAVENGE];
	AreaDB[Areas.BASEMENT2].exits = [["north",Areas.BASEMENT4],["west",Areas.BASEMENT1],["south",Areas.BASEMENT3]];

	AreaDB[Areas.BASEMENT3].area = "Southeast Corner (basement)"
	AreaDB[Areas.BASEMENT3].description = "There's a large pile of dirty laundry and a washing machine in the corner. Same dirt floors -- what a terrible place to do laundry."
	AreaDB[Areas.BASEMENT3].comDrops = [9];
	AreaDB[Areas.BASEMENT3].uncDrops = [1];
	AreaDB[Areas.BASEMENT3].rareDrops = [2];
	AreaDB[Areas.BASEMENT3].repopScav(5);
	AreaDB[Areas.BASEMENT3].floorItems = {11:2,10:1,5:1};
	AreaDB[Areas.BASEMENT1].addEnemy(enemyGenerator(Enemies.RAT));
	AreaDB[Areas.BASEMENT3].map = mapGenerator(Areas.BASEMENT,5,5);
	AreaDB[Areas.BASEMENT3].actions = [Actions.SIT,Actions.SCAVENGE];
	AreaDB[Areas.BASEMENT3].exits = [["west",Areas.BASEMENT],["north",Areas.BASEMENT2]];

	AreaDB[Areas.BASEMENT4].area = "Staircase (basement)"
	AreaDB[Areas.BASEMENT4].description = "The stairs seem to lead up, although there's a locked door (and even if you had the key, the content isn't done yet!)"
	AreaDB[Areas.BASEMENT4].map = mapGenerator(Areas.BASEMENT,5,3);
	AreaDB[Areas.BASEMENT4].actions = [Actions.SIT,Actions.SCAVENGE];
	AreaDB[Areas.BASEMENT4].exits = [["south",Areas.BASEMENT2]];

	AreaDB[Areas.BASEMENT5].area = "Basement Cubby (basement)"
	AreaDB[Areas.BASEMENT5].description = "The area is tight and cramped, but it looks man-made. Almost shoveled out."
	AreaDB[Areas.BASEMENT5].comDrops = [9];
	AreaDB[Areas.BASEMENT5].uncDrops = [1];
	AreaDB[Areas.BASEMENT5].rareDrops = [2];
	AreaDB[Areas.BASEMENT5].repopScav(10);
	AreaDB[Areas.BASEMENT5].floorItems = {3:1};
	AreaDB[Areas.BASEMENT5].addEnemy(enemyGenerator(Enemies.RAT));
	AreaDB[Areas.BASEMENT5].map = mapGenerator(Areas.BASEMENT,4,3);
	AreaDB[Areas.BASEMENT5].actions = [Actions.SIT,Actions.SCAVENGE];
	AreaDB[Areas.BASEMENT5].exits = [["south",Areas.BASEMENT1]];

	player.area = AreaDB[Areas.BASEMENT];
}

function Area(name) {
	this.name = name;
	this.comDrops = [];
	this.uncDrops = [];
	this.rareDrops = [];
	this.scavTable = []; //list of all the stuff the player can CURRENTLY scav (not the full list of scav'able things)
	this.floorItems = {};
	this.mobs = [];
}

Area.prototype.addFloorItem = function(item) {
	if (item in this.floorItems) {
		this.floorItems[item] += 1;
	}
	else {
		this.floorItems[item] = 1;
	}
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
	this.floorItems[item] -= 1;
	if (this.floorItems[item] === 0) {
		delete this.floorItems[item];
	}
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
	this.addFloorItem(12);
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