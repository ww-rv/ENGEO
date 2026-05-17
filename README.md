# WordQuest · Telegram Mini App

Classroom geocaching game combining English and Geography for grades 5–6.

## How to Deploy (GitHub Pages → Telegram Bot)

### 1. Upload to GitHub
```
git init
git add .
git commit -m "init"
git remote add origin https://github.com/YOUR_NAME/wordquest.git
git push -u origin main
```

### 2. Enable GitHub Pages
- Go to repository → **Settings** → **Pages**
- Source: `Deploy from a branch` → `main` → `/root`
- Your URL: `https://YOUR_NAME.github.io/wordquest/`

### 3. Connect to Telegram Bot
- Open **@BotFather** in Telegram
- `/newapp` or select your existing bot
- Paste the GitHub Pages URL as the **Web App URL**
- Set a button name like "Play WordQuest"

---

## Teams

| # | Name | Emoji |
|---|------|-------|
| 1 | Eco Rangers | 🍃 |
| 2 | Planet Protectors | 🌎 |
| 3 | Green Explorers | 🌱 |
| 4 | Nature Guardians | 🦋 |
| 5 | Bio Heroes | 🐾 |

Each team automatically receives its own unique questions — no Teacher Panel setup needed.

---

## QR Codes to Print

Print each code at **qr-code-generator.com**.

| Text to encode | Where to hide | Type |
|---|---|---|
| `WQUEST-C01` | Near the classroom door (A·1) | ✅ Cache |
| `WQUEST-C02` | Near the bookshelf / back wall (B·6) | ✅ Cache |
| `WQUEST-C03` | Near the whiteboard (C·1) | ✅ Cache |
| `WQUEST-C04` | On the windowsill (A·4) | ✅ Cache |
| `WQUEST-C05` | Teacher's desk area (E·1) | ✅ Cache |
| `WQUEST-C06` | Near the clock on the wall (D·3) | ✅ Cache |
| `WQUEST-TRAP-ICE` | A tempting but wrong spot (e.g., cabinet) | ❌ Trap |
| `WQUEST-TRAP-STORM` | Another wrong spot (e.g., notice board) | ❌ Trap |

---

## Classroom Grid Setup

```
        A       B       C       D       E
  1  [door]          [board]         [teacher]
  2
  3                          [clock]
  4  [window]
  5
  6          [books]
```

---

## Teacher Mode

- Tap the compass logo **5 times** to open Teacher Panel
- PIN: **1234**
- Live leaderboard, edit questions, assign task variants per team
- Reset button to clear all game data

---

## Game Flow

1. Student opens Mini App via Telegram bot
2. Registers team name + selects team
3. Gets first clue + coordinate → walks to location → scans QR
4. **If cache**: solves English/Geography task → gets next coordinate
5. **If trap**: frozen for 60 seconds (bonus riddle reduces time!)
6. After all **6 caches** → **Finish screen** with score
7. Tap "Send Score to Bot" → teacher sees leaderboard

---

## Question Structure

Each of the 6 caches has a unique question per team:
- **Caches 1–3**: English questions (MCQ + fill-the-gap unscramble)
- **Caches 4–6**: Ukrainian questions (MCQ)

Edit questions in `js/game-data.js` — `task` = Team 1, `variants[0–3]` = Teams 2–5.
