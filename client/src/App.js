import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import UserPreferences from './components/UserPreferences/UserPreferences';
import LeadingPage from './components/LeadingPage/LeadingPage';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LeadingPage />} />
          <Route path="/preferences" element={<UserPreferences />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;