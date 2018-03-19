//player important ones
var player = {
	dollars : 0,
	dollarMod : 1,
	attack : 1,
}

//instance important
var progressCost = 1;
var valueCost = 1;
var isAttack = false;
var dmgDone = 0;
var totalHP = 1000;

function toggleAttack(id) {
	isAttack = !isAttack;
	colorchange(id);
}

window.setInterval(function(){
	if (isAttack) {
		dmgDone += player.attack;
		if (dmgDone > totalHP) {
			player.dollars += player.dollarMod;
			dmgDone = 0;
			refreshStats();
			refreshButtons();
		}
	}
	refreshBar();
	saveGame();
}, 10);

function refreshBar() {
	//update the CSS of the bar to the timer
	var elem = document.getElementById("progress");
	//calculate percent fill
	var pFill = dmgDone/totalHP*100;
	elem.style.width = pFill.toString() + "%";
}

function purchase(type) {
	if (type == "prog") {
		if (player.dollars >= progressCost) {
			player.attack += 1;
			player.dollars -= progressCost;
			progressCost = Math.floor(10 * Math.pow(1.1,progressCost));
			refreshButtons();
		}
	}
	if (type == "value") {
		if (player.dollars >= valueCost) {
			player.dollarMod += 1;
			player.dollars -= valueCost;
			valueCost = Math.floor(10 * Math.pow(1.1,valueCost));
			refreshButtons();
		}
	}
	refreshStats();
}


function prettify(input){
    var output = Math.round(input * 1000000)/1000000;
	return output;
}

function loadGame() {
	player = JSON.parse(localStorage.getItem("player"));
	if (typeof player.dollars !== "undefined") dollars = player.dollars;
	if (typeof player.dollarValue !== "undefined") dollarMod = player.dollarValue;
	if (typeof player.atkMod !== "undefined") attack = player.atkMod;
	if (typeof player.progressCost !== "undefined") progressCost = player.progressCost;
	if (typeof player.valueCost !== "undefined") valueCost = player.valueCost;
	refreshCost();
	refreshStats();
	refreshButtons();
}

function saveGame() {
	localStorage.setItem("save",JSON.stringify(player));
}

function colorchange(id) {
	var el = document.getElementById(id);
	var currentClass = el.getAttribute("class");
      if(currentClass == "button")
      {
          el.setAttribute("class", "buttonSelect");
      } else {
         el.setAttribute("class", "button");
      }
}

function refreshStats() {
	document.getElementById('progValue').innerHTML = player.attack;
	document.getElementById('valueValue').innerHTML = player.dollarMod;
	document.getElementById('dollarCount').innerHTML = player.dollars;
	var elem = document.getElementById("prog");
	elem.innerText = "Progress ($"+progressCost.toString()+")";
	elem = document.getElementById("value");
	elem.innerText = "Value ($"+valueCost.toString()+")";
}

function refreshCost() {
	progressCost = Math.floor(10 * Math.pow(1.07,player.attack));
	valueCost = Math.floor(10 * Math.pow(1.07,player.dollarMod));
}

function refreshButtons() {
	id = "prog";
	var el = document.getElementById(id);
	if (player.dollars >= progressCost) {
		el.setAttribute("class", "button");
	}
	else {
		el.setAttribute("class", "buttonGrey");
	}
	id = "value";
	el = document.getElementById(id);
	if (player.dollars >= valueCost) {
		el.setAttribute("class", "button");
	}
	else {
		el.setAttribute("class", "buttonGrey");
	}
}
