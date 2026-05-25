# 🎮 CYBER TRIGGER

<p align="center">
  <img src="https://img.shields.io/badge/Language-JavaScript-yellow?style=for-the-badge&logo=javascript" />
  <img src="https://img.shields.io/badge/Engine-Canvas%202D-blueviolet?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Style-Cyberpunk%20Neon-cyan?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Build-Vite-green?style=for-the-badge&logo=vite" />
</p>

> **Cyber Trigger** is a top-down 2D space shooter set in a neon cyberpunk universe. Defend the digital realm against waves of viruses, epic bosses, and deadly natural disasters. Choose your class, upgrade your power, and survive as long as you can!

---

## 🕹️ How to Play

### Controls

| Key / Mouse | Action |
|---|---|
| `W A S D` / `↑ ↓ ← →` | Move your ship |
| `Left Mouse` (hold) | Primary attack (shoot / slash / hammer) |
| `Space` | Special skill (Dash / Shockwave) |
| `E` | Active skill (class-specific) |
| `P` | Pause / Resume game |
| `M` | Toggle sound |

### Objective

- Survive endless waves of enemies as long as possible.
- Kill enemies to earn **XP orbs** — level up to unlock powerful upgrades.
- Defeat **Bosses** every 60 seconds to earn chest rewards containing passive weapons.
- Survive **Natural Disasters** that trigger every 30 seconds between boss waves.

---

## ⚔️ Classes (Choose Your Role)

### 🛡️ Fighter — Gold
- **HP**: 150 | **Speed**: Slow | **Weapon**: Energy Hammer
- Swing the hammer to create a **golden cone shockwave** that pushes enemies back and destroys their bullets.
- **Special**: Shockwave dash forward; **Active E**: Manual hammer swing.
- **Signature Upgrade** — *Earthquake 360°*: Shockwave radiates in all directions, blocking bullets from every angle.

### 🔮 Mage — Purple
- **HP**: 80 | **Speed**: Fast | **Weapon**: Magic Fireball
- Launches a slow-moving purple fireball that leaves a **smoke trail** and **explodes in an AoE** on impact.
- **Special**: Arcane Blink (teleport dash); **Active E**: Instant fireball.
- **Signature Upgrade** — *Giant Fireball*: Fireball doubles in size, explosion radius +50%.

### 🎯 Ranger — Cyan
- **HP**: 90 | **Speed**: Fast | **Weapon**: Long-Range Laser
- Fires a burst of **3 parallel cyan laser beams** at high speed toward the cursor.
- **Special**: Agility Dash; **Active E**: Rapid laser burst.
- **Signature Upgrade** — *Dual Cannon Core*: Upgrades from 3 → 5 parallel beams.

### 🗡️ Assassin — Pink
- **HP**: 70 | **Speed**: Very Fast | **Weapon**: Plasma Blade
- **Auto-slashes** enemies within 110px — no click needed. Click to slash manually.
- **Special**: Phantom Dash (invincible frames); **Active E**: Instant slash.
- **Signature Upgrade** — *Twin Blade*: Slashes both in front and behind simultaneously.

---

## 📈 Level-Up Upgrade System

Every time you level up, choose **1 of 3 random upgrade cards** from your class's upgrade pool.

### Universal Upgrades (All Classes)
| Upgrade | Effect |
|---------|--------|
| ❤️ Max HP | +20–25 Max HP & full heal |
| 🚀 Speed Boost | +15% movement speed per stack |
| 🧲 Magnet Field | +50% XP orb attraction radius per stack |

### Class Signature Upgrades (One-time)
| Class | Upgrade | Effect |
|-------|---------|--------|
| 🛡️ Fighter | Earthquake 360° | Shockwave radiates 360° around ship |
| 🔮 Mage | Giant Fireball | Fireball x2 size, +50% explosion radius |
| 🎯 Ranger | Dual Cannon | 3 → 5 parallel laser beams |
| 🗡️ Assassin | Twin Blade | Slash front + back simultaneously |

---

## ⚡ Power-Up Items — "x2" Buff (8 seconds)

Collect the glowing **x2 item** (cyan) to activate a powerful class-specific buff:

| Class | x2 Buff Effect |
|-------|---------------|
| Fighter (no 360°) | Hammer shockwave becomes 360° |
| Fighter (has 360°) | 360° + 35% damage & radius boost |
| Mage | Fire two fireballs at angled spread |
| Ranger | Fires 5 parallel lasers simultaneously |
| Assassin (no Twin Blade) | Slashes front + back |
| Assassin (has Twin Blade) | Slashes in 4 directions (cross pattern) |

---

## 🏆 Boss Battles (Every 60 seconds)

Every 60 seconds, a siren blares with a flashing `⚠️ SYSTEM INTRUSION ⚠️` warning and 3-second countdown before one of **5 random bosses** spawns:

| Boss | Color | Attack Pattern |
|------|-------|---------------|
| **CYBER INTRUDER** | 🟡 Gold | High-speed charge (flashes red), 360° bullet spread, summons minions |
| **NEON VORTEX** | 🟣 Purple | Powerful gravity pull, slow purple bullet spray, 3 spinning shields |
| **SYNAPSE REAPER** | 🩷 Pink | Extreme speed, rapid melee slashes, instant-teleport 360° spin slash |
| **ARCH OVERSEER** | 🔵 Cyan | Rotating twin laser sweep, homing heat-seeking missiles |
| **GRID INFECTION** | 🟠 Orange | Wide cone bullet bursts, drops landmines, splits into 2 clones at 50% HP |

**Defeating a boss** triggers a massive particle explosion, then drops a **Golden Core Chest** containing a passive weapon.

---

## 🌪️ Natural Disasters (Every 30 seconds between boss waves)

Lasting **6 seconds** each, disasters affect both you and enemies:

### 🌋 Earthquake
- Arena shakes violently (screen shake effect).
- Player movement speed reduced **30%**.
- Energy spikes erupt from the ground after 1 second warning.

### 🔥 Thermal Eruption
- Orange warning circles flash randomly near the player.
- After 1.2 seconds, a fire column erupts for 1.5 seconds dealing **continuous burn damage**.

### ☄️ Meteor Storm
- Red warning rings mark incoming meteor landing zones.
- Meteors streak diagonally from above and **explode in a wide AoE** on impact.

---

## 👾 Enemy Types

| Enemy | Color | Behavior |
|-------|-------|----------|
| 🏃 **Runner** | Pink | Fast, rushes directly at the player |
| 🛡️ **Tanker** | Purple | Large, high HP, slow, high contact damage |
| 🔫 **Shooter** | Orange | Maintains ~250px distance, fires red bullets periodically |
| 💥 **Mine** | Orange (blinking) | Stationary; explodes when shot or touched |
| 🎯 **Sniper** | Magenta | Appears at Level 5+; locks with a pink laser beam for 1.2s before firing a devastating high-speed sniper shot (22 damage) |

---

## 🛡️ Passive Weapons (From Boss Chests)

After defeating a boss, open the chest to choose **1 of 3 passive weapons** (each can be upgraded multiple times):

| Weapon | Description |
|--------|-------------|
| 🛡️ **Rotating Shield Blades** | Neon purple blades orbit the ship, auto-slashing nearby enemies. Upgrade increases blade count (max 4). |
| 🚀 **Heat-Seeking Missiles** | Auto-locks and chases the nearest enemy, explodes in AoE on impact. Upgrade reduces cooldown. |
| 🤖 **Mini Laser Drone** | Escort drone that auto-aims and fires green lasers at the nearest enemy. Upgrade increases fire rate. |

---

## 🚀 Running Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- npm

### Setup

```bash
# Clone the repository
git clone https://github.com/vietanhx9/Cyber-Trigger-Game.git
cd Cyber-Trigger-Game

# Install dependencies
npm install

# Start development server
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
```

The production build will be output to the `dist/` folder.

---

## 🗂️ Project Structure

```
Cyber-Trigger-Game/
├── index.html          # HTML structure, UI overlays, role selection screen
├── style.css           # Cyberpunk neon design, animations, glassmorphism
├── vite.config.js      # Vite build configuration
├── src/
│   ├── main.js         # Main entry point & game loop
│   ├── entities/       # Player, Enemy, Boss classes
│   ├── effects/        # Particles, explosions, visual effects
│   ├── hazards/        # Natural disaster logic
│   ├── audio/          # Sound manager
│   └── utils/          # Helper utilities
└── dist/               # Production build output
```

---

## 🎨 Tech Stack

- **Vanilla JavaScript** — No frameworks, pure Canvas 2D API
- **HTML5 Canvas** — All rendering and game logic
- **CSS3** — Cyberpunk neon aesthetic with glassmorphism, animations
- **Vite** — Fast development server and production bundler
- **GitHub Actions** — Automatic deployment to GitHub Pages

---

<p align="center">Made with ❤️ and ⚡ neon energy</p>