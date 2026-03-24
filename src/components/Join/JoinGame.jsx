import React, { useState } from 'react';
import styles from './JoinGame.module.css';
import { waitAndJoinGame } from '../../firebase';

const JoinGame = () => {
  const [playerName, setPlayerName] = useState('');
  const [gameCode, setGameCode] = useState('');
  const [isFocused, setIsFocused] = useState({ name: false, code: false });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [waitMsg, setWaitMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setWaitMsg('');
    setLoading(true);
    try {
      const playerId = await waitAndJoinGame(gameCode, playerName, (secondsLeft) => {
        setWaitMsg(`⏳ Waiting for host to create the lobby... (${secondsLeft}s)`);
      });
      sessionStorage.setItem('gameCode', gameCode);
      sessionStorage.setItem('playerId', playerId);
      sessionStorage.setItem('playerName', playerName);
      sessionStorage.setItem('isHost', 'false');
      window.location.href = '/player-list';
    } catch (err) {
      setError(err.message);
      setLoading(false);
      setWaitMsg('');
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.background}>
        <div className={styles.shield}>🛡️</div>
      </div>

      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.iconWrapper}>
            <span className={styles.headerIcon}>⚔️</span>
          </div>
          <h1 className={styles.title}>Join the Court</h1>
          <p className={styles.subtitle}>Enter your credentials to join the realm</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label 
              htmlFor="player-name" 
              className={`${styles.label} ${isFocused.name || playerName ? styles.labelFocused : ''}`}
            >
              <span className={styles.labelIcon}>👤</span>
              Player's Name
            </label>
            <input
              type="text"
              id="player-name"
              name="player-name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onFocus={() => setIsFocused({ ...isFocused, name: true })}
              onBlur={() => setIsFocused({ ...isFocused, name: false })}
              className={styles.input}
              placeholder="Enter your noble name"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label 
              htmlFor="game-code" 
              className={`${styles.label} ${isFocused.code || gameCode ? styles.labelFocused : ''}`}
            >
              <span className={styles.labelIcon}>🔑</span>
              Game Code
            </label>
            <input
              type="text"
              id="game-code"
              name="game-code"
              value={gameCode}
              onChange={(e) => setGameCode(e.target.value.toUpperCase())}
              onFocus={() => setIsFocused({ ...isFocused, code: true })}
              onBlur={() => setIsFocused({ ...isFocused, code: false })}
              className={styles.input}
              placeholder="XXXX-XXXX"
              maxLength="9"
              required
            />
            {error && <p className={styles.errorMsg}>⚠️ {error}</p>}
          </div>

          <button type="submit" className={styles.submitButton} disabled={loading}>
            <span className={styles.buttonText}>{loading ? (waitMsg ? 'Waiting...' : 'Joining...') : 'Join Game'}</span>
            <span className={styles.buttonIcon}>→</span>
            <span className={styles.buttonShine}></span>
          </button>

          {waitMsg && (
            <div className={styles.waitBox}>
              <span className={styles.waitSpinner}>⏳</span>
              <span className={styles.waitText}>{waitMsg}</span>
            </div>
          )}

          <a href="/" className={styles.backLink}>
            <span className={styles.backIcon}>←</span>
            Back to Home
          </a>
        </form>

        <div className={styles.decorativeElements}>
          <div className={styles.ornament}>⚜️</div>
          <div className={styles.divider}></div>
          <div className={styles.ornament}>⚜️</div>
        </div>
      </div>
    </div>
  );
};

export default JoinGame;