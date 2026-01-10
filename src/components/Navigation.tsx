import React, { useState } from 'react';
import { playSound } from '../utils/sounds';

interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
}

interface NavigationProps {
  currentView: string;
  onViewChange: (view: string) => void;
  level: number;
  xp: number;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  user: User;
  onLogout: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentView,
  onViewChange,
  level,
  xp,
  darkMode,
  onToggleDarkMode,
  user,
  onLogout
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { id: 'timer', label: 'Study Timer', icon: '⏰' },
    { id: 'subjects', label: 'Subjects', icon: '📚' },
    { id: 'quiz', label: 'Quiz', icon: '❓' },
    { id: 'analytics', label: 'Analytics', icon: '📊' },
    { id: 'achievements', label: 'Achievements', icon: '🏆' },
    { id: 'rooms', label: 'Study Rooms', icon: '👥' }
  ];

  const xpForCurrentLevel = (level - 1) * 100;
  const xpForNextLevel = level * 100;
  const xpProgress = xp - xpForCurrentLevel;
  const xpNeeded = xpForNextLevel - xpForCurrentLevel;
  const progressPercent = (xpProgress / xpNeeded) * 100;

  return (
    <nav className={`shadow-lg border-b-4 border-indigo-500 sticky top-0 z-50 transition-colors duration-300 ${
      darkMode ? 'bg-gray-800/90 backdrop-blur-sm' : 'bg-white'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => onViewChange('dashboard')}>
              <span className="text-2xl">🎯</span>
              <h1 className={`text-xl font-bold ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>StudyFlow</h1>
            </div>
            
            <div className="hidden lg:flex space-x-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { playSound('click'); onViewChange(item.id); }}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    currentView === item.id
                      ? darkMode 
                        ? 'bg-indigo-500/20 text-indigo-400 shadow-md'
                        : 'bg-indigo-100 text-indigo-700 shadow-md'
                      : darkMode
                        ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Dark mode toggle */}
            <button
              onClick={() => { playSound('click'); onToggleDarkMode(); }}
              className={`p-2 rounded-lg transition-all duration-300 ${
                darkMode 
                  ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={darkMode ? 'Light mode' : 'Dark mode'}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>

            {/* XP Progress */}
            <div className="hidden sm:block text-right">
              <div className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Level {level}</div>
              <div className={`w-24 h-2 rounded-full overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{xpProgress}/{xpNeeded} XP</div>
            </div>
            
            {/* User menu */}
            <div className="relative group">
              <button className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white text-lg">
                  {user.avatar || '🎓'}
                </div>
                <span className={`hidden md:block text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                  {user.displayName}
                </span>
              </button>
              
              {/* Dropdown */}
              <div className={`absolute right-0 top-full mt-2 w-48 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ${
                darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
              }`}>
                <div className={`p-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{user.displayName}</p>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>@{user.username}</p>
                </div>
                <button
                  onClick={() => { playSound('click'); onLogout(); }}
                  className={`w-full p-3 text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-b-xl transition-colors`}
                >
                  🚪 Logout
                </button>
              </div>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => { playSound('click'); setMobileMenuOpen(!mobileMenuOpen); }}
              className={`lg:hidden p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-100'}`}
            >
              <span className="text-2xl">{mobileMenuOpen ? '✕' : '☰'}</span>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className={`lg:hidden py-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="grid grid-cols-2 gap-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    playSound('click');
                    onViewChange(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 text-left ${
                    currentView === item.id
                      ? darkMode
                        ? 'bg-indigo-500/20 text-indigo-400'
                        : 'bg-indigo-100 text-indigo-700'
                      : darkMode
                        ? 'text-gray-300 hover:bg-gray-700'
                        : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
