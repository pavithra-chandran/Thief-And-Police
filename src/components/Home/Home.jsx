import React from 'react';
import styles from './Home.module.css';

function Home() {
  return (
    <div className={styles.container}>
      <div className={styles.background}>
        <div className={styles.crown}>👑</div>
      </div>
      
      <div className={styles.content}>
        <div className={styles.titleWrapper}>
          <h1 className={styles.title}>
            <span className={styles.titleWord}>King's</span>
            <span className={styles.titleWord}>Court</span>
          </h1>
          <p className={styles.subtitle}>Enter the Royal Arena</p>
        </div>
        
        <div className={styles.buttonContainer}>
          <a href="/create-game" className={`${styles.button} ${styles.createButton}`}>
            <span className={styles.buttonIcon}>⚔️</span>
            <span className={styles.buttonText}>Create Game</span>
            <span className={styles.buttonShine}></span>
          </a>
          
          <a href="/join-game" className={`${styles.button} ${styles.joinButton}`}>
            <span className={styles.buttonIcon}>🛡️</span>
            <span className={styles.buttonText}>Join Game</span>
            <span className={styles.buttonShine}></span>
          </a>
        </div>
        
        <div className={styles.decorativeElements}>
          <div className={styles.ornament}>⚜️</div>
          <div className={styles.ornament}>⚜️</div>
        </div>
      </div>
    </div>
  );
}

export default Home;