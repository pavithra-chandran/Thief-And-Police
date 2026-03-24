import React, { useState, useEffect } from 'react';
import styles from './Countdown.module.css';
import { updateGameStatus } from '../../firebase';

const Countdown = () => {
  const [count, setCount] = useState(5);
  const [pulseKey, setPulseKey] = useState(0);

  useEffect(() => {
    if (count > 0) {
      const timer = setTimeout(() => {
        setCount(count - 1);
        setPulseKey(prev => prev + 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Redirect to paper selection after countdown finishes
      const redirectTimer = setTimeout(async () => {
        const gameCode = sessionStorage.getItem('gameCode');
        if (sessionStorage.getItem('isHost') === 'true') {
          await updateGameStatus(gameCode, 'paper-selection');
        }
        window.location.href = '/paper-selection';
      }, 2000);
      return () => clearTimeout(redirectTimer);
    }
  }, [count]);

  const getCountdownMessage = () => {
    if (count === 0) return 'Battle Begins!';
    if (count === 1) return 'Prepare Yourself!';
    if (count === 2) return 'Draw Your Weapons!';
    if (count === 3) return 'Ready Your Strategy!';
    return 'The Battle Approaches...';
  };

  const getCountdownColor = () => {
    if (count === 0) return styles.colorGo;
    if (count <= 2) return styles.colorWarning;
    return styles.colorNormal;
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.background}>
        <div className={styles.swords}>⚔️</div>
        <div className={styles.particle}></div>
        <div className={styles.particle}></div>
        <div className={styles.particle}></div>
        <div className={styles.particle}></div>
        <div className={styles.particle}></div>
      </div>

      <div className={styles.container}>
        <div className={styles.crownWrapper}>
          <span className={styles.crownIcon}>👑</span>
        </div>

        <h1 className={styles.title}>
          <span className={styles.titleWord}>Battle</span>
          <span className={styles.titleWord}>Commences</span>
        </h1>

        <p className={styles.message}>{getCountdownMessage()}</p>

        <div className={styles.countdownWrapper}>
          <div className={styles.countdownRing}>
            <div className={styles.countdownRingInner}></div>
          </div>
          <div 
            key={pulseKey}
            className={`${styles.countdown} ${getCountdownColor()} ${count === 0 ? styles.finalCount : ''}`}
          >
            {count === 0 ? '⚡' : count}
          </div>
        </div>

        <div className={styles.progressBarWrapper}>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill}
              style={{ width: `${((5 - count) / 5) * 100}%` }}
            ></div>
          </div>
          <p className={styles.progressLabel}>
            {count === 0 ? 'CHARGE!' : `${count} seconds remaining`}
          </p>
        </div>

        <div className={styles.swordsDecoration}>
          <span className={styles.decorativeSword}>🗡️</span>
          <span className={styles.decorativeShield}>🛡️</span>
          <span className={styles.decorativeSword}>🗡️</span>
        </div>
      </div>

      {count === 0 && (
        <div className={styles.overlay}>
          <div className={styles.flashEffect}></div>
        </div>
      )}
    </div>
  );
};

export default Countdown;