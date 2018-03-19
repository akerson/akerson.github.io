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
var lastTime;
var deltaTime;

function toggleAttack(id) {
	isAttack = !isAttack;
	colorchange(id);
}

window.setInterval(function(){
	console.log(player.dollarMod)
	deltaTime = Date.now() -lastTime;
	lastTime = Date.now();
	//deltaTime is the total time since this last checked
	dmgDone += player.attack*deltaTime/10
	totalAdd = Math.floor(dmgDone / totalHP) //the total bars we filled
	if (totalAdd >= 1) {
		player.dollars += player.dollarMod*totalAdd;
		dmgDone = dmgDone % totalHP;
	}
	refreshStats();
	refreshButtons();
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
			refreshCost();
			refreshButtons();
		}
	}
	if (type == "value") {
		if (player.dollars >= valueCost) {
			player.dollarMod += 1;
			player.dollars -= valueCost;
			refreshCost();
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
	var saveplayer = JSON.parse(localStorage.getItem("save"));
	if (typeof saveplayer.dollars !== "undefined") player.dollars = saveplayer.dollars;
	if (typeof saveplayer.dollarMod !== "undefined") player.dollarMod = saveplayer.dollarMod;
	if (typeof saveplayer.attack !== "undefined") player.attack = saveplayer.attack;
	lastTime = Date.now();
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
	progressCost = Math.floor(10 * Math.pow(1.1,player.attack))-5;
	valueCost = Math.floor(10 * Math.pow(1.1,player.dollarMod))-5;
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
