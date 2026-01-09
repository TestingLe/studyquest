import React, { useState, useRef } from 'react';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { playSound } from '../utils/sounds';
import { registerUser, loginUser } from '../utils/supabaseApi';
import { isSupabaseConfigured as checkSupabase } from '../utils/supabase';

// hCaptcha site key - get yours from https://dashboard.hcaptcha.com
const HCAPTCHA_SITE_KEY = import.meta.env.VITE_HCAPTCHA_SITE_KEY || '10000000-ffff-ffff-ffff-000000000001'; // Test key

interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatar: string;
}

interface AuthProps {
  onLogin: (user: User, token: string) => void;
  darkMode: boolean;
}

export const Auth: React.FC<AuthProps> = ({ onLogin, darkMode }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [useLocalMode, setUseLocalMode] = useState(!checkSupabase());
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  
  // Form fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const captchaRef = useRef<HCaptcha>(null);

  // Local storage auth (fallback when no backend)
  const handleLocalAuth = () => {
    playSound('click');
    
    if (!isLogin) {
      // Register locally
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (username.length < 3) {
        setError('Username must be at least 3 characters');
        return;
      }
      
      // Check if user exists
      const users = JSON.parse(localStorage.getItem('studyquest-users') || '[]');
      if (users.find((u: any) => u.username === username)) {
        setError('Username already exists');
        return;
      }
      
      // Create user
      const newUser = {
        id: Date.now().toString(),
        username,
        email: email || `${username}@local`,
        displayName: displayName || username,
        avatar: '🎓',
        password // In real app, hash this!
      };
      
      users.push(newUser);
      localStorage.setItem('studyquest-users', JSON.stringify(users));
      
      const token = `local-${newUser.id}-${Date.now()}`;
      playSound('complete');
      onLogin(newUser, token);
    } else {
      // Login locally
      const users = JSON.parse(localStorage.getItem('studyquest-users') || '[]');
      const user = users.find((u: any) => 
        (u.username === username || u.email === username) && u.password === password
      );
      
      if (!user) {
        playSound('wrong');
        setError('Invalid username/email or password');
        return;
      }
      
      const token = `local-${user.id}-${Date.now()}`;
      playSound('complete');
      onLogin(user, token);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    playSound('click');
    setError('');
    setLoading(true);

    // Use local mode if selected or Supabase not configured
    if (useLocalMode || !checkSupabase()) {
      handleLocalAuth();
      setLoading(false);
      return;
    }

    // Check captcha for registration (not login)
    if (!isLogin && !captchaToken) {
      setError('Please complete the captcha verification');
      setLoading(false);
      return;
    }

    try {
      if (!isLogin) {
        // Registration
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters');
          setLoading(false);
          return;
        }
        if (!email) {
          setError('Email is required');
          setLoading(false);
          return;
        }

        const result = await registerUser(username, email, password, displayName || username, captchaToken || undefined);
        playSound('complete');
        onLogin(result.user, result.token);
      } else {
        // Login - use email field (username field can contain email)
        const loginEmail = username.includes('@') ? username : email || username;
        
        if (!loginEmail.includes('@')) {
          setError('Please enter your email to login');
          setLoading(false);
          return;
        }

        const result = await loginUser(loginEmail, password);
        playSound('complete');
        onLogin(result.user, result.token);
      }
    } catch (err: any) {
      playSound('wrong');
      setError(err.message || 'Something went wrong');
      // Reset captcha on error
      captchaRef.current?.resetCaptcha();
      setCaptchaToken(null);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    playSound('click');
    setIsLogin(!isLogin);
    setError('');
    setCaptchaToken(null);
    captchaRef.current?.resetCaptcha();
  };

  const supabaseConfigured = checkSupabase();

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${
      darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
    }`}>
      <div className={`w-full max-w-md ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl overflow-hidden`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-8 text-center">
          <div className="text-5xl mb-3">🎯</div>
          <h1 className="text-2xl font-bold text-white">StudyQuest</h1>
          <p className="text-indigo-100 mt-1">Level up your learning</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          <h2 className={`text-xl font-bold text-center mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {isLogin ? 'Welcome Back!' : 'Create Account'}
          </h2>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {!isLogin && (
            <div>
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                }`}
                placeholder="Choose a username"
              />
            </div>
          )}

          <div>
            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Email
            </label>
            <input
              type="email"
              value={isLogin ? username : email}
              onChange={e => isLogin ? setUsername(e.target.value) : setEmail(e.target.value)}
              required
              className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
              }`}
              placeholder="Enter your email"
            />
          </div>

          {!isLogin && (
            <div>
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                }`}
                placeholder="How should we call you?"
              />
            </div>
          )}

          <div>
            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
              }`}
              placeholder="Enter password"
            />
          </div>

          {!isLogin && (
            <div>
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                }`}
                placeholder="Confirm password"
              />
            </div>
          )}

          {/* hCaptcha - only show for registration */}
          {!isLogin && !useLocalMode && (
            <div className="flex justify-center">
              <HCaptcha
                ref={captchaRef}
                sitekey={HCAPTCHA_SITE_KEY}
                onVerify={(token) => setCaptchaToken(token)}
                onExpire={() => setCaptchaToken(null)}
                onError={() => setCaptchaToken(null)}
                theme={darkMode ? 'dark' : 'light'}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-semibold text-white transition-all ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700'
            }`}
          >
            {loading ? '...' : isLogin ? 'Login' : 'Create Account'}
          </button>

          <p className={`text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={switchMode}
              className="text-indigo-500 hover:text-indigo-600 font-medium"
            >
              {isLogin ? 'Sign up' : 'Login'}
            </button>
          </p>

          {/* Offline mode toggle */}
          <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <label className="flex items-center justify-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useLocalMode}
                onChange={() => { playSound('click'); setUseLocalMode(!useLocalMode); }}
                className="w-4 h-4 rounded border-gray-300 text-indigo-500 focus:ring-indigo-500"
              />
              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Offline Mode (data stored locally)
              </span>
            </label>
          </div>
        </form>

        {/* Info */}
        <div className={`px-8 pb-6 text-center text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          {useLocalMode ? (
            <p>📱 Data will be stored locally in your browser</p>
          ) : supabaseConfigured ? (
            <p>☁️ Data synced to cloud - access from anywhere!</p>
          ) : (
            <p>⚠️ Cloud not configured - using offline mode</p>
          )}
        </div>
      </div>
    </div>
  );
};
