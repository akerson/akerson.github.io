"use strict";

const $mixers = $("#mixers");
const $history = $("#history");
const $library = $("#library");

function initializeUI() {
    $mixers.empty();
    gameData.mixers.forEach(mixer => {
        $mixers.append(colorMixerBox(mixer));
    });
    $history.empty();
    gameData.slots.forEach(slot => {
        $history.append(slotBox(slot));
    });
    $library.empty();
    gameData.colorHistory.forEach(colorHistory => {
        $library.append(colorHistoryBox(colorHistory));
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
    const pb = $("<div/>").addClass("mixerBox").html("timerBox");
    $("<div/>").addClass("mixerBoxBar").appendTo(pb);
    colorBox(mixer.color1).addClass("colorUnslot").data({"position":0,"mixer":mixer.count}).appendTo(pb);
    colorBox(mixer.color2).addClass("colorUnslot").data({"position":1,"mixer":mixer.count}).appendTo(pb);
    return pb;
}

function slotBox(slot) {
    const s = $("<div/>").addClass("slotBox colorSlot").data("color",slot.id);
    const star = $("<div/>").addClass("frozenIcon").html(`<i class="fa-solid fa-star"></i>`).appendTo(s);
    if (slot.fr) star.addClass("frozen");
    colorBox(slot.id).appendTo(s);
    return s;
}

function colorHistoryBox(colorHistory) {
    const ch = $("<div/>").addClass("chBox colorSlot").data("color",colorHistory.id);
    colorBox(colorHistory.id).appendTo(ch);
    $("<div/>").addClass("chName").html(colorHistory.name).appendTo(ch); 
    if (colorHistory.found) ch.addClass("found");
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

$(document).on("click",".colorSlot",e => {
    console.log("butts");
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