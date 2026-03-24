import React, { useState, useEffect } from 'react';
import styles from './PlayerList.module.css';
import { listenToPlayers, listenToGame, setPlayerReady, updateGameStatus, MIN_PLAYERS, MAX_PLAYERS } from '../../firebase';

const AVATARS = ['👑', '⚔️', '🛡️', '🔮', '🗡️', '🏹', '⚜️', '🔱'];

const PlayerList = () => {
  const gameCode = sessionStorage.getItem('gameCode');
  const playerId = sessionStorage.getItem('playerId');
  const isHost = sessionStorage.getItem('isHost') === 'true';

  const [players, setPlayers] = useState({});
  const [isReady, setIsReady] = useState(false);
  const [gameStatus, setGameStatus] = useState('waiting');

  useEffect(() => {
    if (!gameCode) return;
    const unsubPlayers = listenToPlayers(gameCode, setPlayers);
    const unsubGame = listenToGame(gameCode, (game) => {
      if (!game) return;
      setGameStatus(game.status);
      if (game.status === 'countdown') window.location.href = '/countdown';
    });
    return () => { unsubPlayers(); unsubGame(); };
  }, [gameCode]);

  const handleReady = async () => {
    const next = !isReady;
    setIsReady(next);
    await setPlayerReady(gameCode, playerId, next);
  };

  const handleStartGame = async () => {
    await updateGameStatus(gameCode, 'countdown');
  };

  const copyGameCode = () => navigator.clipboard.writeText(gameCode);

  const playerList = Object.entries(players).map(([id, p], i) => ({
    id, ...p, avatar: AVATARS[i % AVATARS.length]
  }));

  const canStart = playerList.length >= MIN_PLAYERS && playerList.every(p => p.ready);
  const isFull = playerList.length >= MAX_PLAYERS;

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.background}>
        <div className={styles.castle}>🏰</div>
      </div>

      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.iconWrapper}>
            <span className={styles.headerIcon}>🏰</span>
          </div>
          <h1 className={styles.title}>Royal Waiting Room</h1>
          <p className={styles.subtitle}>Gather your noble warriors</p>
        </div>

        <div className={styles.gameCodeSection}>
          <div className={styles.gameCodeLabel}>
            <span className={styles.codeIcon}>🔑</span>
            Game Code
          </div>
          <div className={styles.gameCodeBox} onClick={copyGameCode}>
            <span className={styles.gameCode}>{gameCode}</span>
            <span className={styles.copyIcon} title="Click to copy">📋</span>
          </div>
          <p className={styles.copyHint}>Click to copy and share with others</p>
        </div>

        <div className={styles.playersSection}>
          <div className={styles.playersHeader}>
            <span className={styles.playersTitle}>
              <span className={styles.playersIcon}>⚔️</span>
              Knights in Court
            </span>
            <span className={styles.playerCount}>
              {playerList.length}/{MAX_PLAYERS}
              {isFull && <span className={styles.fullBadge}>Full</span>}
            </span>
          </div>

          <ul className={styles.playerList}>
            {playerList.map((player, index) => (
              <li key={player.id} className={`${styles.player} ${styles[`player${index + 1}`]}`}>
                <div className={styles.playerInfo}>
                  <span className={styles.playerAvatar}>{player.avatar}</span>
                  <div className={styles.playerDetails}>
                    <span className={styles.playerName}>
                      {player.name}
                      {player.id === playerId && (
                        <span className={styles.hostBadge}>
                          <span className={styles.crownIcon}>{isHost ? '👑' : '👤'}</span>
                          {isHost ? 'Host (You)' : 'You'}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
                <span className={player.ready ? styles.readyStatus : styles.notReady}>
                  <span className={styles.statusDot}></span>
                  {player.ready ? 'Ready' : 'Not Ready'}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.buttonContainer}>
          <button
            onClick={handleReady}
            className={`${styles.readyBtn} ${isReady ? styles.readyActive : ''}`}
          >
            <span className={styles.buttonIcon}>{isReady ? '✓' : '⏳'}</span>
            <span className={styles.buttonText}>{isReady ? 'You are Ready' : 'Mark as Ready'}</span>
            <span className={styles.buttonShine}></span>
          </button>

          {isHost && (
            <>
              {playerList.length < MIN_PLAYERS && (
                <p className={styles.waitingMsg}>
                  ⏳ Need at least {MIN_PLAYERS} players to start ({MIN_PLAYERS - playerList.length} more needed)
                </p>
              )}
              {isFull && (
                <p className={styles.fullMsg}>
                  🚫 Maximum {MAX_PLAYERS} players reached. No more players can join.
                </p>
              )}
              <button
                onClick={handleStartGame}
                className={`${styles.startBtn} ${!canStart ? styles.disabled : ''}`}
                disabled={!canStart}
              >
                <span className={styles.buttonIcon}>⚡</span>
                <span className={styles.buttonText}>Start Battle</span>
                <span className={styles.hostOnly}>(Host Only)</span>
                <span className={styles.buttonShine}></span>
              </button>
            </>
          )}

          <a href="/" className={styles.leaveLink}>
            <span className={styles.leaveIcon}>🚪</span>
            Leave Court
          </a>
        </div>

        <div className={styles.decorativeElements}>
          <div className={styles.ornament}>⚜️</div>
          <div className={styles.divider}></div>
          <div className={styles.ornament}>⚜️</div>
        </div>
      </div>
    </div>
  );
};

export default PlayerList;
