function NPC(name, description) {
    this.name = name;
    this.description = description;
    this.actions = [Actions.TALK];
    this.initalD = null;
    this.dialog = [];
    this.flags = {
        "A" : false,
    }
}

NPC.prototype.getDialog = function(tag) {
    for (let i=0;i<this.dialog.length;i++) {
        if (this.dialog[i].l == tag) {
            return [this.dialog[i].m,this.dialog[i].o]
        }
    }
}

NPC.prototype.getPlayerResponse = function(tag) {
    for (let i=0;i<this.dialog.length;i++) {
        if (this.dialog[i].o)
    }
}

const NPCbank = {
    "Jerry" : new NPC("Jerry","A normal looking man of normal looking neatness."),
}

function npcPrep() {
    NPCbank["Jerry"].dialog = [
        {
            l:"A",
            m:"Please don't talk to me, I'm still mad at you.",
            o:["End","You part ways."],
        },
        {
            l:"init",
            m:"Why hello there stranger, what brings you to these parts?",
            o:[
                ["Nothing","Oh nothiing, I'm just mosying around here."],
                ["Something","Well... there is something. Are you looking for work?"],["Insult","Your mom is a horse."]
            ],
        },
        {
            l:"Nothing",
            m:"Well that's good I'm glad to hear it!?",
            o:["End", "You both bid adieu and go on your merry ways."]
        },  
        {
            l:"Something",
            m:"No sorry, not at tihs time. Check back later though",
            o:["End","You exchange pleasantries and leave."]
        },  
        {
            l:"Insult",
            m:"The fuck you say to me?",
            o:["End","Jerry storms off."],
            f:["A",true],
        },  
    ];
}
