/* The Salt Road — content data.
   Pure content and tuning: stats, roster, icon art, event pool, sidequests, constants.
   No game logic and no DOM access. Adding an encounter means adding one entry to
   EVENT_POOL — nothing else needs to change. */

export const STATS = ["Might","Finesse","Awareness","Presence","Arcane"];
export const STAT_DESCRIPTIONS = {
  Might: "Raw physical power — melee combat, breaking things, hauling weight.",
  Finesse: "Speed and precision — ranged combat, escape, delicate work.",
  Awareness: "Perception and insight. This stat can also provide insight into how difficult a check is, before you commit to it.",
  Presence: "Charisma and social force — persuasion, negotiation, leadership.",
  Arcane: "Magical aptitude — spellcraft, warding, the uncanny."
};
export const COMBAT_STATS = ["Might","Finesse","Arcane"]; // Awareness/Presence are never used directly in combat

export const PARTY_TEMPLATE = [
  { id:'kael',  name:"Kael Ironhand",   epithet:"the Warrior", primary:"Might",     mods:{Might:4, Finesse:0, Awareness:-2, Presence:0, Arcane:-2},
    bio:"A career soldier who traded a losing war for coin and an open road." },
  { id:'rin',   name:"Rin Swiftfoot",   epithet:"the Scout",   primary:"Finesse",   mods:{Might:0, Finesse:4, Awareness:0,  Presence:2, Arcane:-2},
    bio:"Grew up thieving rooftops before the guild ever caught her." },
  { id:'doran', name:"Doran Vale",      epithet:"the Sage",    primary:"Awareness", mods:{Might:-2,Finesse:0, Awareness:4,  Presence:0, Arcane:2},
    bio:"Left a monastery library with more questions than he arrived with — mostly about the older, stranger books." },
  { id:'sable', name:"Sable Ashworth",  epithet:"the Envoy",   primary:"Presence",  mods:{Might:0, Finesse:0, Awareness:2,  Presence:4, Arcane:0},
    bio:"Talks her way out of anything — and occasionally into worse." },
  { id:'fenn',  name:"Fenn Brackwood",  epithet:"the Wanderer",primary:"Finesse",   mods:{Might:2, Finesse:2, Awareness:0,  Presence:-2, Arcane:-2},
    bio:"No one's quite sure which woods raised him. Least of all Fenn." },
];

// Presence, when set as a character's Primary Skill, is no longer a combat stat — but it
// grants +2 to any check that uses Presence, to compensate. Awareness used to get the same
// treatment, but that's removed for now since Awareness already has its own DC-sensing perk.
export function getEffectiveMod(character, stat){
  let mod = character.mods[stat];
  if(stat === character.primary && stat === 'Presence') mod += 2;
  return mod;
}

// A character's combat stat is their Primary Skill if it's combat-eligible (Might/Finesse/
// Arcane); otherwise (Awareness/Presence primary) they fall back to whichever of the three
// combat stats is highest for them, breaking ties by whichever gives the best odds against
// that specific fight's DCs.
export function pickCombatStat(character, dcByStat){
  if(COMBAT_STATS.includes(character.primary)) return character.primary;
  let best = -Infinity;
  COMBAT_STATS.forEach(s => { if(character.mods[s] > best) best = character.mods[s]; });
  const tied = COMBAT_STATS.filter(s => character.mods[s] === best);
  if(tied.length === 1) return tied[0];
  let bestStat = tied[0], bestMargin = -Infinity;
  tied.forEach(s => {
    const dc = dcByStat[s] !== undefined ? dcByStat[s] : 0;
    const margin = character.mods[s] - dc;
    if(margin > bestMargin){ bestMargin = margin; bestStat = s; }
  });
  return bestStat;
}

// Simple original line-art icons — one per character, no external assets.
// Compact single-color symbols shown on the left of each option button. Stat-based options
// (check, group) show their stat's icon; Flee, Combat, Special, and Sidequest always show
// their own default icon regardless of any stat involved.
export const OPTION_ICONS = {
  Might: `<svg viewBox="0 0 24 24"><circle cx="12" cy="4.2" r="2.1" fill="var(--stat-might)"/><path d="M12 6.3 L12 15 M9.4 8.2 L5.6 8.2 L5.6 3.4 M14.6 8.2 L18.4 8.2 L18.4 3.4 M12 15 L8.8 21 M12 15 L15.2 21" fill="none" stroke="var(--stat-might)" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="5.6" cy="8.2" r="1.3" fill="var(--stat-might)"/><circle cx="18.4" cy="8.2" r="1.3" fill="var(--stat-might)"/></svg>`,
  Finesse: `<svg viewBox="0 0 24 24"><path d="M7 2 Q16 12 7 22" fill="none" stroke="var(--stat-finesse)" stroke-width="2.2" stroke-linecap="round"/><line x1="7" y1="2" x2="7" y2="22" stroke="var(--stat-finesse)" stroke-width="1.1" opacity="0.55"/><line x1="2" y1="12" x2="22" y2="12" stroke="var(--stat-finesse)" stroke-width="2" stroke-linecap="round"/><path d="M22 12 L17 8.5 M22 12 L17 15.5" fill="none" stroke="var(--stat-finesse)" stroke-width="2" stroke-linecap="round"/></svg>`,
  Awareness: `<svg viewBox="0 0 24 24"><path d="M2 12 C5 6 19 6 22 12 C19 18 5 18 2 12 Z" fill="none" stroke="var(--stat-awareness)" stroke-width="1.8"/><circle cx="12" cy="12" r="3" fill="var(--stat-awareness)"/></svg>`,
  Presence: `<svg viewBox="0 0 24 24"><path d="M3 4 H21 V15 H11 L6 19 V15 H3 Z" fill="var(--stat-presence)"/></svg>`,
  Arcane: `<svg viewBox="0 0 24 24"><path d="M12 1 L14.2 9.8 L23 12 L14.2 14.2 L12 23 L9.8 14.2 L1 12 L9.8 9.8 Z" fill="var(--stat-arcane)"/></svg>`,
  flee: `<svg viewBox="0 0 24 24"><path d="M12 4 A8 8 0 1 0 19.3 9.2" fill="none" stroke="var(--rust)" stroke-width="2.4" stroke-linecap="round"/><polygon points="12,0.5 12,8 5.5,4.2" fill="var(--rust)"/></svg>`,
  combat: `<svg viewBox="0 0 24 24"><line x1="4" y1="4" x2="20" y2="20" stroke="var(--wipe)" stroke-width="2.4" stroke-linecap="round"/><line x1="20" y1="4" x2="4" y2="20" stroke="var(--wipe)" stroke-width="2.4" stroke-linecap="round"/><line x1="5.8" y1="4.6" x2="3.4" y2="6.8" stroke="var(--wipe)" stroke-width="1.8" stroke-linecap="round"/><line x1="18.2" y1="4.6" x2="20.6" y2="6.8" stroke="var(--wipe)" stroke-width="1.8" stroke-linecap="round"/><circle cx="4" cy="4" r="1.3" fill="var(--wipe)"/><circle cx="20" cy="4" r="1.3" fill="var(--wipe)"/></svg>`,
  special: `<svg viewBox="0 0 24 24"><polygon points="12,2 20,9 12,22 4,9" fill="var(--gold)"/></svg>`,
  sidequest: `<svg viewBox="0 0 24 24"><path d="M12 22 L12 13 M12 13 L5 5 M12 13 L19 5" fill="none" stroke="var(--moss)" stroke-width="2.2" stroke-linecap="round"/></svg>`,
  defer: `<svg viewBox="0 0 24 24"><path d="M2 12 C6 8 18 8 22 12" fill="none" stroke="var(--faint)" stroke-width="2" stroke-linecap="round"/><line x1="5.5" y1="15" x2="7.3" y2="12.8" stroke="var(--faint)" stroke-width="1.6" stroke-linecap="round"/><line x1="18.5" y1="15" x2="16.7" y2="12.8" stroke="var(--faint)" stroke-width="1.6" stroke-linecap="round"/></svg>`,
  sacrifice: `<svg viewBox="0 0 24 24"><rect x="3.5" y="3" width="10" height="18" rx="1" fill="none" stroke="var(--wipe)" stroke-width="1.8"/><circle cx="10.2" cy="12" r="1" fill="var(--wipe)"/><line x1="14" y1="12" x2="21" y2="12" stroke="var(--wipe)" stroke-width="2.2" stroke-linecap="round"/><path d="M17.5 8.5 L21 12 L17.5 15.5" fill="none" stroke="var(--wipe)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
};
export const HOURGLASS_MINI = `<svg viewBox="0 0 16 16"><polygon points="3,2 13,2 8,8" fill="var(--ink)"/><polygon points="3,14 13,14 8,8" fill="var(--ink)"/></svg>`;
export const FATIGUE_MINI = `<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="none" stroke="var(--ink)" stroke-width="1.8"/><path d="M5.6 8.3 Q7.3 10 9 8.3" fill="none" stroke="var(--ink)" stroke-width="1.6" stroke-linecap="round"/><path d="M11 8.3 Q12.7 10 14.4 8.3" fill="none" stroke="var(--ink)" stroke-width="1.6" stroke-linecap="round"/><path d="M6.5 13.6 Q10 15.4 13.5 13.6" fill="none" stroke="var(--ink)" stroke-width="1.6" stroke-linecap="round"/></svg>`;
export const INJURY_MINI = `<svg viewBox="0 0 20 20"><line x1="4" y1="4" x2="10" y2="16" stroke="var(--rust)" stroke-width="2.2" stroke-linecap="round"/><line x1="9" y1="3" x2="15" y2="15" stroke="var(--rust)" stroke-width="2.2" stroke-linecap="round"/><line x1="14" y1="4" x2="18" y2="13" stroke="var(--rust)" stroke-width="2" stroke-linecap="round"/></svg>`;
export const SICK_MINI = `<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="none" stroke="var(--moss)" stroke-width="1.8"/><path d="M5.5 7 L8 9.5 M8 7 L5.5 9.5" stroke="var(--moss)" stroke-width="1.5" stroke-linecap="round"/><path d="M12 7 L14.5 9.5 M14.5 7 L12 9.5" stroke="var(--moss)" stroke-width="1.5" stroke-linecap="round"/><path d="M6 14.5 Q10 12 14 14.5" fill="none" stroke="var(--moss)" stroke-width="1.6" stroke-linecap="round"/></svg>`;
export const CURED_MINI = `<svg viewBox="0 0 20 20"><path d="M4 10.5 L8 14.5 L16 5.5" fill="none" stroke="var(--gold)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
export const RESULT_KIND_ICON = { injured: INJURY_MINI, fatigued: FATIGUE_MINI, sick: SICK_MINI, cured: CURED_MINI };

export function optionIconKey(opt){
  if(opt.type === 'flee') return 'flee';
  if(opt.type === 'combat') return 'combat';
  if(opt.type === 'special') return 'special';
  if(opt.type === 'sidequest') return 'sidequest';
  if(opt.type === 'defer') return 'defer';
  if(opt.type === 'sacrifice') return 'sacrifice';
  return opt.stat; // 'check' and 'group' both key off their stat
}

export const SYMBOL_TITLES = {
  Might: 'Might — physical power',
  Finesse: 'Finesse — speed and precision',
  Awareness: 'Awareness — perception and insight',
  Presence: 'Presence — charisma and social force',
  Arcane: 'Arcane — magical aptitude',
  flee: 'Flee — abandons the encounter, never advances the road',
  combat: 'Combat — the whole party fights at once',
  special: "Special — spends the party's Luck",
  sidequest: 'Sidequest — starts an optional detour',
  defer: 'Let it go — risks Tension rising instead of addressing it',
  sacrifice: 'Exile — a guaranteed, permanent choice, no roll involved'
};

export const CHAR_COLORS = {
  kael:  '#b8442e',
  rin:   '#3f7d4a',
  doran: '#3a5f8a',
  sable: '#8a3f6e',
  fenn:  '#1f8a7a'
};
export const CHAR_TINTS = {
  kael:  '#f6dcd3',
  rin:   '#dcefda',
  doran: '#dbe7f4',
  sable: '#f1dcec',
  fenn:  '#d5f1eb'
};

export const AVATAR_ICONS = {
  kael: `<svg viewBox="0 0 48 48"><line x1="24" y1="6" x2="24" y2="30" stroke="var(--char-color)" stroke-width="3" stroke-linecap="round"/><line x1="15" y1="13" x2="33" y2="13" stroke="var(--char-color)" stroke-width="3" stroke-linecap="round"/><line x1="24" y1="30" x2="24" y2="40" stroke="var(--char-color)" stroke-width="4" stroke-linecap="round"/><circle cx="24" cy="42" r="2.3" fill="var(--char-color)"/></svg>`,
  rin: `<svg viewBox="0 0 48 48"><path d="M15 8 Q31 24 15 40" fill="none" stroke="var(--char-color)" stroke-width="3" stroke-linecap="round"/><line x1="9" y1="24" x2="35" y2="24" stroke="var(--char-color)" stroke-width="2.5" stroke-linecap="round"/><path d="M35 24 L29 19.5 M35 24 L29 28.5" stroke="var(--char-color)" stroke-width="2.5" stroke-linecap="round" fill="none"/></svg>`,
  doran: `<svg viewBox="0 0 48 48"><path d="M24 14 C18 9 10 9 8 11 V37 C10 35 18 35 24 40 C30 35 38 35 40 37 V11 C38 9 30 9 24 14 Z" fill="none" stroke="var(--char-color)" stroke-width="2.4" stroke-linejoin="round"/><line x1="24" y1="14" x2="24" y2="40" stroke="var(--char-color)" stroke-width="1.8"/></svg>`,
  sable: `<svg viewBox="0 0 48 48"><path d="M37 7 C21 13 12 26 10 41 C25 38 37 30 41 13 Z" fill="none" stroke="var(--char-color)" stroke-width="2.4" stroke-linejoin="round"/><line x1="10" y1="41" x2="21" y2="30" stroke="var(--char-color)" stroke-width="2" stroke-linecap="round"/></svg>`,
  fenn: `<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="15.5" fill="none" stroke="var(--char-color)" stroke-width="2.4"/><polygon points="24,11 28,24 24,37 20,24" fill="var(--char-color)"/><circle cx="24" cy="24" r="2" fill="var(--bg-alt)"/></svg>`
};

export const TALLY_VALUES = { disaster:-2, setback:-1, success:1, triumph:2 };

// The stretch of road the party travels — one location tag per stop.
export const ADVENTURE_TRACK = ['forest','forest','road','forest','ruins','river','road','forest','ruins','river','forest','road','ruins','river','forest'];

export const EVENT_POOL = [
  {
    id:'fallen_tree', type:'Travel', title:'The Fallen Tree',
    tags:{ location:['forest'], requires:[], repeatableOnFlee:false },
    prompt:"A great oak lies shattered across the trail, its roots torn from the hillside like exposed nerves. Rain has slicked the bark black, and every branch looks ready to snap underfoot.",
    options:[
      { type:'check', label:'Force a path through the branches', stat:'Might', dc:12, timeCost:3, fatigueCost:2,
        results:{ disaster:'{name} throws their full weight against the trunk — it lurches, pins a leg beneath a limb, and lets go only after a hard fight to break free.', setback:'{name} claws a path through, arms raked bloody by broken branches.', success:'{name} breaks a clean path through the wreckage, and the party files through behind.', triumph:'{name} heaves the entire trunk aside in one motion. Even {ally} stops to stare.' },
        conditionByTier:{ disaster:'Injured' } },
      { type:'check', label:'Scout an alternate route', stat:'Awareness', dc:14, timeCost:1,
        results:{ disaster:'{name} leads the party in a wide, frustrating circle before admitting the mistake.', setback:'{name} finds a way around, though it winds far longer than hoped.', success:'{name} spots a game trail curling neatly around the wreck.', triumph:'{name} finds a shortcut so clean it saves real time — {ally} claps them on the back.' },
        extraTimeByTier:{ disaster:1, triumph:-1 } },
      { type:'flee', label:'Turn back and find another way entirely', stat:'Finesse', dc:10, timeCost:1,
        results:{ disaster:"There is no other way — {name} returns to find the tree waiting, unmoved.", setback:'{name} backtracks, though the detour costs more ground than hoped.', success:'{name} backtracks smoothly and picks up another trail without issue.', triumph:'{name} finds a hidden path almost at once, as if the woods wanted it found.' },
        extraTimeByTier:{ setback:1, triumph:-1 } },
      { type:'special', label:'Trust to fortune', timeCost:0,
        results:{ default:'Luck favors the party — an obvious gap in the wreckage opens up that no one had noticed before. No time lost.' } }
    ]
  },
  {
    id:'steep_switchbacks', type:'Travel', title:'Steep Switchbacks',
    tags:{ location:['forest'], requires:[], repeatableOnFlee:false },
    prompt:"The trail pitches sharply upward, switchbacking along a slope of loose scree that shifts with every step. One wrong footing here could send someone tumbling.",
    options:[
      { type:'check', label:'Push straight up the slope', stat:'Might', dc:13, timeCost:1, fatigueCost:3,
        results:{ disaster:'The scree gives way beneath {name}, who slides hard before catching themselves.', setback:'{name} muscles up the slope, legs burning, lungs raw.', success:'{name} climbs the grade at a steady, punishing pace.', triumph:'{name} practically runs up the slope, and the rest of the party has to jog to keep up.' },
        conditionByTier:{ disaster:'Injured' } },
      { type:'check', label:'Pick the gentler switchback line', stat:'Awareness', dc:[10,14], timeCost:3,
        results:{ disaster:'The "gentler" line {name} chose dead-ends in a rockfall, costing the party dearly.', setback:'The longer line pays off slowly, but {name} gets everyone up without incident.', success:'{name} finds a comfortable, manageable grade that spares everyone\'s knees.', triumph:'{name} finds a line so smooth it barely feels like a climb at all.' },
        extraTimeByTier:{ disaster:1, triumph:-1 } },
      { type:'flee', label:'Look for a way around the slope entirely', stat:'Finesse', dc:9, timeCost:1,
        results:{ disaster:"There is no way around — {name} returns to find the slope still waiting.", setback:'{name} finds a detour, though it eats into the party\'s lead.', success:'{name} routes the party around the slope cleanly.', triumph:'{name} finds a flat bypass almost immediately, grinning the whole way.' } },
      { type:'special', label:'Trust to fortune', timeCost:0,
        results:{ default:'A recent rockslide left a natural, gentle ramp none of you had spotted. No time lost.' } }
    ]
  },
  {
    id:'goblin_ambush', type:'Combat', title:'Goblin Ambush',
    tags:{ location:['forest','road'], requires:[], repeatableOnFlee:false },
    prompt:"Three goblins burst from the brush in a screech of rusted blades, eyes bright with the promise of easy plunder.",
    options:[
      { type:'combat', label:'Stand and fight', timeCost:3,
        dcByStat:{ Might:12, Finesse:15, Arcane:17 },
        tallyTable:[
          { max:-3, result:'The goblins are driven off, but at a terrible cost — {victim} goes down and does not rise again.', conditionGranted:'Dead' },
          { min:-2, max:0, result:'The goblins scatter into the brush, but not before {victim} takes a blade meant for someone else.', conditionGranted:'Injured', tensionDelta:1 },
          { min:1, max:3, result:'Steel rings on steel until the goblins break and run. {mvp} presses the advantage, though the scuffle eats into the party\'s time.', extraTimeCost:1 },
          { min:4, result:'{mvp} routs the goblins almost single-handedly. One drops a strange medallion in its flight — worth a closer look.', grantsLuck:true }
        ] },
      { type:'check', label:'Try to talk them down', stat:'Presence', dc:17, timeCost:1,
        results:{ disaster:'They laugh at {name}\'s attempt to reason and attack anyway — the whole party barely scrambles clear.', setback:'They back off at {name}\'s words, but demand a "toll" first.', success:'Surprised by {name}\'s nerve, they slink back into the brush.', triumph:'{name} talks them down so thoroughly that one tosses over a coin pouch on the way out.' },
        conditionByTier:{ disaster:'Injured' }, grantsLuck:true },
      { type:'flee', label:'Retreat the way you came', stat:'Finesse', dc:11, timeCost:1,
        results:{ disaster:"They're faster than {name} expected — the party is forced to fight after all.", setback:'{name} leads the retreat, though supplies scatter in the scramble.', success:'{name} slips the whole party away into the trees.', triumph:'{name} has everyone gone before the goblins even register it.' } },
      { type:'special', label:'Trust to fortune', timeCost:0,
        results:{ default:"Something about the party's bearing gives the goblins pause. They let everyone pass unchallenged." } }
    ]
  },
  {
    id:'wayside_shrine', type:'Exploration', title:'A Wayside Shrine',
    tags:{ location:['forest','ruins'], requires:[], repeatableOnFlee:true },
    prompt:"Just off the path, a crumbling shrine catches the light — old stone half-swallowed by moss, and something glinting within.",
    options:[
      { type:'check', label:'Investigate the shrine', stat:'Awareness', dc:15, timeCost:1,
        results:{ disaster:'A trap springs as {name} reaches in — nothing lethal, but it hurts plenty.', setback:'{name} finds a little of value, though it costs time picking through the rubble.', success:'{name} turns up a small cache of useful supplies.', triumph:'{name} finds something rare and valuable half-buried in the moss — a stroke of real fortune.' },
        conditionByTier:{ disaster:'Injured' }, grantsLuck:true },
      { type:'check', label:'Pay respects and move on', stat:'Presence', dc:12, timeCost:1,
        results:{ disaster:'Something about the ritual unsettles {name}, and the feeling spreads through the party.', setback:'It takes {name} longer than expected to do it properly.', success:'{name}\'s quiet moment of respect steadies everyone.', triumph:'The moment leaves the whole party feeling unusually fortunate, thanks to {name}.' } },
      { type:'check', label:'Read the old wards still clinging to the stone', stat:'Arcane', dc:14, timeCost:1,
        results:{ disaster:'The wards discharge all at once — {name} takes the backlash badly.', setback:'{name} unravels the warding, but it leaves a lingering headache.', success:'{name} reads the wards cleanly and finds what they were guarding.', triumph:"{name} not only reads the wards but learns something of whoever raised this place — genuinely valuable knowledge." },
        sickByTier:{ disaster:2, setback:1 }, grantsLuck:true },
      { type:'flee', label:"Ignore it — you don't have time", stat:'Finesse', dc:8, timeCost:0,
        results:{ disaster:'Curiosity gets the better of {name} anyway, and the party is drawn in regardless.', setback:'The party moves on, though {name} lingers a beat too long looking back.', success:'{name} leaves it behind without a second thought.', triumph:'{name} has everyone back on the path before anyone even notices the detour.' } },
      { type:'special', label:'Trust to fortune', timeCost:0,
        results:{ default:"Good fortune reveals the shrine's secret compartment instantly — a boon, no risk at all." } }
    ]
  },
  {
    id:'suspicious_guards', type:'Civilization', title:'The Checkpoint',
    tags:{ location:['road'], requires:[], repeatableOnFlee:false },
    prompt:"Two town guards block the road, spears crossed, sizing up the party with open suspicion.",
    options:[
      { type:'check', label:'Explain yourselves calmly', stat:'Presence', dc:14, timeCost:1, cureFatigueOnTier:'triumph',
        results:{ disaster:"{name}'s story falls apart under questioning — the guards hold the party up for a while.", setback:"The guards wave the party through at {name}'s word, but confiscate some supplies first.", success:"Satisfied by {name}'s explanation, the guards let everyone pass.", triumph:"{name} wins the guards over completely — inspired, actually. It's exactly the lift someone needed." },
        extraTimeByTier:{ disaster:1 }, tensionByTier:{ disaster:1 } },
      { type:'check', label:'Find a way around the post', stat:'Awareness', dc:16, timeCost:1,
        results:{ disaster:'{name} is spotted trying to slip past — now the guards are genuinely suspicious.', setback:'{name} finds a gap, though it takes real effort to navigate.', success:'{name} slips the party past along a side path, unnoticed.', triumph:'{name} finds a route so clean it barely costs a moment.' },
        extraTimeByTier:{ disaster:1, triumph:-1 } },
      { type:'flee', label:'Turn back before they notice', stat:'Finesse', dc:10, timeCost:1,
        results:{ disaster:'They call out and give chase — {name} has no choice but to deal with them.', setback:'{name} leads the retreat, though the guards will remember these faces.', success:'{name} gets everyone away before the guards look up.', triumph:'{name} has the party gone before the guards register movement.' } },
      { type:'special', label:'Trust to fortune', timeCost:0,
        results:{ default:'One guard recognizes a token the party carries and waves them through without a word.' } }
    ]
  },
  {
    id:'rivers_edge', type:'Travel', title:"The River's Edge",
    tags:{ location:['river'], requires:[], repeatableOnFlee:false },
    prompt:"A wide river cuts across the trail. What's left of the bridge is little more than rotten planks and fraying rope.",
    options:[
      { type:'check', label:'Cross the old bridge carefully', stat:'Finesse', dc:14, timeCost:1,
        results:{ disaster:'A plank gives way under {name} — a bad fall, but they hang on.', setback:'{name} makes it across, rattled and bruised.', success:'{name} leads the party across without incident.', triumph:'{name} crosses so surely it barely costs a breath.' },
        conditionByTier:{ disaster:'Injured' } },
      { type:'check', label:'Find a shallow ford upstream', stat:'Awareness', dc:[13,17], timeCost:3,
        results:{ disaster:'The current upstream is stronger than {name} judged — a rough crossing for everyone.', setback:'{name} finds a ford, though it takes real time to reach.', success:'{name} finds a safe, shallow crossing for the party.', triumph:'{name} spots a perfect crossing point almost immediately.' },
        extraTimeByTier:{ triumph:-1 } },
      { type:'flee', label:'Turn back and camp for the night instead', stat:'Finesse', dc:10, timeCost:3,
        results:{ disaster:"There's nowhere safe to camp — {name} is forced to lead the crossing anyway.", setback:'{name} finds a spot to camp, though it costs more time than hoped.', success:"The party makes it through the night under {name}'s watch and presses on.", triumph:"A quiet, restful night — thanks to {name} — costs less time than expected." } },
      { type:'special', label:'Trust to fortune', timeCost:0,
        results:{ default:'A local raft, tied up and forgotten, carries the party across in moments.' } }
    ]
  },
  {
    id:'the_argument', type:'Drama', title:'Words Boil Over',
    tags:{ location:['any'], requires:[], repeatableOnFlee:false },
    prompt:"Exhaustion has frayed tempers. An old grievance between {partyA} and {partyB} resurfaces, and the party's unity hangs by a thread.",
    options:[
      { type:'check', label:'Talk it out honestly', stat:'Presence', dc:13, timeCost:1,
        results:{ disaster:"{name}'s attempt to mediate only reopens old wounds between {partyA} and {partyB}.", setback:'{name} gets tempers to cool, though resentment lingers under the surface.', success:'{name} smooths things over between {partyA} and {partyB}.', triumph:'{name}\'s words actually bring {partyA} and {partyB} closer than before.' },
        tensionByTier:{ disaster:1 } },
      { type:'check', label:'Give everyone space to cool off', stat:'Awareness', dc:13, timeCost:3,
        results:{ disaster:"The silence {name} calls for festers into something worse.", setback:'The quiet helps, a little, though it costs time {name} would rather have spent moving.', success:'{name}\'s instinct is right — everyone calms down on their own.', triumph:"The break {name} calls for does wonders — spirits actually lift." },
        tensionByTier:{ disaster:1 } },
      { type:'defer', label:'Ignore it and press on', timeCost:0 },
      { type:'special', label:'Trust to fortune', timeCost:0,
        results:{ default:'A shared moment of good fortune reminds everyone why they travel together.' } }
    ]
  },
  {
    id:'doubts_creep_in', type:'Drama', title:'Doubts Creep In',
    tags:{ location:['any'], requires:[], repeatableOnFlee:false },
    prompt:"Rain-soaked and footsore, {partyA} finally says what everyone's been thinking: \"Are we even sure this is worth it?\" {partyB} doesn't have a good answer ready.",
    options:[
      { type:'check', label:'Make the case for pressing on', stat:'Presence', dc:13, timeCost:1,
        results:{ disaster:"{name}'s pep talk falls painfully flat, and {partyA}'s doubt spreads instead of lifting.", setback:'{name} gets a few nods, though the doubt doesn\'t fully lift.', success:'{name} reminds everyone why they started — good enough to keep boots moving.', triumph:'{name}\'s words land so well the whole party finds their nerve again, doubt gone.' },
        tensionByTier:{ disaster:1 } },
      { type:'check', label:'Admit the doubt is fair, and sit with it', stat:'Awareness', dc:12, timeCost:3,
        results:{ disaster:"Naming the doubt out loud only makes it heavier — {name}'s honesty backfires.", setback:'{name} lets the moment breathe, though it costs real time.', success:"{name}'s honesty clears the air more than false confidence ever could.", triumph:'{name} turns the doubt into a real conversation — the party is more united for having had it.' },
        tensionByTier:{ disaster:1 } },
      { type:'defer', label:'Change the subject and keep walking', timeCost:0 },
      { type:'special', label:'Trust to fortune', timeCost:0,
        results:{ default:'Something on the road ahead answers the question better than any words could.' } }
    ]
  },
  {
    id:'kael_slowing_down', type:'Drama', title:'Falling Behind',
    tags:{ location:['any'], requires:['Injured'], repeatableOnFlee:false },
    prompt:"{injured}'s injury has slowed the whole party's pace for a while now, and patience is finally wearing thin.",
    options:[
      { type:'check', label:'Address it directly, before it festers', stat:'Presence', dc:14, timeCost:1,
        results:{ disaster:"{name} means well, but it comes out all wrong — {injured} takes it harder than intended.", setback:'{name} clears the air, a little, though it takes real effort.', success:'{name} gets the party to agree: slow down, and stop grumbling about it.', triumph:'{name} turns the moment into real solidarity — no one gets left behind, especially not {injured}.' } },
      { type:'check', label:'Quietly reorganize the marching order', stat:'Awareness', dc:13, timeCost:1,
        results:{ disaster:"{name}'s rearrangement backfires and draws more attention to {injured} than before.", setback:'It helps a little, though {name} has to work for it.', success:"{name}'s new pace works, and the grumbling stops.", triumph:"{name}'s new arrangement works so well spirits actually lift." } },
      { type:'defer', label:'Let it go for now', timeCost:0 },
      { type:'special', label:'Trust to fortune', timeCost:0,
        results:{ default:'A stroke of good fortune elsewhere puts everyone in a forgiving mood.' } }
    ]
  },
  {
    id:'collapsed_passage', type:'Travel', title:'The Collapsed Passage',
    tags:{ location:['ruins'], requires:[], repeatableOnFlee:false },
    prompt:"A tunnel through the ruins has partly caved in, choking the only way forward with rubble.",
    options:[
      { type:'check', label:'Clear the rubble by hand', stat:'Might', dc:14, timeCost:3, fatigueCost:2,
        results:{ disaster:'More stone comes down as {name} digs — a close call, but they scramble clear.', setback:'{name} clears it, exhausted and bruised.', success:'{name} digs a clean path through.', triumph:'{name} clears it in almost no time at all.' },
        conditionByTier:{ disaster:'Injured' } },
      { type:'check', label:'Find another way through the ruins', stat:'Awareness', dc:15, timeCost:1,
        results:{ disaster:"{name}'s alternate route loops back on itself, wasting real time.", setback:'{name} finds a way through, though it winds and doubles back.', success:'{name} finds a clean route around the collapse.', triumph:'{name} finds a route so direct it barely costs a moment.' },
        extraTimeByTier:{ disaster:1, triumph:-1 } },
      { type:'flee', label:'Turn back and find another entrance', stat:'Finesse', dc:10, timeCost:1,
        results:{ disaster:"There is no other entrance — {name} returns to find the passage still blocked.", setback:'{name} finds another way in, though it costs time.', success:'{name} finds another entrance without much trouble.', triumph:'{name} finds a hidden second entrance almost at once.' } },
      { type:'special', label:'Trust to fortune', timeCost:0,
        results:{ default:'A gap in the rubble, easily missed, turns out to be just wide enough. No time lost.' } }
    ]
  },
  {
    id:'hollow_cairn_lure', type:'Exploration', title:'The Hollow Cairn',
    tags:{ location:['forest','ruins'], requires:[], repeatableOnFlee:false },
    prompt:"Half-buried in moss, a cairn marks something older than the road. It isn't on the way — but it pulls at {partyA} all the same.",
    options:[
      { type:'sidequest', label:'Investigate the cairn', timeCost:0, startsSidequest:'hollow_cairn' },
      { type:'flee', label:'Leave it be and keep moving', stat:'Awareness', dc:11, timeCost:0,
        results:{ disaster:'Curiosity wins out after all — {name} finds the whole party drawn in regardless.', setback:'{name} manages to tear everyone away, though it nags at them.', success:'{name} walks the party on without a second thought.', triumph:'{name} barely registers it was there at all.' },
        entersSidequestOnDisaster:'hollow_cairn' },
      { type:'special', label:'Trust to fortune', timeCost:0,
        results:{ default:'Instinct warns the party off cleanly, and something tells everyone that was the right call. No time lost.' } }
    ]
  },
  {
    id:'brutal_thunderstorm', type:'Travel', title:'Brutal Thunderstorm',
    tags:{ location:['any'], requires:[], repeatableOnFlee:false },
    prompt:'{partyA} feels a drop of rain on their nose and calls out to the group: "I think it\'s going to rain!" Several minutes later, a drenched {partyB} looks to {partyA} and screams through the crashing rain and thunder: "I think you\'re right!"',
    options:[
      { type:'group', label:'Push through the storm', stat:'Might', dc:15, timeCost:1, fatigueCost:2,
        tallyTable:[
          { max:-3, result:'{lead} hears a "SNAP!" They don\'t remember their foot facing that direction yesterday.', targetLead:{ condition:'Injured', extraFatigue:2 } },
          { min:-2, max:0, result:'Good thing {highest} was there to pick up the slack for everyone else — too bad they\'re paying for it the next day.', targetHighest:{ condition:'Injured' } },
          { min:1, max:3, result:'Everyone is wet. Everyone is cold. But everyone is also a step closer to finishing their journey. Good job.' },
          { min:4, result:'{highest} literally picks up {lowest} and carries them like a football. This storm didn\'t slow the party down one bit — a dazzling Triumph!', extraTimeCost:-1, grantsLuck:true }
        ] },
      { type:'check', label:'Set up camp and wait out the storm', stat:'Awareness', dc:12, timeCost:3,
        results:{
          disaster:'{name} finds a good-sized leaning rock for everyone to hunker beneath. Everyone stays dry — until the rain-loosened earth gives way and the rock comes down on {victim}.',
          setback:"{name} assembles a shelter out of the party's materials. It's not great, though {name} would never admit that — they spend the night constantly patching it while exposed to the elements.",
          success:'Rain? On this party? Not while {name} has anything to say about it. It\'s wet, but everyone makes it through unscathed.',
          triumph:'"I swear that was a better night\'s sleep than the bed back in town," says {ally}. "And was that a mint under my pillow?! Where did the pillow even come from?!" {name} just winks.'
        },
        conditionByTier:{ disaster:'Injured' },
        fatigueByTier:{ disaster:2, setback:1 },
        sickByTier:{ setback:1 },
        targetByTier:{ disaster:'random' },
        grantsLuck:true },
      { type:'flee', label:"Town isn't that far. Turn back and set out another day.", timeCost:3,
        results:{ default:'The party dries off by a nice fireplace, sipping brandy and eating scones. "Adventure can wait!" says {partyA}. "These blueberry scones cannot."' } },
      { type:'special', label:'Trust to fortune', timeCost:0,
        results:{ default:'"I lost my father to rain like this. And he lost his father to rain like this. Get in my caravan, strangers — I shall not let rain like this take anyone else," says the odd, strangely charming stranger. {partyA} finds a loose cookie under their seat, and it\'s not half bad. The party rides along while the stranger, through sheer will, carries them further toward their goal.' } }
    ]
  },
  {
    id:'wildfire_on_the_wind', type:'Travel', title:'Wildfire on the Wind',
    tags:{ location:['any'], requires:[], repeatableOnFlee:false },
    prompt:'{partyA} catches it first — a sharp, wrong smell riding the breeze. By the time {partyB} spots the orange glow through the treeline, it\'s already close. "That\'s not a campfire," {partyB} says.',
    options:[
      { type:'group', label:'Push through before it closes the trail', stat:'Might', dc:15, timeCost:1, fatigueCost:2,
        tallyTable:[
          { max:-3, result:'{lead} goes down hard in the smoke, and for one very long moment nobody can find them. They come up coughing, and considerably worse for it.', targetLead:{ condition:'Injured', extraFatigue:2 } },
          { min:-2, max:0, result:'{highest} hauls the others clear of the worst of it, and pays for it in blistered hands and scorched lungs.', targetHighest:{ condition:'Injured' } },
          { min:1, max:3, result:'Everyone is soot-black. Everyone is coughing. But everyone is also clear of the fire line. Good job.' },
          { min:4, result:'{highest} finds a gap in the flame that has no business existing and hauls {lowest} through it bodily. The fire never even got close — a dazzling Triumph!', extraTimeCost:-1, grantsLuck:true }
        ] },
      { type:'check', label:'Read the smoke and find a way around', stat:'Awareness', dc:12, timeCost:3,
        results:{
          disaster:"{name} spots what looks like a clear route through the smoke and waves the party after them. It isn't clear. It closes in on {victim} before anyone can call out.",
          setback:"{name} feels a way through smoke thick enough to chew. It works, though {name} would never admit how close that was.",
          success:"Smoke or not, {name} isn't losing this trail. It's rough going, but everyone comes out the other side clear-eyed and upright.",
          triumph:'"I owe you my eyebrows," says {ally}, checking that they\'re both still there. {name} just shrugs.'
        },
        conditionByTier:{ disaster:'Injured' },
        fatigueByTier:{ disaster:2, setback:1 },
        sickByTier:{ setback:1 },
        targetByTier:{ disaster:'random' },
        grantsLuck:true },
      { type:'flee', label:'Turn back before the smoke gets any thicker', timeCost:3,
        results:{ default:'The party doubles back long before the fire gets close. "I\'ve smelled worse at a bad tavern," {partyA} says, not entirely convincingly, from a very safe distance.' } },
      { type:'special', label:'Trust to fortune', timeCost:0,
        results:{ default:'The wind shifts at exactly the right moment, and the fire turns to chase something else entirely. No time lost.' } }
    ]
  },
  {
    id:'merchants_cart', type:'Civilization', title:"The Merchant's Overturned Cart",
    tags:{ location:['road'], requires:[], repeatableOnFlee:false },
    prompt:"A merchant's cart lies tipped in a ditch, wheel shattered, goods spilled across the mud. {partyA} spots him first — waving frantically for help, or maybe just company.",
    options:[
      { type:'check', label:'Help him haul the cart upright', stat:'Might', dc:13, timeCost:1, fatigueCost:2, grantsLuck:true,
        results:{ disaster:'{name} throws their back into it and gets nothing but a face full of mud for the trouble.', setback:'{name} rights the cart, though it costs more effort than expected.', success:"{name} gets the cart upright, and the merchant's thanks are genuine.", triumph:"{name} rights the cart in one heave. The merchant, stunned, presses a small pouch of coin into their hands." } },
      { type:'check', label:"Assess whether he's worth trusting", stat:'Awareness', dc:12, timeCost:1,
        results:{ disaster:'{name}\'s guard drops a moment too long — the "merchant" and his cart are gone when {name} looks back, along with a stray coin purse.', setback:"{name} can't quite tell if he's legitimate, and the hesitation costs the party time.", success:"{name} sizes him up quickly — genuine, just unlucky. The party helps with a clear conscience.", triumph:'{name} spots the scam a mile off and calls it out before he can even start his pitch. He slinks off, dropping a few coins in his haste.' },
        extraTimeByTier:{ setback:1 } },
      { type:'flee', label:"Keep walking — not your problem", timeCost:0,
        results:{ default:'{partyB} glances back once, then keeps walking. "Someone else will help him," they mutter, not quite believing it.' } },
      { type:'special', label:'Trust to fortune', timeCost:0,
        results:{ default:'The merchant waves off any need for help — he had it handled after all — and tosses a spare apple to the party as thanks for stopping.' } }
    ]
  },
  {
    id:'flooded_crossing', type:'Travel', title:'The Flooded Crossing',
    tags:{ location:['river'], requires:[], repeatableOnFlee:false },
    prompt:"Days of rain have swollen the ford to a churning brown flood. {partyA} eyes the current. {partyB} eyes {partyA}. Someone has to go first.",
    options:[
      { type:'group', label:'Wade across together, roped in a line', stat:'Finesse', dc:15, timeCost:1, fatigueCost:2,
        tallyTable:[
          { max:-3, result:'{lead} loses their footing and the current takes them under for one horrible second before the rope finally goes taut.', targetLead:{ condition:'Injured', extraFatigue:2 } },
          { min:-2, max:0, result:"{highest} plants their feet and holds the line while everyone else stumbles across — the strain doesn't come cheap.", targetHighest:{ condition:'Injured' } },
          { min:1, max:3, result:'Cold, soaked, and swearing, the party makes it across in one piece.' },
          { min:4, result:'{highest} hauls {lowest} bodily through the worst of it. The party crosses faster than anyone expected — a genuine Triumph.', extraTimeCost:-1, grantsLuck:true }
        ] },
      { type:'check', label:'Search upstream for a calmer crossing', stat:'Awareness', dc:14, timeCost:3,
        results:{ disaster:'The "calmer" spot {name} finds turns out to hide a sinkhole beneath the mud.', setback:'{name} finds a gentler crossing, though it takes real time to reach.', success:'{name} finds a safe, shallow stretch upstream.', triumph:'{name} finds a perfect crossing almost immediately — barely a detour at all.' },
        conditionByTier:{ disaster:'Injured' }, extraTimeByTier:{ triumph:-1 } },
      { type:'flee', label:'Make camp and wait for the water to drop', timeCost:3,
        results:{ default:'The party waits it out. By morning the flood has dropped enough to cross safely — though {partyB} spends the whole night complaining about the mud.' } },
      { type:'special', label:'Trust to fortune', timeCost:0,
        results:{ default:'A local ferryman, waiting out the flood himself, offers passage across for a story well told. The crossing costs nothing but a few minutes and a good tale.' } }
    ]
  },
  {
    id:'wolves_ridge', type:'Combat', title:'Wolves on the Ridge',
    tags:{ location:['forest'], requires:[], repeatableOnFlee:false },
    prompt:"A ridge trail narrows between rock walls — perfect ambush ground. Lean shapes pace the stones above: a wolf pack, hungry and utterly unafraid.",
    options:[
      { type:'combat', label:'Stand your ground', timeCost:3,
        dcByStat:{ Might:12, Finesse:15, Arcane:17 },
        tallyTable:[
          { max:-3, result:'{victim} goes down beneath the pack before the wolves finally break off, gorged and unbothered.', conditionGranted:'Dead' },
          { min:-2, max:0, result:'The pack scatters, but not before {victim} takes a bite meant for someone else.', conditionGranted:'Injured', tensionDelta:1 },
          { min:1, max:3, result:'{mvp} keeps the pack at bay long enough for it to lose interest, though the fight costs time.', extraTimeCost:1 },
          { min:4, result:'{mvp} drives the whole pack off the ridge without a scratch. A lone pup left behind almost seems friendly.', grantsLuck:true }
        ] },
      { type:'check', label:'Use the terrain to scatter them', stat:'Awareness', dc:16, timeCost:1,
        results:{ disaster:"The wolves read {name}'s plan before {name} does — the pack closes in from both sides.", setback:'{name} splits the pack, though a couple slip through anyway.', success:'{name} funnels the wolves through a gap in the rocks, away from the group.', triumph:'{name} reads the terrain perfectly — the wolves scatter before a single blade is drawn.' },
        conditionByTier:{ disaster:'Injured' } },
      { type:'flee', label:'Retreat back down the ridge', stat:'Finesse', dc:12, timeCost:1,
        results:{ disaster:"The pack is faster on the rocks than {name} expected — the party is forced to fight after all.", setback:'{name} leads the retreat, though the pack harries the rear the whole way down.', success:'{name} gets the party clear of the ridge before the wolves commit to the chase.', triumph:'{name} has the party gone before the wolves even fully register the retreat.' } },
      { type:'special', label:'Trust to fortune', timeCost:0,
        results:{ default:"Something else on the ridge draws the pack's attention first. They melt back into the rocks without a second glance at the party." } }
    ]
  },
  {
    id:'peddlers_wine', type:'Civilization', title:"The Peddler's Wine",
    tags:{ location:['road'], requires:[], repeatableOnFlee:false },
    prompt:"A peddler's stall sags under the weight of dubious wares — dented tins, chipped charms, and a cask of wine he swears is \"aged to perfection.\" {partyA} looks tempted.",
    options:[
      { type:'check', label:'Inspect the wine before anyone drinks it', stat:'Awareness', dc:13, timeCost:1, grantsLuck:true,
        results:{ disaster:'{name} gives it the all-clear — and immediately regrets it as {victim} takes a celebratory swig.', setback:"{name} can't quite tell if it's safe, so nobody risks it — mildly annoying, but no harm done.", success:'{name} spots the telltale cloudiness immediately and steers the party well clear.', triumph:'{name} not only spots the bad wine but talks the peddler down on a genuinely decent charm instead.' },
        sickByTier:{ disaster:1 }, targetByTier:{ disaster:'random' } },
      { type:'check', label:'Haggle him down on principle', stat:'Presence', dc:12, timeCost:1,
        results:{ disaster:'The peddler out-haggles {name} completely and somehow talks them into buying two tins of something unidentifiable.', setback:'{name} gets a small discount, mostly out of the peddler wanting them gone.', success:'{name} talks him down to a fair price on a genuinely useful item.', triumph:'{name} charms him so thoroughly he throws in a "bonus" item for free — of dubious value, but free.' } },
      { type:'flee', label:'Walk past without a glance', timeCost:0,
        results:{ default:'{partyB} doesn\'t even slow down. "That wine has never seen a barrel a day in its life," they mutter.' } },
      { type:'special', label:'Trust to fortune', timeCost:0,
        results:{ default:'The peddler, in a rare moment of honesty, waves the party off the wine himself and offers a genuinely fair trade instead.' } }
    ]
  },
  {
    id:'sick_of_it', type:'Drama', title:'Wearing Thin',
    tags:{ location:['any'], requires:['Sick'], repeatableOnFlee:false },
    prompt:"{sick} hasn't been able to keep food down or set a steady pace since falling ill, and the constant stopping has worn everyone's patience thin — {partyA} especially.",
    options:[
      { type:'check', label:'Address it head-on', stat:'Presence', dc:14, timeCost:1,
        results:{ disaster:'{name} means well, but it lands wrong — {sick} hears it as one more person fed up with them.', setback:'{name} smooths it over, a little, though it takes real effort.', success:"{name} gets everyone to ease up — {sick} isn't choosing to be sick, after all.", triumph:'{name} turns the moment into real care for {sick} — the whole party rallies around them instead.' } },
      { type:'check', label:"Quietly reorganize the day's pace", stat:'Awareness', dc:13, timeCost:1,
        results:{ disaster:"{name}'s adjustment draws more attention to {sick} than intended.", setback:'It helps a little, though {name} has to work for it.', success:"{name}'s new pace takes the pressure off without anyone having to say why.", triumph:"{name}'s arrangement works so well spirits actually lift." } },
      { type:'defer', label:'Let it go for now', timeCost:0 },
      { type:'special', label:'Trust to fortune', timeCost:0,
        results:{ default:'A stroke of good fortune elsewhere puts everyone in a forgiving mood.' } }
    ]
  },
  {
    id:'the_landslide', type:'Travel', title:'The Landslide',
    tags:{ location:['ruins'], requires:[], repeatableOnFlee:false },
    prompt:"A recent landslide has buried the path in loose stone and shattered timber. Digging through by hand looks like the only option — unless {partyA} can think of something cleverer.",
    options:[
      { type:'group', label:'Dig through together', stat:'Might', dc:14, timeCost:3, fatigueCost:2,
        tallyTable:[
          { max:-3, result:'{lead} shifts the wrong stone and the whole slope groans — {lead} barely gets clear before more comes down.', targetLead:{ condition:'Injured', extraFatigue:2 } },
          { min:-2, max:0, result:'{highest} ends up doing the work of three people while the rest catch their breath.', targetHighest:{ condition:'Injured' } },
          { min:1, max:3, result:'Stone by stone, the party clears a path through. Slow, exhausting, but it works.' },
          { min:4, result:'{highest} finds the exact right stone to pull, and the whole slide shifts clear at once — {lowest} whoops as daylight breaks through.', extraTimeCost:-1, grantsLuck:true }
        ] },
      { type:'check', label:'Look for a way around the slide', stat:'Awareness', dc:15, timeCost:1,
        results:{ disaster:"{name}'s alternate route loops back on itself, wasting real time.", setback:'{name} finds a way through, though it winds and doubles back.', success:'{name} finds a clean route around the slide.', triumph:'{name} finds a route so direct it barely costs a moment.' },
        extraTimeByTier:{ disaster:1, triumph:-1 } },
      { type:'flee', label:'Turn back and find another path entirely', stat:'Finesse', dc:10, timeCost:1,
        results:{ disaster:"There is no other path — {name} returns to find the slide still blocking the way.", setback:'{name} finds another route, though it costs time.', success:'{name} finds another way around without much trouble.', triumph:'{name} finds a hidden path almost at once.' } },
      { type:'special', label:'Trust to fortune', timeCost:0,
        results:{ default:'A gap high on the slide, easy to miss, turns out to be just wide enough. No time lost.' } }
    ]
  },
  {
    id:'bards_challenge', type:'Civilization', title:"A Traveling Bard's Challenge",
    tags:{ location:['any'], requires:[], repeatableOnFlee:false },
    prompt:"A bard blocks the road with a grin and a lute, refusing to let anyone pass without, in their words, \"earning the privilege.\" {partyA} looks unimpressed. {partyB} looks intrigued.",
    options:[
      { type:'check', label:'Match them verse for verse', stat:'Presence', dc:14, timeCost:1, grantsLuck:true,
        results:{ disaster:'{name} fumbles the rhyme badly enough that the bard composes a mocking song about it on the spot — everyone within earshot hears it.', setback:'{name} holds their own, barely, and the bard lets the party pass, unimpressed.', success:'{name} trades verses well enough to earn a respectful nod and safe passage.', triumph:"{name}'s verse is good enough that the bard insists on teaching it to every tavern between here and the coast." } },
      { type:'check', label:'Answer their riddle instead', stat:'Awareness', dc:13, timeCost:1,
        results:{ disaster:'{name} gets it embarrassingly wrong, and the bard makes sure to mention it to the next travelers down the road.', setback:'{name} gets there eventually, though the bard taps their foot the whole time.', success:'{name} answers cleanly, and the bard steps aside with a theatrical bow.', triumph:'{name} answers so fast the bard actually applauds before waving the party through.' } },
      { type:'flee', label:'Walk around them — the road is wide enough', timeCost:1,
        results:{ default:'{partyA} simply steps around, ignoring the indignant strumming that follows.' } },
      { type:'special', label:'Trust to fortune', timeCost:0,
        results:{ default:'The bard, spotting easier targets down the road, waves the party through without a fight.' } }
    ]
  },
  {
    id:'the_watchtower', type:'Exploration', title:'The Abandoned Watchtower',
    tags:{ location:['ruins'], requires:[], repeatableOnFlee:true },
    prompt:"A watchtower leans at a precarious angle above the ruins, half its stones scattered below. Something at the top glints in the light — if the tower is still standing by the time anyone looks up.",
    options:[
      { type:'check', label:'Climb up for a closer look', stat:'Awareness', dc:16, timeCost:1,
        results:{ disaster:'A step gives way under {name} near the top — a hard fall, but they catch themselves before it gets worse.', setback:'{name} makes the climb, though it costs more time and nerve than expected.', success:'{name} climbs up and back down with something worth the trip.', triumph:'{name} finds something genuinely valuable wedged in the stonework — a stroke of real fortune.' },
        conditionByTier:{ disaster:'Injured' }, grantsLuck:true },
      { type:'check', label:'Test whether the structure will hold first', stat:'Might', dc:13, timeCost:1,
        results:{ disaster:"{name}'s test brings a chunk of the tower down early — better now than with someone on it, but it still hurts.", setback:'{name} confirms it\'s stable enough, though checking eats into the party\'s time.', success:'{name} confirms the tower will hold long enough for a careful look.', triumph:"{name}'s inspection turns up a stash tucked into the base — no climbing required at all." },
        conditionByTier:{ disaster:'Injured' } },
      { type:'check', label:'Sense whether the tower still holds a ward', stat:'Arcane', dc:[12,17], timeCost:1,
        results:{ disaster:'There was a ward, and {name} finds it the hard way.', setback:'{name} confirms the tower is clear, though the sensing takes real focus and time.', success:'{name} confirms the tower is unwarded and safe to approach.', triumph:'{name} not only clears the tower but senses exactly where the valuable object rests — no climbing required.' },
        sickByTier:{ disaster:2 }, extraTimeByTier:{ triumph:-1 } },
      { type:'flee', label:'Leave it standing — barely', stat:'Finesse', dc:7, timeCost:0,
        results:{ disaster:'The tower groans and starts to lean further just as {name} tries to walk away — everyone hurries clear.', setback:'{name} leads the party off, though the tower groans ominously behind them.', success:'{name} leaves it exactly as found.', triumph:'{name} is well clear before the tower so much as creaks.' } },
      { type:'special', label:'Trust to fortune', timeCost:0,
        results:{ default:"A gust of wind knocks the glinting object loose, and it lands almost at the party's feet. No climbing necessary." } }
    ]
  },
  {
    id:'fork_in_fog', type:'Travel', title:'A Fork in the Fog',
    tags:{ location:['forest'], requires:[], repeatableOnFlee:false },
    prompt:"Fog rolls in thick enough to swallow the trail whole. The path splits ahead, and neither branch looks any more promising than the other.",
    options:[
      { type:'check', label:'Track the trail by feel and instinct', stat:'Awareness', dc:14, timeCost:1,
        results:{ disaster:'{name} leads the party astray — by the time the fog lifts, {victim} has wandered dangerously close to a ravine edge.', setback:'{name} finds the right branch eventually, though it takes longer than it should.', success:'{name} reads the trail correctly despite the fog.', triumph:'{name} finds the right path so surely it\'s as if the fog never touched them.' },
        conditionByTier:{ disaster:'Injured' }, targetByTier:{ disaster:'random' }, extraTimeByTier:{ setback:1 } },
      { type:'check', label:'Push forward at a steady pace and hope', stat:'Might', dc:12, timeCost:1, fatigueCost:2,
        results:{ disaster:'{name} sets a pace nobody can sustain in this murk, and the party stumbles more than it walks.', setback:'{name} pushes the party through, footsore and grumbling.', success:'{name} keeps everyone moving at a steady, sensible pace until the fog thins.', triumph:'{name} finds a rhythm the whole party can follow, and the fog seems to part ahead of them.' } },
      { type:'check', label:'Part the fog with a minor charm', stat:'Arcane', dc:13, timeCost:1,
        results:{ disaster:'The charm backfires, and the fog thickens around {name} instead of thinning.', setback:'The charm barely takes hold — it helps, a little, at some cost.', success:'{name} clears enough fog to see the correct branch plainly.', triumph:"{name}'s charm doesn't just clear the fog — it reveals a shortcut neither branch would have found." },
        sickByTier:{ disaster:1 }, extraTimeByTier:{ triumph:-1 } },
      { type:'flee', label:'Wait for the fog to clear', timeCost:3,
        results:{ default:'The party waits it out. {partyA} passes the time practicing knots; {partyB} pretends not to be impressed.' } },
      { type:'special', label:'Trust to fortune', timeCost:0,
        results:{ default:'A break in the fog reveals the correct path plainly, just long enough to commit it to memory.' } }
    ]
  },
  {
    id:'toll_bridge_bandits', type:'Combat', title:'The Toll Bridge',
    tags:{ location:['river'], requires:[], repeatableOnFlee:false },
    prompt:"A rope bridge sways over a rocky gorge — and three armed figures block the near end, hands out for a \"crossing fee\" they clearly intend to collect by force if refused.",
    options:[
      { type:'combat', label:'Refuse and fight', timeCost:3,
        dcByStat:{ Might:12, Finesse:15, Arcane:17 },
        tallyTable:[
          { max:-3, result:'The bandits are driven off, but at a terrible cost — {victim} goes down at the foot of the bridge.', conditionGranted:'Dead' },
          { min:-2, max:0, result:'The bandits break and run, but not before {victim} takes a hit meant to end the fight quickly.', conditionGranted:'Injured', tensionDelta:1 },
          { min:1, max:3, result:'{mvp} presses the fight until the bandits decide the toll isn\'t worth dying for. The scuffle costs extra time.', extraTimeCost:1 },
          { min:4, result:'{mvp} ends it fast enough that the bandits are running before they\'ve even drawn steel. Someone drops their coin purse in the retreat.', grantsLuck:true }
        ] },
      { type:'check', label:'Try to bargain the toll down', stat:'Presence', dc:15, timeCost:1,
        results:{ disaster:'{name}\'s offer only convinces them the party has more worth taking — the bargaining turns hostile fast.', setback:'{name} talks the price down, though it costs more than anyone would like.', success:'{name} negotiates a fair toll, and the party crosses without incident.', triumph:'{name} talks them down so thoroughly they wave the party across for free, half impressed.' },
        conditionByTier:{ disaster:'Injured' } },
      { type:'flee', label:'Turn back and find another crossing', stat:'Finesse', dc:11, timeCost:1,
        results:{ disaster:"They give chase before {name} can get the party clear — there's no avoiding this fight now.", setback:'{name} gets the party away, though the detour costs real ground.', success:'{name} leads the party back before the bandits commit to the chase.', triumph:'{name} has everyone gone before the bandits even finish their demand.' } },
      { type:'special', label:'Trust to fortune', timeCost:0,
        results:{ default:'A rival band of bandits chooses this exact moment to ambush the first — the party slips across the bridge in the confusion.' } }
    ]
  },
  {
    id:'humming_stones', type:'Exploration', title:'The Humming Stones',
    tags:{ location:['ruins'], requires:[], repeatableOnFlee:false },
    prompt:"A ring of standing stones hums low and constant, a sound felt in the teeth more than heard. {partyA} swears the humming changes pitch with every step closer.",
    options:[
      { type:'group', label:'Cross together, wills braced against the hum', stat:'Arcane', dc:15, timeCost:1, fatigueCost:2,
        tallyTable:[
          { max:-3, result:'The hum spikes into a shriek only {lead} seems to hear, and it drops them where they stand.', targetLead:{ condition:'Injured', extraFatigue:2 } },
          { min:-2, max:0, result:'{highest} holds the line against the worst of it, shielding the others at real cost to themselves.', targetHighest:{ condition:'Injured' } },
          { min:1, max:3, result:'The party pushes through the ring, ears ringing, otherwise unharmed.' },
          { min:4, result:'{highest} finds the hum\'s rhythm and leads {lowest} through it like a song — the party emerges with something the stones were guarding.', extraTimeCost:-1, grantsLuck:true }
        ] },
      { type:'check', label:'Find a path around the ring entirely', stat:'Awareness', dc:14, timeCost:3,
        results:{ disaster:"{name}'s detour brings the party right back to where they started, no closer to a way around.", setback:'{name} finds a way around, though it costs real time.', success:'{name} routes the party around the ring without setting foot inside it.', triumph:'{name} finds a route so clean the ring is barely visible from it.' },
        extraTimeByTier:{ disaster:1, triumph:-1 } },
      { type:'flee', label:'Turn back — some things are better left humming', timeCost:1,
        results:{ default:'The party gives the stones a wide berth. {partyB} still swears they can hear it, faintly, an hour on.' } },
      { type:'special', label:'Trust to fortune', timeCost:0,
        results:{ default:'The humming quiets to nothing the moment the party commits to crossing, as if it had been waiting for exactly that.' } }
    ]
  }
];

export const SIDEQUESTS = {
  hollow_cairn: {
    id:'hollow_cairn', title:'The Hollow Cairn',
    stops:[
      { id:'descent', title:'The Descent',
        prompt:"A narrow shaft drops beneath the cairn, choked with roots and loose stone.",
        options:[
          { type:'check', label:'Force your way down through the roots', stat:'Might', dc:13, timeCost:1,
            results:{ disaster:'{name} slips and takes a hard fall.', setback:'{name} makes it down, scraped and winded.', success:'{name} forces a path down without much trouble.', triumph:'{name} finds a clean way down almost immediately.' },
            conditionByTier:{ disaster:'Injured' } },
          { type:'check', label:'Pick through the safer footing', stat:'Awareness', dc:14, timeCost:3,
            results:{ disaster:'The "safe" path {name} chose gives way regardless.', setback:'It takes {name} longer than expected, but the party makes it down.', success:'{name} finds solid footing all the way down.', triumph:'{name} spots a route so clean it barely takes any time.' },
            conditionByTier:{ disaster:'Injured' }, extraTimeByTier:{ triumph:-1 } },
          { type:'flee', label:'Climb back out — abandon the detour', stat:'Finesse', dc:9, timeCost:1,
            results:{ disaster:"The way back up has already collapsed — {name} finds the party committed now.", setback:'{name} climbs out, the moment lost.', success:'{name} climbs back out and rejoins the road.', triumph:'{name} climbs out easily, hardly slowed at all.' },
            abortsSidequest:true }
        ]
      },
      { id:'chamber', title:'The Chamber',
        prompt:"Below, a sealed chamber waits — and something inside catches the light.",
        options:[
          { type:'check', label:'Dig fast and brace for the worst', stat:'Might', dc:15, timeCost:1,
            results:{ disaster:'The chamber gives way entirely as {name} digs — it costs the party dearly.', setback:'{name} forces it open, worse for wear.', success:'{name} breaks through cleanly.', triumph:'{name} breaks through in one motion, and what they find is well worth the risk.' },
            conditionByTier:{ disaster:'Dead' }, extraTimeByTier:{ disaster:1, setback:1 }, grantsLuck:true },
          { type:'check', label:'Shore up the ceiling first, then dig', stat:'Awareness', dc:14, timeCost:3,
            results:{ disaster:"It gives way despite {name}'s care.", setback:'Slow going, but {name} makes it hold.', success:'{name} opens it safely.', triumph:'{name} opens it easily, and what they find is well worth the wait.' },
            conditionByTier:{ disaster:'Injured' }, extraTimeByTier:{ disaster:1 }, grantsLuck:true },
          { type:'check', label:'Unravel whatever seals it', stat:'Arcane', dc:15, timeCost:1,
            results:{ disaster:'Whatever sealed it discharges straight through {name} — a bad way to learn what was guarding this place.', setback:'{name} unravels the ward, though it leaves them queasy and drained.', success:'{name} unmakes the seal cleanly, no digging required.', triumph:'{name} unmakes the seal so precisely that whatever it was hiding survives completely intact — clearly worth the care.' },
            sickByTier:{ disaster:2, setback:1 }, grantsLuck:true },
          { type:'flee', label:'Cut your losses and climb out', stat:'Finesse', dc:10, timeCost:1,
            results:{ disaster:"There's no clean way back up from here — {name} has to see this through.", setback:'{name} climbs out, the chamber left sealed behind them.', success:"{name} climbs out, deciding it isn't worth it.", triumph:'{name} climbs out without a backward glance, and without losing much time at all.' },
            abortsSidequest:true }
        ]
      }
    ]
  }
};

export const BLOWUP_EVENT = {
  id:'the_breaking_point', type:'Drama', title:'The Breaking Point',
  tags:{ location:['any'], requires:[], repeatableOnFlee:false },
  prompt:"It's been building between {partyA} and {partyB} for a while now, and tonight it finally spills over. There's no putting this off any longer — and no easy way through it either.",
  options:[
    { type:'group', label:'Lay every grievance on the table', stat:'Presence', dc:18, timeCost:2, fatigueCost:2,
      tallyTable:[
        { max:-3, result:"It goes about as badly as it possibly could. Things get said that can't be unsaid, and {victim} walks before the sun comes up.", targetRandom:{ condition:'Departed' } },
        { min:-2, max:0, result:'{highest} manages to keep the worst of it from boiling over, but it costs them plenty to hold the room together.', targetHighest:{ condition:'Injured' } },
        { min:1, max:3, result:"It's ugly, and it's honest, and by the end of it the air is actually clear. The party stays whole." },
        { min:4, result:"{highest} says exactly what needed saying, and {lowest} finally hears it. Whatever this party is, it's stronger for tonight.", grantsLuck:true }
      ] },
    { type:'sacrifice', label:'Ask someone to leave, for the good of the rest', timeCost:1 }
  ]
};

export const MAX_TIME = 38;
export const MIN_TENSION = 1;
export const MAX_TENSION = 5;


/* ---------------------------------------------------------
   TRANSITION TEXT — the connective line shown on arrival at a stop.
--------------------------------------------------------- */
export const TRANSITION_ARRIVE = {
  forest: "The trees close ranks around the party once more, the road narrowing beneath the canopy.",
  road: "The path widens and firms underfoot as it joins the old road.",
  ruins: "Broken stone breaks through the earth ahead — the first sign of the ruins.",
  river: "The sound of moving water rises ahead, and the trail bends toward it."
};
export const TRANSITION_CONTINUE = {
  forest: "The party presses on deeper into the woods.",
  road: "The road rolls on beneath tired feet.",
  ruins: "More ruins sprawl ahead, half-swallowed by root and moss.",
  river: "The trail continues to wind along the water's edge."
};
export const TRANSITION_START = "The journey begins, the road stretching out ahead.";

// "Let it go for now" — odds that declining a Drama event escalates it anyway,
// keyed by current Tension.
export const DEFER_ESCALATION_CHANCE = { 1:0.20, 2:0.40, 3:0.60, 4:0.80 };
