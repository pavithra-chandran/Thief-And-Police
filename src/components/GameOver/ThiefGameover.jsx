import React, { useState, useEffect } from 'react';
import styles from './ThiefGameover.module.css';
import { listenToPlayers, listenToGame, updateGameStatus } from '../../firebase';

const ROLE_SCORES = {
  Rajavu: 20, Rani: 18, Mantri: 16, Police: 15, Kallan: 12,
  Bhadan: 14, Thozhi: 13, Dasi: 12, Kavalalkaran: 11, Dhoodhan: 10,
  Paachakakkaran: 9, Vyapari: 8, Karshakan: 7, Vaidyan: 6,
  Nayathipathi: 5, Vidushakan: 4,
};

const ThiefGameover = () => {
  const gameCode = sessionStorage.getItem('gameCode');
  const playerId = sessionStorage.getItem('playerId');
  const isHost = sessionStorage.getItem('isHost') === 'true';

  const [players, setPlayers] = useState({});
  const [gameData, setGameData] = useState(null);
  const [showWinPopup, setShowWinPopup] = useState(false);
  const [myWinReason, setMyWinReason] = useState(null);
  const [votingPhase, setVotingPhase] = useState(true);
  const [votes, setVotes] = useState({});
  const [selectedVote, setSelectedVote] = useState(null);
  const [revealPhase, setRevealPhase] = useState(false);
  const [thiefRevealed, setThiefRevealed] = useState(false);
  const [showScores, setShowScores] = useState(false);
  const [iFinished, setIFinished] = useState(false);

  useEffect(() => {
    if (!gameCode) return;
    const unsubPlayers = listenToPlayers(gameCode, setPlayers);
    const unsubGame = listenToGame(gameCode, setGameData);
    return () => { unsubPlayers(); unsubGame(); };
  }, [gameCode]);

  // Show win popup when this player has a winReason
  useEffect(() => {
    if (!players[playerId]) return;
    const me = players[playerId];
    if (me.winReason && !showWinPopup && !iFinished) {
      setMyWinReason(me.winReason);
      setShowWinPopup(true);
    }
  }, [players, playerId]);

  // When host sets status to 'gameover-reveal', all players enter reveal phase
  useEffect(() => {
    if (gameData?.status === 'gameover-reveal') {
      setVotingPhase(false);
      setRevealPhase(true);
      setTimeout(() => {
        setThiefRevealed(true);
        setTimeout(() => setShowScores(true), 2000);
      }, 1500);
    }
  }, [gameData?.status]);

  const playerList = Object.entries(players).map(([id, p]) => ({ id, ...p }));
  const allFinished = playerList.length > 0 && playerList.every(p => p.finished);
  const myData = players[playerId] || {};
  const myScore = ROLE_SCORES[myData.role] || 0;

  const voteThief = (targetId) => {
    if (selectedVote) return;
    setSelectedVote(targetId);
    setVotes(prev => ({ ...prev, [targetId]: (prev[targetId] || 0) + 1 }));
    setTimeout(() => setSelectedVote(null), 1000);
  };

  const revealThief = async () => {
    if (isHost) await updateGameStatus(gameCode, 'gameover-reveal');
  };

  const dismissWinPopup = () => {
    setShowWinPopup(false);
    setIFinished(true);
  };

  const finalScores = playerList
    .map(p => ({ ...p, points: ROLE_SCORES[p.role] || 0 }))
    .sort((a, b) => b.points - a.points)
    .map((p, i) => ({ ...p, rank: i + 1, medal: ['🥇', '🥈', '🥉'][i] || '' }));

  const maxPoints = Math.max(...finalScores.map(s => s.points), 1);

  return (
    <div className={styles.container}>
      <div className={styles.smokeEffect}></div>
      <div className={styles.spotlightEffect}></div>

      {/* Win Popup */}
      {showWinPopup && (
        <div className={styles.winOverlay}>
          <div className={styles.winPopup}>
            <div className={styles.winIcon}>🏆</div>
            <h2 className={styles.winTitle}>You Win!</h2>
            <p className={styles.winReason}>{myWinReason}</p>
            <p className={styles.winScore}>+{myScore} points</p>
            {allFinished
              ? <p className={styles.winWait}>All players finished! See the results below.</p>
              : <p className={styles.winWait}>⏳ Waiting for other players to finish...</p>
            }
            <button className={styles.winBtn} onClick={dismissWinPopup}>
              {allFinished ? 'See Results' : 'Watch Others Play'}
            </button>
          </div>
        </div>
      )}

      {/* Waiting / Spectator banner */}
      {iFinished && !allFinished && votingPhase && (
        <div className={styles.spectatorBanner}>
          <span>👁️ Spectating — waiting for others to finish</span>
          <div className={styles.spectatorProgress}>
            {playerList.map(p => (
              <span key={p.id} title={p.name} className={p.finished ? styles.dotDone : styles.dotWaiting}>
                {p.finished ? '✅' : '⏳'}
              </span>
            ))}
          </div>
        </div>
      )}

      {votingPhase ? (
        <>
          <header className={styles.header}>
            <div className={styles.warningIcon}>⚠️</div>
            <h1 className={styles.title}>
              <span className={styles.titleShadow}>Identify the Kallan</span>
              Identify the Kallan
            </h1>
            <p className={styles.subtitle}>
              A traitor lurks among the court. Cast your vote wisely...
            </p>
          </header>

          <div className={styles.votingSection}>
            <div className={styles.instructionBanner}>
              <span className={styles.bannerIcon}>🗳️</span>
              <span className={styles.bannerText}>Vote for who you believe is the Kallan</span>
            </div>

            <ul className={styles.playersList}>
              {playerList.map((player, index) => (
                <li
                  key={player.id}
                  className={`${styles.playerCard} ${selectedVote === player.id ? styles.voting : ''}`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className={styles.playerInfo}>
                    <div className={styles.playerAvatar}>
                      <span className={styles.avatarIcon}>👤</span>
                      {votes[player.id] > 0 && (
                        <div className={styles.voteBadge}>{votes[player.id]}</div>
                      )}
                    </div>
                    <div className={styles.playerDetails}>
                      <h3 className={styles.playerName}>
                        {player.name} {player.id === playerId ? '(You)' : ''}
                      </h3>
                      <p className={styles.playerStatus}>
                        {player.finished ? '✅ Finished' : '⏳ Playing'}
                        {votes[player.id] > 0 && ` · ${votes[player.id]} vote${votes[player.id] > 1 ? 's' : ''}`}
                      </p>
                    </div>
                  </div>
                  <button
                    className={styles.voteBtn}
                    onClick={() => voteThief(player.id)}
                    disabled={selectedVote !== null || player.id === playerId}
                  >
                    <span className={styles.voteBtnIcon}>⚖️</span>
                    Vote
                  </button>
                </li>
              ))}
            </ul>

            {isHost && (
              <button className={styles.revealBtn} onClick={revealThief}>
                <span className={styles.revealIcon}>🔍</span>
                Reveal the Kallan
              </button>
            )}
            {!isHost && (
              <p className={styles.subtitle} style={{ textAlign: 'center', marginTop: '1rem' }}>
                ⏳ Waiting for host to reveal the Kallan...
              </p>
            )}
          </div>
        </>
      ) : (
        <>
          <div className={`${styles.revealSection} ${revealPhase ? styles.active : ''}`}>
            <div className={styles.revealHeader}>
              <h2 className={styles.revealTitle}>
                {!thiefRevealed ? 'Revealing...' : 'The Kallan Has Been Exposed!'}
              </h2>
            </div>

            <div className={styles.suspenseCards}>
              {playerList.map((player, index) => (
                <div
                  key={player.id}
                  className={`${styles.suspenseCard} ${thiefRevealed ? styles.revealed : ''} ${player.role === 'Kallan' ? styles.isThief : styles.isInnocent}`}
                  style={{ animationDelay: `${index * 0.3}s` }}
                >
                  <div className={styles.cardGlow}></div>
                  <div className={styles.cardContent}>
                    <div className={styles.suspenseIcon}>
                      {!thiefRevealed ? '?' : player.role === 'Kallan' ? '🗡️' : '✓'}
                    </div>
                    <h3 className={styles.suspenseName}>{player.name}</h3>
                    <p className={styles.suspenseLabel}>
                      {!thiefRevealed ? 'Unknown' : player.role === 'Kallan' ? 'THE KALLAN' : player.role || 'Innocent'}
                    </p>
                    <div className={styles.suspenseVotes}>
                      {(votes[player.id] || 0)} {(votes[player.id] || 0) === 1 ? 'vote' : 'votes'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {showScores && (
            <div className={styles.gameOverSection}>
              <div className={styles.gameOverHeader}>
                <div className={styles.gameOverIcon}>👑</div>
                <h2 className={styles.gameOverTitle}>Game Over!</h2>
                <p className={styles.gameOverSubtitle}>Final Court Rankings</p>
              </div>

              <div className={styles.scoresContainer}>
                {finalScores.map((score, index) => (
                  <div
                    key={score.id}
                    className={`${styles.scoreRow} ${index === 0 ? styles.winner : ''} ${score.id === playerId ? styles.myScore : ''}`}
                    style={{ animationDelay: `${index * 0.15}s` }}
                  >
                    <div className={styles.scoreRank}>
                      <span className={styles.rankNumber}>{score.rank}</span>
                      {score.medal && <span className={styles.medal}>{score.medal}</span>}
                    </div>
                    <div className={styles.scoreInfo}>
                      <h4 className={styles.scoreName}>
                        {score.name} {score.id === playerId ? '(You)' : ''}
                      </h4>
                      <div className={styles.scorePoints}>
                        <span className={styles.pointsNumber}>{score.points}</span>
                        <span className={styles.pointsLabel}>points · {score.role}</span>
                      </div>
                    </div>
                    <div className={styles.scoreBar}>
                      <div
                        className={styles.scoreBarFill}
                        style={{ width: `${(score.points / maxPoints) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.playAgain}>
                <button className={styles.playAgainBtn} onClick={() => window.location.href = '/'}>
                  <span className={styles.playAgainIcon}>🔄</span>
                  Play Again
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <div className={styles.bottomDecor}>
        <span className={styles.decorDiamond}>◆</span>
        <span className={styles.decorLine}></span>
        <span className={styles.decorDiamond}>◆</span>
      </div>
    </div>
  );
};

export default ThiefGameover;
