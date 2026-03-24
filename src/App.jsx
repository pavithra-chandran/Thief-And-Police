import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Countdown from './components/Countdown/Countdown';
import CreateGame from './components/Create/CreateGame';
import Home from './components/Home/Home';
import JoinGame from './components/Join/JoinGame';
import PaperSelection from './components/PaperSelection/PaperSelection';
import PlayerList from './components/PlayerList/PlayerList';
import RoleIdentification from './components/RoleIdentification/RoleIdentification';
import Leaderboard from './components/Leaderboard/Leaderboard';
import RolesDisplay from './components/RolesDisplay/RolesDisplay';
import ScoreExchange from './components/ScoreExchange/ScoreExchange';
import ThiefGameover from './components/GameOver/ThiefGameover';

function App() {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/countdown" element={<Countdown />} />
          <Route path="/create-game" element={<CreateGame />} />
          <Route path="/join-game" element={<JoinGame />} />
          <Route path="/paper-selection" element={<PaperSelection />} />
          <Route path="/player-list" element={<PlayerList />} />
          <Route path="/role-identification" element={<RoleIdentification />} />
          <Route path="/roles-display" element={<RolesDisplay />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/score-exchange" element={<ScoreExchange />} />
          <Route path="/thief-gameover" element={<ThiefGameover />} />
          <Route path="/" element={<Home />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;