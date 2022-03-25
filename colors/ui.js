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
    historyChange : true,
    easleChange : true,
    mixerChange : true,
    libraryChange : true,
    pointsRefresh : true,
    mixerProperty : null,
    autoEasel : null,
    colorFlip : [],
    gameEnd : true,
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
        const ptText = gameData.ptsRemaining() === 1 ? `1 ${pt}` : `${gameData.ptsRemaining()} ${pt}`;
        $("#pts").html(`Mix these for palette points (${ptText} remaining)`);
    }
    if (UITrigger.autoEasel !== null) {
        autoEasel(UITrigger.autoEasel);
        UITrigger.autoEasel = null;
    }
    if (UITrigger.gameEnd) {
        UITrigger.gameEnd = false;
        if (!gameData.gameEnd) return;
        $(".youWin").show();
        $(".rainbowBG").show();
        $("#colorsMixed").html(gameData.mixedColors);
        $("#timeSpent").html(timeSince(gameData.startTime,gameData.gameEnd));
    }
    while (UITrigger.colorFlip.length > 0) {
        const mix = UITrigger.colorFlip.pop();
        colorFlip(mix);
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
        $("<div/>").addClass("mixerBuy").html(`Purchase Mixer<br>(1 ${pt})`).appendTo($mixers);
    }
}

function updateEasles() {
    $easel.empty();
    gameData.easel.forEach(color => {
        $easel.append(easelBox(color));
    })
    //up to 10, so do the rest
    for (let i=0;i<gameData.easelMax-gameData.easel.length;i++) {
        $("<div/>").addClass("easelBoxEmpty").html("Empty").appendTo($easel);
    }
    if (gameData.easelMax < 30) {
        $("<div/>").addClass("easelBoxBuy").html(`Purchase 3 Easels<br>(1 ${pt})`).appendTo($easel);
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
    $("#completedLibraryHeading").html(`Completed Library (${foundCount}/${gameData.colorLibrary.length})`);
    $("#remainingLibraryHeading").html(`Remaining Library (${gameData.colorLibrary.length-foundCount}/${gameData.colorLibrary.length})`);
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
    const a = $("<div/>").addClass("mixerAll");
    const pb = $("<div/>").addClass("mixerBoxBar").appendTo(a);
    if (!mixer.autoEasel) $("<div/>").addClass("buyAutoEasel autoEaselHeading").data("mixer",mixer.count).html(`AutoEasel (1 ${pt})`).appendTo(pb);
    else if (mixer.autoEaselOn) $("<div/>").addClass("autoEaselView autoEaselHeading").data("mixer",mixer.count).html(`#${mixer.autoEaselFilter}`).appendTo(pb);
    else $("<div/>").addClass("autoEaselView autoEaselHeading").data("mixer",mixer.count).html(`Auto Off`).appendTo(pb);
    colorBox(mixer.color1).addClass("colorUnslot").data({"position":0,"mixer":mixer.count}).appendTo(pb);
    const d = $("<div/>").attr("id","MPBB"+mixer.count).addClass("pbHolder").appendTo(pb);
    if (!mixer.colorFlip) d.css("background-color",`#${mixer.color2}`);
    else d.css("background-color",`#${mixer.color1}`);
    createProgressBar(mixer).appendTo(d);
    colorBox(mixer.color2).addClass("colorUnslot").data({"position":1,"mixer":mixer.count}).appendTo(pb);
    const propBtn = $("<div/>").addClass("mixerProperties action-button").data("mixer",mixer.count).appendTo(a);
        $("<span/>").addClass("action-text").html(`Properties (${mixer.maxProperties})`).appendTo(propBtn);
        propBtn.append('<i class="fa-solid fa-list-dropdown"></i>');
    return a;
}

function easelBox(color) {
    const s = $("<div/>").addClass("easelBox").data("color",color).html("#"+color);
    s.css({"background-color":`#${color}`,"color":textColor(color)});
    const x = $("<div/>").addClass("easelBoxClose").data("color",color).html(`<i class="fa-solid fa-xmark"></i>`).appendTo(s);
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

$(document).on("click",".autoEaselClose",e=> {
    e.preventDefault();
    $autoEasel.hide();
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

$(document).on("click",".easelBoxBuy", e=> {
    e.preventDefault();
    gameData.buyEasel();
});

$(document).on("click",".buyAutoEasel",e=> {
    e.preventDefault();
    const mixer = parseInt($(e.currentTarget).data("mixer"));
    gameData.buyAutoEasel(mixer);
});

$(document).on("click",".autoEaselView",e=> {
    e.preventDefault();
    const mixer = parseInt($(e.currentTarget).data("mixer"));
    autoEasel(mixer);
});

$(document).on("click",".pause",e=> {
    e.preventDefault();
    gamePause();
})

$(document).on("click","#mixersClear",e=> {
    e.preventDefault();
    gameData.clearMixers();
})

$(document).on("click","#mixersClearColor",e=> {
    e.preventDefault();
    gameData.clearMixers(true);
})

$(document).on("click","#mixersCopy",e=> {
    e.preventDefault();
    gameData.propogateFirst();
})

$(document).on("click",".mixerColorCount",e=> {
    e.preventDefault();
    const mixer = parseInt($(e.currentTarget).data("mixer"));
    gameData.addColorCount(mixer);
})

function createProgressBar(mixer) {
    const width = (mixer.time/mixer.maxTime()*100).toFixed(1)+"%";
    const d = $("<div/>").addClass("progressBar").attr("id","MPB"+mixer.count).css("width", width);
    if (!mixer.colorFlip) d.css("background-color",`#${mixer.color1}`);
    else d.css("background-color",`#${mixer.color2}`);
    mixer.pb = d;
    return d;
}

function colorFlip(mixer) {
    mixer.colorFlip = !mixer.colorFlip;
    const d = $("#MPB"+mixer.count.toString());
    const e = $("#MPBB"+mixer.count.toString());
    if (!mixer.colorFlip) {
        d.css("background-color",`#${mixer.color1}`);
        e.css("background-color",`#${mixer.color2}`);
    }
    else {
        d.css("background-color",`#${mixer.color2}`);
        e.css("background-color",`#${mixer.color1}`);
    }
}

const $propertiesBox = $("#propertiesBox");

function viewProperties(mixerID) {
    const mixer = gameData.mixers.find(m=>m.count === mixerID);
    $propertiesBox.empty().show();
    $autoEasel.hide();
    $("<div/>").addClass("mixerColorCount").data("mixer",mixer.count).html(`${mixer.colorCount} Color${mixer.colorCount > 1 ? "s" : ""} Per Fill${mixer.colorCount < mixer.colorCountMax ? ` (${mixer.colorCost()} ${pt})` : ""}`).appendTo($propertiesBox);
    $("<div/>").addClass("propertiesBoxClose").html(`<i class="fa-solid fa-xmark"></i>`).appendTo($propertiesBox);
    $("<div/>").addClass("mixerPropertyHeading").html("Mixer Properties").appendTo($propertiesBox);
    //property slots
    const d = $("<div/>").addClass("propertySlots").appendTo($propertiesBox);
    mixer.properties.forEach(property => {
        $("<div/>").addClass("propertySlot propertyPadding").data({"property":property,"mixer":mixer.count}).html(property).appendTo(d);
    });
    for (let i=0;i<mixer.maxProperties-mixer.properties.length;i++) {
        $("<div/>").addClass("propertySlot propertyPadding").data("propertySlotEmpty",i).html("Empty").appendTo(d);
    }
    if (mixer.maxProperties < 4) $("<div/>").addClass("buyPropertySlot").data("mixer",mixer.count).html(`Buy A Property Slot (1 ${pt})`).appendTo(d);
    //available properties
    const e = $("<div/>").addClass("propertyPurchase").appendTo($propertiesBox);
    $("<div/>").addClass("propertyHeading").html("Properties available").appendTo(e);
    mixerProperties.forEach(property => {
        if (gameData.boughtProperties.includes(property)) {
            $("<div/>").addClass("propertyBought propertyPadding").data({"mixer":mixer.count,"property":property}).html(property).appendTo(e);
        }
        else {
            $("<div/>").addClass("propertyNotBought propertyPadding").data({"mixer":mixer.count,"property":property}).html(`${property} (6 ${pt})`).appendTo(e);
        }
    });
    $("<div/>").addClass("propertyBuyText").html("Buying properties buys them for all mixers").appendTo($propertiesBox);
}

const $autoEasel = $("#autoEasel");
function autoEasel(mixerID) {
    const mixer = gameData.mixers.find(m=>m.count === mixerID);
    $autoEasel.empty().show();
    $propertiesBox.hide();
    $("<div/>").addClass("autoEaselClose").html(`<i class="fa-solid fa-xmark"></i>`).appendTo($autoEasel);
    if (mixer.autoEaselOn) $("<div/>").addClass("autoEaselEnable").data("mixer",mixer.count).html("AutoEasel: Enabled").appendTo($autoEasel);
    else $("<div/>").addClass("autoEaselEnable").data("mixer",mixer.count).html("AutoEasel: Disabled").appendTo($autoEasel);
    const d1 = $("<div/>").addClass("characterFilters").appendTo($autoEasel);
    for (let i=0;i<6;i++) {
        const e = $("<div/>").addClass("characterBound").appendTo(d1);
        for (let j=0;j<17;j++) {
            // i = position, j = character
            const chars = "x0123456789ABCDEF";
            const f = $("<div/>").addClass("autoEaselFilterCharacter").data({"mixer":mixer.count,"position":i,"character":chars[j]}).html(chars[j]).appendTo(e);
            if (mixer.autoEaselFilter[i] === chars[j]) f.addClass("highlight");
        }
    }
}

$(document).on("click",".autoEaselFilterCharacter",e => {
    e.preventDefault();
    const mixer = parseInt($(e.currentTarget).data("mixer"));
    const position = parseInt($(e.currentTarget).data("position"));
    const character = $(e.currentTarget).data("character");
    gameData.autoEaselFilterAdjust(mixer,position,character);
});

$(document).on("click",".autoEaselEnable",e => {
    e.preventDefault();
    const mixer = parseInt($(e.currentTarget).data("mixer"));
    gameData.autoEaselEnable(mixer);
})

// Make the DIV element draggable:
dragElement(document.getElementById("propertiesBox"));
dragElement(document.getElementById("autoEasel"));
// dragElement(document.getElementById("helpBox"));

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

function gamePause() {
    const pauseButton = $("#pause");
    pauseButton.empty();
    gameData.paused = !gameData.paused;
    if (gameData.paused) {
        $("<span/>").addClass("action-text").html("Game Paused").appendTo(pauseButton);
        pauseButton.addClass("game-paused").append('<i class="fa-solid fa-pause"></i>')
    } else {
        $("<span/>").addClass("action-text").html("Game Running").appendTo(pauseButton);
        pauseButton.removeClass("game-paused").append('<i class="fa-solid fa-play"></i>')
    }
}

document.addEventListener('keydown', (event) => {
    if (event.code === "Space") {
        event.preventDefault();
        gamePause();
    }
  }, false);

$(document).on("click",".helpOpen",e=>{
    e.preventDefault();
    $("#clearSave").html("Clear Save");
    $("#helpBox").show();
})


$(document).on("click","#helpClose",e=> {
    e.preventDefault();
    $("#clearSave").html("Clear Save");
    $("#helpBox").hide();
})