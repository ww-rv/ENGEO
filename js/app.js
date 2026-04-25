// ════════════════════════════════════════════════════════════════════════════
//  WORDQUEST — App Logic
//  Не редагуй цей файл. Всі дані гри — у js/game-data.js
// ════════════════════════════════════════════════════════════════════════════

'use strict';

// ─── STATE ───────────────────────────────────────────────────────────────────

let G = {
  screen:         'welcome',
  team:           null,
  teamId:         null,
  teamColor:      null,
  teamEmoji:      null,
  coins:          0,
  cacheIndex:     0,
  found:          false,
  done:           [],
  isFrozen:       false,
  freezeEnd:      null,
  trap:           null,
  bonusUsed:      false,
  startTime:      null,
  endTime:        null,
  selectedTeamId: null,
  unscPool:       [],
  unscAnswer:     [],
  selectedOpt:    null,
};

// ─── PERSISTENCE ─────────────────────────────────────────────────────────────

function save() {
  try { localStorage.setItem('wq_state', JSON.stringify(G)); } catch (e) {}
}

function load() {
  try {
    const s = localStorage.getItem('wq_state');
    if (s) { Object.assign(G, JSON.parse(s)); return true; }
  } catch (e) {}
  return false;
}

function resetGame() {
  localStorage.removeItem('wq_state');
  Object.assign(G, {
    screen: 'welcome', team: null, teamId: null, teamColor: null, teamEmoji: null,
    coins: 0, cacheIndex: 0, found: false, done: [],
    isFrozen: false, freezeEnd: null, trap: null, bonusUsed: false,
    startTime: null, endTime: null, selectedTeamId: TEAMS[0].id,
    unscPool: [], unscAnswer: [], selectedOpt: null,
  });
  save();
  navigate('welcome');
}

// ─── NAVIGATION ──────────────────────────────────────────────────────────────

let _freezeInterval = null;

function navigate(screen) {
  stopScanner();
  if (_freezeInterval) { clearInterval(_freezeInterval); _freezeInterval = null; }

  G.screen = screen;
  save();

  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById('s-' + screen);
  if (el) el.classList.add('active');

  switch (screen) {
    case 'welcome':  renderWelcome();  break;
    case 'register': renderRegister(); break;
    case 'hunt':     renderHunt();     break;
    case 'task':     renderTask();     break;
    case 'trap':     renderTrap();     break;
    case 'finish':   renderFinish();   break;
  }
  window.scrollTo(0, 0);
}

// ─── WELCOME ─────────────────────────────────────────────────────────────────

let _logoTaps = 0, _logoTimer = null;

function logoTap() {
  _logoTaps++;
  clearTimeout(_logoTimer);
  if (_logoTaps >= 5) { _logoTaps = 0; openTeacher(); return; }
  _logoTimer = setTimeout(() => _logoTaps = 0, 2000);
}

function renderWelcome() {
  const hasGame = G.team && G.done.length > 0;
  document.getElementById('w-continue-btn').style.display = hasGame ? 'block' : 'none';
  document.getElementById('w-main-btn').textContent = hasGame ? 'New Game' : 'Start Expedition';
}

function welcomeMainBtn() {
  if (G.team && G.done.length > 0) {
    if (!confirm('Start a new game? Current progress will be lost.')) return;
    resetGame();
    return;
  }
  navigate('register');
}

// ─── REGISTER ────────────────────────────────────────────────────────────────

function renderRegister() {
  if (!G.selectedTeamId) G.selectedTeamId = TEAMS[0].id;
  const grid = document.getElementById('teams-grid');
  grid.innerHTML = TEAMS.map(t => `
    <button class="team-card ${t.id === G.selectedTeamId ? 'sel' : ''}"
            style="--tc:${t.color}"
            onclick="selectTeam('${t.id}')">
      <div class="team-badge" style="background:${t.color}">${t.emoji}</div>
      <div class="team-name">The ${t.name}</div>
    </button>
  `).join('');
}

function selectTeam(id) {
  G.selectedTeamId = id;
  renderRegister();
}

function doRegister() {
  const name  = document.getElementById('reg-name').value.trim();
  const errEl = document.getElementById('reg-err');
  if (!name) {
    errEl.textContent = 'Enter your team name!';
    errEl.style.display = 'block';
    return;
  }
  errEl.style.display = 'none';

  const t = TEAMS.find(t => t.id === G.selectedTeamId) || TEAMS[0];
  Object.assign(G, {
    team: t.name, teamId: t.id, teamColor: t.color, teamEmoji: t.emoji,
    coins: 0, cacheIndex: 0, found: false, done: [],
    startTime: Date.now(), endTime: null,
  });
  save();
  navigate('hunt');
}

// ─── HUNT ────────────────────────────────────────────────────────────────────

function renderHunt() {
  const c     = CACHES[G.cacheIndex];
  const total = CACHES.length;
  const done  = G.done.length;
  const pct   = Math.round((done / total) * 100);

  document.getElementById('hunt-title').textContent         = 'Cache #' + (G.cacheIndex + 1);
  document.getElementById('hunt-sub').textContent           = `Find the QR code · ${done} of ${total}`;
  document.getElementById('hunt-coins').textContent         = `⭐ ${G.coins}`;
  document.getElementById('hunt-team-label').textContent    = `${G.teamEmoji || '🌿'} ${G.team || 'Team'}`;
  document.getElementById('hunt-progress-label').textContent = `${done} / ${total} caches`;
  document.getElementById('hunt-progress').style.width      = pct + '%';
  document.getElementById('hunt-clue-text').innerHTML       = c.clue;
  document.getElementById('hunt-coord').textContent         = '📍 ' + c.coord;
  document.getElementById('hunt-msg').style.display         = 'none';
}

function showHuntMsg(msg) {
  document.getElementById('hunt-msg-text').textContent = msg;
  document.getElementById('hunt-msg').style.display    = 'flex';
}

// ─── QR SCANNER ──────────────────────────────────────────────────────────────

let _qrScanner = null, _scanActive = false;

function openScan() {
  document.getElementById('o-scan').classList.add('active');
  startScanner();
}

function closeScan() {
  document.getElementById('o-scan').classList.remove('active');
  stopScanner();
}

function startScanner() {
  if (_scanActive) return;
  _qrScanner = new Html5Qrcode('qr-reader');
  _qrScanner.start(
    { facingMode: 'environment' },
    { fps: 10, qrbox: { width: 220, height: 220 } },
    (text) => { closeScan(); handleQR(text.trim()); },
    () => {}
  ).then(() => {
    _scanActive = true;
  }).catch(() => {
    closeScan();
    showHuntMsg('Camera error. Use "Type code" instead.');
  });
}

function stopScanner() {
  if (_qrScanner && _scanActive) {
    _qrScanner.stop()
      .then(() => { _qrScanner.clear(); _scanActive = false; })
      .catch(() => { _scanActive = false; });
  }
}

function typeCodeManually() {
  const code = prompt('Type the QR code text:');
  if (code) { closeScan(); handleQR(code.trim()); }
}

// ─── QR LOGIC ────────────────────────────────────────────────────────────────

function handleQR(raw) {
  const code = raw.toUpperCase().replace(/\s/g, '');

  // Still frozen?
  if (G.isFrozen && G.freezeEnd && Date.now() < G.freezeEnd) {
    showHuntMsg('Your team is still FROZEN! Wait for the timer to end.');
    return;
  }

  // Is it a trap?
  if (TRAPS[code]) {
    G.trap      = code;
    G.bonusUsed = false;
    G.isFrozen  = true;
    G.freezeEnd = Date.now() + TRAPS[code].freezeSec * 1000;
    save();
    navigate('trap');
    return;
  }

  // Is it the expected cache?
  const expectedQR = CACHES[G.cacheIndex].qr.toUpperCase();
  if (code === expectedQR) {
    G.found = true;
    save();
    navigate('task');
    return;
  }

  // Is it a future cache?
  const futureIdx = CACHES.findIndex((c, i) => c.qr.toUpperCase() === code && i > G.cacheIndex);
  if (futureIdx >= 0) {
    showHuntMsg(`That is Cache #${futureIdx + 1}. You need Cache #${G.cacheIndex + 1} first!`);
    return;
  }

  // Is it an already-found cache?
  const pastIdx = CACHES.findIndex((c, i) => c.qr.toUpperCase() === code && i < G.cacheIndex);
  if (pastIdx >= 0) {
    showHuntMsg('You already found that cache! Move forward.');
    return;
  }

  showHuntMsg('Unknown code. Keep searching!');
}

// ─── TASK ────────────────────────────────────────────────────────────────────

function renderTask() {
  const c = CACHES[G.cacheIndex];
  const t = c.task;
  G.selectedOpt = null;
  G.unscPool    = shuffle([...(t.scrambled || [])]);
  G.unscAnswer  = [];

  document.getElementById('task-header').textContent     = `Cache #${G.cacheIndex + 1} — Found!`;
  document.getElementById('task-type-label').textContent = t.label;
  document.getElementById('task-question').textContent   = t.question;
  document.getElementById('task-coins-badge').textContent = `+${c.coins} ⭐`;
  document.getElementById('task-feedback').style.display = 'none';
  document.getElementById('task-submit-btn').disabled    = false;
  document.getElementById('task-submit-btn').textContent = 'Submit Answer';
  document.getElementById('task-submit-btn').onclick     = submitAnswer;

  if (t.type === 'unscramble') {
    document.getElementById('task-opts').style.display       = 'none';
    document.getElementById('task-unscramble').style.display = 'block';
    renderUnscramble();
  } else {
    document.getElementById('task-opts').style.display       = 'grid';
    document.getElementById('task-unscramble').style.display = 'none';
    document.getElementById('task-opts').innerHTML = t.options.map((o, i) => `
      <button class="opt-btn" id="opt-${i}" onclick="selectOpt(${i})">${o}</button>
    `).join('');
  }
}

function selectOpt(i) {
  G.selectedOpt = i;
  document.querySelectorAll('.opt-btn').forEach((b, idx) => {
    b.classList.toggle('sel', idx === i);
  });
}

// ─── UNSCRAMBLE UI ───────────────────────────────────────────────────────────

function renderUnscramble() {
  const pool   = document.getElementById('us-pool');
  const answer = document.getElementById('us-answer');

  pool.innerHTML = G.unscPool.map((l, i) => `
    <button class="letter-tile" onclick="usPickFromPool(${i})">${l}</button>
  `).join('');

  answer.innerHTML = G.unscAnswer.length === 0
    ? '<span style="font-size:12px;color:var(--bark-l);font-style:italic;">Tap letters above to spell the answer…</span>'
    : G.unscAnswer.map((l, i) => `
        <button class="letter-tile in-answer" onclick="usRemoveFromAnswer(${i})">${l}</button>
      `).join('');
}

function usPickFromPool(i) {
  G.unscAnswer.push(G.unscPool[i]);
  G.unscPool.splice(i, 1);
  renderUnscramble();
}

function usRemoveFromAnswer(i) {
  G.unscPool.push(G.unscAnswer[i]);
  G.unscAnswer.splice(i, 1);
  renderUnscramble();
}

// ─── SUBMIT ANSWER ───────────────────────────────────────────────────────────

function submitAnswer() {
  const c = CACHES[G.cacheIndex];
  const t = c.task;
  let correct = false;

  if (t.type === 'unscramble') {
    correct = G.unscAnswer.join('').toUpperCase() === t.answer.toUpperCase();
  } else {
    if (G.selectedOpt === null) {
      showTaskFeedback('❗ Select an answer first!', 'warn');
      return;
    }
    correct = G.selectedOpt === t.correct;
  }

  if (correct) {
    G.coins += c.coins;
    G.done.push(c.id);
    G.cacheIndex++;
    G.found = false;
    save();
    disableTaskInputs();
    showTaskFeedback(`✅ Correct! +${c.coins} ⭐`, 'ok', () => {
      if (c.isLast) {
        G.endTime = Date.now();
        save();
        navigate('finish');
      } else {
        showNextClue(c);
      }
    });
  } else {
    G.coins = Math.max(0, G.coins - SETTINGS.wrongAnswerFine);
    save();
    showTaskFeedback(`❌ Wrong answer! −${SETTINGS.wrongAnswerFine} ⭐  Try again!`, 'err');
    G.selectedOpt = null;
    document.querySelectorAll('.opt-btn').forEach(b => b.classList.remove('sel'));
    if (t.type === 'unscramble') {
      G.unscPool   = shuffle([...t.scrambled]);
      G.unscAnswer = [];
      renderUnscramble();
    }
  }
}

function disableTaskInputs() {
  document.querySelectorAll('.opt-btn, .letter-tile').forEach(b => b.disabled = true);
  document.getElementById('task-submit-btn').disabled = true;
}

function showTaskFeedback(msg, type, cb) {
  const el = document.getElementById('task-feedback');
  const bg = { ok: 'rgba(45,90,61,.12)', err: 'rgba(192,75,63,.1)', warn: 'rgba(232,181,71,.15)' };
  el.style.cssText = `display:block;background:${bg[type] || bg.warn};padding:12px 14px;border-radius:12px;font-weight:700;font-size:14px;text-align:center;margin-top:12px;`;
  el.textContent = msg;
  if (cb) setTimeout(cb, 1800);
}

function showNextClue(c) {
  const el = document.getElementById('task-feedback');
  el.style.cssText = 'display:block;background:rgba(45,90,61,.1);padding:14px;border-radius:14px;font-size:13px;text-align:left;margin-top:12px;';
  el.innerHTML = `
    <div style="font-weight:900;color:var(--moss-deep);margin-bottom:6px;">📍 Next clue:</div>
    <div style="font-style:italic;line-height:1.4;margin-bottom:10px;">${c.nextClue}</div>
    <div style="font-family:var(--fm);font-size:11px;color:var(--bark);">Coordinate: <b>${c.nextCoord}</b></div>
  `;
  const btn = document.getElementById('task-submit-btn');
  btn.textContent = 'Got it! Start searching →';
  btn.disabled    = false;
  btn.onclick     = () => navigate('hunt');
}

// ─── TRAP ────────────────────────────────────────────────────────────────────

function renderTrap() {
  const trap = TRAPS[G.trap];
  document.getElementById('trap-title').textContent   = trap.title;
  document.getElementById('trap-emoji').textContent   = trap.emoji;
  document.getElementById('trap-msg').textContent     = trap.msg;
  document.getElementById('bonus-seconds').textContent = trap.bonusSec;

  spawnSnowflakes();
  startFreezeTimer();

  if (!G.bonusUsed) {
    document.getElementById('trap-bonus').style.display = 'block';
    document.getElementById('trap-bonus-q').textContent = trap.bonus.q;
    document.getElementById('trap-bonus-opts').innerHTML = trap.bonus.opts.map((o, i) => `
      <button class="opt-btn" style="color:var(--paper);background:rgba(255,255,255,.12);box-shadow:none;"
              onclick="trapBonusAnswer(${i})">${o}</button>
    `).join('');
  } else {
    document.getElementById('trap-bonus').style.display = 'none';
  }
}

function trapBonusAnswer(i) {
  const trap = TRAPS[G.trap];
  if (i === trap.bonus.correct) {
    G.freezeEnd = Math.max(Date.now(), (G.freezeEnd || Date.now()) - trap.bonusSec * 1000);
    G.bonusUsed = true;
    save();
    document.getElementById('trap-bonus').style.display = 'none';
    updateFreezeDisplay();
  } else {
    document.querySelectorAll('#trap-bonus-opts .opt-btn').forEach((b, idx) => {
      b.disabled = true;
      if (idx === i) b.style.background = 'rgba(192,75,63,.4)';
    });
  }
}

function startFreezeTimer() {
  if (!G.freezeEnd) G.freezeEnd = Date.now() + (TRAPS[G.trap]?.freezeSec || 60) * 1000;
  updateFreezeDisplay();
  _freezeInterval = setInterval(() => {
    const rem = Math.max(0, Math.ceil((G.freezeEnd - Date.now()) / 1000));
    document.getElementById('trap-timer').textContent = fmtSec(rem);
    if (rem <= 0) {
      clearInterval(_freezeInterval);
      _freezeInterval = null;
      G.isFrozen = false; G.freezeEnd = null; G.trap = null;
      save();
      navigate('hunt');
    }
  }, 500);
}

function updateFreezeDisplay() {
  const rem = Math.max(0, Math.ceil((G.freezeEnd - Date.now()) / 1000));
  document.getElementById('trap-timer').textContent = fmtSec(rem);
}

function spawnSnowflakes() {
  const c = document.getElementById('snowflakes-container');
  c.innerHTML = '';
  for (let i = 0; i < 12; i++) {
    const s = document.createElement('div');
    s.className = 'snowflake';
    s.textContent = ['❄️', '🌨️', '❄️', '⛄'][i % 4];
    s.style.cssText = `left:${Math.random() * 95}%;top:${-Math.random() * 50}%;font-size:${14 + Math.random() * 22}px;animation-duration:${4 + Math.random() * 6}s;animation-delay:${Math.random() * 4}s;`;
    c.appendChild(s);
  }
}

// ─── FINISH ──────────────────────────────────────────────────────────────────

function renderFinish() {
  if (!G.endTime) { G.endTime = Date.now(); save(); }
  const elapsed = G.endTime - (G.startTime || G.endTime);
  const m = Math.floor(elapsed / 60000);
  const s = Math.floor((elapsed % 60000) / 1000);

  document.getElementById('fin-team-name').textContent = `${G.teamEmoji || ''} The ${G.team || 'Team'}`;
  document.getElementById('fin-subtitle').textContent  = `All ${CACHES.length} caches found!`;
  document.getElementById('fin-score').textContent     = G.coins;
  document.getElementById('fin-time').textContent      = `Time: ${m}m ${s}s`;
  setTimeout(spawnFireworks, 300);
}

function submitToBot() {
  const tg = window.Telegram?.WebApp;
  if (tg && tg.sendData) {
    tg.sendData(JSON.stringify({
      type:   'score',
      team:   G.team,
      teamId: G.teamId,
      coins:  G.coins,
      caches: G.done.length,
      time:   Math.floor((G.endTime - G.startTime) / 1000),
    }));
  } else {
    alert(`Score: ${G.coins} ⭐ | Team: The ${G.team} | Caches: ${G.done.length}/${CACHES.length}\n\nShow this to your teacher!`);
  }
}

function spawnFireworks() {
  const emojis = ['🎉', '🌟', '✨', '🌿', '🏆', '⭐', '🌸', '🎊'];
  for (let i = 0; i < 16; i++) {
    setTimeout(() => {
      const el = document.createElement('div');
      el.className   = 'firework';
      el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      el.style.cssText = `left:${Math.random() * 90}vw;font-size:${24 + Math.random() * 28}px;animation-duration:${1.5 + Math.random() * 1.5}s;`;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 3000);
    }, i * 200);
  }
}

// ─── TEACHER PANEL ───────────────────────────────────────────────────────────

function openTeacher() {
  const pin = prompt('Enter teacher PIN:');
  if (pin !== SETTINGS.teacherPin) { alert('Wrong PIN!'); return; }

  const items = [
    ...CACHES.map(c => ({ code: c.qr, label: `Cache #${parseInt(c.id.slice(1))} · Coord ${c.coord}`, type: 'cache' })),
    ...Object.keys(TRAPS).map(k => ({ code: k, label: `Trap: ${TRAPS[k].title}`, type: 'trap' })),
  ];
  document.getElementById('teacher-qr-list').innerHTML = items.map(it => `
    <div class="qr-row">
      <div>
        <div class="qr-code-text">${it.code}</div>
        <div style="font-size:11px;color:var(--ink-s);margin-top:2px;">${it.label}</div>
      </div>
      <span class="qr-type-badge ${it.type === 'cache' ? 'badge-cache' : 'badge-trap'}">${it.type.toUpperCase()}</span>
    </div>
  `).join('');
  document.getElementById('o-teacher').classList.add('active');
}

function closeTeacher() {
  document.getElementById('o-teacher').classList.remove('active');
}

// ─── UTILS ───────────────────────────────────────────────────────────────────

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function fmtSec(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// ─── INIT ─────────────────────────────────────────────────────────────────────

(function init() {
  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.ready();
    tg.expand();
    tg.setHeaderColor('#1F4530');
    tg.setBackgroundColor('#FAF3E2');
  }

  const had = load();
  if (had && G.team) {
    if (G.isFrozen && G.freezeEnd && Date.now() < G.freezeEnd) {
      navigate('trap');
    } else {
      if (G.isFrozen) { G.isFrozen = false; G.freezeEnd = null; G.trap = null; save(); }
      if (G.done.length >= CACHES.length) navigate('finish');
      else if (G.found) navigate('task');
      else navigate('hunt');
    }
  } else {
    navigate('welcome');
  }
})();
