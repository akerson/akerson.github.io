/* The Salt Road — game engine.
   Owns state and all rules. Knows nothing about the DOM: every action returns,
   and the UI subscribes via onChange() to re-render. */

import { STATS, PARTY_TEMPLATE, TALLY_VALUES, ADVENTURE_TRACK, EVENT_POOL, MAX_TIME } from './data.js';

export let state = null;

let listener = null;
export function onChange(fn){ listener = fn; }
function changed(){ if(listener) listener(state); }

function freshState(){
  return {
    screen:'start',
    party: PARTY_TEMPLATE.map(c => ({ ...c, mods:{...c.mods}, alive:true, conditions:[] })),
    time: MAX_TIME,
    triumphPoint: 0,
    stopIndex: 0,
    currentEvent: null,
    usedEventIds: new Set(),
    pendingOptionIndex: null,
    pendingResolution: null,
    replayCurrentEvent: false,
    lastResult: null,
    ended: null
  };
}

/* --- helpers --- */
function rollD20(){ return 1 + Math.floor(Math.random()*20); }
function getTier(margin){
  if(margin <= -5) return 'disaster';
  if(margin <= -1) return 'setback';
  if(margin <= 4) return 'success';
  return 'triumph';
}

export function livingParty(){ return state.party.filter(c=>c.alive); }
function randomLivingMember(){
  const alive = livingParty();
  return alive.length ? alive[Math.floor(Math.random()*alive.length)] : null;
}
function findChar(id){ return state.party.find(c=>c.id===id); }

export function hasFatigue(c){ return c.conditions.some(cd=>cd.tag==='Fatigue' && cd.value>0); }
export function fatigueValue(c){ const f=c.conditions.find(cd=>cd.tag==='Fatigue'); return f?f.value:0; }
function addFatigue(c, amount){
  if(!amount) return;
  const existing = c.conditions.find(cd=>cd.tag==='Fatigue');
  if(existing) existing.value += amount; else c.conditions.push({tag:'Fatigue', value:amount});
}
function clearFatigue(c){ c.conditions = c.conditions.filter(cd=>cd.tag!=='Fatigue'); }
function tickFatigue(){
  state.party.forEach(c=>{
    c.conditions = c.conditions
      .map(cd => cd.tag==='Fatigue' ? {...cd, value: cd.value-1} : cd)
      .filter(cd => !(cd.tag==='Fatigue' && cd.value<=0));
  });
}
export function selectableParty(){
  const alive = livingParty();
  const rested = alive.filter(c=>!hasFatigue(c));
  return rested.length ? rested : alive;
}

function resolveCheck(character, stat, dc){
  const total = rollD20() + character.mods[stat];
  const margin = total - dc;
  return { total, margin, tier: getTier(margin) };
}

function applyCondition(character, condition){
  if(condition === 'Dead'){
    character.alive = false;
    return `${character.name} has fallen.`;
  }
  if(condition === 'Injured'){
    if(!character.conditions.some(cd=>cd.tag==='Injured')){
      character.conditions.push({tag:'Injured'});
      STATS.forEach(s => character.mods[s] -= 1);
    }
    return `${character.name} is now Injured (-1 to all rolls).`;
  }
  return null;
}

function applyTimeCost(cost){
  state.time -= cost;
  if(state.time < 0) state.time = 0;
}
function checkWipe(){ if(livingParty().length === 0) state.ended = 'wipe'; }

/* --- event pool / draw logic --- */
function partyHasTag(tag){
  return livingParty().some(c => c.conditions.some(cd => cd.tag === tag));
}

function eligibleForStop(location, ignoreRequires, ignoreLocation){
  return EVENT_POOL.filter(e => {
    if(state.usedEventIds.has(e.id)) return false;
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
  let pool = eligibleForStop(location, false, false);
  if(pool.length===0) pool = eligibleForStop(location, true, false);   // drop requires filter
  if(pool.length===0) pool = eligibleForStop(location, true, true);    // drop location filter too
  const chosen = pool[Math.floor(Math.random()*pool.length)];
  state.currentEvent = chosen;
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

/* --- actions --- */
export function newGame(){ state = freshState(); changed(); }

export function beginJourney(){
  state = freshState();
  drawEventForStop(0);
  state.screen = 'event';
  changed();
}

export function chooseOption(idx){
  const option = state.currentEvent.options[idx];
  if(option.type === 'combat'){ resolveCombat(option); return; }
  if(option.type === 'special'){
    if(state.triumphPoint < 1) return;
    resolveSpecial(option);
    return;
  }
  state.pendingOptionIndex = idx;
  state.screen = 'pickActor';
  changed();
}

export function backToEvent(){
  state.pendingOptionIndex = null;
  state.screen = 'event';
  changed();
}

function resolveSpecial(option){
  const event = state.currentEvent;
  state.triumphPoint = 0;
  finalizeResolution({
    event, option, tier:null, breakdown:[],
    text: option.results.default,
    effects: ['Triumph Point spent.'],
    timeCost: option.timeCost || 0
  });
}

function resolveCombat(option){
  const event = state.currentEvent;
  const breakdown = [];
  const alive = livingParty();
  let tally = 0;

  alive.forEach(c => {
    const dc = option.dcByStat[c.primary];
    const fatigued = hasFatigue(c);
    const total = fatigued
      ? Math.min(rollD20(), rollD20()) + c.mods[c.primary]
      : rollD20() + c.mods[c.primary];
    const margin = total - dc;
    const tier = getTier(margin);
    tally += TALLY_VALUES[tier];
    breakdown.push({
      text: `${c.name}${fatigued ? ' (Fatigued — disadvantage)' : ''} — ${c.primary} vs DC ${dc}: rolled ${total}`,
      tier
    });
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
  let timeCost = option.timeCost || 0;

  if(entry.conditionGranted){
    const victim = randomLivingMember();
    if(victim){ const msg = applyCondition(victim, entry.conditionGranted); if(msg) effects.push(msg); }
  }
  if(entry.extraTimeCost){ timeCost += entry.extraTimeCost; effects.push(`Extra time spent: ${entry.extraTimeCost}.`); }
  if(entry.triumphGrantsPoint && state.triumphPoint < 1){ state.triumphPoint = 1; effects.push('The party gains a Triumph Point.'); }

  breakdown.push({ text:`Tally total: ${tally}`, tier:null, isTotal:true });

  finalizeResolution({ event, option, tier:null, breakdown, text: entry.result, effects, timeCost });
}

export function pickActor(charId){
  const event = state.currentEvent;
  const option = event.options[state.pendingOptionIndex];
  const actor = findChar(charId);
  const r = resolveCheck(actor, option.stat, option.dc);
  const tier = r.tier;

  const effects = [];
  let timeCost = option.timeCost || 0;

  if(option.extraTimeByTier && option.extraTimeByTier[tier] !== undefined){
    timeCost += option.extraTimeByTier[tier];
    if(timeCost < 0) timeCost = 0;
  }
  if(option.conditionByTier && option.conditionByTier[tier]){
    const msg = applyCondition(actor, option.conditionByTier[tier]);
    if(msg) effects.push(msg);
  }
  if(option.triumphGrantsPoint && tier === 'triumph' && state.triumphPoint < 1){
    state.triumphPoint = 1;
    effects.push('The party gains a Triumph Point.');
  }
  if(option.fatigueCost){
    addFatigue(actor, option.fatigueCost);
    effects.push(`${actor.name} is now Fatigued (${fatigueValue(actor)}).`);
  }

  const breakdown = [{ text:`${actor.name} — ${option.stat} vs DC ${option.dc}: rolled ${r.total}`, tier }];
  const payload = { event, option, tier, breakdown, text: option.results[tier], effects, timeCost };
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

export function pickCureTarget(charId){
  const char = findChar(charId);
  clearFatigue(char);
  state.pendingResolution.effects.push(`${char.name}'s Fatigue is lifted.`);
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
  applyTimeCost(payload.timeCost);
  checkWipe();
  markEventUsedIfNeeded(payload.event, payload.option, payload.tier);
  state.replayCurrentEvent = (payload.option.type === 'flee' && payload.tier === 'disaster');
  state.lastResult = { breakdown: payload.breakdown, text: payload.text, effects: payload.effects };
  state.screen = 'result';
  changed();
}

export function continueAfterResult(){
  if(state.ended){ state.screen = 'end'; changed(); return; }

  if(state.replayCurrentEvent){
    state.replayCurrentEvent = false;
    if(state.time <= 0){ state.ended = 'lose'; state.screen = 'end'; changed(); return; }
    state.screen = 'event';
    changed();
    return;
  }

  tickFatigue();
  state.stopIndex++;
  if(state.stopIndex >= ADVENTURE_TRACK.length){ state.ended = 'win'; state.screen = 'end'; changed(); return; }
  if(state.time <= 0){ state.ended = 'lose'; state.screen = 'end'; changed(); return; }

  drawEventForStop(state.stopIndex);
  state.screen = 'event';
  changed();
}
