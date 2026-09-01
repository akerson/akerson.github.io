# The Salt Road

A short tabletop-style journey game. Six stops, a fixed time budget, and a party
that accumulates injury and fatigue along the way.

Play it: https://akerson.github.io/saltroad/

## Structure

```
saltroad/
├── index.html        markup shell only
├── css/style.css     styles, mobile-first
└── js/
    ├── data.js       content: roster, event pool, tuning constants
    ├── engine.js     state and rules; no DOM access
    ├── ui.js         renders HTML from state
    └── main.js       boot + click delegation
```

`engine.js` holds every rule and notifies the UI through `onChange()`, so game
logic can change without touching rendering. Adding an encounter means adding one
entry to `EVENT_POOL` in `data.js` — nothing else needs to change.

## Running locally

ES modules need a real server (opening `index.html` from disk won't work):

```
python3 -m http.server 8000
# then visit http://localhost:8000/saltroad/
```
