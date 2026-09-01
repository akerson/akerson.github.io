/* The Salt Road — rendering.
   Builds HTML from state. All interaction goes through data-action attributes,
   which main.js dispatches; no inline handlers, so this works as a module. */

import { STATS, PARTY_TEMPLATE, ADVENTURE_TRACK, MAX_TIME } from './data.js';
import { livingParty, selectableParty, hasFatigue, fatigueValue } from './engine.js';

function fmtMod(n){ return (n>=0?'+':'') + n; }
function tierLabel(t){ return t.charAt(0).toUpperCase()+t.slice(1); }
function cap(s){ return s.charAt(0).toUpperCase()+s.slice(1); }

export function render(state){
  const app = document.getElementById('app');
  if(state.screen === 'start') app.innerHTML = renderStart();
  else if(state.screen === 'event') app.innerHTML = renderStatusBar(state) + renderEvent(state);
  else if(state.screen === 'pickActor') app.innerHTML = renderStatusBar(state) + renderPickActor(state);
  else if(state.screen === 'pickCureTarget') app.innerHTML = renderStatusBar(state) + renderPickCureTarget(state);
  else if(state.screen === 'result') app.innerHTML = renderStatusBar(state) + renderResult(state);
  else if(state.screen === 'end') app.innerHTML = renderEnd(state);
  window.scrollTo(0,0);
}

function renderStart(){
  const roster = PARTY_TEMPLATE.map(c => `
    <div class="roster-card">
      <div class="name">${c.name}</div>
      <div class="epithet">${c.epithet}</div>
      <div class="stat-row">
        ${STATS.map(s => `<span class="${s===c.primary?'primary':''}">${s} ${fmtMod(c.mods[s])}</span>`).join('')}
      </div>
    </div>`).join('');

  return `
    <div class="hero">
      <div class="eyebrow">Encounter prototype</div>
      <h1>The Salt Road</h1>
      <p class="lede">A short pass through six stops, now drawn from a tagged event pool instead of a fixed script.</p>
    </div>
    <ul class="rules">
      <li><b>Time budget: ${MAX_TIME} units</b> for the whole road. Every choice costs time.</li>
      <li><b>Degrees of success.</b> Rolls resolve as Disaster, Setback, Success, or Triumph.</li>
      <li><b>Combat</b> asks the whole party to roll their Primary Skill at once, tallied into one outcome.</li>
      <li><b>Triumph Point.</b> The party holds at most one — spend it to unlock a guaranteed option on any stop.</li>
      <li><b>Fatigue.</b> Some actions tire out whoever attempts them, removing that character as an option for a few stops — and forcing disadvantage if Combat catches them still tired.</li>
      <li><b>The pool.</b> Events are tagged by location and won't repeat once resolved — unless fled from an event marked as safe to revisit.</li>
    </ul>
    <div class="roster">${roster}</div>
    <button class="btn-primary" data-action="begin">Begin the Journey</button>
  `;
}

function renderStatusBar(state){
  const tokens = state.party.map(c => {
    if(!c.alive) return `<span class="party-token dead">${c.name.split(' ')[0]} · Fallen</span>`;
    const tags = [];
    if(c.conditions.some(cd=>cd.tag==='Injured')) tags.push('Injured');
    const fat = c.conditions.find(cd=>cd.tag==='Fatigue');
    if(fat) tags.push(`Fatigue ${fat.value}`);
    const cls = c.conditions.some(cd=>cd.tag==='Injured') ? 'injured' : (fat ? 'fatigued' : '');
    const tagStr = tags.length ? ' · ' + tags.join(', ') : '';
    return `<span class="party-token ${cls}">${c.name.split(' ')[0]}${tagStr}</span>`;
  }).join('');

  return `
    <div class="statusbar">
      <div class="party-row">${tokens}</div>
      <div class="meters">
        <span class="meter">Time <b>${state.time}</b> / ${MAX_TIME}</span>
        <span class="meter"><span class="gem ${state.triumphPoint>0?'filled':''}"></span>Triumph ${state.triumphPoint}/1</span>
      </div>
    </div>
  `;
}

function locationLabel(event){
  const locs = event.tags.location.filter(l => l !== 'any');
  return locs.length ? locs.map(cap).join(' / ') : 'Anywhere';
}

function renderEvent(state){
  const event = state.currentEvent;
  const options = event.options.map((opt, i) => {
    let sub = '';
    if(opt.type === 'check'){
      sub = `${opt.stat} check · DC ${opt.dc} · ${opt.timeCost} time`;
      if(opt.fatigueCost) sub += ` · Fatigue ${opt.fatigueCost}`;
      if(opt.cureFatigueOnTier) sub += ` · Triumph cures Fatigue`;
    } else if(opt.type === 'flee'){
      sub = `Flee · ${opt.stat} check · DC ${opt.dc} · ${opt.timeCost} time`;
    } else if(opt.type === 'combat'){
      sub = `Whole party · Primary Skill checks · ${opt.timeCost} time`;
    } else if(opt.type === 'special'){
      sub = state.triumphPoint > 0 ? 'Spends your Triumph Point' : 'Requires a Triumph Point';
    }
    const disabled = (opt.type === 'special' && state.triumphPoint < 1);
    return `
      <button class="option-btn" ${disabled?'disabled':''} data-action="option" data-index="${i}">
        <div class="option-label">${opt.label}</div>
        <div class="option-sub ${opt.type==='flee'?'flee':''}">${sub}</div>
      </button>
    `;
  }).join('');

  return `
    <div class="stop-count">Stop ${state.stopIndex+1} of ${ADVENTURE_TRACK.length}</div>
    <span class="event-tag">${event.type} · ${locationLabel(event)}</span>
    <h2 class="event-title">${event.title}</h2>
    <p class="event-prompt">${event.prompt}</p>
    <div class="options">${options}</div>
  `;
}

function renderPickActor(state){
  const event = state.currentEvent;
  const option = event.options[state.pendingOptionIndex];
  const actors = selectableParty().map(c => {
    const tagBits = [];
    if(c.conditions.some(cd=>cd.tag==='Injured')) tagBits.push('Injured');
    const fat = c.conditions.find(cd=>cd.tag==='Fatigue');
    if(fat) tagBits.push(`Fatigue ${fat.value}`);
    const tags = tagBits.length ? `<span class="tags">${tagBits.join(', ')}</span>` : '';
    return `
      <button class="actor-btn" data-action="actor" data-id="${c.id}">
        <span>${c.name}${tags}</span>
        <span class="mod">${option.stat} ${fmtMod(c.mods[option.stat])}</span>
      </button>
    `;
  }).join('');

  return `
    <div class="stop-count">Stop ${state.stopIndex+1} of ${ADVENTURE_TRACK.length}</div>
    <span class="event-tag">${event.type} · ${locationLabel(event)}</span>
    <h2 class="event-title">${option.label}</h2>
    <p class="event-prompt">Who attempts this?</p>
    <div class="options">${actors}</div>
    <button class="btn-secondary" data-action="back">Back</button>
  `;
}

function renderPickCureTarget(state){
  const candidates = livingParty().filter(c => hasFatigue(c));
  const buttons = candidates.map(c => `
    <button class="actor-btn" data-action="cure" data-id="${c.id}">
      <span>${c.name}</span>
      <span class="mod">Fatigue ${fatigueValue(c)}</span>
    </button>
  `).join('');

  return `
    <div class="stop-count">Stop ${state.stopIndex+1} of ${ADVENTURE_TRACK.length}</div>
    <h2 class="event-title">A Moment of Inspiration</h2>
    <p class="event-prompt">Your success gives you a chance to lift someone's spirits and shake off their Fatigue. Who benefits?</p>
    <div class="options">${buttons}</div>
    <button class="btn-secondary" data-action="skip-cure">Skip</button>
  `;
}

function renderResult(state){
  const r = state.lastResult;
  const breakdown = r.breakdown.map(b => {
    const pill = b.tier ? `<span class="tier-pill tier-${b.tier}">${tierLabel(b.tier)}</span>` : '';
    return `<div class="${b.isTotal?'tally':''}">${b.text}${pill}</div>`;
  }).join('');

  const effects = r.effects.length
    ? `<ul class="effects">${r.effects.map(e=>`<li>${e}</li>`).join('')}</ul>`
    : '';

  return `
    <div class="breakdown">${breakdown}</div>
    <p class="result-text">${r.text}</p>
    ${effects}
    <button class="btn-primary" data-action="continue">Continue</button>
  `;
}

function renderEnd(state){
  let title, sub;
  if(state.ended === 'win'){
    title = 'The Road Ends';
    sub = 'You reach the end of the Salt Road with the party intact enough to call it a success.';
  } else if(state.ended === 'wipe'){
    title = 'The Party Falls';
    sub = 'No one is left standing to carry the journey forward.';
  } else {
    title = 'Out of Time';
    sub = "The road doesn't wait. You run out of time before reaching the end.";
  }
  const survivors = livingParty().length;
  return `
    <h1 class="end-title ${state.ended==='win'?'win':'lose'}">${title}</h1>
    <p class="end-sub">${sub}<br>Survivors: ${survivors} / ${PARTY_TEMPLATE.length} — Time remaining: ${state.time}</p>
    <button class="btn-primary" data-action="begin">Play Again</button>
  `;
}
