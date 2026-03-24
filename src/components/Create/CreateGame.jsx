import React, { useState, useEffect } from 'react';
import styles from './CreateGame.module.css';
import { createGame, generateUniqueGameCode } from '../../firebase';

const CreateGame = () => {
  const [playerName, setPlayerName] = useState('');
  const [gameCode, setGameCode] = useState('');
  const [totalRounds, setTotalRounds] = useState(5);
  const [isFocused, setIsFocused] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(true);

  useEffect(() => {
    const generate = async () => {
      const code = await generateUniqueGameCode();
      setGameCode(code);
      setGenerating(false);
    };
    generate();
  }, []);

  const copyCode = () => {
    navigator.clipboard.writeText(gameCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const refreshCode = async () => {
    setGenerating(true);
    const code = await generateUniqueGameCode();
    setGameCode(code);
    setGenerating(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!gameCode) return;
    setLoading(true);
    try {
      const playerId = await createGame(gameCode, playerName, totalRounds);
      sessionStorage.setItem('gameCode', gameCode);
      sessionStorage.setItem('playerId', playerId);
      sessionStorage.setItem('playerName', playerName);
      sessionStorage.setItem('isHost', 'true');
      sessionStorage.setItem('totalRounds', totalRounds);
      window.location.href = '/player-list';
    } catch (err) {
      console.error('createGame error:', err);
      alert('Failed to create game: ' + err.message);
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.background}>
        <div className={styles.crown}>👑</div>
      </div>

      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.iconWrapper}>
            <span className={styles.headerIcon}>⚔️</span>
          </div>
          <h1 className={styles.title}>Create Royal Court</h1>
          <p className={styles.subtitle}>Establish your kingdom and invite noble warriors</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label
              htmlFor="player-name"
              className={`${styles.label} ${isFocused || playerName ? styles.labelFocused : ''}`}
            >
              <span className={styles.labelIcon}>👑</span>
              Player's Name
            </label>
            <input
              type="text"
              id="player-name"
              name="player-name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className={styles.input}
              placeholder="Enter your royal name"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              <span className={styles.labelIcon}>🔁</span>
              Number of Rounds
            </label>
            <div className={styles.roundPicker}>
              {[3, 5, 7, 10, 15].map(n => (
                <button
                  key={n}
                  type="button"
                  className={`${styles.roundOption} ${totalRounds === n ? styles.roundSelected : ''}`}
                  onClick={() => setTotalRounds(n)}
                >
                  <span className={styles.roundNum}>{n}</span>
                  <span className={styles.roundLabel}>rounds</span>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              <span className={styles.labelIcon}>🔐</span>
              Your Game Code
            </label>
            <div className={styles.gameCodeDisplay}>
              <span className={`${styles.gameCodeText} ${generating ? styles.generating : ''}`}>
                {generating ? 'Generating...' : gameCode}
              </span>
              <div className={styles.codeActions}>
                <button
                  type="button"
                  onClick={copyCode}
                  className={styles.codeActionBtn}
                  title="Copy code"
                  disabled={generating}
                >
                  {copied ? '✓' : '📋'}
                </button>
                <button
                  type="button"
                  onClick={refreshCode}
                  className={styles.codeActionBtn}
                  title="Generate new code"
                  disabled={generating}
                >
                  🔄
                </button>
              </div>
            </div>
            <p className={styles.hint}>Share this code with players to join your game</p>
          </div>

          <button type="submit" className={styles.submitButton} disabled={loading || generating}>
            <span className={styles.buttonText}>{loading ? 'Creating...' : 'Create Kingdom'}</span>
            <span className={styles.buttonIcon}>⚡</span>
            <span className={styles.buttonShine}></span>
          </button>

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

export default CreateGame;
