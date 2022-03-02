"use strict";

const $mixers = $("#mixers");
const $easel = $("#easel");
const $history = $("#history");
const $library = $("#library");

function initializeUI() {
    $mixers.empty();
    gameData.mixers.forEach(mixer => {
        $mixers.append(colorMixerBox(mixer));
    });
    $easel.empty();
    gameData.easel.forEach(color => {
        $easel.append(easelBox(color));
    })
    $history.empty();
    gameData.history.forEach(color => {
        $history.append(historyBox(color));
    });
    $library.empty();
    gameData.colorLibrary.forEach(library => {
        $library.append(colorLibraryBox(library));
    });
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
    const pb = $("<div/>").addClass("mixerBox").html("TODO Timer");
    $("<div/>").addClass("mixerBoxBar").appendTo(pb);
    colorBox(mixer.color1).addClass("colorUnslot").data({"position":0,"mixer":mixer.count}).appendTo(pb);
    colorBox(mixer.color2).addClass("colorUnslot").data({"position":1,"mixer":mixer.count}).appendTo(pb);
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
    colorBox(library.id).appendTo(ch);
    $("<div/>").addClass("chName").html(library.name).appendTo(ch); 
    if (library.found) ch.addClass("found");
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
});

$(document).on("click",".easelBox",e => {
    //add easel to mixer
    e.preventDefault();
    const color = $(e.currentTarget).data("color");
    gameData.addMixColor(color);
});

$(document).on("click",".libraryBox",e => {
    //add library to mixer
    e.preventDefault();
    const color = $(e.currentTarget).data("color");
    gameData.addMixColor(color);
});

$(document).on("click",".colorUnslot",e => {
    e.preventDefault();
    const mixer = parseInt($(e.currentTarget).data("mixer"));
    const position = parseInt($(e.currentTarget).data("position"));
    gameData.removeMix(mixer,position)
});