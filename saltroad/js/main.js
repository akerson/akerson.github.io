/* The Salt Road — boot and input wiring.
   One delegated click handler maps data-action attributes onto engine actions.
   Choices that pick a button run the swipe animation first, then resolve. */

import * as game from './engine.js';
import { render, animateChoice } from './ui.js';

const idx = el => Number(el.dataset.index);

const actions = {
  begin: () => game.beginJourney(),
  option: el => animateChoice(idx(el)).then(() => game.executeOption(idx(el))),
  actor: el => animateChoice(idx(el)).then(() => game.executeActor(el.dataset.id)),
  sacrifice: el => animateChoice(idx(el)).then(() => game.executeSacrifice(el.dataset.id)),
  cure: el => animateChoice(idx(el)).then(() => game.executeCure(el.dataset.id)),
  'skip-cure': () => game.skipCure(),
  back: () => game.backToEvent(),
  continue: () => game.continueAfterResult(),
  'toggle-char': el => game.toggleCharDetail(el.dataset.id),
  'toggle-condition': el => game.toggleConditionDetail(el.dataset.key),
  'toggle-result-char': el => game.toggleResultCharDetail(el.dataset.id)
};

// closest() resolves to the innermost action, so a condition pill nested inside a
// party token fires the pill's action rather than the token's.
document.getElementById('app').addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if(!el || el.disabled) return;
  const fn = actions[el.dataset.action];
  if(fn) fn(el);
});

game.onChange(render);
game.newGame();
