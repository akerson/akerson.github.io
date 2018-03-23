//player important ones
var player = {
	money : 0,
	area : null,
	inventory : {},
	scavProgress : 0,
	timePassed : 0,
	Date: [0,0,0],
}

var firstLogEntry = true;

function addInventory(item) {
	if (item in player.inventory) {
		player.inventory[item] += 1
	}
	else {
		player.inventory[item] = 1
	}
}

function Area(name, scavTime, money, moneyPercent) {
	this.name = name;
	this.scavTime = scavTime;
	this.drops = [];
	this.money = money;
	this.moneyPercent = moneyPercent;
	this.addDrop = function(item) {
		this.drops.push(item);
	}
	this.getDrop = function() {
		//Roll money, then roll through items until you don't exceed max value.
		//If it doesn't go, drop nothing
		var roll = Math.floor(Math.random() * 101);
		if (roll <= this.moneyPercent) {
			return new Item("money",getRandMoney(this.money),0,ItemType.MONEY);
		}
		else {
			roll -= this.moneyPercent;
		}
		for (i=0;i<this.drops.length;i++) {
			if (roll <= this.drops[i][1]) {
				return this.drops[i][0];
			}
			else {
				roll -= this.drops[i][1];
			}
		}
		return new Item("none",0,0,ItemType.NONE);
	}
	this.Money = function() {
		return getRandMoney(this.money);
	}
}

function calculateDate() {
	seconds = Math.floor(player.timePassed/1000);
	var interval = 30
	if (seconds >= interval) {
		player.Date[2] += Math.floor(seconds/interval)*5;
		player.timePassed = player.timePassed % (interval*1000);
	}
	if (player.Date[2] >= 12) {
		player.Date[1] += Math.floor(player.Date[2]/60);
		player.Date[2] = player.Date[2]%60;
	}
	if (player.Date[1] >= 24) {
		player.Date[0] += Math.floor(player.Date[1]/24);
		player.Date[1] = player.Date[1]%24;
	}
	//make a string out of it
	s = "Day " + (player.Date[0]+1).toString() + " "
	hr = player.Date[1];
	ampm = "am"
	if (player.Date[1] > 12) {
		hr -= 12;
		ampm = "pm"
	}

	if (hr == 0) {
		s += "12:";
	}
	else {
		if (hr < 10) {
			s += "0"
		}
		s += hr.toString() + ":";
	}
	if (player.Date[2] < 10) {
		s += "0"
	}
	s += player.Date[2].toString();
	s += ampm;
	return s
}

function Item(name, value, weight, type) {
  this.name = name;
  this.value = value;
  this.weight = weight;
  this.type = type;
}

function setupGame() {
	var newlvl = new Area(Areas.BASEMENT,30000,100,25);
	//in form of [ItemID,probability]
	newlvl.addDrop([0,15])
	newlvl.addDrop([1,10]);
	newlvl.addDrop([2,20]);
	newlvl.addDrop([3,1]);
	player.area = newlvl;
}

const Areas = {
	BASEMENT : 0,
}

const ItemType = {
	EQUIPMENT : 0,
	COMPONENT : 1,
	CONSUMABLE : 2,
	MONEY : 3,
	NONE : 4,
}

var itemLookup = {
	0 : new Item("stone",0.03,0.5,ItemType.COMPONENT),
	1 : new Item("plank",0.15,0.4,ItemType.COMPONENT),
	2 : new Item("trash",0.01,0.1,ItemType.COMPONENT),
	3 : new Item("key",0.01,0.1,ItemType.COMPONENT),
}

//instance important
var buttonToggle = [false,false,false];
var lastTime;
var deltaTime;

function toggleButton(id) {
	console.log("test");
	var s;
	if (id == 0) {
		//we started scavenging!
		if (!buttonToggle[0]) {
			s = "You begin scavenging the basement. Hopefully something turns up."
		}
		else {
			s = "You stopped scaveging and wait idly in this idle game."
		}
	}
	else if (id == 1) {
		if (!buttonToggle[1]) {
			s = "You want to attack something, but Akerson hasn't coded it yet."
		}
		else {
			s = "You stop not attacking anything and wait idly."
		}
	}
	else if (id == 2) {
		if (!buttonToggle[2]) {
			s = "You ponder about how cool a crafting system would be."
		}
		else {
			s = "You stop pondering about how cool a crafting system would be."
		}
	}
	for (i=0;i<3;i++) {
		if (id == i) {
			buttonToggle[i] = !buttonToggle[i]
		}
		else {
			buttonToggle[i] = false;
		}
	}
	addLog(s);
	colorchange();
}

function gameLoop() {
	deltaTime = Date.now() - lastTime;
	player.timePassed += deltaTime;
	if (buttonToggle[0]) { //scav toggle
		//get time that's passed
		player.scavProgress += deltaTime;
		if (player.scavProgress >= player.area.scavTime) {
			//we did it!
			var numTimes = Math.floor(player.scavProgress/player.area.scavTime);
			player.scavProgress = player.scavProgress % player.area.scavTime;
			var newitem = player.area.getDrop();
			//if money
			if (newitem.type == ItemType.MONEY) {
				player.money += newitem.value;
				s = "You found $" + newitem.value.toString() + ".";
			}
			else if (newitem.type == ItemType.NONE) {
				s = "You scavenged but found nothing."
			}
			else {
				addInventory(newitem);
				s = "You found a " + itemLookup[newitem].name + ".";
			}
			addLog(s);
		}
		//setup text for spam
		s = "[";
		//fix it up so it's two characters AND less than 100
		pt = player.scavProgress/player.area.scavTime*100;
		pts = Math.round(pt).toString();
		if (pts == "100") {
			pts = "99";
		}
		if (pts.length == 1) {
			pts = " "+pts;
		}
		s += pts
		s += "%] "
		t = player.area.scavTime - player.scavProgress;
		s += msToTime(t)
		document.getElementById("progressPercent").innerHTML = s;
	}
	lastTime = Date.now();
	saveGame();
	refreshGame();
}

function getRandMoney(max) {
    var num = 0;
    for (var i = 0; i < 4; i++) {
        num += Math.random() * (max/4);
    }
    return Math.floor(num)/100;
}

function addLog(s) {
	var table = document.getElementById("logTable");
	var row = table.insertRow(0);
	var cell = row.insertCell(0);
	if (firstLogEntry) {
		cell.innerHTML = "<i><b>" + calculateDate() + "</b></i><br>" + s;
		firstLogEntry = false;
	}
	else {
		cell.innerHTML = "<i><b>" + calculateDate() + "</b></i><br>" + s + "<br>---";
	}
}

function prettify(input){
  var output = Math.round(input * 1000000)/1000000;
	return output;
}

function loadGame() {
	var saveplayer = JSON.parse(localStorage.getItem('save'));
	console.log(saveplayer);
	if (saveplayer !== null) {
		if (typeof saveplayer.money !== "undefined") player.money = saveplayer.money;
		if (typeof saveplayer.inventory !== "undefined") player.inventory = saveplayer.inventory;
		if (typeof saveplayer.Date !== "undefined") player.Date = saveplayer.Date;
	}
	lastTime = Date.now();
	setupGame();
	window.mainLoop = setInterval(gameLoop, 10);
}

function saveGame() {
	var saveplayer = JSON.stringify(player)
	localStorage.setItem('save',saveplayer);
}

function refreshGame() {
	refreshCost();
	refreshStats();
	refreshBar();
	refreshDate();
	refreshInventory();
}

function colorchange() {
	for (id=0; id<3; id++) {
			var el = document.getElementById(id);
			if (buttonToggle[id]) {
				el.setAttribute("class", "buttonSelect");
			}
			else {
				el.setAttribute("class", "button");
			}
	}
}

function refreshStats() {
	var money = parseFloat(player.money).toFixed(2)
	document.getElementById('money').innerHTML = money;
}

function refreshCost() {
	progressCost = Math.floor(10 * Math.pow(1.1,player.attack))-5;
	valueCost = Math.floor(10 * Math.pow(1.1,player.dollarMod))-5;
}

function refreshBar() {
	//update the CSS of the bar to the timer
	var elem = document.getElementById("progress");
	//calculate percent fill
	var pFill = player.scavProgress/player.area.scavTime*100;
	elem.style.width = pFill.toString() + "%";
}

function refreshInventory() {
	var table = document.getElementById("invTable");
	table.innerHTML = "";
	for (const [itemid, amt] of Object.entries(player.inventory)) {
		var itemname = itemLookup[itemid].name;
		row = table.insertRow(0);
		cell1 = row.insertCell(0);
		cell1.innerHTML = "[" + amt + "] " + itemname;
	}
	var row = table.insertRow(0);
	var cell = row.insertCell(0);
	cell.innerHTML = "<b><u>Items</u></b>";
}

function refreshDate() {
	document.getElementById('date').innerHTML = calculateDate();
}

function msToTime(duration) {
    var milliseconds = parseInt((duration%1000)/100)
        , seconds = parseInt((duration/1000)%60)
        , minutes = parseInt((duration/(1000*60))%60)
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;
    return minutes + ":" + seconds;
}
