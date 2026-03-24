import React, { useState, useEffect } from 'react';
import styles from './RolesDisplay.module.css';

const RolesDisplay = () => {
  const [revealedRoles, setRevealedRoles] = useState([]);
  const [showAll, setShowAll] = useState(false);

  const roles = [
    { name: 'Rajavu',  player: 'Player 1', icon: '♔', color: 'gold',    description: 'Ruler of the Court' },
    { name: 'Rani',    player: 'Player 2', icon: '♕', color: 'gold',    description: 'Royal Consort' },
    { name: 'Mantri',  player: 'Player 3', icon: '⚜️', color: 'bronze',  description: 'Royal Advisor' },
    { name: 'Police',  player: 'Player 4', icon: '⚔', color: 'silver',  description: 'Guardian of Order' },
    { name: 'Kallan',  player: 'Player 5', icon: '🗡', color: 'crimson', description: 'Shadow in the Court' },
  ];

  useEffect(() => {
    if (showAll) {
      roles.forEach((_, index) => {
        setTimeout(() => {
          setRevealedRoles(prev => [...prev, index]);
        }, index * 200);
      });
    } else {
      setRevealedRoles([]);
    }
  }, [showAll]);

  const handleRevealAll = () => {
    setShowAll(true);
  };

  const handleReset = () => {
    setRevealedRoles([]);
    setShowAll(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.background}></div>
      
      <header className={styles.header}>
        <div className={styles.emblem}>⚜</div>
        <h1 className={styles.title}>
          <span className={styles.titleDecoration}>✦</span>
          Court Roles
          <span className={styles.titleDecoration}>✦</span>
        </h1>
        <p className={styles.subtitle}>The Royal Assembly</p>
      </header>

      <div className={styles.controls}>
        {!showAll ? (
          <button className={styles.revealBtn} onClick={handleRevealAll}>
            <span className={styles.btnIcon}>👁</span>
            Reveal All Roles
          </button>
        ) : (
          <button className={styles.resetBtn} onClick={handleReset}>
            <span className={styles.btnIcon}>↺</span>
            Reset
          </button>
        )}
      </div>

      <ul className={styles.rolesList}>
        {roles.map((role, index) => (
          <li 
            key={index} 
            className={`${styles.roleCard} ${styles[role.color]} ${revealedRoles.includes(index) ? styles.revealed : ''}`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className={styles.cardInner}>
              <div className={styles.cardFront}>
                <div className={styles.cardPattern}></div>
                <div className={styles.questionMark}>?</div>
                <div className={styles.cardLabel}>Hidden Role</div>
              </div>
              
              <div className={styles.cardBack}>
                <div className={styles.roleHeader}>
                  <div className={styles.roleIcon}>{role.icon}</div>
                  <div className={styles.roleInfo}>
                    <h3 className={styles.roleName}>{role.name}</h3>
                    <p className={styles.roleDescription}>{role.description}</p>
                  </div>
                </div>
                
                <div className={styles.playerBadge}>
                  <span className={styles.playerLabel}>Assigned to:</span>
                  <span className={styles.playerName}>{role.player}</span>
                </div>

                <div className={styles.cardFooter}>
                  <div className={styles.cardSeal}>
                    <span className={styles.sealIcon}>🔱</span>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className={styles.ornamentBottom}>
        <span className={styles.ornamentSymbol}>◈</span>
        <span className={styles.ornamentLine}></span>
        <span className={styles.ornamentSymbol}>◈</span>
      </div>
    </div>
  );
};

export default RolesDisplay;