/* The Salt Road — game engine.
   Owns state and all rules. Knows nothing about the DOM: every action mutates
   state and then calls changed(), and the UI subscribes via onChange() to
   re-render. Choice animations and input wiring live in ui.js / main.js. */

import {
  STATS, PARTY_TEMPLATE, getEffectiveMod, pickCombatStat,
  TALLY_VALUES, ADVENTURE_TRACK, EVENT_POOL, SIDEQUESTS, BLOWUP_EVENT,
  MAX_TIME, MIN_TENSION, MAX_TENSION,
  TRANSITION_ARRIVE, TRANSITION_CONTINUE, TRANSITION_START, DEFER_ESCALATION_CHANCE
} from './data.js';

let listener = null;
export function onChange(fn){ listener = fn; }
function changed(){ if(listener) listener(state); }

/* ---------------------------------------------------------
   STATE
--------------------------------------------------------- */
export let state = null;

export function freshState(){
  return {
    screen:'start',
    party: PARTY_TEMPLATE.map(c => ({ ...c, mods:{...c.mods}, alive:true, conditions:[], exitReason:null })),
    time: MAX_TIME,
    luck: 0,
    tension: MIN_TENSION,
    dramaQuotaRemaining: dramaQuotaForTension(MIN_TENSION),
    blowupQueued: false,
    stopIndex: 0,
    currentEvent: null,
    usedEventIds: new Set(),
    activeSidequest: null,
    sidequestStopIndex: 0,
    pendingBranchSidequest: null,
    lastResolvedAbort: false,
    lastResolvedWasFlee: false,
    fleeNoAdvance: false,
    pendingOptionIndex: null,
    pendingResolution: null,
    replayCurrentEvent: false,
    lastResult: null,
    ended: null,
    expandedCharId: null,
    expandedConditionKey: null,
    playRevealAnimation: false,
    revealToken: 0,
    pendingCharacterUpdates: {},
    expandedResultCharId: null
  };
}

export function toggleCharDetail(id){
  state.expandedCharId = (state.expandedCharId === id) ? null : id;
  state.expandedConditionKey = null;
  changed();
}

export function toggleConditionDetail(key){
  state.expandedConditionKey = (state.expandedConditionKey === key) ? null : key;
  changed();
}

export function toggleResultCharDetail(charId){
  state.expandedResultCharId = (state.expandedResultCharId === charId) ? null : charId;
  changed();
}

// Backing out of an actor/cure/sacrifice picker: drop the pending choice and
// return to the event, without replaying the reveal animation.
export function backToEvent(){
  state.pendingOptionIndex = null;
  state.playRevealAnimation = false;
  state.screen = 'event';
  changed();
}

function dramaQuotaForTension(tension){
  // Flat quota, pinned for now — a broader rework of scaling by tension is deferred.
  return 2;
}

function adjustTension(delta){
  if(!delta) return;
  const before = state.tension;
  state.tension = Math.max(MIN_TENSION, Math.min(MAX_TENSION, state.tension + delta));
  if(state.tension > before){
    state.dramaQuotaRemaining = dramaQuotaForTension(state.tension);
  }
  if(state.tension >= MAX_TENSION) state.blowupQueued = true;
}

/* ---------------------------------------------------------
   HELPERS
--------------------------------------------------------- */
function rollD20(){ return 1 + Math.floor(Math.random()*20); }
function getTier(margin){
  if(margin <= -5) return 'disaster';
  if(margin <= -1) return 'setback';
  if(margin <= 4) return 'success';
  return 'triumph';
}
export function fmtMod(n){ return (n>=0?'+':'') + n; }
export function tierLabel(t){ return t.charAt(0).toUpperCase()+t.slice(1); }
export function cap(s){ return s.charAt(0).toUpperCase()+s.slice(1); }

export function livingParty(){ return state.party.filter(c=>c.alive); }
function randomLivingMember(){
  const alive = livingParty();
  return alive.length ? alive[Math.floor(Math.random()*alive.length)] : null;
}
export function findChar(id){ return state.party.find(c=>c.id===id); }

// There is no automatic "presenting a new event" tick anymore — the option you pick is the
// sole determinant of time spent. If an option omits timeCost entirely, it falls back to 1
// (every option should cost at least something by default); explicit authoring — including 0
// for a genuinely free option — always wins.
function defaultTimeCostForType(type){
  return 1;
}
export function effectiveTimeCost(option){
  return option.timeCost !== undefined ? option.timeCost : defaultTimeCostForType(option.type);
}

// Fatigue defaults to 1 for any option that actually asks someone to make a check (Check,
// Group) — Flee, Special, Combat, Sidequest, and the Drama "defer" option are exempt by
// default, though any option can still explicitly override this.
function defaultFatigueCostForType(type){
  return (type === 'check' || type === 'group') ? 1 : 0;
}
export function effectiveFatigueCost(option){
  return option.fatigueCost !== undefined ? option.fatigueCost : defaultFatigueCostForType(option.type);
}

// An option's `dc` can be authored as a single number (e.g. 14) or a [min, max] range (e.g.
// [10, 14]) for unpredictability across playthroughs of the same event. Every integer in the
// range has an equal chance. This resolves ranges into a concrete number for this one instance,
// without mutating the shared pool objects — every draw of the same event rolls fresh.
function resolveOptionDcs(options){
  return options.map(opt => {
    if(Array.isArray(opt.dc)){
      const [min, max] = opt.dc;
      const roll = min + Math.floor(Math.random() * (max - min + 1));
      return { ...opt, dc: roll };
    }
    return opt;
  });
}

// A hidden, invisible roll: for every option with a single numeric DC (not Combat, which uses
// per-stat DCs), any living Awareness-primary character secretly rolls DC 15. If any of them
// succeed, that option's DC becomes visible to the player. No consequence, no resource spent —
// purely a chance to know what you're up against.
function revealDcsForEvent(eventLike){
  const awarenessChars = livingParty().filter(c => c.primary === 'Awareness');
  return eventLike.options.map(opt => {
    if(typeof opt.dc !== 'number') return false;
    if(!awarenessChars.length) return false;
    return awarenessChars.some(c => (rollD20() + getEffectiveMod(c, 'Awareness')) >= 15);
  });
}

function fillTemplate(text, vars){
  if(!text) return text;
  return text.replace(/\{(\w+)\}/g, (m, key) => (vars && vars[key] !== undefined ? vars[key] : m));
}
export function firstName(c){ return c.name.split(' ')[0]; }
function pickTwoDistinctNames(){
  const alive = livingParty();
  if(alive.length === 0) return { partyA:'the party', partyB:'everyone' };
  if(alive.length === 1) return { partyA:firstName(alive[0]), partyB:'the others' };
  const shuffled = alive.slice().sort(() => Math.random()-0.5);
  return { partyA:firstName(shuffled[0]), partyB:firstName(shuffled[1]) };
}
function buildPromptVars(eventLike){
  const vars = pickTwoDistinctNames();
  if(eventLike && eventLike.tags && eventLike.tags.requires){
    eventLike.tags.requires.forEach(tag => {
      const matches = livingParty().filter(c => c.conditions.some(cd => cd.tag === tag));
      if(matches.length) vars[tag.toLowerCase()] = firstName(matches[Math.floor(Math.random()*matches.length)]);
    });
  }
  return vars;
}
function pickAllyName(excludeId){
  const alive = livingParty().filter(c => c.id !== excludeId);
  if(!alive.length) return 'the others';
  return firstName(alive[Math.floor(Math.random()*alive.length)]);
}

function getTransitionText(fromLoc, toLoc){
  if(!fromLoc) return TRANSITION_START;
  if(fromLoc === toLoc) return TRANSITION_CONTINUE[toLoc] || '';
  return TRANSITION_ARRIVE[toLoc] || '';
}

export function hasFatigue(c){ return c.conditions.some(cd=>cd.tag==='Fatigue' && cd.value>0); }
export function fatigueValue(c){ const f=c.conditions.find(cd=>cd.tag==='Fatigue'); return f?f.value:0; }
// Tracks what happened to which characters this resolution, so the result screen can show a
// portrait cascade instead of a wall of text. Deduplicated per (character, kind) — if the same
// kind of update lands on someone twice in one resolution, only one symbol shows for it.
function recordCharUpdate(charId, kind, detail){
  if(!state.pendingCharacterUpdates[charId]) state.pendingCharacterUpdates[charId] = [];
  if(!state.pendingCharacterUpdates[charId].some(u => u.kind === kind)){
    state.pendingCharacterUpdates[charId].push({ kind, detail });
  }
}

function addFatigue(c, amount){
  if(!amount) return;
  const existing = c.conditions.find(cd=>cd.tag==='Fatigue');
  if(existing){ existing.value += amount; existing.fresh = true; }
  else c.conditions.push({tag:'Fatigue', value:amount, fresh:true});
  recordCharUpdate(c.id, 'fatigued', `${c.name} is now Fatigued (${fatigueValue(c)}).`);
}
function clearFatigue(c){
  c.conditions = c.conditions.filter(cd=>cd.tag!=='Fatigue');
  recordCharUpdate(c.id, 'cured', `${c.name}'s Fatigue is lifted.`);
}
function tickFatigue(){
  // Fatigue applied during a stop shouldn't expire before the party even reaches the next
  // one — it stays at full value through that first "fresh" transition, and only starts
  // ticking down from the transition after that.
  state.party.forEach(c=>{
    c.conditions = c.conditions
      .map(cd => {
        if(cd.tag !== 'Fatigue') return cd;
        if(cd.fresh) return { ...cd, fresh:false };
        return { ...cd, value: cd.value - 1 };
      })
      .filter(cd => !(cd.tag==='Fatigue' && cd.value<=0));
  });
}
export function hasSick(c){ return c.conditions.some(cd=>cd.tag==='Sick' && cd.value>0); }
export function sickValue(c){ const s=c.conditions.find(cd=>cd.tag==='Sick'); return s?s.value:0; }
function addSick(c, amount){
  if(!amount) return;
  const existing = c.conditions.find(cd=>cd.tag==='Sick');
  if(existing) existing.value += amount; else c.conditions.push({tag:'Sick', value:amount});
  recordCharUpdate(c.id, 'sick', `${c.name} is now Sick (${sickValue(c)}).`);
}
function consumeSick(c){
  const s = c.conditions.find(cd=>cd.tag==='Sick');
  if(!s) return;
  s.value -= 1;
  if(s.value <= 0) c.conditions = c.conditions.filter(cd=>cd!==s);
}
export function selectableParty(){
  const alive = livingParty();
  const rested = alive.filter(c=>!hasFatigue(c));
  return rested.length ? rested : alive;
}

function resolveCheck(character, stat, dc){
  const sick = hasSick(character);
  const mod = getEffectiveMod(character, stat);
  const total = sick
    ? Math.min(rollD20(), rollD20()) + mod
    : rollD20() + mod;
  const margin = total - dc;
  return { total, margin, tier: getTier(margin), sick };
}

function markDead(character){
  character.alive = false;
  character.exitReason = 'Dead';
  adjustTension(2);
  recordCharUpdate(character.id, 'dead', `${character.name} has fallen.`);
}

function applyCondition(character, condition){
  if(condition === 'Dead'){
    markDead(character);
    return `${character.name} has fallen.`;
  }
  if(condition === 'Departed'){
    character.alive = false;
    character.exitReason = 'Departed';
    recordCharUpdate(character.id, 'departed', `${character.name} has left the party.`);
    return `${character.name} has left the party.`;
  }
  if(condition === 'Injured'){
    if(character.conditions.some(cd=>cd.tag==='Injured')){
      // Injured is permanent — a second injury is fatal.
      markDead(character);
      return `${character.name} was already wounded and cannot survive a second blow — they have fallen.`;
    }
    character.conditions.push({tag:'Injured'});
    STATS.forEach(s => character.mods[s] -= 1);
    recordCharUpdate(character.id, 'injured', `${character.name} is now Injured`);
    return `${character.name} is now Injured`;
  }
  return null;
}

/* ---------------------------------------------------------
   STATUS FLOURISH (overlay animation + synthesized cue)
--------------------------------------------------------- */
function applyTimeCost(cost){
  state.time -= cost;
  if(state.time < 0) state.time = 0;
}
function checkWipe(){ if(livingParty().length === 0) state.ended = 'wipe'; }

/* ---------------------------------------------------------
   EVENT POOL / DRAW LOGIC
--------------------------------------------------------- */
function partyHasTag(tag){
  return livingParty().some(c => c.conditions.some(cd => cd.tag === tag));
}

function eligibleForStop(location, ignoreRequires, ignoreLocation, ignoreUsed){
  return EVENT_POOL.filter(e => {
    if(e.type === 'Drama') return false; // Drama events are scheduled via the quota system, not drawn per-stop
    if(!ignoreUsed && state.usedEventIds.has(e.id)) return false;
    if(!ignoreLocation){
      const locMatch = e.tags.location.includes('any') || e.tags.location.includes(location);
      if(!locMatch) return false;
    }
    if(!ignoreRequires && e.tags.requires && e.tags.requires.length){
      const ok = e.tags.requires.every(tag => partyHasTag(tag));
      if(!ok) return false;
    }
    return true;
  });
}

function drawEventForStop(idx){
  const location = ADVENTURE_TRACK[idx];
  let pool = eligibleForStop(location, false, false, false);
  if(pool.length===0) pool = eligibleForStop(location, true, false, false);   // drop requires filter
  if(pool.length===0) pool = eligibleForStop(location, true, true, false);    // drop location filter too
  if(pool.length===0) pool = eligibleForStop(location, true, true, true);     // pool exhausted — allow a repeat rather than crash
  const chosen = pool[Math.floor(Math.random()*pool.length)];
  const vars = buildPromptVars(chosen);
  const fromLoc = idx > 0 ? ADVENTURE_TRACK[idx-1] : null;
  const transition = getTransitionText(fromLoc, location);
  const resolvedOptions = resolveOptionDcs(chosen.options);
  state.currentEvent = { ...chosen, options: resolvedOptions, prompt: fillTemplate(chosen.prompt, vars), promptVars: vars, transition, dcRevealed: revealDcsForEvent({options: resolvedOptions}) };
}

function drawDramaEvent(){
  const candidates = EVENT_POOL.filter(e =>
    e.type === 'Drama' &&
    !state.usedEventIds.has(e.id) &&
    (!e.tags.requires.length || e.tags.requires.every(tag => partyHasTag(tag)))
  );
  if(!candidates.length) return null;
  const chosen = candidates[Math.floor(Math.random()*candidates.length)];
  const vars = buildPromptVars(chosen);
  const resolvedOptions = resolveOptionDcs(chosen.options);
  return { ...chosen, options: resolvedOptions, prompt: fillTemplate(chosen.prompt, vars), promptVars: vars, dcRevealed: revealDcsForEvent({options: resolvedOptions}) };
}

function markEventUsedIfNeeded(event, option, tier){
  if(option.type === 'flee'){
    if(tier === 'disaster') return;          // forced to stay — event isn't concluded
    if(event.tags.repeatableOnFlee) return;  // goes back into the pool
    state.usedEventIds.add(event.id);
    return;
  }
  state.usedEventIds.add(event.id);
}

/* ---------------------------------------------------------
   GAME ACTIONS
--------------------------------------------------------- */
// Boot: show the title screen without starting a run.
export function newGame(){
  state = freshState();
  changed();
}

export function beginJourney(){
  state = freshState();
  presentEncounterForCurrentStop(false); // never open the adventure with a Drama beat
}

// Decides what the party sees next at their current position: a pending Blowup, a scheduled
// Drama beat (if quota remains and allowed), or the normal location-drawn event. Doesn't touch stopIndex/time.
function presentEncounterForCurrentStop(allowDrama = true){
  // The Blowup is a special case of Drama: unlike scheduled beats, it's a forced consequence
  // and fires the instant it's queued — even immediately after another Drama event, and even
  // on what would otherwise be the final stop. Nothing defers it.
  if(state.blowupQueued){
    state.currentEvent = buildBlowupEvent();
    state.blowupQueued = false;
    state.playRevealAnimation = true;
    state.screen = 'event';
    changed();
    return;
  }

  const isFinalStop = state.stopIndex === ADVENTURE_TRACK.length - 1;
  const effectiveAllowDrama = allowDrama && !isFinalStop; // scheduled Drama never shows at the final stop

  if(effectiveAllowDrama && state.dramaQuotaRemaining > 0){
    const dramaEvent = drawDramaEvent();
    if(dramaEvent){
      state.currentEvent = dramaEvent;
      state.dramaQuotaRemaining -= 1;
      state.playRevealAnimation = true;
      state.screen = 'event';
      changed();
      return;
    }
  }
  drawEventForStop(state.stopIndex);
  state.playRevealAnimation = true;
  state.screen = 'event';
  changed();
}

export function executeOption(idx){
  state.pendingCharacterUpdates = {}; // fresh slate for this resolution's portrait cascade
  const option = state.currentEvent.options[idx];
  if(option.type === 'combat'){ resolveCombat(option); return; }
  if(option.type === 'special'){
    if(state.luck < 1) return;
    resolveSpecial(option);
    return;
  }
  if(option.type === 'sidequest'){
    const event = state.currentEvent;
    applyTimeCost(effectiveTimeCost(option));
    markEventUsedIfNeeded(event, option, null);
    state.pendingOptionIndex = null;
    startSidequest(option.startsSidequest);
    return;
  }
  if(option.type === 'defer'){
    if(state.tension >= MAX_TENSION) return; // shouldn't be reachable — the option is hidden at Tension 5
    resolveDramaDefer(option);
    return;
  }
  if(option.type === 'sacrifice'){
    if(livingParty().length <= 1) return; // shouldn't be reachable — disabled in the UI
    state.pendingOptionIndex = idx;
    state.screen = 'pickSacrifice';
    changed();
    return;
  }
  if(option.type === 'flee' && !option.stat){
    resolveFreeFlee(option);
    return;
  }
  // 'check' and 'group' both need an actor — a solo check, or a lead for the group roll
  state.pendingOptionIndex = idx;
  state.screen = 'pickActor';
  changed();
}

function resolveFreeFlee(option){
  const event = state.currentEvent;
  const fillVars = { ...(event.promptVars || {}) };
  finalizeResolution({
    event, option, tier:null, breakdown:[],
    text: fillTemplate(option.results.default, fillVars),
    effects: [],
    timeCost: effectiveTimeCost(option)
  });
}

// "Let it go for now" — the standard way to decline addressing a Drama event. No roll, no
// character chosen. Odds of the tension quietly escalating anyway scale with current Tension,
// and the result text is deliberately generic rather than authored per-event.
function resolveDramaDefer(option){
  const event = state.currentEvent;
  const chance = DEFER_ESCALATION_CHANCE[state.tension] || 0;
  const escalates = Math.random() < chance;
  const effects = [];
  if(escalates){
    adjustTension(1);
    effects.push(`Tension +1 (now ${state.tension}/${MAX_TENSION}).`);
  }
  const text = escalates
    ? 'You can only ignore a situation for so long before it escalates...'
    : 'No one wants to talk about it, so no one talks about it. The journey continues...';
  finalizeResolution({
    event, option, tier:null, breakdown:[], text, effects,
    timeCost: effectiveTimeCost(option)
  });
}

function startSidequest(id){
  state.activeSidequest = SIDEQUESTS[id];
  state.sidequestStopIndex = 0;
  state.currentEvent = buildSidequestStop(0);
  state.playRevealAnimation = true;
  state.screen = 'event';
  changed();
}

function buildSidequestStop(i){
  const sq = state.activeSidequest;
  const stopDef = sq.stops[i];
  const vars = pickTwoDistinctNames();
  const resolvedOptions = resolveOptionDcs(stopDef.options);
  return {
    id: sq.id + '__' + stopDef.id,
    type: 'Exploration',
    title: `${sq.title} — ${stopDef.title}`,
    prompt: fillTemplate(stopDef.prompt, vars),
    options: resolvedOptions,
    tags: { location:['any'], requires:[], repeatableOnFlee:false },
    promptVars: vars,
    dcRevealed: revealDcsForEvent({options: resolvedOptions})
  };
}

function buildBlowupEvent(){
  const vars = pickTwoDistinctNames();
  const resolvedOptions = resolveOptionDcs(BLOWUP_EVENT.options);
  return { ...BLOWUP_EVENT, options: resolvedOptions, prompt: fillTemplate(BLOWUP_EVENT.prompt, vars), promptVars: vars, dcRevealed: revealDcsForEvent({options: resolvedOptions}) };
}

function resolveSpecial(option){
  const event = state.currentEvent;
  state.luck = 0;
  const fillVars = { ...(event.promptVars || {}) };
  finalizeResolution({
    event, option, tier:null, breakdown:[],
    text: fillTemplate(option.results.default, fillVars),
    effects: ['Luck spent.'],
    timeCost: effectiveTimeCost(option)
  });
}

function resolveCombat(option){
  const event = state.currentEvent;
  const breakdown = [];
  const rolls = [];
  const alive = livingParty();
  let tally = 0;

  alive.forEach(c => {
    const stat = pickCombatStat(c, option.dcByStat);
    const dc = option.dcByStat[stat];
    const fatigued = hasFatigue(c);
    const sick = hasSick(c);
    const disadvantage = fatigued || sick;
    const mod = getEffectiveMod(c, stat);
    const total = disadvantage
      ? Math.min(rollD20(), rollD20()) + mod
      : rollD20() + mod;
    const margin = total - dc;
    const tier = getTier(margin);
    tally += TALLY_VALUES[tier];
    rolls.push({ char:c, tier, total });
    breakdown.push({
      text: `${c.name}${disadvantage ? ' (disadvantage)' : ''} — ${stat} vs DC ${dc}: rolled ${total}`,
      tier
    });
    if(sick) consumeSick(c);
  });

  const missing = PARTY_TEMPLATE.length - alive.length;
  if(missing > 0){
    tally += missing * -1;
    breakdown.push({ text:`${missing} missing party member${missing>1?'s':''}: -${missing}`, tier:null });
  }

  const entry = option.tallyTable.find(e =>
    (e.min === undefined || tally >= e.min) && (e.max === undefined || tally <= e.max)
  );

  const effects = [];
  let timeCost = effectiveTimeCost(option);
  let victimChar = null;

  if(entry.conditionGranted){
    victimChar = randomLivingMember();
    if(victimChar){ applyCondition(victimChar, entry.conditionGranted); }
  }
  if(entry.extraTimeCost){ timeCost += entry.extraTimeCost; effects.push(`Extra time spent: ${entry.extraTimeCost}.`); }
  if(entry.grantsLuck && state.luck < 1){ state.luck = 1; effects.push('The party gains a point of Luck.'); }
  if(entry.tensionDelta){
    adjustTension(entry.tensionDelta);
    effects.push(`Tension ${entry.tensionDelta>=0?'+':''}${entry.tensionDelta} (now ${state.tension}/${MAX_TENSION}).`);
  }

  breakdown.push({ text:`Tally total: ${tally}`, tier:null, isTotal:true });

  const mvpRoll = rolls.filter(r=>r.tier==='triumph').sort((a,b)=>b.total-a.total)[0]
    || rolls.slice().sort((a,b)=>b.total-a.total)[0];
  const fillVars = { ...(event.promptVars || {}) };
  fillVars.victim = victimChar ? firstName(victimChar) : 'someone';
  fillVars.mvp = mvpRoll ? firstName(mvpRoll.char) : 'the party';

  finalizeResolution({ event, option, tier:null, breakdown, text: fillTemplate(entry.result, fillVars), effects, timeCost });
}

// A "Group Check": the whole party rolls a single forced stat (option.stat) against one DC,
// tallied exactly like Combat, but a Lead is chosen up front for narrative/mechanical targeting
// (fatigueCost, and the {lead} token) — distinct from Combat where each character uses their own Primary Skill.
function resolveGroupCheck(option, lead){
  const event = state.currentEvent;
  const breakdown = [];
  const rolls = [];
  const alive = livingParty();
  let tally = 0;

  alive.forEach(c => {
    const stat = option.stat;
    const fatigued = hasFatigue(c);
    const sick = hasSick(c);
    const disadvantage = fatigued || sick;
    const mod = getEffectiveMod(c, stat);
    const total = disadvantage
      ? Math.min(rollD20(), rollD20()) + mod
      : rollD20() + mod;
    const margin = total - option.dc;
    const tier = getTier(margin);
    tally += TALLY_VALUES[tier];
    rolls.push({ char:c, tier, total });
    breakdown.push({
      text: `${c.name}${disadvantage ? ' (disadvantage)' : ''} — ${stat} vs DC ${option.dc}: rolled ${total}`,
      tier
    });
    if(sick) consumeSick(c);
  });

  const missing = PARTY_TEMPLATE.length - alive.length;
  if(missing > 0){
    tally += missing * -1;
    breakdown.push({ text:`${missing} missing party member${missing>1?'s':''}: -${missing}`, tier:null });
  }

  const entry = option.tallyTable.find(e =>
    (e.min === undefined || tally >= e.min) && (e.max === undefined || tally <= e.max)
  );

  const effects = [];
  let timeCost = effectiveTimeCost(option);

  const groupFatigue = effectiveFatigueCost(option);
  if(groupFatigue){
    addFatigue(lead, groupFatigue);
  }
  if(entry.extraTimeCost){
    timeCost += entry.extraTimeCost;
    if(timeCost < 0) timeCost = 0;
    effects.push(`Time adjusted by ${entry.extraTimeCost}.`);
  }
  if(entry.grantsLuck && state.luck < 1){ state.luck = 1; effects.push('The party gains a point of Luck.'); }
  if(entry.tensionDelta){
    adjustTension(entry.tensionDelta);
    effects.push(`Tension ${entry.tensionDelta>=0?'+':''}${entry.tensionDelta} (now ${state.tension}/${MAX_TENSION}).`);
  }

  const sortedByTotal = rolls.slice().sort((a,b) => b.total - a.total);
  const highest = sortedByTotal[0];
  const lowest = sortedByTotal[sortedByTotal.length - 1];

  if(entry.targetLead){
    if(entry.targetLead.condition){ applyCondition(lead, entry.targetLead.condition); }
    if(entry.targetLead.extraFatigue){ addFatigue(lead, entry.targetLead.extraFatigue); }
  }
  if(entry.targetHighest && highest){
    if(entry.targetHighest.condition){ applyCondition(highest.char, entry.targetHighest.condition); }
  }
  let victimChar = null;
  if(entry.targetRandom){
    victimChar = randomLivingMember();
    if(victimChar && entry.targetRandom.condition){
      applyCondition(victimChar, entry.targetRandom.condition);
    }
  }

  breakdown.push({ text:`Tally total: ${tally}`, tier:null, isTotal:true });

  const fillVars = { ...(event.promptVars || {}) };
  fillVars.lead = firstName(lead);
  fillVars.highest = highest ? firstName(highest.char) : 'someone';
  fillVars.lowest = lowest ? firstName(lowest.char) : 'someone';
  fillVars.victim = victimChar ? firstName(victimChar) : 'someone';

  finalizeResolution({ event, option, tier:null, breakdown, text: fillTemplate(entry.result, fillVars), effects, timeCost });
}

// A guaranteed, deterministic choice — no roll. Whoever is picked Departs immediately.
export function executeSacrifice(charId){
  const event = state.currentEvent;
  const option = event.options[state.pendingOptionIndex];
  const target = findChar(charId);
  applyCondition(target, 'Departed');
  const fillVars = { ...(event.promptVars || {}), name: firstName(target) };
  const text = fillTemplate(
    "The party agrees — {name} can't stay. It isn't fair, and it isn't kind, but the rest of you have to keep moving.",
    fillVars
  );
  state.pendingOptionIndex = null;
  finalizeResolution({
    event, option, tier:null, breakdown:[],
    text, effects: [],
    timeCost: effectiveTimeCost(option)
  });
}

export function executeActor(charId){
  const event = state.currentEvent;
  const option = event.options[state.pendingOptionIndex];
  const actor = findChar(charId);

  if(option.type === 'group'){
    state.pendingOptionIndex = null;
    resolveGroupCheck(option, actor);
    return;
  }

  const r = resolveCheck(actor, option.stat, option.dc);
  const tier = r.tier;
  if(r.sick) consumeSick(actor);

  const effects = [];
  let timeCost = effectiveTimeCost(option);

  if(option.extraTimeByTier && option.extraTimeByTier[tier] !== undefined){
    timeCost += option.extraTimeByTier[tier];
    if(timeCost < 0) timeCost = 0;
  }

  // Per-tier effects (condition/fatigue/sick) land on a target, which defaults to the
  // acting character but can be redirected — e.g. a random bystander — via targetByTier.
  const targetMode = option.targetByTier && option.targetByTier[tier];
  const effectTarget = (targetMode === 'random') ? (randomLivingMember() || actor) : actor;

  if(option.conditionByTier && option.conditionByTier[tier]){
    applyCondition(effectTarget, option.conditionByTier[tier]);
  }
  if(option.fatigueByTier && option.fatigueByTier[tier]){
    addFatigue(effectTarget, option.fatigueByTier[tier]);
  }
  if(option.sickByTier && option.sickByTier[tier]){
    addSick(effectTarget, option.sickByTier[tier]);
  }
  if(option.grantsLuck && tier === 'triumph' && state.luck < 1){
    state.luck = 1;
    effects.push('The party gains a point of Luck.');
  }
  const flatFatigue = effectiveFatigueCost(option);
  if(flatFatigue){
    addFatigue(actor, flatFatigue);
  }
  if(option.tensionByTier && option.tensionByTier[tier] !== undefined){
    const delta = option.tensionByTier[tier];
    adjustTension(delta);
    effects.push(`Tension ${delta>=0?'+':''}${delta} (now ${state.tension}/${MAX_TENSION}).`);
  }

  const breakdown = [{ text:`${actor.name}${r.sick?' (Sick — disadvantage)':''} — ${option.stat} vs DC ${option.dc}: rolled ${r.total}`, tier }];
  const branchSidequestId = (option.type === 'flee' && tier === 'disaster' && option.entersSidequestOnDisaster)
    ? option.entersSidequestOnDisaster : null;
  const fillVars = { ...(event.promptVars || {}), name: firstName(actor), ally: pickAllyName(actor.id), victim: firstName(effectTarget) };
  const payload = { event, option, tier, breakdown, text: fillTemplate(option.results[tier], fillVars), effects, timeCost, branchSidequestId };
  state.pendingOptionIndex = null;

  const fatiguedCandidates = livingParty().filter(c => hasFatigue(c));
  if(option.cureFatigueOnTier === tier && fatiguedCandidates.length > 0){
    state.pendingResolution = payload;
    state.screen = 'pickCureTarget';
    changed();
    return;
  }
  finalizeResolution(payload);
}

export function executeCure(charId){
  const char = findChar(charId);
  clearFatigue(char);
  const payload = state.pendingResolution;
  state.pendingResolution = null;
  finalizeResolution(payload);
}
export function skipCure(){
  const payload = state.pendingResolution;
  state.pendingResolution = null;
  finalizeResolution(payload);
}

function finalizeResolution(payload){
  const isFreeDrama = payload.event.type === 'Drama' && payload.event.id !== BLOWUP_EVENT.id;
  const effectiveTimeCost = isFreeDrama ? 0 : payload.timeCost;

  applyTimeCost(effectiveTimeCost);
  checkWipe();
  markEventUsedIfNeeded(payload.event, payload.option, payload.tier);

  if(payload.event.id === BLOWUP_EVENT.id){
    state.tension = MIN_TENSION;
  }

  state.lastResolvedAbort = !!(payload.option.abortsSidequest && payload.tier && payload.tier !== 'disaster');
  state.pendingBranchSidequest = payload.branchSidequestId || null;
  state.replayCurrentEvent = !state.pendingBranchSidequest && (payload.option.type === 'flee' && payload.tier === 'disaster');
  // Fleeing (successfully or not) never counts as progress toward the end of the road —
  // sidequest-internal flees are handled separately by the activeSidequest branch below.
  state.fleeNoAdvance = !state.pendingBranchSidequest && !state.replayCurrentEvent && !state.activeSidequest
    && payload.option.type === 'flee';
  // Using Flee never ticks Fatigue down, win or lose.
  state.lastResolvedWasFlee = payload.option.type === 'flee';

  const effects = payload.effects.slice();
  if(isFreeDrama) effects.push('This conversation cost no time and did not move the party forward.');

  state.lastResult = { breakdown: payload.breakdown, text: payload.text, effects, characterUpdates: state.pendingCharacterUpdates };
  state.expandedResultCharId = null;
  state.screen = 'result';
  changed();
}

export function continueAfterResult(){
  if(state.ended){ state.screen = 'end'; changed(); return; }

  if(state.pendingBranchSidequest){
    const id = state.pendingBranchSidequest;
    state.pendingBranchSidequest = null;
    startSidequest(id);
    return;
  }

  if(state.replayCurrentEvent){
    state.replayCurrentEvent = false;
    if(state.time <= 0){ state.ended = 'lose'; state.screen = 'end'; changed(); return; }
    state.playRevealAnimation = true;
    state.screen = 'event';
    changed();
    return;
  }

  if(state.activeSidequest){
    const wasAbort = state.lastResolvedAbort;
    const skipTick = state.lastResolvedWasFlee;
    state.lastResolvedAbort = false;
    state.lastResolvedWasFlee = false;
    state.fleeNoAdvance = false; // sidequest-internal flees don't use the main-track no-advance rule
    if(wasAbort){
      state.activeSidequest = null;
      state.sidequestStopIndex = 0;
    } else {
      state.sidequestStopIndex++;
      if(state.sidequestStopIndex < state.activeSidequest.stops.length){
        state.currentEvent = buildSidequestStop(state.sidequestStopIndex);
        state.playRevealAnimation = true;
        state.screen = 'event';
        changed();
        return;
      }
      state.activeSidequest = null;
      state.sidequestStopIndex = 0;
    }
    advanceToNextEncounter(false, true, skipTick);
    return;
  }

  const resolvedEvent = state.currentEvent;
  const wasAnyDrama = !!(resolvedEvent && resolvedEvent.type === 'Drama');
  const wasFreeDrama = wasAnyDrama && resolvedEvent.id !== BLOWUP_EVENT.id;
  const sameStop = state.fleeNoAdvance || wasFreeDrama;
  const skipTick = state.lastResolvedWasFlee;
  state.fleeNoAdvance = false;
  state.lastResolvedWasFlee = false;
  advanceToNextEncounter(sameStop, !wasAnyDrama, skipTick);
}

// Moves (or doesn't) to the next stop, then presents whatever the party sees there.
// allowDrama=false suppresses a scheduled Drama beat from appearing here — used right after
// another Drama beat (including the Blowup) just resolved, so drama never immediately repeats.
// skipFatigueTick=true means the option that just resolved was Flee, which never ticks Fatigue.
function advanceToNextEncounter(sameStop, allowDrama = true, skipFatigueTick = false){
  if(!skipFatigueTick) tickFatigue();
  if(!sameStop){
    state.stopIndex++;
    if(state.stopIndex >= ADVENTURE_TRACK.length){ state.ended = 'win'; state.screen = 'end'; changed(); return; }
  }
  if(state.time <= 0){ state.ended = 'lose'; state.screen = 'end'; changed(); return; }
  presentEncounterForCurrentStop(allowDrama);
}

