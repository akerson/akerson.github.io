# The Salt Road

A short tabletop-style journey game. Six stops, a fixed time budget, and a party
that accumulates injury, fatigue and interpersonal tension along the way.

Play it: https://akerson.github.io/saltroad/

## Structure

```
saltroad/
├── index.html        markup shell only
├── css/style.css     styles, mobile-first
└── js/
    ├── data.js       content: roster, icon art, event pool, sidequests, tuning constants
    ├── engine.js     state and rules; no DOM access
    ├── ui.js         renders HTML from state; owns the choice animation
    └── main.js       boot + click delegation
```

`engine.js` holds every rule and notifies the UI through `onChange()`, so game
logic can change without touching rendering. Adding an encounter means adding one
entry to `EVENT_POOL` in `data.js` — nothing else needs to change.

Rendering emits `data-action` attributes rather than inline handlers; `main.js`
maps each one onto an engine action through a single delegated click listener.

## Rules at a glance

- **Time** is the only budget: 38 units for the whole road. Every option states its
  own cost — there is no automatic per-stop tick.
- **Five stats.** Only Might, Finesse and Arcane fight; an Awareness- or
  Presence-primary character falls back to their best combat stat in Combat.
  Awareness carries a hidden chance to reveal a check's DC before you commit.
- **DCs may be authored as a range** and are rolled fresh each time an event comes
  up, so replaying one won't teach you the number.
- **Fatigue** is the default cost of most checks. A fatigued character sits out the
  whole next stop.
- **Injury is permanent** until cured; a second injury is fatal.
- **Tension** runs 1–5. At its cap the next stop is overridden by a Blowup, where
  someone may leave for good. Declining a Drama beat carries a rising chance of
  making things worse.

## Running locally

ES modules need a real server (opening `index.html` from disk won't work):

```
python3 -m http.server 8000
# then visit http://localhost:8000/saltroad/
```

`.claude/launch.json` wires the same server up for the editor's preview pane.
