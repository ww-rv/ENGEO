// ════════════════════════════════════════════════════════════════════════════
//  WORDQUEST — App Logic
//  Не редагуй цей файл. Всі дані гри — у js/game-data.js
// ════════════════════════════════════════════════════════════════════════════

'use strict';

// ─── CUSTOM CONFIG (teacher edits saved here) ─────────────────────────────────
// Returns the active game config: custom (from teacher panel) or defaults

function loadCfg() {
  try {
    const s = localStorage.getItem('wq_config');
    return s ? JSON.parse(s) : {};
  } catch (e) { return {}; }
}

// Local-only save (used by Firebase listener to avoid infinite loop)
function saveCfgLocal(cfg) {
  try { localStorage.setItem('wq_config', JSON.stringify(cfg)); } catch (e) {}
}

// Full save: localStorage + Firebase (teacher's writes go here)
function saveCfg(cfg) {
  saveCfgLocal(cfg);
  fbSaveConfig(cfg);
}

function getActiveCaches()   { return loadCfg().caches   || CACHES;   }
function getActiveTraps()    { return loadCfg().traps    || TRAPS;    }
function getActiveSettings() { return { ...SETTINGS, ...(loadCfg().settings || {}) }; }

// ── Team key (unique per game session, persists on refresh) ──────────────────
function getTeamKey() {
  let key = localStorage.getItem('wq_team_key');
  if (!key) {
    key = (G.teamId || 'team') + '_' + Date.now();
    localStorage.setItem('wq_team_key', key);
  }
  return key;
}

// ─── GAME STATE ───────────────────────────────────────────────────────────────

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

let _fbTeamTimer = null;
function save() {
  try { localStorage.setItem('wq_state', JSON.stringify(G)); } catch (e) {}
  // Debounced Firebase team sync (every 2s max to avoid quota issues)
  if (G.team) {
    clearTimeout(_fbTeamTimer);
    _fbTeamTimer = setTimeout(() => {
      const caches = getActiveCaches();
      fbSaveTeam(getTeamKey(), {
        name:         G.team,
        teamId:       G.teamId,
        emoji:        G.teamEmoji || '🌿',
        color:        G.teamColor || '#2D5A3D',
        coins:        G.coins,
        cacheIndex:   G.cacheIndex,
        done:         G.done,
        startTime:    G.startTime,
        endTime:      G.endTime || null,
        isFrozen:     G.isFrozen,
        gameComplete: G.done.length >= caches.length,
      });
    }, 2000);
  }
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
  localStorage.removeItem('wq_team_key');
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
  const caches = getActiveCaches();
  const c      = caches[G.cacheIndex];
  const total  = caches.length;
  const done   = G.done.length;
  const pct    = Math.round((done / total) * 100);

  document.getElementById('hunt-title').textContent          = 'Cache #' + (G.cacheIndex + 1);
  document.getElementById('hunt-sub').textContent            = `Find the QR code · ${done} of ${total}`;
  document.getElementById('hunt-coins').textContent          = `⭐ ${G.coins}`;
  document.getElementById('hunt-team-label').textContent     = `${G.teamEmoji || '🌿'} ${G.team || 'Team'}`;
  document.getElementById('hunt-progress-label').textContent = `${done} / ${total} caches`;
  document.getElementById('hunt-progress').style.width       = pct + '%';
  document.getElementById('hunt-clue-text').innerHTML        = c.clue;
  document.getElementById('hunt-coord').textContent          = '📍 ' + c.coord;
  document.getElementById('hunt-msg').style.display          = 'none';
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
  const code   = raw.toUpperCase().replace(/\s/g, '');
  const caches = getActiveCaches();
  const traps  = getActiveTraps();

  if (G.isFrozen && G.freezeEnd && Date.now() < G.freezeEnd) {
    showHuntMsg('Your team is still FROZEN! Wait for the timer to end.');
    return;
  }

  if (traps[code]) {
    G.trap      = code;
    G.bonusUsed = false;
    G.isFrozen  = true;
    G.freezeEnd = Date.now() + traps[code].freezeSec * 1000;
    save();
    navigate('trap');
    return;
  }

  const expectedQR = caches[G.cacheIndex].qr.toUpperCase();
  if (code === expectedQR) {
    G.found = true;
    save();
    navigate('task');
    return;
  }

  const futureIdx = caches.findIndex((c, i) => c.qr.toUpperCase() === code && i > G.cacheIndex);
  if (futureIdx >= 0) {
    showHuntMsg(`That is Cache #${futureIdx + 1}. You need Cache #${G.cacheIndex + 1} first!`);
    return;
  }
  const pastIdx = caches.findIndex((c, i) => c.qr.toUpperCase() === code && i < G.cacheIndex);
  if (pastIdx >= 0) {
    showHuntMsg('You already found that cache! Move forward.');
    return;
  }

  showHuntMsg('Unknown code. Keep searching!');
}

// ─── TASK ────────────────────────────────────────────────────────────────────

function renderTask() {
  const caches = getActiveCaches();
  const c = caches[G.cacheIndex];
  const t = c.task;
  G.selectedOpt = null;
  G.unscPool    = shuffle([...(t.scrambled || [])]);
  G.unscAnswer  = [];

  document.getElementById('task-header').textContent      = `Cache #${G.cacheIndex + 1} — Found!`;
  document.getElementById('task-type-label').textContent  = t.label;
  document.getElementById('task-question').textContent    = t.question;
  document.getElementById('task-coins-badge').textContent = `+${c.coins} ⭐`;
  document.getElementById('task-feedback').style.display  = 'none';
  document.getElementById('task-submit-btn').disabled     = false;
  document.getElementById('task-submit-btn').textContent  = 'Submit Answer';
  document.getElementById('task-submit-btn').onclick      = submitAnswer;

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

function submitAnswer() {
  const caches = getActiveCaches();
  const c = caches[G.cacheIndex];
  const t = c.task;
  let correct = false;

  if (t.type === 'unscramble') {
    correct = G.unscAnswer.join('').toUpperCase() === t.answer.toUpperCase();
  } else {
    if (G.selectedOpt === null) { showTaskFeedback('❗ Select an answer first!', 'warn'); return; }
    correct = G.selectedOpt === t.correct;
  }

  const fine = getActiveSettings().wrongAnswerFine;

  if (correct) {
    G.coins += c.coins;
    G.done.push(c.id);
    G.cacheIndex++;
    G.found = false;
    save();
    disableTaskInputs();
    showTaskFeedback(`✅ Correct! +${c.coins} ⭐`, 'ok', () => {
      if (c.isLast) { G.endTime = Date.now(); save(); navigate('finish'); }
      else showNextClue(c);
    });
  } else {
    G.coins = Math.max(0, G.coins - fine);
    save();
    showTaskFeedback(`❌ Wrong answer! −${fine} ⭐  Try again!`, 'err');
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
  el.style.cssText = `display:block;background:${bg[type]||bg.warn};padding:12px 14px;border-radius:12px;font-weight:700;font-size:14px;text-align:center;margin-top:12px;`;
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
  const traps = getActiveTraps();
  const trap  = traps[G.trap];
  document.getElementById('trap-title').textContent    = trap.title;
  document.getElementById('trap-emoji').textContent    = trap.emoji;
  document.getElementById('trap-msg').textContent      = trap.msg;
  document.getElementById('bonus-seconds').textContent = trap.bonusSec;
  spawnSnowflakes();
  startFreezeTimer();

  if (!G.bonusUsed) {
    document.getElementById('trap-bonus').style.display  = 'block';
    document.getElementById('trap-bonus-q').textContent  = trap.bonus.q;
    document.getElementById('trap-bonus-opts').innerHTML = trap.bonus.opts.map((o, i) => `
      <button class="opt-btn" style="color:var(--paper);background:rgba(255,255,255,.12);box-shadow:none;"
              onclick="trapBonusAnswer(${i})">${o}</button>
    `).join('');
  } else {
    document.getElementById('trap-bonus').style.display = 'none';
  }
}

function trapBonusAnswer(i) {
  const traps = getActiveTraps();
  const trap  = traps[G.trap];
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
  const traps = getActiveTraps();
  if (!G.freezeEnd) G.freezeEnd = Date.now() + (traps[G.trap]?.freezeSec || 60) * 1000;
  updateFreezeDisplay();
  _freezeInterval = setInterval(() => {
    const rem = Math.max(0, Math.ceil((G.freezeEnd - Date.now()) / 1000));
    document.getElementById('trap-timer').textContent = fmtSec(rem);
    if (rem <= 0) {
      clearInterval(_freezeInterval); _freezeInterval = null;
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
    s.className   = 'snowflake';
    s.textContent = ['❄️','🌨️','❄️','⛄'][i % 4];
    s.style.cssText = `left:${Math.random()*95}%;top:${-Math.random()*50}%;font-size:${14+Math.random()*22}px;animation-duration:${4+Math.random()*6}s;animation-delay:${Math.random()*4}s;`;
    c.appendChild(s);
  }
}

// ─── FINISH ──────────────────────────────────────────────────────────────────

function renderFinish() {
  const caches = getActiveCaches();
  if (!G.endTime) { G.endTime = Date.now(); save(); }
  const elapsed = G.endTime - (G.startTime || G.endTime);
  const m = Math.floor(elapsed / 60000);
  const s = Math.floor((elapsed % 60000) / 1000);
  document.getElementById('fin-team-name').textContent = `${G.teamEmoji || ''} The ${G.team || 'Team'}`;
  document.getElementById('fin-subtitle').textContent  = `All ${caches.length} caches found!`;
  document.getElementById('fin-score').textContent     = G.coins;
  document.getElementById('fin-time').textContent      = `Time: ${m}m ${s}s`;
  setTimeout(spawnFireworks, 300);
}

function submitToBot() {
  const caches = getActiveCaches();
  const tg     = window.Telegram?.WebApp;
  if (tg && tg.sendData) {
    tg.sendData(JSON.stringify({
      type: 'score', team: G.team, teamId: G.teamId,
      coins: G.coins, caches: G.done.length,
      time: Math.floor((G.endTime - G.startTime) / 1000),
    }));
  } else {
    alert(`Score: ${G.coins} ⭐ | Team: The ${G.team} | Caches: ${G.done.length}/${caches.length}\n\nShow this to your teacher!`);
  }
}

function spawnFireworks() {
  const emojis = ['🎉','🌟','✨','🌿','🏆','⭐','🌸','🎊'];
  for (let i = 0; i < 16; i++) {
    setTimeout(() => {
      const el = document.createElement('div');
      el.className   = 'firework';
      el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      el.style.cssText = `left:${Math.random()*90}vw;font-size:${24+Math.random()*28}px;animation-duration:${1.5+Math.random()*1.5}s;`;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 3000);
    }, i * 200);
  }
}

// ════════════════════════════════════════════════════════════════════════════
//  TEACHER PANEL
// ════════════════════════════════════════════════════════════════════════════

let TP = {
  tab:          'caches',   // active tab
  view:         'list',     // 'list' | 'edit-cache' | 'edit-trap'
  editCacheIdx: null,
  editTrapKey:  null,
  draft:        null,       // current edit draft (deep copy)
};

// ── Open / Close ──────────────────────────────────────────────────────────────

function openTeacher() {
  const pin = prompt('Enter teacher PIN:');
  if (pin !== getActiveSettings().teacherPin) { alert('Wrong PIN!'); return; }
  TP.tab = 'caches'; TP.view = 'list';
  tpRender();
  document.getElementById('o-teacher').classList.add('active');
}

function closeTeacher() {
  fbStopListenLeaderboard();
  document.getElementById('o-teacher').classList.remove('active');
}

// ── Tab switching ─────────────────────────────────────────────────────────────

function tpSetTab(tab) {
  TP.tab  = tab;
  TP.view = 'list';
  TP.draft = null;
  document.querySelectorAll('.tp-tab').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tab);
  });
  tpRenderContent();
  tpUpdateBar();
}

// ── Back navigation ───────────────────────────────────────────────────────────

function tpBack() {
  TP.view  = 'list';
  TP.draft = null;
  tpRenderContent();
  tpUpdateBar();
}

function tpUpdateBar() {
  const backBtn   = document.getElementById('tp-back-btn');
  const titleEl   = document.getElementById('tp-bar-title');
  const tabsEl    = document.getElementById('tp-tabs');
  const inEdit    = TP.view !== 'list';
  backBtn.style.display = inEdit ? 'block' : 'none';
  tabsEl.style.display  = inEdit ? 'none' : 'flex';

  const caches = getActiveCaches();
  const titles = {
    list:         '🔑 Teacher Panel',
    'edit-cache': `✏️ Edit Cache #${(TP.editCacheIdx ?? 0) + 1}`,
    'new-cache':  `➕ New Cache #${caches.length + 1}`,
    'edit-trap':  `✏️ Edit Trap`,
    'new-trap':   `➕ New Trap`,
  };
  titleEl.textContent = titles[TP.view] || '🔑 Teacher Panel';
}

// ── Main render dispatcher ────────────────────────────────────────────────────

function tpRender() {
  // Sync tab UI
  document.querySelectorAll('.tp-tab').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === TP.tab);
  });
  tpRenderContent();
  tpUpdateBar();
}

function tpRenderContent() {
  const el = document.getElementById('tp-content');
  switch (TP.view) {
    case 'list':
      switch (TP.tab) {
        case 'caches':   el.innerHTML = tpHtmlCacheList();   break;
        case 'traps':    el.innerHTML = tpHtmlTrapList();    break;
        case 'qr':       el.innerHTML = tpHtmlQR();          break;
        case 'live':     el.innerHTML = tpHtmlLive([]);      tpStartLive(); break;
        case 'settings': el.innerHTML = tpHtmlSettings();    break;
      }
      break;
    case 'edit-cache': el.innerHTML = tpHtmlCacheEdit(false); break;
    case 'new-cache':  el.innerHTML = tpHtmlCacheEdit(true);  break;
    case 'edit-trap':  el.innerHTML = tpHtmlTrapEdit();       break;
    case 'new-trap':   el.innerHTML = tpHtmlTrapEdit(true);   break;
  }
}

// ── CACHES TAB ────────────────────────────────────────────────────────────────

function tpHtmlCacheList() {
  const caches = getActiveCaches();
  return `
    <div class="tp-hint">Tap a cache to edit its clue, question, or answers.</div>
    ${caches.map((c, i) => `
      <div class="tp-item-card" onclick="tpEditCache(${i})">
        <div class="tp-item-num">${i + 1}</div>
        <div class="tp-item-body">
          <div class="tp-item-title">Cache #${i + 1} &mdash; ${c.coord}</div>
          <div class="tp-item-sub">${c.task.type.toUpperCase()} · ${c.coins} ⭐ · ${c.task.question.slice(0, 45)}…</div>
        </div>
        <div class="tp-item-arrow">›</div>
      </div>
    `).join('')}
    <button class="tp-add-btn" onclick="tpNewCache()">➕ Add new cache</button>
  `;
}

function tpNewCache() {
  const caches = getActiveCaches();
  const prevLast = caches[caches.length - 1];
  TP.editCacheIdx = null;
  TP.draft = {
    id:        `C${String(caches.length + 1).padStart(2, '0')}`,
    qr:        `WQUEST-C${String(caches.length + 1).padStart(2, '0')}`,
    coord:     '',
    clue:      '',
    task: {
      type:    'mcq',
      label:   'TASK · MULTIPLE CHOICE',
      question:'',
      options: ['', '', '', ''],
      correct: 0,
    },
    nextClue:  '',
    nextCoord: 'FINISH',
    coins:     40,
    isLast:    true,
  };
  // Previous last cache loses its isLast flag
  TP._prevLastIdx = caches.length - 1;
  TP.view = 'new-cache';
  tpRenderContent();
  tpUpdateBar();
}

function tpEditCache(idx) {
  const caches = getActiveCaches();
  TP.editCacheIdx = idx;
  TP.draft        = JSON.parse(JSON.stringify(caches[idx])); // deep copy
  TP.view         = 'edit-cache';
  tpRenderContent();
  tpUpdateBar();
}

function tpHtmlCacheEdit(isNew = false) {
  const d = TP.draft;
  const isMCQ        = d.task.type === 'mcq';
  const isUnscramble = d.task.type === 'unscramble';
  const isLast       = !!d.isLast;

  const optRows = (d.task.options || ['','','','']).map((o, i) => `
    <div class="opt-editor-row ${d.task.correct === i ? 'correct' : ''}" id="opt-row-${i}">
      <input type="radio" class="opt-radio" name="tp-correct" value="${i}"
             ${d.task.correct === i ? 'checked' : ''}
             onchange="tpSetCorrect(${i})">
      <input class="opt-editor-input" type="text" value="${escHtml(o)}"
             placeholder="Option ${i+1}"
             oninput="tpDraft('task.options.${i}', this.value)">
    </div>
  `).join('');

  return `
    <div class="tp-section">
      <div class="tp-section-title">📍 LOCATION</div>
      <div class="tp-field">
        <div class="tp-label">Coordinate (e.g. A·1)</div>
        <input class="tp-input" type="text" value="${escHtml(d.coord)}" oninput="tpDraft('coord', this.value)">
      </div>
      <div class="tp-field">
        <div class="tp-label">Clue text (shown to students)</div>
        <textarea class="tp-textarea" oninput="tpDraft('clue', this.value)">${escHtml(d.clue)}</textarea>
      </div>
    </div>

    <div class="tp-section">
      <div class="tp-section-title">🧩 TASK</div>
      <div class="tp-field">
        <div class="tp-label">Task type</div>
        <select class="tp-select" onchange="tpChangeCacheType(this.value)">
          <option value="mcq"        ${d.task.type==='mcq'?'selected':''}>Multiple Choice (MCQ)</option>
          <option value="unscramble" ${d.task.type==='unscramble'?'selected':''}>Unscramble letters</option>
        </select>
      </div>
      <div class="tp-field">
        <div class="tp-label">Task label (e.g. TASK · FILL THE GAP)</div>
        <input class="tp-input" type="text" value="${escHtml(d.task.label)}" oninput="tpDraft('task.label', this.value)">
      </div>
      <div class="tp-field">
        <div class="tp-label">Question</div>
        <textarea class="tp-textarea" oninput="tpDraft('task.question', this.value)">${escHtml(d.task.question)}</textarea>
      </div>

      ${isMCQ ? `
        <div class="tp-field">
          <div class="tp-label">Answer options (select ● the correct one)</div>
          <div class="opt-editor">${optRows}</div>
        </div>
      ` : ''}

      ${isUnscramble ? `
        <div class="tp-field">
          <div class="tp-label">Answer word (auto-scrambled for students)</div>
          <input class="tp-input" type="text" value="${escHtml(d.task.answer||'')}"
                 placeholder="e.g. EVEREST"
                 oninput="tpDraft('task.answer', this.value.toUpperCase())">
        </div>
      ` : ''}
    </div>

    <div class="tp-section">
      <div class="tp-section-title">➡️ NEXT STEP</div>
      ${!isLast ? `
        <div class="tp-field">
          <div class="tp-label">Next cache coordinate</div>
          <input class="tp-input" type="text" value="${escHtml(d.nextCoord||'')}" oninput="tpDraft('nextCoord', this.value)">
        </div>
        <div class="tp-field">
          <div class="tp-label">Next clue text</div>
          <textarea class="tp-textarea" oninput="tpDraft('nextClue', this.value)">${escHtml(d.nextClue||'')}</textarea>
        </div>
      ` : `<div class="tp-hint">This is the last cache — no next clue needed.</div>`}
      <div class="tp-field">
        <div class="tp-label">Coins reward for correct answer</div>
        <input class="tp-input-sm" type="number" min="0" max="999" value="${d.coins}"
               oninput="tpDraft('coins', Number(this.value))">
      </div>
    </div>

    <button class="tp-save-btn" onclick="tpSaveCache()">${isNew ? '➕ Add Cache' : '💾 Save Cache'}</button>
    ${!isNew && TP.editCacheIdx !== null && getActiveCaches().length > 1 ? `
      <div style="height:8px;"></div>
      <button class="tp-delete-btn" onclick="tpDeleteCache(${TP.editCacheIdx})">🗑️ Delete this cache</button>
    ` : ''}
    <div style="height:8px;"></div>
  `;
}

function tpChangeCacheType(type) {
  TP.draft.task.type = type;
  if (type === 'mcq') {
    TP.draft.task.options = TP.draft.task.options || ['','','',''];
    TP.draft.task.correct = TP.draft.task.correct ?? 0;
    TP.draft.task.label   = TP.draft.task.label || 'TASK · MULTIPLE CHOICE';
  } else {
    TP.draft.task.answer   = TP.draft.task.answer || '';
    TP.draft.task.scrambled = [];
    TP.draft.task.label    = TP.draft.task.label || 'TASK · UNSCRAMBLE';
  }
  tpRenderContent();
}

function tpSetCorrect(i) {
  TP.draft.task.correct = i;
  document.querySelectorAll('.opt-editor-row').forEach((row, idx) => {
    row.classList.toggle('correct', idx === i);
  });
}

function tpSaveCache() {
  const d = TP.draft;

  // Auto-generate scrambled letters for unscramble tasks
  if (d.task.type === 'unscramble' && d.task.answer) {
    d.task.scrambled = shuffle(d.task.answer.toUpperCase().split(''));
  }

  const cfg = loadCfg();
  if (!cfg.caches) cfg.caches = JSON.parse(JSON.stringify(getActiveCaches()));

  if (TP.view === 'new-cache') {
    // Clear isLast from the previous last cache
    if (TP._prevLastIdx != null && cfg.caches[TP._prevLastIdx]) {
      cfg.caches[TP._prevLastIdx].isLast = false;
    }
    cfg.caches.push(d);
    tpShowToast('✅ Cache added!');
  } else {
    cfg.caches[TP.editCacheIdx] = d;
    tpShowToast('✅ Cache saved!');
  }

  saveCfg(cfg);
  tpBack();
}

function tpDeleteCache(idx) {
  const caches = getActiveCaches();
  if (caches.length <= 1) { alert('Cannot delete the only cache!'); return; }
  if (!confirm(`Delete Cache #${idx + 1}?`)) return;

  const cfg = loadCfg();
  if (!cfg.caches) cfg.caches = JSON.parse(JSON.stringify(caches));
  cfg.caches.splice(idx, 1);

  // Make sure the last remaining cache has isLast: true
  cfg.caches[cfg.caches.length - 1].isLast = true;
  // All others must not have isLast
  for (let i = 0; i < cfg.caches.length - 1; i++) {
    cfg.caches[i].isLast = false;
  }

  saveCfg(cfg);
  tpShowToast('🗑️ Cache deleted');
  tpBack();
}

// ── TRAPS TAB ─────────────────────────────────────────────────────────────────

function tpHtmlTrapList() {
  const traps = getActiveTraps();
  const keys  = Object.keys(traps);
  return `
    <div class="tp-hint">Trap codes freeze students for a set time. Tap to edit.</div>
    ${keys.map(k => `
      <div class="tp-item-card" onclick="tpEditTrap('${k}')">
        <div class="tp-item-num trap">${traps[k].emoji}</div>
        <div class="tp-item-body">
          <div class="tp-item-title">${traps[k].title}</div>
          <div class="tp-item-sub">${k} · Freeze: ${traps[k].freezeSec}s</div>
        </div>
        <div class="tp-item-arrow">›</div>
      </div>
    `).join('')}
    <button class="tp-add-btn" onclick="tpNewTrap()">＋ Add new trap</button>
  `;
}

function tpEditTrap(key) {
  const traps  = getActiveTraps();
  TP.editTrapKey = key;
  TP.draft       = JSON.parse(JSON.stringify(traps[key]));
  TP.draft._qrKey = key; // store original key
  TP.view        = 'edit-trap';
  tpRenderContent();
  tpUpdateBar();
}

function tpNewTrap() {
  TP.editTrapKey = null;
  TP.draft = {
    _qrKey:    'WQUEST-TRAP-NEW',
    title:     'NEW TRAP!',
    emoji:     '⚡',
    msg:       'Your team hit a trap!',
    freezeSec: 60,
    bonus: { q: '', opts: ['','','',''], correct: 0 },
    bonusSec:  15,
  };
  TP.view = 'new-trap';
  tpRenderContent();
  tpUpdateBar();
}

function tpHtmlTrapEdit(isNew = false) {
  const d = TP.draft;
  const optRows = (d.bonus.opts || ['','','','']).map((o, i) => `
    <div class="opt-editor-row ${d.bonus.correct === i ? 'correct' : ''}" id="trap-opt-row-${i}">
      <input type="radio" class="opt-radio" name="tp-trap-correct" value="${i}"
             ${d.bonus.correct === i ? 'checked' : ''}
             onchange="tpSetTrapCorrect(${i})">
      <input class="opt-editor-input" type="text" value="${escHtml(o)}"
             placeholder="Option ${i+1}"
             oninput="tpDraft('bonus.opts.${i}', this.value)">
    </div>
  `).join('');

  return `
    <div class="tp-section">
      <div class="tp-section-title">🔖 QR CODE IDENTITY</div>
      <div class="tp-field">
        <div class="tp-label">QR code text (what you print)</div>
        <input class="tp-input" type="text" value="${escHtml(d._qrKey)}"
               placeholder="e.g. WQUEST-TRAP-VOLCANO"
               oninput="tpDraft('_qrKey', this.value.toUpperCase())">
      </div>
      <div class="tp-field">
        <div class="tp-label">Title shown to students</div>
        <input class="tp-input" type="text" value="${escHtml(d.title)}" oninput="tpDraft('title', this.value)">
      </div>
      <div class="tp-field">
        <div class="tp-label">Emoji (❄️ ⛈️ 🌋 🌊 🔥 etc.)</div>
        <input class="tp-input" type="text" value="${escHtml(d.emoji)}" oninput="tpDraft('emoji', this.value)">
      </div>
      <div class="tp-field">
        <div class="tp-label">Message shown to frozen team</div>
        <textarea class="tp-textarea" oninput="tpDraft('msg', this.value)">${escHtml(d.msg)}</textarea>
      </div>
    </div>

    <div class="tp-section">
      <div class="tp-section-title">⏱️ FREEZE SETTINGS</div>
      <div class="tp-field">
        <div class="tp-label">Freeze duration (seconds)</div>
        <input class="tp-input-sm" type="number" min="5" max="300" value="${d.freezeSec}"
               oninput="tpDraft('freezeSec', Number(this.value))">
      </div>
    </div>

    <div class="tp-section">
      <div class="tp-section-title">🎯 BONUS RIDDLE (reduces freeze time)</div>
      <div class="tp-field">
        <div class="tp-label">Bonus seconds saved for correct answer</div>
        <input class="tp-input-sm" type="number" min="0" max="300" value="${d.bonusSec}"
               oninput="tpDraft('bonusSec', Number(this.value))">
      </div>
      <div class="tp-field">
        <div class="tp-label">Bonus question text</div>
        <textarea class="tp-textarea" oninput="tpDraft('bonus.q', this.value)">${escHtml(d.bonus.q)}</textarea>
      </div>
      <div class="tp-field">
        <div class="tp-label">Bonus answer options (select ● the correct one)</div>
        <div class="opt-editor">${optRows}</div>
      </div>
    </div>

    <button class="tp-save-btn" onclick="tpSaveTrap()">💾 Save Trap</button>
    ${!isNew ? `
      <div style="height:8px;"></div>
      <button class="tp-delete-btn" onclick="tpDeleteTrap('${TP.editTrapKey}')">🗑️ Delete this trap</button>
    ` : ''}
    <div style="height:8px;"></div>
  `;
}

function tpSetTrapCorrect(i) {
  TP.draft.bonus.correct = i;
  document.querySelectorAll('#trap-bonus-opts .opt-editor-row, [id^="trap-opt-row"]').forEach((row, idx) => {
    row.classList.toggle('correct', idx === i);
  });
}

function tpSaveTrap() {
  const cfg   = loadCfg();
  if (!cfg.traps) cfg.traps = JSON.parse(JSON.stringify(getActiveTraps()));

  const d      = TP.draft;
  const newKey = d._qrKey;
  const oldKey = TP.editTrapKey;

  const { _qrKey, ...trapData } = d; // remove internal key from saved data

  // If key changed, remove old entry
  if (oldKey && oldKey !== newKey) delete cfg.traps[oldKey];
  cfg.traps[newKey] = trapData;

  saveCfg(cfg);
  tpShowToast('✅ Trap saved!');
  tpBack();
}

function tpDeleteTrap(key) {
  if (!confirm(`Delete trap "${key}"?`)) return;
  const cfg = loadCfg();
  if (!cfg.traps) cfg.traps = JSON.parse(JSON.stringify(getActiveTraps()));
  delete cfg.traps[key];
  saveCfg(cfg);
  tpShowToast('🗑️ Trap deleted');
  tpBack();
}

// ── LIVE LEADERBOARD TAB ─────────────────────────────────────────────────────

function tpStartLive() {
  fbListenLeaderboard(teams => {
    if (TP.tab !== 'live' || TP.view !== 'list') return;
    const el = document.getElementById('tp-content');
    if (el) el.innerHTML = tpHtmlLive(teams);
  });
}

function tpHtmlLive(teams = []) {
  if (!teams.length) return `
    <div class="tp-hint">No teams have joined yet. Waiting for students…</div>
    <div style="text-align:center;font-size:48px;margin-top:32px;opacity:.4;">⏳</div>
  `;

  const sorted = [...teams].sort((a, b) => (b.coins || 0) - (a.coins || 0));
  const medal  = ['🥇','🥈','🥉'];

  return `
    <div class="tp-hint" style="margin-bottom:4px;">
      Live · <b>${teams.length}</b> team${teams.length !== 1 ? 's' : ''} active
    </div>
    ${sorted.map((t, i) => `
      <div class="tp-item-card" style="cursor:default;">
        <div class="tp-item-num" style="background:${
          i === 0 ? '#E8B547' : i === 1 ? '#A89472' : i === 2 ? '#8B5E37' : 'var(--moss-deep)'
        };font-size:${i < 3 ? '18px' : '16px'};">
          ${i < 3 ? medal[i] : i + 1}
        </div>
        <div class="tp-item-body">
          <div class="tp-item-title">${escHtml(t.emoji || '🌿')} ${escHtml(t.name || '—')}</div>
          <div class="tp-item-sub">
            ${t.done?.length || 0}/${getActiveCaches().length} caches
            ${t.isFrozen ? '· ❄️ frozen' : ''}
            ${t.gameComplete ? '· 🏆 FINISHED' : '· cache #' + ((t.cacheIndex || 0) + 1)}
          </div>
        </div>
        <div style="text-align:right;flex-shrink:0;">
          <div style="font-family:var(--fd);font-weight:800;font-size:20px;color:var(--bark);">
            ${t.coins || 0}
          </div>
          <div style="font-size:9px;color:var(--ink-s);font-family:var(--fm);">⭐ COINS</div>
        </div>
      </div>
    `).join('')}
    <button class="tp-delete-btn" style="margin-top:8px;"
            onclick="if(confirm('Clear all team data from Firebase?')){fbResetTeams().then(()=>tpShowToast('✅ All teams cleared'));}">
      🗑️ Clear all teams
    </button>
  `;
}

// ── QR PRINT TAB ──────────────────────────────────────────────────────────────

function tpHtmlQR() {
  const caches = getActiveCaches();
  const traps  = getActiveTraps();

  const cacheCards = caches.map((c, i) => `
    <div class="tp-qr-card">
      <div class="tp-qr-code">${c.qr}</div>
      <div class="tp-qr-desc">Cache #${i+1} · Coordinate ${c.coord}<br>${c.clue.slice(1, 60)}…</div>
      <button class="tp-copy-btn" onclick="tpCopy('${c.qr}', this)">📋 Copy</button>
    </div>
  `).join('');

  const trapCards = Object.entries(traps).map(([k, t]) => `
    <div class="tp-qr-card is-trap">
      <div class="tp-qr-code">${k}</div>
      <div class="tp-qr-desc">${t.title} · Freeze ${t.freezeSec}s</div>
      <button class="tp-copy-btn" onclick="tpCopy('${k}', this)">📋 Copy</button>
    </div>
  `).join('');

  return `
    <div class="tp-hint">
      Copy each code below and paste it into <b>qr-code-generator.com</b> to generate a printable QR code.
    </div>
    <div class="tp-section-title" style="padding:0;">✅ CACHE CODES</div>
    ${cacheCards}
    <div class="tp-section-title" style="padding:8px 0 0;">❌ TRAP CODES</div>
    ${trapCards}
  `;
}

function tpCopy(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    btn.textContent = '✅ Copied!';
    setTimeout(() => btn.textContent = '📋 Copy', 1500);
  }).catch(() => {
    prompt('Copy this text:', text);
  });
}

// ── SETTINGS TAB ─────────────────────────────────────────────────────────────

function tpHtmlSettings() {
  const s = getActiveSettings();
  return `
    <div class="tp-section">
      <div class="tp-section-title">🎓 GAME SETTINGS</div>
      <div class="tp-field">
        <div class="tp-label">Class name (shown in header)</div>
        <input class="tp-input" type="text" id="s-class" value="${escHtml(s.className)}">
      </div>
      <div class="tp-field">
        <div class="tp-label">Wrong answer penalty (coins)</div>
        <input class="tp-input-sm" type="number" min="0" max="100" id="s-fine" value="${s.wrongAnswerFine}">
      </div>
      <div class="tp-field">
        <div class="tp-label">Teacher PIN</div>
        <input class="tp-input" type="text" id="s-pin" value="${escHtml(s.teacherPin)}" maxlength="20">
      </div>
      <button class="tp-save-btn" onclick="tpSaveSettings()">💾 Save Settings</button>
    </div>

    <div class="tp-section">
      <div class="tp-section-title">☁️ FIREBASE SYNC</div>
      <div class="tp-hint">
        All edits are saved to Firebase automatically. Students get updates in real-time — no link sharing needed.
        Use the <b>📊 Live</b> tab to see all teams.
      </div>
    </div>

    <div class="tp-section">
      <div class="tp-section-title">🔄 RESET OPTIONS</div>
      <div class="tp-hint" style="margin-bottom:10px;">
        Resetting game data clears students' progress. Resetting configuration restores all questions to defaults.
      </div>
      <button class="tp-delete-btn" style="margin-bottom:8px;"
              onclick="if(confirm('Reset all student game data?')){ resetGame(); closeTeacher(); }">
        🗑️ Reset all student progress
      </button>
      <button class="tp-delete-btn"
              onclick="if(confirm('Reset ALL custom questions, traps, and settings to defaults?')){ localStorage.removeItem('wq_config'); tpShowToast('✅ Config reset to defaults'); tpRenderContent(); }">
        ↩️ Reset config to defaults
      </button>
    </div>
  `;
}

function tpShareConfig() {
  const cfg = loadCfg();
  if (!Object.keys(cfg).length) {
    tpShowToast('ℹ️ No custom config yet — using defaults');
    return;
  }
  try {
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(cfg))));
    const url = window.location.origin + window.location.pathname + '?cfg=' + encoded;
    document.getElementById('tp-share-url').textContent = url;
    document.getElementById('tp-share-result').style.display = 'block';

    // Try Telegram share directly
    const tg = window.Telegram?.WebApp;
    if (tg?.openTelegramLink) {
      const shareText = encodeURIComponent('🧭 WordQuest — open this link to load the game config:\n' + url);
      // Telegram share URL
      tg.openTelegramLink('https://t.me/share/url?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent('🧭 WordQuest game config'));
    }
  } catch (e) {
    tpShowToast('❌ Error generating link');
  }
}

function tpCopyShareUrl() {
  const url = document.getElementById('tp-share-url').textContent;
  navigator.clipboard.writeText(url).then(() => {
    tpShowToast('✅ Link copied!');
  }).catch(() => {
    prompt('Copy this link and send to students:', url);
  });
}

function tpSaveSettings() {
  const cfg = loadCfg();
  cfg.settings = {
    className:       document.getElementById('s-class').value.trim(),
    wrongAnswerFine: Number(document.getElementById('s-fine').value),
    teacherPin:      document.getElementById('s-pin').value.trim() || '1234',
  };
  saveCfg(cfg);
  tpShowToast('✅ Settings saved!');
}

// ── Draft helper — deep-set nested path ──────────────────────────────────────

function tpDraft(path, value) {
  const parts = path.split('.');
  let obj = TP.draft;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = isNaN(parts[i]) ? parts[i] : Number(parts[i]);
    if (obj[key] === undefined || obj[key] === null) obj[key] = {};
    obj = obj[key];
  }
  const last = parts[parts.length - 1];
  obj[isNaN(last) ? last : Number(last)] = value;
}

// ── Toast notification ────────────────────────────────────────────────────────

function tpShowToast(msg) {
  const t = document.createElement('div');
  t.className   = 'tp-success-toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2200);
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

function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
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

  // Ripple effect on tap for all interactive elements
  document.addEventListener('pointerdown', e => {
    const el = e.target.closest('.btn, .opt-btn, .team-card, .letter-tile, .tp-item-card, .tp-save-btn, .tp-delete-btn, .tp-add-btn, .tp-tab');
    if (!el) return;
    const r   = el.getBoundingClientRect();
    const rip = document.createElement('span');
    rip.className   = 'ripple-el';
    rip.style.left  = (e.clientX - r.left - 5) + 'px';
    rip.style.top   = (e.clientY - r.top  - 5) + 'px';
    el.appendChild(rip);
    setTimeout(() => rip.remove(), 600);
  }, { passive: true });

  // Listen for config changes from teacher in real-time
  // When teacher edits caches/traps → all students get it instantly
  fbListenConfig(cfg => {
    saveCfgLocal(cfg); // local only, no re-write to Firebase
    // Re-render current screen if game is active
    if (G.screen === 'hunt')   renderHunt();
    if (G.screen === 'task')   renderTask();
  });

  const had = load();
  if (had && G.team) {
    if (G.isFrozen && G.freezeEnd && Date.now() < G.freezeEnd) {
      navigate('trap');
    } else {
      if (G.isFrozen) { G.isFrozen = false; G.freezeEnd = null; G.trap = null; save(); }
      const caches = getActiveCaches();
      if (G.done.length >= caches.length) navigate('finish');
      else if (G.found) navigate('task');
      else navigate('hunt');
    }
  } else {
    navigate('welcome');
  }
})();
