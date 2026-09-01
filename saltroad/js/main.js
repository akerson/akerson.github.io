/* The Salt Road — boot and input wiring.
   One delegated click handler maps data-action attributes onto engine actions. */

import * as game from './engine.js';
import { render } from './ui.js';

const actions = {
  begin: () => game.beginJourney(),
  option: el => game.chooseOption(Number(el.dataset.index)),
  actor: el => game.pickActor(el.dataset.id),
  cure: el => game.pickCureTarget(el.dataset.id),
  'skip-cure': () => game.skipCure(),
  back: () => game.backToEvent(),
  continue: () => game.continueAfterResult()
};

document.getElementById('app').addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if(!el || el.disabled) return;
  const fn = actions[el.dataset.action];
  if(fn) fn(el);
});

game.onChange(render);
game.newGame();
