/* The Salt Road — content data.
   Pure data: stats, roster, event pool, tuning constants. No game logic here. */

const STATS = ["Might","Finesse","Awareness","Presence"];

const PARTY_TEMPLATE = [
  { id:'kael',  name:"Kael Ironhand",   epithet:"the Warrior", primary:"Might",     mods:{Might:3, Finesse:0, Awareness:-1, Presence:0} },
  { id:'rin',   name:"Rin Swiftfoot",   epithet:"the Scout",   primary:"Finesse",   mods:{Might:0, Finesse:3, Awareness:0,  Presence:1} },
  { id:'doran', name:"Doran Vale",      epithet:"the Sage",    primary:"Awareness", mods:{Might:-1,Finesse:1, Awareness:3,  Presence:0} },
  { id:'sable', name:"Sable Ashworth",  epithet:"the Envoy",   primary:"Presence",  mods:{Might:0, Finesse:0, Awareness:1,  Presence:3} },
  { id:'fenn',  name:"Fenn Brackwood",  epithet:"the Wanderer",primary:"Finesse",   mods:{Might:1, Finesse:2, Awareness:1,  Presence:-1} },
];

const TALLY_VALUES = { disaster:-2, setback:-1, success:1, triumph:2 };

// The stretch of road the party travels — one location tag per stop.
const ADVENTURE_TRACK = ['forest','forest','road','forest','ruins','river'];

const EVENT_POOL = [
  {
    id:'fallen_tree', type:'Travel', title:'The Fallen Tree',
    tags:{ location:['forest'], requires:[], repeatableOnFlee:false },
    prompt:"A massive oak has crashed across the trail, roots torn from the hillside. Rain-slick bark makes the footing treacherous.",
    options:[
      { type:'check', label:'Force a path through the branches', stat:'Might', dc:10, timeCost:2, fatigueCost:1,
        results:{ disaster:'The trunk shifts and pins a leg — you break free, but not unscathed.', setback:'You clear a path, though the effort leaves scrapes and bruises.', success:'You clear enough branches to pass through cleanly.', triumph:'You heave the whole trunk aside in one motion — the party is genuinely impressed.' },
        conditionByTier:{ disaster:'Injured' } },
      { type:'check', label:'Scout an alternate route', stat:'Awareness', dc:12, timeCost:1,
        results:{ disaster:'You lead the party in a circle, wasting precious time.', setback:'You find a way around, though it takes longer than hoped.', success:'You spot a deer trail that loops around neatly.', triumph:'You find a shortcut that saves real time.' },
        extraTimeByTier:{ disaster:1, triumph:-1 } },
      { type:'flee', label:'Turn back and find another way entirely', stat:'Finesse', dc:8, timeCost:1,
        results:{ disaster:"You can't find another way — the tree has to be dealt with after all.", setback:'You backtrack, though it costs more ground than expected.', success:'You backtrack and pick up another trail without issue.', triumph:'You find a hidden path almost immediately.' },
        extraTimeByTier:{ setback:1, triumph:-1 } },
      { type:'special', label:'Trust to fortune', timeCost:0,
        results:{ default:'With a bit of luck on your side, an obvious gap opens up that none of you noticed before. No time lost.' } }
    ]
  },
  {
    id:'steep_switchbacks', type:'Travel', title:'Steep Switchbacks',
    tags:{ location:['forest'], requires:[], repeatableOnFlee:false },
    prompt:"The trail pitches sharply upward, switchbacking along a loose scree slope.",
    options:[
      { type:'check', label:'Push straight up the slope', stat:'Might', dc:11, timeCost:1, fatigueCost:2,
        results:{ disaster:'The scree gives way beneath someone.', setback:'You make it up, legs burning.', success:'You climb it at a steady pace.', triumph:'You practically run up the slope.' },
        conditionByTier:{ disaster:'Injured' } },
      { type:'check', label:'Pick the gentler switchback line', stat:'Awareness', dc:10, timeCost:2,
        results:{ disaster:'The "gentler" line dead-ends, costing you dearly.', setback:'The longer line pays off, slowly.', success:'You find a comfortable, manageable grade.', triumph:'You find a line so smooth it barely feels like a climb.' },
        extraTimeByTier:{ disaster:1, triumph:-1 } },
      { type:'flee', label:'Look for a way around the slope entirely', stat:'Finesse', dc:7, timeCost:1,
        results:{ disaster:"There's no way around — the slope must be climbed.", setback:'You find a detour, though it eats into your lead.', success:'You route around it cleanly.', triumph:'You find a flat bypass almost at once.' } },
      { type:'special', label:'Trust to fortune', timeCost:0,
        results:{ default:'A recent rockslide left a natural, gentle ramp none of you had spotted. No time lost.' } }
    ]
  },
  {
    id:'goblin_ambush', type:'Combat', title:'Goblin Ambush',
    tags:{ location:['forest','road'], requires:[], repeatableOnFlee:false },
    prompt:"Three goblins burst from the brush, blades drawn, eyes hungry for easy plunder.",
    options:[
      { type:'combat', label:'Stand and fight', timeCost:2,
        dcByStat:{ Might:10, Finesse:13, Awareness:16, Presence:19 },
        tallyTable:[
          { max:-3, result:'The goblins are driven off, but at terrible cost — a party member is slain.', conditionGranted:'Dead' },
          { min:-2, max:0, result:'The goblins scatter, but a party member is left injured.', conditionGranted:'Injured' },
          { min:1, max:3, result:'You beat the goblins back cleanly, though the scuffle costs extra time.', extraTimeCost:1 },
          { min:4, result:'You rout the goblins with ease. One drops a strange medallion.', triumphGrantsPoint:true }
        ] },
      { type:'check', label:'Try to talk them down', stat:'Presence', dc:15, timeCost:1,
        results:{ disaster:'They laugh and attack anyway — you barely scramble clear.', setback:'They back off, but demand a "toll" first.', success:'Surprised, they slink back into the brush.', triumph:'You convince them you are not worth the trouble — one even tosses you a coin pouch.' },
        conditionByTier:{ disaster:'Injured' }, triumphGrantsPoint:true },
      { type:'flee', label:'Retreat the way you came', stat:'Finesse', dc:9, timeCost:1,
        results:{ disaster:"They're faster than expected — you're forced to fight after all.", setback:'You escape, but drop supplies in the scramble.', success:'You slip away into the trees.', triumph:'You vanish before they even register you are gone.' } },
      { type:'special', label:'Trust to fortune', timeCost:0,
        results:{ default:'Something about your bearing gives the goblins pause. They let you pass unchallenged.' } }
    ]
  },
  {
    id:'wayside_shrine', type:'Exploration', title:'A Wayside Shrine',
    tags:{ location:['forest','ruins'], requires:[], repeatableOnFlee:true },
    prompt:"Just off the path, a crumbling shrine catches your eye — old stone, and something glinting within.",
    options:[
      { type:'check', label:'Investigate the shrine', stat:'Awareness', dc:13, timeCost:1,
        results:{ disaster:'A trap springs — nothing lethal, but painful.', setback:'You find a little of value, but waste time picking through rubble.', success:'You find a small cache of useful supplies.', triumph:'You find something rare and valuable — a stroke of real fortune.' },
        conditionByTier:{ disaster:'Injured' }, triumphGrantsPoint:true },
      { type:'check', label:'Pay respects and move on', stat:'Presence', dc:10, timeCost:1,
        results:{ disaster:'Something about the ritual unsettles the party.', setback:'It takes longer than expected to do properly.', success:'A brief moment of peace steadies everyone.', triumph:'The moment leaves the party feeling unusually fortunate.' } },
      { type:'flee', label:"Ignore it — you don't have time", stat:'Finesse', dc:6, timeCost:0,
        results:{ disaster:'Curiosity gets the better of someone anyway — you investigate regardless.', setback:'You move on, though someone lingers a beat too long.', success:'You leave it behind without a second thought.', triumph:'You are back on the path before anyone notices the detour.' } },
      { type:'special', label:'Trust to fortune', timeCost:0,
        results:{ default:"Your good fortune reveals the shrine's secret compartment instantly — a boon, no risk at all." } }
    ]
  },
  {
    id:'suspicious_guards', type:'Civilization', title:'The Checkpoint',
    tags:{ location:['road'], requires:[], repeatableOnFlee:false },
    prompt:"Two town guards block the road, spears crossed, eyeing your group with open suspicion.",
    options:[
      { type:'check', label:'Explain yourselves calmly', stat:'Presence', dc:12, timeCost:1, cureFatigueOnTier:'triumph',
        results:{ disaster:'Your story falls apart under questioning — they hold you up for a while.', setback:'They wave you through, but confiscate some of your supplies.', success:'Satisfied, they let you pass.', triumph:"They're won over completely — inspired, actually. It's exactly the lift one of you needed." },
        extraTimeByTier:{ disaster:1 } },
      { type:'check', label:'Find a way around the post', stat:'Awareness', dc:14, timeCost:1,
        results:{ disaster:'You are spotted trying to slip past — now they are genuinely suspicious.', setback:'You find a gap, but it takes real effort to navigate.', success:'You slip past along a side path unnoticed.', triumph:'You find a route so clean it barely costs a moment.' },
        extraTimeByTier:{ disaster:1, triumph:-1 } },
      { type:'flee', label:'Turn back before they notice', stat:'Finesse', dc:8, timeCost:1,
        results:{ disaster:"They call out and give chase — you're forced to deal with them.", setback:'You retreat, though they will remember your faces.', success:'You slip away before they look up.', triumph:'You are gone before they register movement.' } },
      { type:'special', label:'Trust to fortune', timeCost:0,
        results:{ default:'One guard recognizes a token you carry and waves you through without a word.' } }
    ]
  },
  {
    id:'rivers_edge', type:'Travel', title:"The River's Edge",
    tags:{ location:['river'], requires:[], repeatableOnFlee:false },
    prompt:"A wide river cuts across the trail. The old bridge is little more than rotten planks and rope.",
    options:[
      { type:'check', label:'Cross the old bridge carefully', stat:'Finesse', dc:12, timeCost:1,
        results:{ disaster:'A plank gives way — a bad fall.', setback:'You make it across, rattled and bruised.', success:'You cross without incident.', triumph:'You cross so surely it barely costs a breath.' },
        conditionByTier:{ disaster:'Injured' } },
      { type:'check', label:'Find a shallow ford upstream', stat:'Awareness', dc:13, timeCost:2,
        results:{ disaster:'The current is stronger than it looked — a rough crossing.', setback:'You find a ford, though it takes time to reach.', success:'You find a safe, shallow crossing.', triumph:'You find a perfect crossing point almost immediately.' },
        extraTimeByTier:{ triumph:-1 } },
      { type:'flee', label:'Turn back and camp for the night instead', stat:'Finesse', dc:8, timeCost:2,
        results:{ disaster:"There's nowhere safe to make camp — you're forced to cross anyway.", setback:'You make camp, though it costs more time than hoped.', success:'You make it through the night and press on.', triumph:'A quiet, restful night costs less time than expected.' } },
      { type:'special', label:'Trust to fortune', timeCost:0,
        results:{ default:'A local raft, tied up and forgotten, carries you across in moments.' } }
    ]
  },
  {
    id:'the_argument', type:'Drama', title:'Words Boil Over',
    tags:{ location:['any'], requires:[], repeatableOnFlee:false },
    prompt:"Exhaustion has frayed tempers. An old grievance resurfaces, and the party's unity hangs by a thread.",
    options:[
      { type:'check', label:'Talk it out honestly', stat:'Presence', dc:11, timeCost:1,
        results:{ disaster:'The argument gets worse — old wounds reopen.', setback:'Tempers cool, though resentment lingers.', success:'You smooth things over.', triumph:'The conversation actually brings the party closer together.' } },
      { type:'check', label:'Give everyone space to cool off', stat:'Awareness', dc:11, timeCost:2,
        results:{ disaster:'The silence festers into something worse.', setback:'The quiet helps, a little, though it costs time.', success:'Everyone calms down on their own.', triumph:'The break does wonders — spirits actually lift.' } },
      { type:'flee', label:'Ignore it and press on', stat:'Finesse', dc:8, timeCost:0,
        results:{ disaster:'The issue erupts anyway, right as you try to move on.', setback:"You push forward, but the tension doesn't go anywhere.", success:'You press on; the issue quietly fades for now.', triumph:'Somehow, momentum alone dissolves the tension.' } },
      { type:'special', label:'Trust to fortune', timeCost:0,
        results:{ default:'A shared moment of good fortune reminds everyone why they travel together.' } }
    ]
  },
  {
    id:'kael_slowing_down', type:'Drama', title:'Falling Behind',
    tags:{ location:['any'], requires:['Injured'], repeatableOnFlee:false },
    prompt:"Someone's injury has slowed the whole party's pace for a while now, and patience is finally wearing thin.",
    options:[
      { type:'check', label:'Address it directly, before it festers', stat:'Presence', dc:12, timeCost:1,
        results:{ disaster:'It comes out all wrong — feelings are hurt worse than before.', setback:'The air clears, a little, though it takes real effort.', success:'The party agrees to slow down and stop grumbling about it.', triumph:'The moment turns into real solidarity — no one is left behind.' } },
      { type:'check', label:'Quietly reorganize the marching order', stat:'Awareness', dc:11, timeCost:1,
        results:{ disaster:'The rearrangement backfires and draws more attention to it.', setback:'It helps a little, though it takes some doing.', success:'The new pace works, and the grumbling stops.', triumph:'The new arrangement works so well spirits actually lift.' } },
      { type:'flee', label:'Let it go for now', stat:'Finesse', dc:7, timeCost:0,
        results:{ disaster:'It boils over anyway, right in front of everyone.', setback:'It quiets down, but just for now.', success:'The moment passes without incident.', triumph:'It blows over almost immediately.' } },
      { type:'special', label:'Trust to fortune', timeCost:0,
        results:{ default:'A stroke of good fortune elsewhere puts everyone in a forgiving mood.' } }
    ]
  },
  {
    id:'collapsed_passage', type:'Travel', title:'The Collapsed Passage',
    tags:{ location:['ruins'], requires:[], repeatableOnFlee:false },
    prompt:"A tunnel through the ruins has partly caved in, choking the only way forward with rubble.",
    options:[
      { type:'check', label:'Clear the rubble by hand', stat:'Might', dc:12, timeCost:2, fatigueCost:1,
        results:{ disaster:'More stone comes down as you dig — a close call.', setback:'You clear it, exhausted and bruised.', success:'You dig a clean path through.', triumph:'You clear it in almost no time at all.' },
        conditionByTier:{ disaster:'Injured' } },
      { type:'check', label:'Find another way through the ruins', stat:'Awareness', dc:13, timeCost:1,
        results:{ disaster:'The alternate route loops back on itself, wasting real time.', setback:'You find a way through, though it winds and doubles back.', success:'You find a clean route around the collapse.', triumph:'You find a route so direct it barely costs a moment.' },
        extraTimeByTier:{ disaster:1, triumph:-1 } },
      { type:'flee', label:'Turn back and find another entrance', stat:'Finesse', dc:8, timeCost:1,
        results:{ disaster:"There is no other entrance — the passage must be cleared.", setback:'You find another way in, though it costs you.', success:'You find another entrance without much trouble.', triumph:'You find a hidden second entrance almost at once.' } },
      { type:'special', label:'Trust to fortune', timeCost:0,
        results:{ default:'A gap in the rubble, easily missed, turns out to be just wide enough. No time lost.' } }
    ]
  }
];

const MAX_TIME = 15;

export { STATS, PARTY_TEMPLATE, TALLY_VALUES, ADVENTURE_TRACK, EVENT_POOL, MAX_TIME };
