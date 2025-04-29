import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import UserPreferences from './components/UserPreferences/UserPreferences';
import LeadingPage from './components/LeadingPage/LeadingPage';
import InvestmentProfile from './components/InvestmentProfile/InvestmentProfile';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LeadingPage />} />
          <Route path="/investment-profile" element={<InvestmentProfile />} />
          <Route path="/preferences" element={<UserPreferences />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;