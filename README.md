# .sb3-AIAgent

Scratch .sb3 generation and project editing agent.

## Core

- Scratch project import by Project ID
- Scratch project normalization
- SB3 packaging
- Asset preservation
- Agent policy for Scratch-specific feasibility checks
- Extensible support for HTML, CSS and Python

## Philosophy

The agent should not oppose normal Scratch implementation choices.

It should only disagree when the requested implementation is genuinely difficult, unavailable, unreliable, or structurally incompatible with Scratch.

## Architecture

```
User
  |
  v
Agent Core
  |
  +--> Feasibility Policy
  |
  +--> Project Loader
  |      |
  |      +--> Scratch Metadata API
  |      +--> Project JSON
  |      +--> Assets
  |
  +--> Scratch IR
  |
  +--> SB3 Builder
  |
  +--> HTML/CSS/Python adapters
  |
  v
Output
```

## Development

```
npm install
npm run dev
```

The initial implementation is intentionally small. AI inference, autonomous editing, validation and repair loops are added on top of the core.
