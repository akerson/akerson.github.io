var cookies = 0;
var factories = 0;

function cookieClick(number){
    cookies = cookies + number;
	document.getElementById("cookies").innerHTML = cookies;
}

function buyFactory(){
    var factoryCost = Math.floor(10 * Math.pow(1.1,factories));     //works out the cost of this cursor
    if(cookies >= factoryCost){                                   //checks that the player can afford the cursor
        factories = factories + 1;                                   //increases number of cursors
    	cookies = cookies - factoryCost;                          //removes the cookies spent
        refreshPage();
    };
    var nextCost = Math.floor(10 * Math.pow(1.1,factories));       //works out the cost of the next cursor
    document.getElementById('factoryCost').innerHTML = nextCost;  //updates the cursor cost for the user
};



window.setInterval(function(){
	cookieClick(factories);
	saveGame()
}, 1000);




function prettify(input){
    var output = Math.round(input * 1000000)/1000000;
	return output;
}

function loadGame() {
	var savegame = JSON.parse(localStorage.getItem("save"));
	if (typeof savegame.cookies !== "undefined") cookies = savegame.cookies;
	if (typeof savegame.factories !== "undefined") factories = savegame.factories;
	refreshPage();
}

function refreshPage() {
	document.getElementById('cookies').innerHTML = prettify(cookies);
	document.getElementById('factory').innerHTML = prettify(factories);
}

function saveGame() {
	var save = {
		cookies: cookies,
		factories: factories,
	}
	localStorage.setItem("save",JSON.stringify(save));
}