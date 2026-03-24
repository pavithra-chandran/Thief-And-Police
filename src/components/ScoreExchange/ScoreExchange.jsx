import React, { useState, useEffect, useRef } from 'react';
import styles from './ScoreExchange.module.css';
import { listenToPlayers, listenToGame, restartGame, db } from '../../firebase';
import { ref, update } from 'firebase/database';

const ROLE_SCORES = {
  Rajavu: 20, Rani: 18, Mantri: 16, Police: 15, Kallan: 0,
  Bhadan: 14, Thozhi: 13, Dasi: 12, Kavalalkaran: 11, Dhoodhan: 10,
  Paachakakkaran: 9, Vyapari: 8, Karshakan: 7, Vaidyan: 6,
  Nayathipathi: 5, Vidushakan: 4,
};

const ScoreExchange = () => {
  const gameCode = sessionStorage.getItem('gameCode');
  const playerId = sessionStorage.getItem('playerId');
  const isHost = sessionStorage.getItem('isHost') === 'true';

  const [myData, setMyData] = useState(null);
  const [gameInfo, setGameInfo] = useState(null);
  const scoreSavedRef = useRef(false);

  useEffect(() => {
    if (!gameCode || !playerId) return;
    const unsubPlayers = listenToPlayers(gameCode, (data) => {
      const me = data[playerId];
      if (me?.role && !myData) {
        const isCaughtKallan = me.role === 'Kallan' && me.winReason === 'caught';
        const roundScore = isCaughtKallan ? 0 : (ROLE_SCORES[me.role] || 0);
        setMyData({ role: me.role, winReason: me.winReason, roundScore, totalScore: (me.totalScore || 0) + roundScore });
      }
    });
    const unsubGame = listenToGame(gameCode, (game) => {
      if (!game) return;
      setGameInfo(game);
      if (game.status === 'leaderboard') window.location.href = '/leaderboard';
      if (game.status === 'countdown') window.location.href = '/countdown';
    });
    return () => { unsubPlayers(); unsubGame(); };
  }, [gameCode, playerId]);

  // Save round score to Firebase once
  useEffect(() => {
    if (!myData || scoreSavedRef.current || !gameCode || !playerId) return;
    scoreSavedRef.current = true;
    update(ref(db, `games/${gameCode}/players/${playerId}`), {
      totalScore: myData.totalScore,
    });
  }, [myData]);

  const handleRestart = async () => {
    await restartGame(gameCode);
  };

  const currentRound = gameInfo?.currentRound || 1;
  const totalRounds = gameInfo?.totalRounds || 5;
  const isCaughtKallan = myData?.role === 'Kallan' && myData?.winReason === 'caught';

  return (
    <div className={styles.container}>
      <div className={styles.background}>
        <div className={styles.coinFloat} style={{ top: '10%', left: '15%', animationDelay: '0s' }}>💰</div>
        <div className={styles.coinFloat} style={{ top: '60%', right: '10%', animationDelay: '2s' }}>💎</div>
        <div className={styles.coinFloat} style={{ bottom: '20%', left: '8%', animationDelay: '4s' }}>👑</div>
        <div className={styles.coinFloat} style={{ top: '30%', right: '20%', animationDelay: '1.5s' }}>⚜️</div>
      </div>

      <div className={styles.roundBadge}>Round {currentRound} / {totalRounds}</div>

      {myData && (
        <div className={styles.winBanner}>
          <div className={styles.winBannerIcon}>{isCaughtKallan ? '😔' : '🏆'}</div>
          <h2 className={styles.winBannerTitle}>Your Role: {myData.role}</h2>
          {isCaughtKallan
            ? <p className={styles.winBannerFound}>You got caught as Kallan!</p>
            : myData.winReason
            ? <p className={styles.winBannerFound}>You found the <span>{myData.winReason}</span>!</p>
            : null}
          <p className={styles.winBannerScore}>This round: <span>{myData.roundScore} pts</span></p>
          <p className={styles.winBannerScore}>Total score: <span>{myData.totalScore} pts</span></p>
        </div>
      )}

      {isHost && (
        <div className={styles.endButtons}>
          <button className={styles.homeBtn} onClick={() => window.location.href = '/'}>🏠 Home</button>
          <button className={styles.restartBtn} onClick={handleRestart}>
            {currentRound >= totalRounds ? '🏆 See Leaderboard' : `▶ Next Round (${currentRound + 1}/${totalRounds})`}
          </button>
        </div>
      )}
      {!isHost && (
        <p className={styles.winBannerWait}>⏳ Waiting for host to start next round...</p>
      )}

      <div className={styles.treasuryFooter}></div>
    </div>
  );
};

export default ScoreExchange;
