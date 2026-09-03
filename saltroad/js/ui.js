/* The Salt Road — rendering.
   Builds HTML from state and owns the choice animation. All interaction goes
   through data-action attributes, which main.js dispatches; no inline handlers,
   so this works as a module. */

import {
  STATS, STAT_DESCRIPTIONS, PARTY_TEMPLATE, getEffectiveMod, optionIconKey,
  OPTION_ICONS, SYMBOL_TITLES, HOURGLASS_MINI, FATIGUE_MINI,
  RESULT_KIND_ICON, CHAR_COLORS, CHAR_TINTS, AVATAR_ICONS,
  ADVENTURE_TRACK, MAX_TIME, MIN_TENSION, MAX_TENSION
} from './data.js';
import {
  state, livingParty, selectableParty, findChar, hasFatigue, fatigueValue,
  fmtMod, tierLabel, cap, effectiveTimeCost, effectiveFatigueCost
} from './engine.js';

// One shared symbol component, reused at different sizes: option buttons (with a
// conditionally-revealed DC), roster cards and the character pentagon (always showing the
// stat's value), and the actor picker (icon only, no value). Always carries hover text.
// valueExtra (optional) = { cls, style } applied to the value overlay, e.g. for the stamp-in effect.
function renderStatSymbol(iconKey, sizeClass, valueText, valueExtra){
  const icon = OPTION_ICONS[iconKey] || '';
  const hasValue = valueText !== undefined && valueText !== null;
  const title = SYMBOL_TITLES[iconKey] || iconKey;
  const extraCls = valueExtra && valueExtra.cls ? ` ${valueExtra.cls}` : '';
  const extraStyle = valueExtra && valueExtra.style ? ` style="${valueExtra.style}"` : '';
  return `<span class="stat-symbol ${sizeClass}${hasValue?' has-value':''}" title="${title}">${icon}${hasValue?`<span class="stat-value${extraCls}"${extraStyle}>${valueText}</span>`:''}</span>`;
}

// The chosen button flourishes, its siblings swipe away, then the caller proceeds.
// Resolves after the animation so callers can await it before mutating state.
export function animateChoice(idx){
  return new Promise(resolve => {
    const buttons = Array.from(document.querySelectorAll('.options .option-btn, .options .actor-btn'));
    if(buttons.length === 0){ resolve(); return; }
    buttons.forEach((btn,i) => {
      btn.disabled = true;
      if(i === idx) btn.classList.add('anim-selected');
      else btn.classList.add('anim-swiped');
    });
    setTimeout(() => {
      if(buttons[idx]) buttons[idx].classList.add('anim-exit');
    }, 320);
    setTimeout(resolve, 620);
  });
}

export function render(){
  const app = document.getElementById('app');
  const dockScreens = ['event','pickActor','pickCureTarget','pickSacrifice','result'];
  if(state.screen === 'start'){
    app.innerHTML = `<div class="screen-content">${renderStart()}</div>`;
  } else if(state.screen === 'end'){
    app.innerHTML = `<div class="screen-content">${renderEnd()}</div>`;
  } else if(dockScreens.includes(state.screen)){
    let content = '';
    if(state.screen === 'event') content = renderEvent();
    else if(state.screen === 'pickActor') content = renderPickActor();
    else if(state.screen === 'pickCureTarget') content = renderPickCureTarget();
    else if(state.screen === 'pickSacrifice') content = renderPickSacrifice();
    else if(state.screen === 'result') content = renderResult();
    app.innerHTML = renderTopBar() + `<div class="screen-content">${content}</div>` + renderPartyDock();
  }
  window.scrollTo(0,0);
}

function renderStart(){
  const roster = PARTY_TEMPLATE.map(c => `
    <div class="char-card" style="--char-color:${CHAR_COLORS[c.id]}">
      ${renderCharacterCardBody(c, false)}
    </div>`).join('');

  const legend = STATS.map(s => `
    <div class="stat-legend-row">
      ${renderStatSymbol(s, 'size-legend')}
      <div>
        <div class="stat-legend-name">${s}</div>
        <div class="stat-legend-desc">${STAT_DESCRIPTIONS[s]}</div>
      </div>
    </div>`).join('');

  return `
    <div class="hero">
      <div class="eyebrow">Encounter prototype</div>
      <h1>The Salt Road</h1>
      <p class="lede">A short pass through six stops, now drawn from a tagged event pool instead of a fixed script.</p>
    </div>
    <ul class="rules">
      <li><b>Time budget: ${MAX_TIME} units</b> for the whole road. Every option's time cost is shown directly on it — no hidden baseline, no automatic tick. Most cost 1; some cost more, some less, and a great roll can occasionally hand time back.</li>
      <li><b>Only Might, Finesse, and Arcane fight.</b> A character whose Primary Skill is Awareness or Presence doesn't fight directly — in Combat they fall back to whichever of Might, Finesse, or Arcane is strongest for them. A Presence primary also gets +2 on checks using Presence.</li>
      <li><b>Awareness</b> has its own perk: a hidden chance to reveal how hard a check actually is before you commit to it.</li>
      <li><b>Some DCs are a range, not a fixed number</b> — the actual difficulty is rolled fresh each time the event comes up, so replaying it won't teach you the exact number.</li>
      <li><b>Injured is permanent</b> until something eventually cures it. A second Injury is fatal.</li>
      <li><b>Combat</b> and <b>Group Checks</b> ask the whole party to roll at once, tallied into one outcome.</li>
      <li><b>Luck.</b> The party holds at most one — spend it to unlock a guaranteed option on any stop.</li>
      <li><b>Fatigue</b> is the default cost of most checks now, not an exception — it's shown right on the option. A fatigued character is unavailable for the entire next stop, clearing only once that stop is over. Fleeing never ticks it down.</li>
      <li><b>Fleeing</b> never counts as progress — it costs time (or nothing, if guaranteed) but never advances the party down the road.</li>
      <li><b>Tension</b> runs 1 (calm) to 5 (breaking point). Certain bad outcomes raise it — a death always raises it by 2. At its cap, the next stop is overridden by a Blowup, and someone may leave for good.</li>
      <li><b>Drama</b> is scheduled, not random — the party owes a certain number of Drama beats before the road ends, free of time or progress cost. Tension rising resets how many are still owed. Choosing to let a Drama moment go unaddressed carries its own rising risk of making things worse.</li>
      <li><b>Exploration.</b> Some stops offer a detour into a short, higher-stakes sidequest — real risk, real reward, and no penalty for turning it down cleanly.</li>
    </ul>
    <div class="stat-legend">${legend}</div>
    <div class="roster">${roster}</div>
    <button class="btn-primary" data-action="begin">Begin the Journey</button>
  `;
}

function arcPoint(cx,cy,r,angleDeg){
  const rad = angleDeg * Math.PI / 180;
  return { x: cx + r*Math.cos(rad), y: cy - r*Math.sin(rad) };
}
function arcPathStr(cx,cy,r,startAngle,endAngle){
  const p1 = arcPoint(cx,cy,r,startAngle), p2 = arcPoint(cx,cy,r,endAngle);
  return `M ${p1.x.toFixed(2)},${p1.y.toFixed(2)} A ${r},${r} 0 0,1 ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
}

function renderHourglassIcon(){
  const f = Math.max(0, Math.min(1, state.time / MAX_TIME)); // fraction of time remaining
  const g = 1 - f;
  const cx = 20, apexY = 30, topY = 5, botY = 55, halfW = 13;

  const topBaseY = apexY - f*(apexY-topY);
  const topHalfW = f*halfW;
  const topSand = `${cx-topHalfW},${topBaseY.toFixed(2)} ${cx+topHalfW},${topBaseY.toFixed(2)} ${cx},${apexY}`;

  const botTopY = botY - g*(botY-apexY);
  const botHalfW = g*halfW;
  const botSand = `${cx-halfW},${botY} ${cx+halfW},${botY} ${cx+botHalfW},${botTopY.toFixed(2)} ${cx-botHalfW},${botTopY.toFixed(2)}`;

  return `
    <svg viewBox="0 0 40 60">
      <polygon points="${topSand}" fill="var(--gold)" opacity="0.9"/>
      <polygon points="${botSand}" fill="var(--gold)" opacity="0.9"/>
      <path d="M6,5 L34,5 L${cx},${apexY} Z" fill="none" stroke="var(--gold-dim)" stroke-width="2" stroke-linejoin="round"/>
      <path d="M6,55 L34,55 L${cx},${apexY} Z" fill="none" stroke="var(--gold-dim)" stroke-width="2" stroke-linejoin="round"/>
      <line x1="4" y1="5" x2="36" y2="5" stroke="var(--gold-dim)" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="4" y1="55" x2="36" y2="55" stroke="var(--gold-dim)" stroke-width="2.5" stroke-linecap="round"/>
    </svg>
  `;
}

function renderLuckGem(){
  const filled = state.luck > 0;
  const fillColor = filled ? 'var(--gold)' : 'var(--bg-alt)';
  const strokeColor = filled ? 'var(--gold)' : 'var(--panel-border)';
  return `
    <div class="gem-icon ${filled?'filled':''}">
      <svg viewBox="0 0 32 32">
        <polygon points="16,3 27,13 16,29 5,13" fill="${fillColor}" stroke="${strokeColor}" stroke-width="1.6" stroke-linejoin="round"/>
        <line x1="5" y1="13" x2="27" y2="13" stroke="${filled?'#a3690f':'var(--panel-border)'}" stroke-width="1"/>
        <line x1="16" y1="3" x2="16" y2="29" stroke="${filled?'#a3690f':'var(--panel-border)'}" stroke-width="1" opacity="0.5"/>
      </svg>
    </div>
  `;
}

function renderTensionGauge(){
  const cx = 45, cy = 40, R = 34;
  const bounds = [180,144,108,72,36,0];
  const colors = ['#4f8a52','#8fae3f','#e0b93a','#d9832f','#c0392b'];
  let arcs = '';
  for(let i=0;i<5;i++){
    arcs += `<path d="${arcPathStr(cx,cy,R,bounds[i],bounds[i+1])}" stroke="${colors[i]}" stroke-width="9" fill="none" stroke-linecap="butt"/>`;
  }
  // Tension is a discrete 1-5 scale — the needle points at the center of whichever of the 5 bands is current.
  const bandIndex = Math.max(0, Math.min(4, state.tension - MIN_TENSION));
  const needleAngle = (bounds[bandIndex] + bounds[bandIndex+1]) / 2;
  const tip = arcPoint(cx,cy,R-9,needleAngle);
  return `
    <svg viewBox="0 0 90 48">
      ${arcs}
      <line x1="${cx}" y1="${cy}" x2="${tip.x.toFixed(2)}" y2="${tip.y.toFixed(2)}" stroke="var(--ink)" stroke-width="2.4" stroke-linecap="round"/>
      <circle cx="${cx}" cy="${cy}" r="3.5" fill="var(--ink)"/>
    </svg>
  `;
}

function renderTopBar(){
  const tensionHigh = state.tension >= MAX_TENSION - 1;
  return `
    <div class="topbar">
      <div class="meter-widget time-widget">
        ${renderHourglassIcon()}
        <span class="mlabel">Time</span>
        <span class="mval">${state.time}/${MAX_TIME}</span>
      </div>
      <div class="meter-widget gem-widget">
        ${renderLuckGem()}
        <span class="mlabel">Luck</span>
      </div>
      <div class="meter-widget tension-widget">
        ${renderTensionGauge()}
        <span class="mlabel ${tensionHigh?'tension-high':''}">Tension</span>
      </div>
    </div>
  `;
}

const INN_ICON = `
  <polygon points="10,1 19,10 15,10 15,19 5,19 5,10 1,10" fill="var(--ink)"/>
  <rect x="8" y="13" width="4" height="6" fill="var(--panel)"/>
`;
const LIGHTHOUSE_ICON = `
  <polygon points="10,0 14,4 6,4" fill="var(--ink)"/>
  <rect x="6" y="4" width="8" height="3.5" fill="var(--ink)"/>
  <polygon points="7.5,7.5 12.5,7.5 13.5,19 6.5,19" fill="var(--ink)"/>
  <rect x="7.5" y="12" width="5" height="1.6" fill="var(--panel)"/>
  <line x1="14.5" y1="5.5" x2="19" y2="3" stroke="var(--gold)" stroke-width="1" opacity="0.7"/>
  <line x1="14.5" y1="7" x2="19.5" y2="7" stroke="var(--gold)" stroke-width="1" opacity="0.5"/>
`;

function renderJourneyTracker(){
  const total = ADVENTURE_TRACK.length;
  const w = 300, h = 30, midY = h/2 + 2;
  const startX = 26, endX = w - 26;
  const span = endX - startX;
  const step = total > 1 ? span / (total - 1) : 0;

  let footprints = '';
  for(let i = 0; i < total; i++){
    const x = startX + step * i;
    const y = midY + (i % 2 === 0 ? -4 : 4);
    const rotate = i % 2 === 0 ? -14 : 14;
    const done = i < state.stopIndex;
    const current = i === state.stopIndex;
    const fill = done ? 'var(--gold)' : (current ? 'var(--gold-dim)' : 'var(--panel-border)');
    footprints += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="4" ry="6" fill="${fill}" transform="rotate(${rotate} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
  }

  return `
    <svg viewBox="0 0 ${w} ${h}" class="journey-tracker-svg">
      <line x1="${startX}" y1="${midY}" x2="${endX}" y2="${midY}" stroke="var(--panel-border)" stroke-width="1.5" stroke-dasharray="1 5" stroke-linecap="round"/>
      ${footprints}
      <g transform="translate(1,${midY-19})">${INN_ICON}</g>
      <g transform="translate(${w-21},${midY-19})">${LIGHTHOUSE_ICON}</g>
    </svg>
  `;
}

function renderPartyDock(){
  const tokens = state.party.map(c => {
    const injured = c.conditions.some(cd=>cd.tag==='Injured');
    const fat = c.conditions.find(cd=>cd.tag==='Fatigue');
    const sick = c.conditions.find(cd=>cd.tag==='Sick');
    const avatarCls = !c.alive ? 'dead' : (injured ? 'injured' : (fat ? 'fatigued' : (sick ? 'sick' : '')));
    const activeCls = state.expandedCharId === c.id ? 'active' : '';
    const badges = `
      ${injured ? '<span class="injured-badge"></span>' : ''}
      ${fat ? `<span class="fatigue-badge">${fat.value}</span>` : ''}
      ${sick ? `<span class="sick-badge">${sick.value}</span>` : ''}
    `;
    return `
      <button class="party-token ${activeCls}" style="--char-color:${CHAR_COLORS[c.id]}; --char-tint:${CHAR_TINTS[c.id]}" data-action="toggle-char" data-id="${c.id}">
        <div class="avatar-wrap">
          <div class="avatar-circle ${avatarCls}">${AVATAR_ICONS[c.id]}</div>
          ${badges}
        </div>
        <div class="pname">${c.name.split(' ')[0]}</div>
      </button>
    `;
  }).join('');

  const detail = state.expandedCharId ? renderCharDetail(findChar(state.expandedCharId)) : '';

  return `
    <div class="party-dock-wrap">
      ${detail}
      <div class="party-dock">
        <div class="journey-tracker">${renderJourneyTracker()}</div>
        <div class="party-row">${tokens}</div>
      </div>
    </div>
  `;
}

const PENTAGON_LAYOUT = [
  { stat:'Arcane',    angle:90,   abbr:'ARC' },
  { stat:'Finesse',   angle:18,   abbr:'FIN' },
  { stat:'Presence',  angle:-54,  abbr:'PRE' },
  { stat:'Awareness', angle:-126, abbr:'AWR' },
  { stat:'Might',     angle:162,  abbr:'MGT' }
];

function renderStatPentagon(character){
  const cx = 75, cy = 72, r = 46;
  const pts = PENTAGON_LAYOUT.map(p => {
    const rad = p.angle * Math.PI / 180;
    return { ...p, x: cx + r*Math.cos(rad), y: cy - r*Math.sin(rad) };
  });
  const polyPoints = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const nodes = pts.map(p => `
    <div class="pentagon-node${p.stat === character.primary ? ' is-primary' : ''}" style="left:${(p.x-18).toFixed(1)}px; top:${(p.y-18).toFixed(1)}px;">
      ${renderStatSymbol(p.stat, 'size-pentagon', fmtMod(character.mods[p.stat]))}
      <span class="pentagon-abbr">${p.abbr}</span>
    </div>
  `).join('');
  return `
    <div class="stat-pentagon">
      <svg class="pentagon-lines" viewBox="0 0 150 145"><polygon points="${polyPoints}" fill="none" stroke="var(--panel-border)" stroke-width="1.4"/></svg>
      ${nodes}
    </div>
  `;
}

// The card body — name, epithet, bio, optional conditions, and the stat pentagon — shared by
// both the in-game character popup and the pre-game roster, so they look identical.
const CONDITION_INFO = {
  injured: { label:'Injured', desc:'A lasting wound — a permanent -1 to all rolls until something eventually cures it. A second Injury is fatal.' },
  fatigued: { label:v => `Fatigue ${v}`, desc:v => `Too tired to be chosen for the next event. Clears once that event is over. Currently ${v}.` },
  sick: { label:v => `Sick ${v}`, desc:v => `Rolls with disadvantage until it wears off. ${v} affected roll${v===1?'':'s'} remaining.` },
  dead: { label:'Fallen', desc:'This character has died and can no longer act — though they still count against the party in Combat and Group Checks.' },
  departed: { label:'Departed', desc:'This character chose to leave the party for good and no longer travels with the group.' },
  none: { label:'No conditions', desc:'Nothing is currently affecting this character.' }
};

function renderConditionPill(key, value){
  const info = CONDITION_INFO[key];
  const label = typeof info.label === 'function' ? info.label(value) : info.label;
  const desc = typeof info.desc === 'function' ? info.desc(value) : info.desc;
  const conditionId = value !== undefined ? `${key}-${value}` : key;
  const expanded = state.expandedConditionKey === conditionId;
  return `
    <button type="button" class="tag-pill ${key}${expanded?' expanded':''}" title="${desc}" data-action="toggle-condition" data-key="${conditionId}">${label}</button>
    ${expanded ? `<div class="condition-detail">${desc}</div>` : ''}
  `;
}

function renderCharacterCardBody(c, showConditions){
  let conditionsHtml = '';
  if(showConditions){
    const pills = [];
    if(!c.alive){
      pills.push(renderConditionPill(c.exitReason === 'Departed' ? 'departed' : 'dead'));
    } else {
      if(c.conditions.some(cd=>cd.tag==='Injured')) pills.push(renderConditionPill('injured'));
      const fat = c.conditions.find(cd=>cd.tag==='Fatigue');
      if(fat) pills.push(renderConditionPill('fatigued', fat.value));
      const sick = c.conditions.find(cd=>cd.tag==='Sick');
      if(sick) pills.push(renderConditionPill('sick', sick.value));
      if(!pills.length) pills.push(renderConditionPill('none'));
    }
    conditionsHtml = `<div class="dconditions">${pills.join('')}</div>`;
  }
  return `
    <div class="char-detail-grid">
      <div class="char-detail-info">
        <h3 class="dname">${c.name}</h3>
        <div class="depithet">${c.epithet}</div>
        <p class="dbio">${c.bio}</p>
        ${conditionsHtml}
      </div>
      <div class="char-detail-stats">${renderStatPentagon(c)}</div>
    </div>
  `;
}

function renderCharDetail(c){
  return `
    <div class="char-card char-detail" style="--char-color:${CHAR_COLORS[c.id]}">
      <button class="close-btn" data-action="toggle-char" data-id="${c.id}">&times;</button>
      ${renderCharacterCardBody(c, true)}
    </div>
  `;
}

function locationLabel(event){
  const locs = event.tags.location.filter(l => l !== 'any');
  return locs.length ? locs.map(cap).join(' / ') : 'Anywhere';
}

const REVEAL_INFO_STAGGER = 90;
const REVEAL_OPTIONS_START = 650;
const REVEAL_OPTIONS_STAGGER = 90;
const REVEAL_OPTIONS_FADE = 220;
const REVEAL_STAMP_START = 1300;
const REVEAL_STAMP_STAGGER = 130;
const REVEAL_STAMP_FADE = 280;

function renderEvent(){
  const event = state.currentEvent;
  const isFreeDrama = event.type === 'Drama' && event.id !== 'the_breaking_point';
  const shouldAnimate = state.playRevealAnimation;
  state.playRevealAnimation = false;
  const myToken = shouldAnimate ? ++state.revealToken : state.revealToken;

  let infoLineIndex = 0;
  function infoAttrs(baseClass){
    if(!shouldAnimate) return `class="${baseClass}"`;
    const delay = infoLineIndex * REVEAL_INFO_STAGGER;
    infoLineIndex++;
    return `class="${baseClass} reveal-line" style="animation-delay:${delay}ms"`;
  }

  const interludeLine = isFreeDrama ? `<div ${infoAttrs('stop-count')}>Interlude — no time or progress spent</div>` : '';
  const transitionLine = event.transition ? `<p ${infoAttrs('event-transition')}>${event.transition}</p>` : '';
  const tagLine = `<span ${infoAttrs('event-tag')}>${event.type} · ${locationLabel(event)}</span>`;
  const titleLine = `<h2 ${infoAttrs('event-title')}>${event.title}</h2>`;
  const promptLine = `<p ${infoAttrs('event-prompt')}>${event.prompt}</p>`;

  const dcStampIndices = [];
  const options = event.options.map((opt, i) => {
    if(opt.type === 'defer' && state.tension >= MAX_TENSION) return ''; // doesn't exist at Tension 5

    const tc = isFreeDrama ? 0 : effectiveTimeCost(opt);
    const fc = effectiveFatigueCost(opt);
    const fatigueChip = fc > 0
      ? `<span class="time-chip fatigue-chip" title="Fatigue ${fc} — tires out whoever attempts this">${FATIGUE_MINI.repeat(fc)}</span>` : '';
    const hourglassChip = tc > 0
      ? `<span class="time-chip hourglass-chip" title="${tc} unit${tc>1?'s':''} of time">${HOURGLASS_MINI.repeat(tc)}</span>` : '';
    const rightSymbols = (fatigueChip || hourglassChip) ? `<span class="option-time">${fatigueChip}${hourglassChip}</span>` : '';

    const iconKey = optionIconKey(opt);
    const dcShown = typeof opt.dc === 'number' && event.dcRevealed && event.dcRevealed[i];
    let valueExtra = null;
    if(dcShown && shouldAnimate){
      dcStampIndices.push(i);
      valueExtra = { cls:'stamp', style:`animation-delay:${REVEAL_STAMP_START + i*REVEAL_STAMP_STAGGER}ms` };
    }
    const symbol = renderStatSymbol(iconKey, 'size-option', dcShown ? opt.dc : null, valueExtra);

    const disabled = (opt.type === 'special' && state.luck < 1) || (opt.type === 'sacrifice' && livingParty().length <= 1);
    const btnStyle = shouldAnimate ? ` style="animation-delay:${REVEAL_OPTIONS_START + i*REVEAL_OPTIONS_STAGGER}ms"` : '';
    return `
      <button class="option-btn" ${disabled?'disabled':''}${btnStyle} data-action="option" data-index="${i}">
        ${symbol}
        <span class="option-label">${opt.label}</span>
        ${rightSymbols}
      </button>
    `;
  }).join('');

  if(shouldAnimate){
    const lastStampEnd = dcStampIndices.length
      ? REVEAL_STAMP_START + Math.max(...dcStampIndices)*REVEAL_STAMP_STAGGER + REVEAL_STAMP_FADE
      : 0;
    const lastOptionEnd = REVEAL_OPTIONS_START + event.options.length*REVEAL_OPTIONS_STAGGER + REVEAL_OPTIONS_FADE;
    const totalMs = Math.max(lastStampEnd, lastOptionEnd) + 40;
    setTimeout(() => {
      if(state.revealToken !== myToken) return;
      const els = document.querySelectorAll('.options.revealing');
      if(els && els[0]) els[0].classList.remove('revealing');
    }, totalMs);
  }

  return `
    ${interludeLine}
    ${transitionLine}
    ${tagLine}
    ${titleLine}
    ${promptLine}
    <div class="options${shouldAnimate?' revealing':''}">${options}</div>
  `;
}

function renderPickActor(){
  const event = state.currentEvent;
  const option = event.options[state.pendingOptionIndex];
  const actors = selectableParty().map((c, i) => {
    const tagBits = [];
    if(c.conditions.some(cd=>cd.tag==='Injured')) tagBits.push('Injured');
    const fat = c.conditions.find(cd=>cd.tag==='Fatigue');
    if(fat) tagBits.push(`Fatigue ${fat.value}`);
    const tags = tagBits.length ? `<span class="tags">${tagBits.join(', ')}</span>` : '';
    const modLabel = option.stat ? `<span class="mod">${fmtMod(getEffectiveMod(c, option.stat))}</span>` : '';
    return `
      <button class="actor-btn" style="--char-color:${CHAR_COLORS[c.id]}" data-action="actor" data-index="${i}" data-id="${c.id}">
        ${renderStatSymbol(c.primary, 'size-actor')}
        <span class="actor-name">${c.name}${tags}</span>
        ${modLabel}
      </button>
    `;
  }).join('');

  return `
    <span class="event-tag">${event.type} · ${locationLabel(event)}</span>
    <h2 class="event-title">${option.label}</h2>
    <p class="event-prompt">${option.type === 'group' ? 'The whole party rolls — who takes the lead?' : 'Who attempts this?'}</p>
    <div class="options">${actors}</div>
    <button class="btn-secondary" data-action="back">Back</button>
  `;
}

function renderPickSacrifice(){
  const event = state.currentEvent;
  const option = event.options[state.pendingOptionIndex];
  const candidates = livingParty().map((c, i) => `
    <button class="actor-btn" style="--char-color:${CHAR_COLORS[c.id]}" data-action="sacrifice" data-index="${i}" data-id="${c.id}">
      ${renderStatSymbol(c.primary, 'size-actor')}
      <span class="actor-name">${c.name}</span>
    </button>
  `).join('');

  return `
    <span class="event-tag">${event.type} · ${locationLabel(event)}</span>
    <h2 class="event-title">${option.label}</h2>
    <p class="event-prompt">Who does the party ask to leave? This cannot be undone.</p>
    <div class="options">${candidates}</div>
    <button class="btn-secondary" data-action="back">Back</button>
  `;
}

function renderPickCureTarget(){
  const candidates = livingParty().filter(c => hasFatigue(c));
  const buttons = candidates.map((c, i) => `
    <button class="actor-btn" style="--char-color:${CHAR_COLORS[c.id]}" data-action="cure" data-index="${i}" data-id="${c.id}">
      <span class="actor-name">${c.name}</span>
      <span class="mod">Fatigue ${fatigueValue(c)}</span>
    </button>
  `).join('');

  return `
    <h2 class="event-title">A Moment of Inspiration</h2>
    <p class="event-prompt">Your success gives you a chance to lift someone's spirits and shake off their Fatigue. Who benefits?</p>
    <div class="options">${buttons}</div>
    <button class="btn-secondary" data-action="skip-cure">Skip</button>
  `;
}

const RESULT_PORTRAIT_STAGGER = 260;
const RESULT_SYMBOL_DELAY = 200;
const RESULT_KIND_GAP = 380;

// One portrait per character actually affected this resolution, left to right in fixed party
// order, each fading in and then getting a brief "harsh" symbol flourish per condition gained —
// or, for Dead/Departed, a grey-out and a strike across the portrait instead of a symbol.
function renderResultPortraits(characterUpdates){
  const ids = Object.keys(characterUpdates || {});
  if(!ids.length) return '';
  const ordered = state.party.filter(c => ids.includes(c.id));

  const portraits = ordered.map((c, i) => {
    const updates = characterUpdates[c.id];
    const isExit = updates.some(u => u.kind === 'dead' || u.kind === 'departed');
    const injured = c.conditions.some(cd=>cd.tag==='Injured');
    const fat = c.conditions.find(cd=>cd.tag==='Fatigue');
    const sick = c.conditions.find(cd=>cd.tag==='Sick');
    const avatarCls = !c.alive ? 'dead' : (injured ? 'injured' : (fat ? 'fatigued' : (sick ? 'sick' : '')));
    const portraitDelay = i * RESULT_PORTRAIT_STAGGER;
    const expanded = state.expandedResultCharId === c.id;

    let overlay = '';
    let avatarStyle = '';
    let avatarExtraCls = '';
    if(isExit){
      overlay = `<span class="result-strike" style="animation-delay:${portraitDelay + 500}ms"></span>`;
      avatarExtraCls = ' result-grey';
      avatarStyle = ` style="animation-delay:${portraitDelay + 350}ms"`;
    } else {
      overlay = updates.map((u, ui) => {
        const icon = RESULT_KIND_ICON[u.kind];
        if(!icon) return '';
        const delay = portraitDelay + RESULT_SYMBOL_DELAY + ui*RESULT_KIND_GAP;
        return `<span class="result-symbol-overlay" style="animation-delay:${delay}ms">${icon}</span>`;
      }).join('');
    }

    return `
      <button class="result-portrait${isExit?' is-exit':''}${expanded?' expanded':''}" style="animation-delay:${portraitDelay}ms; --char-color:${CHAR_COLORS[c.id]}" data-action="toggle-result-char" data-id="${c.id}">
        <span class="avatar-wrap">
          <span class="avatar-circle ${avatarCls}${avatarExtraCls}"${avatarStyle}>${AVATAR_ICONS[c.id]}</span>
          ${overlay}
        </span>
        <span class="pname">${c.name.split(' ')[0]}</span>
      </button>
    `;
  }).join('');

  const expandedChar = state.expandedResultCharId ? ordered.find(c=>c.id===state.expandedResultCharId) : null;
  const detail = expandedChar
    ? `<div class="result-detail">${characterUpdates[expandedChar.id].map(u=>`<div>${u.detail}</div>`).join('')}</div>`
    : '';

  return `<div class="result-portraits">${portraits}</div>${detail}`;
}

function renderResult(){
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
    ${renderResultPortraits(r.characterUpdates)}
  `;
}

function renderEnd(){
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

