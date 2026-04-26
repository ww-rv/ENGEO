// ════════════════════════════════════════════════════════════════════════════
//  WordQuest — Firebase Integration
//  Realtime Database: конфіг гри + прогрес всіх команд
// ════════════════════════════════════════════════════════════════════════════

'use strict';

const FB_CONFIG = {
  apiKey:            'AIzaSyCI9eZj_b2g_8P1oxjMaLmiSl62h-nCvGw',
  authDomain:        'engeo-4ca52.firebaseapp.com',
  databaseURL:       'https://engeo-4ca52-default-rtdb.europe-west1.firebasedatabase.app',
  projectId:         'engeo-4ca52',
  storageBucket:     'engeo-4ca52.firebasestorage.app',
  messagingSenderId: '885776659240',
  appId:             '1:885776659240:web:aafe71b7ff17b61844d61d',
};

firebase.initializeApp(FB_CONFIG);
const _db   = firebase.database();
const _ROOT = 'wordquest';

// ── Config (вчитель пише → всі учні читають у реальному часі) ────────────────

function fbSaveConfig(cfg) {
  return _db.ref(`${_ROOT}/config`).set(cfg)
    .catch(e => console.warn('[FB] save config:', e));
}

function fbListenConfig(callback) {
  _db.ref(`${_ROOT}/config`).on('value', snap => {
    const val = snap.val();
    if (val) callback(val);
  }, e => console.warn('[FB] listen config:', e));
}

function fbStopListenConfig() {
  _db.ref(`${_ROOT}/config`).off('value');
}

// ── Команди (кожна команда пише свій прогрес) ────────────────────────────────

function fbSaveTeam(key, data) {
  return _db.ref(`${_ROOT}/teams/${key}`).set({ ...data, ts: Date.now() })
    .catch(e => console.warn('[FB] save team:', e));
}

function fbListenLeaderboard(callback) {
  _db.ref(`${_ROOT}/teams`).on('value', snap => {
    const teams = [];
    snap.forEach(child => teams.push({ _key: child.key, ...child.val() }));
    callback(teams);
  }, e => console.warn('[FB] listen lb:', e));
}

function fbStopListenLeaderboard() {
  _db.ref(`${_ROOT}/teams`).off('value');
}

function fbResetTeams() {
  return _db.ref(`${_ROOT}/teams`).remove()
    .catch(e => console.warn('[FB] reset teams:', e));
}
