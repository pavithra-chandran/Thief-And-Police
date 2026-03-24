import React, { useState, useEffect } from 'react';
import styles from './Leaderboard.module.css';
import { listenToPlayers, listenToGame, fullRestartGame } from '../../firebase';

const MEDALS = ['🥇', '🥈', '🥉'];

const Leaderboard = () => {
  const gameCode = sessionStorage.getItem('gameCode');
  const playerId = sessionStorage.getItem('playerId');
  const isHost = sessionStorage.getItem('isHost') === 'true';
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!gameCode) return;
    const unsubPlayers = listenToPlayers(gameCode, (data) => {
      const sorted = Object.entries(data)
        .map(([id, p]) => ({ id, name: p.name, totalScore: p.totalScore || 0 }))
        .sort((a, b) => b.totalScore - a.totalScore);
      setPlayers(sorted);
    });
    const unsubGame = listenToGame(gameCode, (game) => {
      if (!game) return;
      // All players redirect when host restarts
      if (game.status === 'waiting') window.location.href = '/player-list';
    });
    return () => { unsubPlayers(); unsubGame(); };
  }, [gameCode]);

  const handleRestart = async () => {
    setLoading(true);
    await fullRestartGame(gameCode);
    // redirect handled by listenToGame above
  };

  return (
    <div className={styles.container}>
      <div className={styles.background}>
        <div className={styles.floatIcon} style={{ top: '8%', left: '10%' }}>🏆</div>
        <div className={styles.floatIcon} style={{ top: '70%', right: '8%', animationDelay: '2s' }}>👑</div>
        <div className={styles.floatIcon} style={{ bottom: '15%', left: '5%', animationDelay: '4s' }}>⚜️</div>
      </div>

      <div className={styles.header}>
        <div className={styles.trophy}>🏆</div>
        <h1 className={styles.title}>Final Leaderboard</h1>
        <p className={styles.subtitle}>Rajavu's Court — Game Over</p>
      </div>

      <div className={styles.board}>
        {players.map((player, index) => (
          <div
            key={player.id}
            className={`${styles.row} ${index === 0 ? styles.first : index === 1 ? styles.second : index === 2 ? styles.third : ''} ${player.id === playerId ? styles.me : ''}`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className={styles.rank}>
              {index < 3 ? MEDALS[index] : <span className={styles.rankNum}>{index + 1}</span>}
            </div>
            <div className={styles.playerName}>
              {player.name}
              {player.id === playerId && <span className={styles.youBadge}>You</span>}
            </div>
            <div className={styles.score}>{player.totalScore} <span>pts</span></div>
          </div>
        ))}
      </div>

      <div className={styles.buttons}>
        <button className={styles.homeBtn} onClick={() => window.location.href = '/'}>
          🏠 Home
        </button>
        {isHost && (
          <button className={styles.restartBtn} onClick={handleRestart} disabled={loading}>
            {loading ? '⏳ Restarting...' : '🔄 Restart Game'}
          </button>
        )}
        {!isHost && (
          <p className={styles.waitMsg}>⏳ Waiting for host to restart...</p>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
