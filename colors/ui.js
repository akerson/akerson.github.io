"use strict";

const $mixers = $("#mixers");
const $easel = $("#easel");
const $history = $("#history");
const $completedLibrary = $("#completedLibrary");
const $remainingLibrary = $("#remainingLibrary");

function updateHistory() {
    $history.empty();
    gameData.history.forEach(color => {
        $history.append(historyBox(color));
    });
}

const UITrigger = {
    historyChange : false,
    easleChange : false,
    mixerChange : false,
    libraryChange : false,
    mixerProperty : null,
    pointsRefresh : false,
}

function updateMixerBars() {
    if (UITrigger.historyChange) {
        UITrigger.historyChange = false;
        updateHistory();
    } 
    if (UITrigger.easleChange) {
        UITrigger.easleChange = false;
        updateEasles();
    }
    if (UITrigger.mixerChange) {
        UITrigger.mixerChange = false;
        updateMixers();
    }
    if (UITrigger.libraryChange) {
        UITrigger.libraryChange = false;
        updateLibrary();
    }
    if (UITrigger.mixerProperty !== null) {
        viewProperties(UITrigger.mixerProperty);
        UITrigger.mixerProperty = null;
    }
    if (UITrigger.pointsRefresh) {
        UITrigger.pointsRefresh = false;
        $("#remainingPts").html(`Points Remaining - ${gameData.ptsRemaining()}`);
    }
    gameData.mixers.forEach(mixer => {
        const width = (mixer.time/mixer.maxTime()*100).toFixed(1)+"%";
        mixer.pb.css("width", width);
    });
}

function updateMixers() {
    $mixers.empty();
    gameData.mixers.forEach(mixer => {
        $mixers.append(colorMixerBox(mixer));
    });
    if (gameData.mixers.length < gameData.mixersMax) {
        $("<div/>").addClass("mixerBuy").html("Buy Mixer - 1 Pt").appendTo($mixers);
    }
}

function updateEasles() {
    $easel.empty();
    gameData.easel.forEach(color => {
        $easel.append(easelBox(color));
    })
    //up to 10, so do the rest
    for (let i=0;i<10-gameData.easel.length;i++) {
        $("<div/>").addClass("easelBoxEmpty").html("Empty").appendTo($easel);
    }
}

function updateLibrary() {
    $completedLibrary.empty();
    $remainingLibrary.empty();
    gameData.colorLibrary.forEach(library => {
        if (library.found) $completedLibrary.append(colorLibraryBox(library));
        else $remainingLibrary.append(colorLibraryBox(library));
    });
    const foundCount = gameData.colorLibrary.filter(c=>c.found).length;
    $("#completedLibraryHeading").html(`Completed Library (${foundCount}/140)`);
    $("#remainingLibraryHeading").html(`Remaining Library (${140-foundCount}/140)`);
}

function colorBox(color) {
    const d = $("<div/>").addClass("colorBlock");
    if (!color) {
        $("<span/>").addClass("colorName").html("Empty").appendTo(d);
        return d;
    }
    d.css("background-color",`#${color}`);
    const t = $("<span/>").addClass("colorName").html("#"+color).appendTo(d);
    t.css("color",textColor(color));
    return d;
}

function colorMixerBox(mixer) {
    const pb = $("<div/>").addClass("mixerBoxBar");
    createProgressBar(mixer).appendTo(pb);
    colorBox(mixer.color1).addClass("colorUnslot").data({"position":0,"mixer":mixer.count}).appendTo(pb);
    colorBox(mixer.color2).addClass("colorUnslot").data({"position":1,"mixer":mixer.count}).appendTo(pb);
    $("<div/>").addClass("mixerProperties").data("mixer",mixer.count).html("Properties").appendTo(pb);
    return pb;
}

function easelBox(color) {
    const s = $("<div/>").addClass("easelBox").data("color",color);
    $("<div/>").addClass("easelBoxClose").data("color",color).html(`<i class="fa-solid fa-xmark"></i>`).appendTo(s);
    colorBox(color).appendTo(s);
    return s;
}

function historyBox(color) {
    const s = $("<div/>").addClass("historyBox").data("color",color);
    colorBox(color).appendTo(s);
    return s;
}

function colorLibraryBox(library) {
    const ch = $("<div/>").addClass("libraryBox").data("color",library.id);
    if (library.found) ch.addClass("libraryBoxFound");
    ch.css("background-color",`#${library.id}`);
    ch.css("color",textColor(library.id));
    $("<div/>").addClass("chName").html(library.name).appendTo(ch); 
    colorBox(library.id).appendTo(ch);
    return ch;
}

function textColor(backgroundColor) {
    //given a background color, return the proper color for the text
    const r = parseInt(backgroundColor.substring(0,2),16);
    const g = parseInt(backgroundColor.substring(2,4),16);
    const b = parseInt(backgroundColor.substring(4,6),16);
    const brightness = Math.round((299*r + 587*g + 114*b)/1000);
    return (brightness > 125) ? '#000000' : '#FFFFFF';
}

$(document).on("click",".historyBox",e => {
    //add history to easel
    e.preventDefault();
    const color = $(e.currentTarget).data("color");
    gameData.addEasel(color);
    UITrigger.easleChange = true;
});

$(document).on("click",".easelBoxClose",e => {
    //remove from easel
    e.stopPropagation();
    const color = $(e.currentTarget).data("color");
    gameData.removeEasel(color);
    UITrigger.easleChange = true;
});

$(document).on("click",".easelBox",e => {
    //add easel to mixer
    e.preventDefault();
    const color = $(e.currentTarget).data("color");
    gameData.addMixColor(color);
    UITrigger.mixerChange = true;
});

$(document).on("click",".libraryBoxFound",e => {
    //add library to mixer
    e.preventDefault();
    const color = $(e.currentTarget).data("color");
    gameData.addMixColor(color);
    UITrigger.mixerChange = true;
});

$(document).on("click",".colorUnslot",e => {
    e.preventDefault();
    const mixer = parseInt($(e.currentTarget).data("mixer"));
    const position = parseInt($(e.currentTarget).data("position"));
    gameData.removeMix(mixer,position);
    UITrigger.mixerChange = true;
});

$(document).on("click",".mixerBuy",e => {
    e.preventDefault();
    gameData.purchaseMixer();
});

$(document).on("click",".mixerProperties",e=> {
    e.preventDefault();
    const mixer = parseInt($(e.currentTarget).data("mixer"));
    viewProperties(mixer);
});

$(document).on("click",".propertiesBoxClose",e=> {
    e.preventDefault();
    $propertiesBox.hide();
});

$(document).on("click",".propertySlot",e=> {
    e.preventDefault();
    const mixer = parseInt($(e.currentTarget).data("mixer"));
    const property = $(e.currentTarget).data("property");
    gameData.removeProperty(mixer,property);
});

$(document).on("click",".buyPropertySlot",e=> {
    e.preventDefault();
    const mixer = parseInt($(e.currentTarget).data("mixer"));
    gameData.buyPropertySlot(mixer);
});

$(document).on("click",".propertyBought",e=> {
    e.preventDefault();
    const mixer = parseInt($(e.currentTarget).data("mixer"));
    const property = $(e.currentTarget).data("property");
    gameData.addProperty(mixer,property);
});

$(document).on("click",".propertyNotBought",e=> {
    e.preventDefault();
    const mixer = parseInt($(e.currentTarget).data("mixer"));
    const property = $(e.currentTarget).data("property");
    gameData.buyProperty(mixer,property);
});

function createProgressBar(mixer) {
    const width = (mixer.time/mixer.maxTime()*100).toFixed(1)+"%";
    const d = $("<div/>").addClass("progressBar").attr("id","MPB"+mixer.count).css("width", width);
    mixer.pb = d;
    return d;
}

const $propertiesBox = $("#propertiesBox");

function viewProperties(mixerID) {
    const mixer = gameData.mixers.find(m=>m.count === mixerID);
    $propertiesBox.empty().show();
    $("<div/>").addClass("propertiesBoxClose").html(`<i class="fa-solid fa-xmark"></i>`).appendTo($propertiesBox);
    //property slots
    const d = $("<div/>").addClass("propertySlots").appendTo($propertiesBox);
    mixer.properties.forEach(property => {
        $("<div/>").addClass("propertySlot").data({"property":property,"mixer":mixer.count}).html(property).appendTo(d);
    });
    for (let i=0;i<mixer.maxProperties-mixer.properties.length;i++) {
        $("<div/>").addClass("propertySlot").data("propertySlotEmpty",i).html("Empty").appendTo(d);
    }
    if (mixer.maxProperties < 4) $("<div/>").addClass("buyPropertySlot").data("mixer",mixer.count).html("Buy - 1 pt").appendTo(d);
    //available properties
    const e = $("<div/>").addClass("propertyPurchase").appendTo($propertiesBox);
    mixerProperties.forEach(property => {
        if (gameData.boughtProperties.includes(property)) {
            $("<div/>").addClass("propertyBought").data({"mixer":mixer.count,"property":property}).html(property).appendTo(e);
        }
        else {
            $("<div/>").addClass("propertyNotBought").data({"mixer":mixer.count,"property":property}).html(`${property} - 6pts`).appendTo(e);
        }
    });
    $("<div/>").addClass("propertyBuyText").html("Buying properties buys them for all mixers").appendTo($propertiesBox);
}

// Make the DIV element draggable:
dragElement(document.getElementById("propertiesBox"));

function dragElement(elmnt) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  if (document.getElementById(elmnt.id + "header")) {
    // if present, the header is where you move the DIV from:
    document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
  } else {
    // otherwise, move the DIV from anywhere inside the DIV:
    elmnt.onmousedown = dragMouseDown;
  }

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
  }
}