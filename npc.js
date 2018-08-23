function NPC(name, description) {
    this.name = name;
    this.description = description;
    this.actions = [Actions.TALK];
    this.initalD = null;
    this.dialog = [];
}

NPC.prototype.getDialog = function(tag) {
    for (let i=0;i<this.dialog.length;i++) {
        if (this.dialog[i].l == tag) {
            return [this.dialog[i].m,this.dialog[i].o]
        }
    }
}

const NPCbank = {
    "Jerry" : new NPC("Jerry","A normal looking man of normal looking neatness."),
}

function npcPrep() {
    NPCbank["Jerry"].dialog = [
        {
            l:"init",
            m:"Why hello there stranger, what brings you to these parts?",
            o:["Nothing","Something"]
        },
        {
            l:"Nothing",
            m:"Well that's good I'm glad to hear it!?",
            o:["End"]
        },  
        {
            l:"Something",
            m:"Oh yeah?? Mind sharing?",
            f:["A",true],
            o:["End"]
        },  
        {
            l:"A",
            m:"Why haven't you told me yet?",
            o:["End"]
        },  
    ];
}
