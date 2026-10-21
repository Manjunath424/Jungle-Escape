# JUNGLE ESCAPE — 3D Endless Runner Game

An arcade 3D endless runner game inspired by classics like *Temple Run*. Built with pure HTML5, CSS3, JavaScript, WebGL via Three.js, and procedural sound design via the Web Audio API.

---

## 🌴 Game Features

1. **Procedural 3D Explorer Hero**
   - Low-poly adventurer character with explorer fedora hat, safari outfit, leather vest, belt with gold buckle, backpack with bedroll, and the recovered ancient idol artifact.
   - Procedurally rigged and animated running cycle, tuck-and-leap jump animation, foot-forward sliding animation, and stumble/fall death reaction.

2. **Endless Track & Ancient Jungle World**
   - Procedural chunk generation and infinite recycling system (zero garbage collection hitching).
   - Atmospheric emerald jungle fog, ancient stone pathways, carved temple archways, towering trees with multi-tier canopies, mossy pillars, tiki totems with glowing eyes, flaming pedestals, distant mountain silhouettes, and jungle flora.

3. **10 Ancient Obstacles & Fair Navigation**
   - **Large Mossy Rocks**: 1-lane blocker (Dodge).
   - **Fallen Tree Trunks**: Single and dual-lane logs (Jump over).
   - **Ancient Stone Barriers**: Waist-height ruins (Jump over).
   - **Wooden Tribal Barricades**: Spiked wooden fences (Jump or dodge).
   - **Low Jungle Branches**: Hanging branches with creeping vines (Slide under).
   - **High Stone Arch Traps**: Overhead spiked stone beams (Slide under).
   - **Ancient Stone Pillars**: Towering obelisks (Dodge).
   - **Spike Traps**: Ground pressure plates with protruding stone spikes (Jump over).
   - **Broken Chasm Pits**: Collapsed pathways over deep jungle ravines (Jump across).
   - **Multi-Lane Combinations**: Intelligent procedural generation ensuring at least one safe avoidance path is always navigable.

4. **Coins & 5 Power-Up Systems**
   - **Gold Coins**: Rotating metallic coins placed in lines, jump-rewarding parabolic arcs, and lane zigzags.
   - **🧲 Coin Magnet**: Automatically draws all nearby gold coins toward the runner.
   - **🛡️ Temple Shield**: Absorbs one fatal obstacle crash, shattering with an energy shield reaction while the runner continues unscathed.
   - **✨ 2X Gold Multiplier**: Doubles the value of all collected coins for a duration.
   - **⚡ Score Boost**: Doubles distance score progression for a duration.
   - **🔥 Artifact Rush (Speed Boost)**: Grants supersonic running speed and invincibility, blasting straight through obstacles.
   - Active HUD powerup cards with real-time countdown progress bars.

5. **Audio Engine (Zero External Audio Dependencies)**
   - Complete procedural Web Audio API synthesizer.
   - Seamless ambient tribal jungle soundtrack (rhythmic log drums, shakers, deep kicks, and pentatonic Dorian flute melodies).
   - Dynamic SFX for footsteps, jumping whooshes, slide friction, double-chime coin pickups, heroic power-up fanfares, shield bursts, collisions, and UI clicks.

6. **Comprehensive UI / UX & Settings**
   - Animated loading screen with dynamic progress bar and gameplay tips.
   - Main menu with cinematic 3D camera pan, high scores, and quick sound controls.
   - Real-time HUD displaying score, distance in meters, coins, and active power-ups.
   - Translucent Pause Menu with Resume, Restart, and Menu options.
   - Game Over screen with run breakdown, all-time records, and new record badges.
   - Settings Modal with Master, SFX, and Music volume sliders, Graphics quality presets (Low / Medium / High), Mobile controls toggle, and Data Reset with confirmation.
   - How to Play modal with controls guide and obstacle index.
   - Credits modal.
   - LocalStorage persistence for best score, longest distance, and accumulated coins.

7. **Desktop & Mobile Controls**
   - **Desktop**:
     - `A` / `D` or `←` / `→` : Change lanes
     - `W` / `Space` or `↑` : Jump
     - `S` or `↓` : Slide
     - `Esc` or `P` : Pause / Resume
   - **Mobile Touch**:
     - Responsive swipe gestures (Left, Right, Jump Up, Slide Down).
     - On-screen touch D-Pad with quick-response buttons.
     - `touch-action: none` to prevent page scrolling or zooming.

---

## 📁 Project Structure

```
jungle-escape/
├── index.html            # Main game entry point & UI overlays
├── three.min.js          # Three.js r128 (bundled locally for 100% offline play)
├── test.html             # Automated unit & integration test suite
├── css/
│   └── style.css         # Modern jungle theme, glassmorphism & responsive layout
└── js/
    ├── constants.js      # Game constants, lanes, bounds, speeds, powerups
    ├── audio.js          # Procedural Web Audio API sound synthesizer
    ├── player.js         # Procedural 3D adventurer, rig animations & physics
    ├── track.js          # Endless track chunks, scenery & object pooling
    ├── obstacles.js      # 10 obstacle models, hitboxes & procedural spawning
    ├── collectibles.js   # Gold coins, 5 powerups, magnet logic & particle FX
    ├── ui.js             # HUD, modals, touch/swipe input & local persistence
    └── game.js           # Main state machine, camera follower & render loop
```

---

## 🚀 How to Run Locally

### Option 1: Direct Browser Launch
Simply double-click `index.html` or open it in any modern browser (Chrome, Edge, Firefox, Safari).

### Option 2: Local Python Server (Recommended)
Open a terminal in the project directory and run:
```bash
python -m http.server 8080
```
Then visit [http://localhost:8080](http://localhost:8080) in your web browser.

---

