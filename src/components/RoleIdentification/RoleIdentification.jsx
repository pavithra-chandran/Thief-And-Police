import React, { useState, useEffect, useRef } from 'react';
import styles from './RoleIdentification.module.css';
import { listenToPlayers, listenToGame, assignRoles, reassignRoles, db } from '../../firebase';
import { ref, update } from 'firebase/database';

const TIMER_SECONDS = 60;

// Chain order — Rajavu starts, Police always ends by catching Kallan
const CHAIN_ORDER = [
  'Rajavu', 'Rani', 'Mantri', 'Bhadan', 'Thozhi', 'Dasi',
  'Kavalalkaran', 'Dhoodhan', 'Paachakakkaran', 'Vyapari',
  'Karshakan', 'Vaidyan', 'Nayathipathi', 'Vidushakan', 'Police'
];

// What role must `myRole` find, given the roles present in this game
const getTargetRole = (myRole, presentRoles) => {
  if (myRole === 'Police') return 'Kallan';
  const chain = CHAIN_ORDER.filter(r => presentRoles.includes(r));
  const idx = chain.indexOf(myRole);
  if (idx === -1 || idx === chain.length - 1) return null;
  return chain[idx + 1];
};

// Is it currently this player's turn? All roles before them in chain must have foundTarget
const isMyTurn = (myRole, players, presentRoles) => {
  if (myRole === 'Kallan') return false;
  const chain = CHAIN_ORDER.filter(r => presentRoles.includes(r));
  const idx = chain.indexOf(myRole);
  if (idx === -1) return false;
  for (let i = 0; i < idx; i++) {
    const prevRole = chain[i];
    const prevPlayer = Object.values(players).find(p => p.role === prevRole);
    if (!prevPlayer?.foundTarget) return false;
  }
  return true;
};

const RoleIdentification = () => {
  const gameCode = sessionStorage.getItem('gameCode');
  const playerId = sessionStorage.getItem('playerId');
  const isHost = sessionStorage.getItem('isHost') === 'true';
  const playerName = sessionStorage.getItem('playerName') || 'Player';

  const [myRole, setMyRole] = useState(null);
  const [players, setPlayers] = useState({});
  const [declared, setDeclared] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [popup, setPopup] = useState(null);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [timerActive, setTimerActive] = useState(false);
  const timerRef = useRef(null);
  const lastWrongGuessRef = useRef(null);
  const [kallanCaught, setKallanCaught] = useState(false);

  useEffect(() => {
    if (!gameCode) return;
    const unsubPlayers = listenToPlayers(gameCode, (data) => {
      setPlayers(data);
      if (data[playerId]?.role) setMyRole(data[playerId].role);
    });
    const unsubGame = listenToGame(gameCode, (game) => {
      if (!game) return;
      if (game.kallanCaught) setKallanCaught(true);
      if (game.wrongGuess && game.status === 'role-identification' && game.wrongGuess !== lastWrongGuessRef.current) {
        lastWrongGuessRef.current = game.wrongGuess;
        setPopup({ type: 'wrong', message: 'Wrong Declaration! Roles are being swapped...' });
        setDeclared(false);
        setSelectedTarget(null);
        setTimerActive(false);
        setTimeLeft(TIMER_SECONDS);
        clearInterval(timerRef.current);
        setTimeout(() => setPopup(null), 3000);
      }
    });
    return () => { unsubPlayers(); unsubGame(); };
  }, [gameCode, playerId]);

  useEffect(() => {
    if (isHost && gameCode) assignRoles(gameCode);
  }, [gameCode]);

  useEffect(() => {
    if (!timerActive) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setTimerActive(false);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [timerActive]);

  const handleTimeUp = async () => {
    setPopup({ type: 'wrong', message: "Time's up! Roles are being reshuffled..." });
    await reassignRoles(gameCode, null, null);
    setTimeout(() => setPopup(null), 3000);
  };

  const presentRoles = Object.values(players).map(p => p.role).filter(Boolean);
  const targetRole = myRole ? getTargetRole(myRole, presentRoles) : null;
  const myTurn = myRole ? isMyTurn(myRole, players, presentRoles) : false;
  const alreadyFound = players[playerId]?.foundTarget;
  const canAct = myTurn && !alreadyFound;

  const handleConfirm = async () => {
    if (!selectedTarget || loading) return;
    setLoading(true);
    clearInterval(timerRef.current);
    setTimerActive(false);

    const guessedPlayer = players[selectedTarget];
    const isCorrect = guessedPlayer?.role === targetRole;

    if (isCorrect) {
      setPopup({ type: 'correct', message: `Correct! ${guessedPlayer.name} is the ${targetRole}!` });
      await update(ref(db, `games/${gameCode}/players/${playerId}`), { foundTarget: true, winReason: targetRole });
      if (myRole === 'Police') {
        await update(ref(db, `games/${gameCode}`), { kallanCaught: true });
        setTimeout(() => { setPopup(null); window.location.href = '/score-exchange'; }, 2500);
      } else {
        setTimeout(() => { setPopup(null); window.location.href = '/score-exchange'; }, 2500);
      }
    } else {
      setPopup({ type: 'wrong', message: `Wrong! ${guessedPlayer.name} is not the ${targetRole}. Swapping roles...` });
      await reassignRoles(gameCode, playerId, selectedTarget);
      setLoading(false);
      setTimeout(() => setPopup(null), 3000);
    }
  };

  const otherPlayers = Object.entries(players).filter(([id]) => id !== playerId && !players[id]?.foundTarget);
  const timerColor = timeLeft <= 10 ? styles.timerDanger : timeLeft <= 20 ? styles.timerWarning : styles.timerNormal;
  const timerPercent = (timeLeft / TIMER_SECONDS) * 100;

  return (
    <div className={styles.container}>

      {popup && (
        <div className={styles.popupOverlay}>
          <div className={`${styles.popupBox} ${popup.type === 'correct' ? styles.popupCorrect : styles.popupWrong}`}>
            <div className={styles.popupIcon}>{popup.type === 'correct' ? '✅' : '❌'}</div>
            <h2 className={styles.popupTitle}>
              {popup.type === 'correct' ? 'Correct!' : 'Wrong Declaration!'}
            </h2>
            <p className={styles.popupMessage}>{popup.message}</p>
            {popup.type === 'wrong' && <div className={styles.reshuffleSpinner}>🔄</div>}
          </div>
        </div>
      )}

      <div className={styles.crown}>👑</div>

      <header className={styles.header}>
        <div className={styles.playerNameBadge}>
          <span className={styles.playerNameIcon}>👤</span>
          <span className={styles.playerNameText}>{playerName}</span>
        </div>
        <h1 className={styles.title}>
          <span className={styles.titleMain}>Rajavu's Court</span>
          <span className={styles.titleSub}>Role Identification</span>
        </h1>
      </header>

      {declared && canAct && (
        <div className={styles.timerWrapper}>
          <div className={styles.timerRing}>
            <svg viewBox="0 0 60 60" className={styles.timerSvg}>
              <circle cx="30" cy="30" r="26" className={styles.timerTrack} />
              <circle
                cx="30" cy="30" r="26"
                className={`${styles.timerProgress} ${timerColor}`}
                strokeDasharray={`${2 * Math.PI * 26}`}
                strokeDashoffset={`${2 * Math.PI * 26 * (1 - timerPercent / 100)}`}
              />
            </svg>
            <span className={`${styles.timerCount} ${timerColor}`}>{timeLeft}</span>
          </div>
          <span className={styles.timerLabel}>seconds left</span>
        </div>
      )}

      <div className={styles.content}>
        <div className={`${styles.roleCard} ${styles.kingCard} ${declared ? styles.declared : ''}`}>
          <div className={styles.cardHeader}>
            <div className={styles.roleIcon}>♔</div>
            <h2 className={styles.roleTitle}>
              {myRole ? `Your Role: ${myRole}` : 'Loading your role...'}
            </h2>
          </div>
          <p className={styles.roleDescription}>
            {myRole === 'Kallan'
              ? '🤫 Stay hidden! The Police is looking for you.'
              : alreadyFound
              ? `✅ You found the ${targetRole}. Waiting for others...`
              : canAct && targetRole
              ? `You are the ${myRole}. Declare yourself and identify the ${targetRole}.`
              : targetRole
              ? `Your role is ${myRole}. Wait for your turn.`
              : myRole
              ? `Your role is ${myRole}.`
              : ''}
          </p>
          {canAct && !alreadyFound && (
            <button
              className={`${styles.declareBtn} ${declared ? styles.btnDeclared : ''}`}
              onClick={() => { setDeclared(true); setTimerActive(true); }}
              disabled={declared}
            >
              {declared
                ? <><span className={styles.checkmark}>✓</span> Declared</>
                : myRole === 'Police' ? 'Find the Kallan' : `Declare as ${myRole}`}
            </button>
          )}
        </div>

        {canAct && targetRole && (
          <div className={`${styles.roleCard} ${styles.queenSection} ${declared ? styles.active : ''}`}>
            <div className={styles.cardHeader}>
              <div className={styles.roleIcon}>♕</div>
              <h3 className={styles.roleTitle}>Identify the {targetRole}</h3>
            </div>

            {!declared && (
              <p className={styles.lockedMessage}>Declare yourself as {myRole} first</p>
            )}

            <ul className={styles.playersList}>
              {otherPlayers.map(([id, player], index) => (
                <li
                  key={id}
                  className={`${styles.playerCard} ${!declared ? styles.locked : ''} ${selectedTarget === id ? styles.selected : ''}`}
                  style={{ animationDelay: declared ? `${index * 0.1}s` : '0s' }}
                >
                  <div className={styles.playerInfo}>
                    <span className={styles.playerAvatar}>👤</span>
                    <span className={styles.playerName}>{player.name}</span>
                  </div>
                  <button
                    className={styles.identifyBtn}
                    onClick={() => setSelectedTarget(id)}
                    disabled={!declared}
                  >
                    {selectedTarget === id
                      ? <><span className={styles.queenCrown}>♕</span> {targetRole}</>
                      : 'Identify'}
                  </button>
                </li>
              ))}
            </ul>

            {selectedTarget && (
              <button
                className={styles.confirmBtn}
                onClick={handleConfirm}
                disabled={loading}
              >
                <span className={styles.checkmark}>✓</span>
                {loading ? 'Checking...' : 'Confirm Selection'}
              </button>
            )}
          </div>
        )}

        {!canAct && myRole !== 'Kallan' && myRole && (
          <div className={styles.roleCard}>
            <p className={styles.roleDescription}>
              {alreadyFound
                ? `✅ You found the ${targetRole}. Waiting for others...`
                : 'Wait for your turn in the chain...'}
            </p>
          </div>
        )}

        {myRole === 'Kallan' && (
          <div className={styles.roleCard}>
            <p className={styles.roleDescription}>🤫 Stay hidden! The Police is looking for you.</p>
            {kallanCaught && (
              <button
                className={styles.declareBtn}
                onClick={async () => {
                  await update(ref(db, `games/${gameCode}/players/${playerId}`), { winReason: 'caught' });
                  window.location.href = '/score-exchange';
                }}
              >
                Declare as Kallan
              </button>
            )}
          </div>
        )}
      </div>

      <div className={styles.ornament}></div>
    </div>
  );
};

export default RoleIdentification;
