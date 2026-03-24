import React, { useState, useEffect, useRef } from 'react';
import styles from './PaperSelection.module.css';
import { setSelectedPaper, listenToPlayers } from '../../firebase';

const PaperSelection = () => {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [playerCount, setPlayerCount] = useState(0);
  const [claimedMap, setClaimedMap] = useState({});   // { paperIndex: playerName }
  const [toast, setToast] = useState('');
  const toastTimer = useRef(null);

  const gameCode = sessionStorage.getItem('gameCode');
  const playerId = sessionStorage.getItem('playerId');

  useEffect(() => {
    if (!gameCode || !playerId) return;
    // Clear any previously selected paper on mount (e.g. after restart)
    setSelectedPaper(gameCode, playerId, null);
    const unsub = listenToPlayers(gameCode, (players) => {
      setPlayerCount(Object.keys(players).length);
      // Build claimed map from all OTHER players' selectedPaper
      const map = {};
      Object.entries(players).forEach(([id, p]) => {
        if (id !== playerId && p.selectedPaper !== undefined) {
          map[p.selectedPaper] = p.name;
        }
      });
      setClaimedMap(map);
    });
    return unsub;
  }, [gameCode, playerId]);

  const papers = Array.from({ length: playerCount }, (_, i) => i);

  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 3000);
  };

  const selectPaper = (index) => {
    if (confirmed) return;
    if (claimedMap[index]) {
      showToast(`⚠️ ${claimedMap[index]} is eyeing this scroll! Select it fast or another player will claim it!`);
      return;
    }
    // Release previous claim if switching
    if (selectedIndex !== null && selectedIndex !== index) {
      setSelectedPaper(gameCode, playerId, null);
    }
    const next = selectedIndex === index ? null : index;
    setSelectedIndex(next);
    // Write claim to Firebase immediately so others see it
    setSelectedPaper(gameCode, playerId, next !== null ? next : null);
  };

  const handleSubmit = () => {
    if (selectedIndex !== null && !confirmed) {
      if (claimedMap[selectedIndex]) {
        showToast(`⚠️ ${claimedMap[selectedIndex]} just claimed this scroll! Pick another one!`);
        setSelectedIndex(null);
        return;
      }
      setConfirmed(true);
      setSelectedPaper(gameCode, playerId, selectedIndex);
      setTimeout(() => {
        window.location.href = '/role-identification';
      }, 1000);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.background}>
        <div className={styles.scroll}>📜</div>
        <div className={styles.sparkle}></div>
        <div className={styles.sparkle}></div>
        <div className={styles.sparkle}></div>
      </div>

      <div className={styles.container}>
        {toast && (
          <div className={styles.toast}>
            <span>{toast}</span>
          </div>
        )}
        <div className={styles.header}>
          <div className={styles.iconWrapper}>
            <span className={styles.headerIcon}>📜</span>
          </div>
          <h1 className={styles.title}>
            <span className={styles.titleWord}>Choose Your</span>
            <span className={styles.titleWord}>Royal Scroll</span>
          </h1>
          <p className={styles.subtitle}>Each scroll holds a royal role — choose wisely</p>
        </div>

        {playerCount === 0 ? (
          <p className={styles.hint}>Loading scrolls...</p>
        ) : (
        <div className={styles.papersGrid}>
          {papers.map((_, index) => {
            const claimedBy = claimedMap[index];
            const isMySelection = selectedIndex === index;
            const isClaimed = !!claimedBy && !isMySelection;
            return (
            <div
              key={index}
              className={`${styles.paperWrapper} ${styles[`paper${index + 1}`]}`}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div
                className={`${styles.paper} ${
                  confirmed && isMySelection ? styles.selected : ''
                } ${!confirmed && hoveredIndex === index ? styles.hovered : ''} ${
                  isClaimed ? styles.claimed : ''
                }`}
                onClick={() => selectPaper(index)}
              >
                <div className={styles.paperFront}>
                  <div className={styles.scrollTop}>
                    <div className={styles.scrollRod}></div>
                  </div>
                  <div className={styles.scrollBody}>
                    <div className={styles.sealWrapper}>
                      <div className={styles.seal}>
                        <span className={styles.sealIcon}>{isClaimed ? '👁️' : '🔒'}</span>
                      </div>
                    </div>
                    <div className={styles.scrollPattern}>
                      <div className={styles.patternLine}></div>
                      <div className={styles.patternLine}></div>
                      <div className={styles.patternLine}></div>
                    </div>
                  </div>
                  <div className={styles.scrollBottom}>
                    <div className={styles.scrollRod}></div>
                  </div>
                </div>

                <div className={styles.paperBack}>
                  <div className={styles.paperContent}>
                    <div className={styles.contentIcon}>📜</div>
                    <div className={styles.contentName}>Scroll {index + 1}</div>
                    <div className={styles.contentBadge}>
                      <span className={styles.badgeText}>Selected</span>
                    </div>
                  </div>
                </div>

                {isMySelection && !confirmed && (
                  <div className={styles.selectedIndicator}>
                    <span className={styles.checkmark}>✓</span>
                  </div>
                )}

                {isClaimed && (
                  <div className={styles.claimedBadge}>
                    <span>👁️ {claimedBy}</span>
                  </div>
                )}
              </div>

              <div className={styles.paperLabel}>
                Scroll {index + 1}
              </div>
            </div>
            );
          })}
        </div>
        )}

        <div className={styles.actionSection}>
          <button
            onClick={handleSubmit}
            className={`${styles.confirmButton} ${selectedIndex === null ? styles.disabled : ''}`}
            disabled={selectedIndex === null}
          >
            <span className={styles.buttonIcon}>⚡</span>
            <span className={styles.buttonText}>
              {selectedIndex === null ? 'Choose a Scroll' : 'Confirm Selection'}
            </span>
            <span className={styles.buttonShine}></span>
          </button>

          <p className={styles.hint}>
            {playerCount > 0 && `${playerCount} scrolls for ${playerCount} players — `}
            {selectedIndex === null
              ? 'Select any scroll'
              : `Scroll ${selectedIndex + 1} selected`}
          </p>
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

export default PaperSelection;