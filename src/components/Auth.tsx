import React, { useState, useRef, useEffect, useMemo } from 'react';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { playSound } from '../utils/sounds';
import { registerUser, loginUser } from '../utils/supabaseApi';

// hCaptcha site key
const HCAPTCHA_SITE_KEY = import.meta.env.VITE_HCAPTCHA_SITE_KEY || '10000000-ffff-ffff-ffff-000000000001';

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

// Floating particles background
const ParticleField: React.FC = () => {
  const particles = useMemo(() => 
    [...Array(30)].map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 20 + 10,
      delay: Math.random() * 5,
    })), []
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full bg-white/20"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animation: `particleFloat ${p.duration}s linear infinite`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
};

// Gradient orbs
const GradientOrbs: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div 
      className="absolute w-[500px] h-[500px] rounded-full opacity-30 blur-3xl"
      style={{
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.8) 0%, transparent 70%)',
        top: '-20%',
        right: '-10%',
        animation: 'orbFloat 15s ease-in-out infinite',
      }}
    />
    <div 
      className="absolute w-[400px] h-[400px] rounded-full opacity-20 blur-3xl"
      style={{
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.8) 0%, transparent 70%)',
        bottom: '-10%',
        left: '-10%',
        animation: 'orbFloat 18s ease-in-out infinite reverse',
      }}
    />
  </div>
);

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  
  // Form fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const captchaRef = useRef<HCaptcha>(null);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    playSound('click');
    setError('');
    setLoading(true);

    if (!captchaToken) {
      setError('Please complete the captcha verification');
      setLoading(false);
      return;
    }

    try {
      if (!isLogin) {
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
        const loginEmail = username.includes('@') ? username : email || username;
        
        if (!loginEmail.includes('@')) {
          setError('Please enter your email to login');
          setLoading(false);
          return;
        }

        const result = await loginUser(loginEmail, password, captchaToken || undefined);
        playSound('complete');
        onLogin(result.user, result.token);
      }
    } catch (err: any) {
      playSound('wrong');
      setError(err.message || 'Something went wrong');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <GradientOrbs />
      <ParticleField />
      
      {/* Animated grid */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `linear-gradient(rgba(139, 92, 246, 0.3) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(139, 92, 246, 0.3) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
      />

      <div 
        className={`relative z-10 w-full max-w-md transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
              <span className="text-white font-bold text-2xl">S</span>
            </div>
            <span className="text-white font-bold text-2xl">StudyFlow</span>
          </div>
          <p className="text-white/60">Level up your learning journey</p>
        </div>

        {/* Auth Card */}
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
          {/* Tabs */}
          <div className="flex border-b border-white/10">
            <button
              onClick={() => { if (!isLogin) switchMode(); }}
              className={`flex-1 py-4 text-center font-medium transition-all ${
                isLogin 
                  ? 'text-white bg-white/10' 
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { if (isLogin) switchMode(); }}
              className={`flex-1 py-4 text-center font-medium transition-all ${
                !isLogin 
                  ? 'text-white bg-white/10' 
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}

            {!isLogin && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white/80">Username</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">👤</span>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all"
                    placeholder="Choose a username"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/80">Email</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">✉️</span>
                <input
                  type="email"
                  value={isLogin ? username : email}
                  onChange={e => isLogin ? setUsername(e.target.value) : setEmail(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white/80">Display Name</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">🏷️</span>
                  <input
                    type="text"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all"
                    placeholder="How should we call you?"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/80">Password</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">🔒</span>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all"
                  placeholder="Enter password"
                />
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white/80">Confirm Password</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">🔒</span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all"
                    placeholder="Confirm password"
                  />
                </div>
              </div>
            )}

            {/* hCaptcha */}
            <div className="flex justify-center py-2">
              <HCaptcha
                ref={captchaRef}
                sitekey={HCAPTCHA_SITE_KEY}
                onVerify={(token) => setCaptchaToken(token)}
                onExpire={() => setCaptchaToken(null)}
                onError={() => setCaptchaToken(null)}
                theme="dark"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-xl font-semibold text-white transition-all duration-300 ${
                loading
                  ? 'bg-white/20 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-500 to-blue-500 hover:shadow-lg hover:shadow-purple-500/30 hover:scale-[1.02]'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Processing...
                </span>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>

            {isLogin && (
              <p className="text-center text-white/40 text-sm">
                Forgot your password?{' '}
                <button type="button" className="text-purple-400 hover:text-purple-300 font-medium">
                  Reset it
                </button>
              </p>
            )}
          </form>

          {/* Footer */}
          <div className="px-8 pb-6 text-center">
            <div className="flex items-center justify-center gap-2 text-white/40 text-sm">
              <span>☁️</span>
              <span>Your data syncs across all devices</span>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          {[
            { icon: '⏱️', label: 'Smart Timer' },
            { icon: '📊', label: 'Analytics' },
            { icon: '🏆', label: 'Achievements' },
          ].map((feature, i) => (
            <div 
              key={i}
              className="bg-white/5 backdrop-blur rounded-xl p-3 text-center border border-white/10"
            >
              <div className="text-2xl mb-1">{feature.icon}</div>
              <div className="text-white/60 text-xs">{feature.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes particleFloat {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-100vh) translateX(20px); opacity: 0; }
        }
        @keyframes orbFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
      `}</style>
    </div>
  );
};
