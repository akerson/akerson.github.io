function HostileEnemy(name,areaname,hp,spd,dodge,soak,hit,dmg,part,description) {
	//these are the things you can attack, they have stats
	this.name = getName(name); //used for combat
	this.areaname = areaname; //used for when you see one in the area
	this.description = description
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
	this.actions = [Actions.FIGHT];
}

function getName(name) {
    mobNames = {
        "rat" : ["brown rat","black rat","grey rat","big rat","white rat","crazy rat","smiling rat",
                "happy rat","smelly rat","fuzzy rat","small rat","albino rat","scary rat","strong rat","wimpy rat"]
    }
    return item = mobNames[name][Math.floor(Math.random()*mobNames[name].length)];
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
	examine.clear();
	clearLog();
	addCombatLog("You killed the " + this.name + "! Awarded " + this.getXP() + "XP!");
}

HostileEnemy.prototype.butcher = function() {
	return this.part;
}

//this could be factored into area but I wanted to keep it separated
function enemyGenerator(type) {
	if (type === Enemies.RAT) {
		return new HostileEnemy("rat","a ",6,1200,10,0,5,1,8,"A rat that looks like it maintains a good diet in this dusty basement.");
	}
}