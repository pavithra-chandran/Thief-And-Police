import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, update, onValue, push, remove } from 'firebase/database';

// Replace these with your Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyCUaDOZUucwWk1KfzezhijFD-RTBfoIVB8",
  authDomain: "kings-court-game.firebaseapp.com",
  databaseURL: "https://kings-court-game-default-rtdb.firebaseio.com",
  projectId: "kings-court-game",
  storageBucket: "kings-court-game.firebasestorage.app",
  messagingSenderId: "65098999010",
  appId: "1:65098999010:web:a341cb8637d3a125a3eabb",
  measurementId: "G-JVDLL8P803"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

// ── Game ──────────────────────────────────────────────────────────────────────

const generateCode = () =>
  Math.random().toString(36).substring(2, 6).toUpperCase() +
  '-' +
  Math.random().toString(36).substring(2, 6).toUpperCase();

export const generateUniqueGameCode = async () => {
  let code;
  let exists = true;
  while (exists) {
    code = generateCode();
    const snap = await get(ref(db, `games/${code}`));
    exists = snap.exists();
  }
  return code;
};

export const createGame = async (gameCode, hostName, totalRounds = 5) => {
  const playerId = push(ref(db, `games/${gameCode}/players`)).key;
  await set(ref(db, `games/${gameCode}`), {
    host: playerId,
    status: 'waiting',
    totalRounds,
    currentRound: 1,
    players: {
      [playerId]: { name: hostName, ready: false, score: 0, totalScore: 0 }
    }
  });
  return playerId;
};

export const waitAndJoinGame = async (gameCode, playerName, onWaiting) => {
  const POLL_INTERVAL = 2000;
  const MAX_WAIT = 30000;
  const started = Date.now();

  while (Date.now() - started < MAX_WAIT) {
    const snap = await get(ref(db, `games/${gameCode}`));
    if (snap.exists()) {
      const gameData = snap.val();
      if (gameData.status !== 'waiting') throw new Error('Game already started');
      const currentCount = Object.keys(gameData.players || {}).length;
      if (currentCount >= MAX_PLAYERS) throw new Error(`Maximum ${MAX_PLAYERS} players allowed`);
      // Lobby found — join now
      const playerId = push(ref(db, `games/${gameCode}/players`)).key;
      await set(ref(db, `games/${gameCode}/players/${playerId}`), {
        name: playerName, ready: false, score: 0
      });
      return playerId;
    }
    // Lobby not created yet — notify UI and wait
    const secondsLeft = Math.ceil((MAX_WAIT - (Date.now() - started)) / 1000);
    onWaiting(secondsLeft);
    await new Promise(r => setTimeout(r, POLL_INTERVAL));
  }
  throw new Error('Lobby not found. Ask the host to create the game first.');
};

export const joinGame = async (gameCode, playerName) => {
  const gameSnap = await get(ref(db, `games/${gameCode}`));
  if (!gameSnap.exists()) throw new Error('Game not found');
  const gameData = gameSnap.val();
  if (gameData.status !== 'waiting') throw new Error('Game already started');
  const currentCount = Object.keys(gameData.players || {}).length;
  if (currentCount >= MAX_PLAYERS) throw new Error(`Maximum ${MAX_PLAYERS} players allowed`);

  const playerId = push(ref(db, `games/${gameCode}/players`)).key;
  await set(ref(db, `games/${gameCode}/players/${playerId}`), {
    name: playerName, ready: false, score: 0
  });
  return playerId;
};

export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 16;

// Each player count gets exactly these roles (one per player, no duplicates)
const ROLE_ORDER = [
  'Rajavu',         // 3 players
  'Kallan',         // 3 players
  'Police',         // 3 players
  'Rani',           // 4 players
  'Mantri',         // 5 players
  'Bhadan',         // 6 players
  'Thozhi',         // 7 players
  'Dasi',           // 8 players
  'Kavalalkaran',   // 9 players
  'Dhoodhan',       // 10 players
  'Paachakakkaran', // 11 players
  'Vyapari',        // 12 players
  'Karshakan',      // 13 players
  'Vaidyan',        // 14 players
  'Nayathipathi',   // 15 players
  'Vidushakan',     // 16 players
];

// Returns exactly `count` unique roles, always including Rajavu, Kallan, Police
export const getRolesForCount = (count) =>
  ROLE_ORDER.slice(0, count);

export const assignRoles = async (gameCode) => {
  const snap = await get(ref(db, `games/${gameCode}/players`));
  const data = snap.val();
  if (!data) return;
  // Skip if all players already have roles assigned
  const ids = Object.keys(data);
  if (ids.every(id => data[id].role)) return;
  const roles = getRolesForCount(ids.length).sort(() => Math.random() - 0.5);
  const updates = {};
  ids.forEach((id, i) => { updates[`games/${gameCode}/players/${id}/role`] = roles[i]; });
  await update(ref(db), updates);
};

// Swap roles between the guesser and the wrongly guessed player, reset chain
export const reassignRoles = async (gameCode, guesserId, wrongGuessedId) => {
  const snap = await get(ref(db, `games/${gameCode}/players`));
  const data = snap.val();
  if (!data) return;
  const ids = Object.keys(data);
  const updates = {};
  if (guesserId && wrongGuessedId) {
    const roleA = data[guesserId]?.role ?? null;
    const roleB = data[wrongGuessedId]?.role ?? null;
    updates[`games/${gameCode}/players/${guesserId}/role`] = roleB;
    updates[`games/${gameCode}/players/${wrongGuessedId}/role`] = roleA;
  }
  ids.forEach(id => { updates[`games/${gameCode}/players/${id}/foundTarget`] = null; });
  await update(ref(db), updates);
  await update(ref(db, `games/${gameCode}`), { status: 'role-identification', wrongGuess: Date.now() });
};

export const restartGame = async (gameCode) => {
  const gameSnap = await get(ref(db, `games/${gameCode}`));
  const gameData = gameSnap.val();
  if (!gameData) return;
  const totalRounds = gameData.totalRounds || 5;
  const currentRound = gameData.currentRound || 1;
  const nextRound = currentRound + 1;
  const snap = await get(ref(db, `games/${gameCode}/players`));
  const data = snap.val();
  if (!data) return;
  const updates = {};
  Object.keys(data).forEach(id => {
    updates[`games/${gameCode}/players/${id}/role`] = null;
    updates[`games/${gameCode}/players/${id}/foundTarget`] = null;
    updates[`games/${gameCode}/players/${id}/winReason`] = null;
    updates[`games/${gameCode}/players/${id}/selectedPaper`] = null;
    updates[`games/${gameCode}/players/${id}/finished`] = null;
    updates[`games/${gameCode}/players/${id}/ready`] = false;
  });
  await update(ref(db), updates);
  if (nextRound > totalRounds) {
    await update(ref(db, `games/${gameCode}`), {
      status: 'leaderboard',
      wrongGuess: null,
      kallanCaught: null,
      currentRound: nextRound,
    });
  } else {
    await update(ref(db, `games/${gameCode}`), {
      status: 'countdown',
      wrongGuess: null,
      kallanCaught: null,
      currentRound: nextRound,
    });
  }
};

export const fullRestartGame = async (gameCode) => {
  const gameSnap = await get(ref(db, `games/${gameCode}`));
  const gameData = gameSnap.val();
  if (!gameData) return;
  const snap = await get(ref(db, `games/${gameCode}/players`));
  const data = snap.val();
  if (!data) return;
  const updates = {};
  Object.keys(data).forEach(id => {
    updates[`games/${gameCode}/players/${id}/role`] = null;
    updates[`games/${gameCode}/players/${id}/foundTarget`] = null;
    updates[`games/${gameCode}/players/${id}/winReason`] = null;
    updates[`games/${gameCode}/players/${id}/selectedPaper`] = null;
    updates[`games/${gameCode}/players/${id}/finished`] = null;
    updates[`games/${gameCode}/players/${id}/ready`] = false;
    updates[`games/${gameCode}/players/${id}/totalScore`] = 0;
  });
  await update(ref(db), updates);
  await update(ref(db, `games/${gameCode}`), {
    status: 'waiting',
    wrongGuess: null,
    kallanCaught: null,
    currentRound: 1,
    totalRounds: gameData.totalRounds || 5,
  });
};

export const updateGameStatus = (gameCode, status) =>
  update(ref(db, `games/${gameCode}`), { status });

// ── Player ────────────────────────────────────────────────────────────────────

export const setPlayerReady = (gameCode, playerId, ready) =>
  update(ref(db, `games/${gameCode}/players/${playerId}`), { ready });

export const setPlayerRole = (gameCode, playerId, role) =>
  update(ref(db, `games/${gameCode}/players/${playerId}`), { role });

export const setSelectedPaper = (gameCode, playerId, paperIndex) =>
  update(ref(db, `games/${gameCode}/players/${playerId}`), { selectedPaper: paperIndex });

export const updatePlayerScore = (gameCode, playerId, score) =>
  update(ref(db, `games/${gameCode}/players/${playerId}`), { score });

export const setPlayerFinished = (gameCode, playerId, winReason = null) =>
  update(ref(db, `games/${gameCode}/players/${playerId}`), { finished: true, winReason });

export const resetPlayerState = (gameCode, playerId) =>
  update(ref(db, `games/${gameCode}/players/${playerId}`), { isNextIdentifier: null });

export const setNextIdentifier = (gameCode, playerId) =>
  update(ref(db, `games/${gameCode}/players/${playerId}`), { isNextIdentifier: true });

export const broadcastFound = (gameCode, finderName, foundRole) =>
  update(ref(db, `games/${gameCode}`), { lastFound: { finderName, foundRole, at: Date.now() } });

export const swapRoles = async (gameCode, playerAId, playerBId) => {
  const snap = await get(ref(db, `games/${gameCode}/players`));
  const data = snap.val();
  if (!data) return;
  const roleA = data[playerAId]?.role ?? null;
  const roleB = data[playerBId]?.role ?? null;
  await update(ref(db), {
    [`games/${gameCode}/players/${playerAId}/role`]: roleB,
    [`games/${gameCode}/players/${playerBId}/role`]: roleA,
  });
  await update(ref(db, `games/${gameCode}`), { status: 'role-identification', wrongGuess: Date.now() });
};

export const swapSelectedPapers = async (gameCode, playerAId, playerBId) => {
  const snap = await get(ref(db, `games/${gameCode}/players`));
  const data = snap.val();
  if (!data) return;
  const paperA = data[playerAId]?.selectedPaper ?? null;
  const paperB = data[playerBId]?.selectedPaper ?? null;
  await update(ref(db), {
    [`games/${gameCode}/players/${playerAId}/selectedPaper`]: paperB,
    [`games/${gameCode}/players/${playerBId}/selectedPaper`]: paperA,
  });
};

// ── Listeners ─────────────────────────────────────────────────────────────────

export const listenToGame = (gameCode, callback) =>
  onValue(ref(db, `games/${gameCode}`), snap => callback(snap.val()));

export const listenToPlayers = (gameCode, callback) =>
  onValue(ref(db, `games/${gameCode}/players`), snap => callback(snap.val() || {}));

export const getGame = (gameCode) =>
  get(ref(db, `games/${gameCode}`)).then(snap => snap.val());
