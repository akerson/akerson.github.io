var dollars = 0;
var dollarValue = 1;

var atkNeed = 1000;
var atkCurrent = 0;
var atkMod = 1;
var isAttack = false;

var progressCost = 1;
var valueCost = 1;

function attack(id) {
	isAttack = !isAttack;
	colorchange(id);
}

window.setInterval(function(){
	if (isAttack) {
		atkCurrent = atkCurrent + atkMod;
		if (atkCurrent > atkNeed) {
			dollars = dollars + dollarValue;
			console.log(dollars)
			atkCurrent = 0;
			refreshPage();
			refreshButtons();
		}
	}
	refreshBar();
}, 10);

function refreshBar() {
	//update the CSS of the bar to the timer
	var elem = document.getElementById("progress");
	//calculate percent fill
	var pFill = atkCurrent/atkNeed*100;
	elem.style.width = pFill.toString() + "%";
}

function purchase(type) {
	if (type == "prog") {
		if (dollars >= progressCost) {
			atkMod = atkMod + 1;
			dollars = dollars - progressCost;
			progressCost = Math.floor(10 * Math.pow(1.1,progressCost));
			refreshButtons();
		}
	}
	if (type == "value") {
		if (dollars >= valueCost) {
			dollarValue = dollarValue + 1;
			dollars = dollars - valueCost;
			valueCost = Math.floor(10 * Math.pow(1.1,valueCost));
			refreshButtons();
		}		
	}
	refreshPage();
}

function refreshPage() {
	document.getElementById('progValue').innerHTML = atkMod;
	document.getElementById('valueValue').innerHTML = dollarValue;
	document.getElementById('dollarCount').innerHTML = dollars;
	var elem = document.getElementById("prog");
	elem.innerText = "Progress ($"+progressCost.toString()+")";
	elem = document.getElementById("value");
	elem.innerText = "Value ($"+valueCost.toString()+")";
}

function refreshButtons() {
	id = "prog";
	var el = document.getElementById(id);
	if (dollars >= progressCost) {
		el.setAttribute("class", "button");
	}
	else {
		el.setAttribute("class", "buttonGrey");
	}
	id = "value";
	el = document.getElementById(id);
	if (dollars >= valueCost) {
		el.setAttribute("class", "button");
	}
	else {
		el.setAttribute("class", "buttonGrey");
	}
}

function prettify(input){
    var output = Math.round(input * 1000000)/1000000;
	return output;
}

function loadGame() {
	var savegame = JSON.parse(localStorage.getItem("save"));
	if (typeof savegame.dollars !== "undefined") dollars = savegame.dollars;
	if (typeof savegame.factories !== "undefined") factories = savegame.factories;
	refreshPage();
}

function saveGame() {
	var save = {
		dollars: dollars,
		factories: factories,
	}
	localStorage.setItem("save",JSON.stringify(save));
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