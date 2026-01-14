
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Home } from './pages/Home';
import { Feed } from './pages/Feed';
import { Profile } from './pages/Profile';
import { Court } from './pages/Court';
import { BottomNav } from './components/BottomNav';
import { CreateComplaint } from './pages/CreateComplaint';
import { PinPad } from './components/PinPad';
import { ComplaintProvider } from './context/ComplaintContext';

// Using HashRouter for GitHub Pages/Netlify compatibility without redirects
const App: React.FC = () => {
  const [isLocked, setIsLocked] = useState(true);

  useEffect(() => {
    // Check local storage for theme
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  if (isLocked) {
    return <PinPad onUnlock={() => setIsLocked(false)} />;
  }

  return (
    <ComplaintProvider>
      <Router>
        <div className="antialiased text-gray-900 bg-background dark:bg-darkBg min-h-screen font-sans">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/court" element={<Court />} />
            
            {/* Create Routes */}
            <Route path="/create/step1" element={<CreateComplaint />} />
            <Route path="/create/step2" element={<CreateComplaint />} />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <BottomNav />
        </div>
      </Router>
    </ComplaintProvider>
  );
};

export default App;