import React, { useState, useEffect, useMemo } from 'react';

interface LandingPageProps {
  onGetStarted: () => void;
  darkMode: boolean;
}

// 3D Floating Phone Component with Study App UI
const FloatingPhone: React.FC = () => {
  const [time, setTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  return (
    <div 
      className="relative"
      style={{ 
        perspective: '1500px',
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Phone body */}
      <div
        className="relative w-56 h-[420px] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-[3rem] p-2 shadow-2xl"
        style={{
          transform: 'rotateY(-15deg) rotateX(5deg)',
          animation: 'phoneFloat 6s ease-in-out infinite',
          boxShadow: '0 50px 100px -20px rgba(0, 0, 0, 0.5), 0 30px 60px -30px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
        }}
      >
        {/* Phone frame highlight */}
        <div className="absolute inset-0 rounded-[3rem] bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
        
        {/* Screen */}
        <div className="relative w-full h-full bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 rounded-[2.5rem] overflow-hidden">
          {/* Status bar */}
          <div className="flex justify-between items-center px-6 py-2 text-white/80 text-xs">
            <span>{formatTime(time)}</span>
            <div className="flex items-center gap-1">
              <div className="flex gap-0.5">
                {[1,2,3,4].map(i => (
                  <div key={i} className={`w-1 rounded-full bg-white/80`} style={{ height: `${i * 2 + 2}px` }} />
                ))}
              </div>
              <div className="w-6 h-3 border border-white/80 rounded-sm ml-1">
                <div className="w-4 h-full bg-green-400 rounded-sm" />
              </div>
            </div>
          </div>

          {/* App content */}
          <div className="px-4 pt-2">
            {/* App header */}
            <div className="text-center mb-4">
              <h3 className="text-white font-bold text-lg">StudyFlow</h3>
              <p className="text-purple-300 text-xs">Your learning companion</p>
            </div>

            {/* Timer display */}
            <div className="bg-gradient-to-br from-purple-600/30 to-blue-600/30 backdrop-blur rounded-2xl p-4 mb-3 border border-white/10">
              <div className="text-center">
                <div className="text-4xl font-mono font-bold text-white mb-1 tracking-wider">
                  25:00
                </div>
                <div className="text-purple-300 text-xs">Focus Session</div>
              </div>
              {/* Progress ring */}
              <div className="flex justify-center mt-3">
                <svg className="w-16 h-16 -rotate-90">
                  <circle cx="32" cy="32" r="28" stroke="rgba(255,255,255,0.1)" strokeWidth="4" fill="none" />
                  <circle 
                    cx="32" cy="32" r="28" 
                    stroke="url(#gradient)" 
                    strokeWidth="4" 
                    fill="none"
                    strokeDasharray="176"
                    strokeDashoffset="44"
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10">
                <div className="text-2xl mb-1">🔥</div>
                <div className="text-white font-bold text-sm">7 Days</div>
                <div className="text-white/50 text-xs">Streak</div>
              </div>
              <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10">
                <div className="text-2xl mb-1">📚</div>
                <div className="text-white font-bold text-sm">12.5 hrs</div>
                <div className="text-white/50 text-xs">This Week</div>
              </div>
            </div>

            {/* Subject progress */}
            <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10">
              <div className="text-white/80 text-xs mb-2">Today's Progress</div>
              {[
                { name: 'Mathematics', progress: 75, color: 'from-pink-500 to-rose-500' },
                { name: 'Physics', progress: 45, color: 'from-cyan-500 to-blue-500' },
              ].map((subject, i) => (
                <div key={i} className="mb-2 last:mb-0">
                  <div className="flex justify-between text-xs text-white/60 mb-1">
                    <span>{subject.name}</span>
                    <span>{subject.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${subject.color} rounded-full`}
                      style={{ width: `${subject.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom nav */}
          <div className="absolute bottom-4 left-4 right-4 flex justify-around bg-white/5 backdrop-blur rounded-2xl py-3 border border-white/10">
            {['🏠', '📊', '⏱️', '👤'].map((icon, i) => (
              <div key={i} className={`text-lg ${i === 0 ? 'opacity-100' : 'opacity-50'}`}>{icon}</div>
            ))}
          </div>
        </div>

        {/* Notch */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-6 bg-black rounded-full" />
      </div>

      {/* Floating elements around phone */}
      <div className="absolute -top-8 -right-8 animate-bounce" style={{ animationDuration: '3s' }}>
        <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center text-2xl shadow-lg shadow-orange-500/30 rotate-12">
          ⭐
        </div>
      </div>
      <div className="absolute -bottom-4 -left-8 animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>
        <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-green-500/30 -rotate-12">
          ✓
        </div>
      </div>
      <div className="absolute top-1/2 -right-12 animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }}>
        <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg flex items-center justify-center text-sm shadow-lg shadow-purple-500/30 rotate-6">
          📖
        </div>
      </div>
    </div>
  );
};











// Animated Stats Counter
const AnimatedCounter: React.FC<{ end: number; suffix?: string; duration?: number }> = ({ 
  end, suffix = '', duration = 2000 
}) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let startTime: number;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [end, duration]);

  return <span>{count.toLocaleString()}{suffix}</span>;
};

// Particle Background
const ParticleField: React.FC = () => {
  const particles = useMemo(() => 
    [...Array(50)].map((_, i) => ({
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

// Animated Gradient Orbs
const GradientOrbs: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div 
      className="absolute w-[600px] h-[600px] rounded-full opacity-30 blur-3xl"
      style={{
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.8) 0%, transparent 70%)',
        top: '-20%',
        right: '-10%',
        animation: 'orbFloat 15s ease-in-out infinite',
      }}
    />
    <div 
      className="absolute w-[500px] h-[500px] rounded-full opacity-20 blur-3xl"
      style={{
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.8) 0%, transparent 70%)',
        bottom: '-10%',
        left: '-10%',
        animation: 'orbFloat 18s ease-in-out infinite reverse',
      }}
    />
    <div 
      className="absolute w-[400px] h-[400px] rounded-full opacity-25 blur-3xl"
      style={{
        background: 'radial-gradient(circle, rgba(236, 72, 153, 0.6) 0%, transparent 70%)',
        top: '40%',
        left: '30%',
        animation: 'orbFloat 12s ease-in-out infinite',
        animationDelay: '2s',
      }}
    />
  </div>
);

// Feature Card Component
const FeatureCard: React.FC<{ icon: string; title: string; description: string; delay: number }> = ({ 
  icon, title, description, delay 
}) => (
  <div 
    className="group relative bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-purple-500/50 transition-all duration-500 hover:scale-105 hover:bg-white/10"
    style={{ 
      animation: 'fadeInUp 0.8s ease-out forwards',
      animationDelay: `${delay}s`,
      opacity: 0,
    }}
  >
    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <div className="relative">
      <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center text-2xl mb-4 shadow-lg shadow-purple-500/25 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
      <p className="text-white/60 text-sm leading-relaxed">{description}</p>
    </div>
  </div>
);

// Main Landing Page Component
const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    { icon: '⏱️', title: 'Smart Timer', description: 'Pomodoro technique with customizable focus sessions and break reminders' },
    { icon: '📊', title: 'Progress Analytics', description: 'Track your study habits with beautiful charts and insights' },
    { icon: '🎯', title: 'Goal Setting', description: 'Set daily and weekly targets to stay motivated and on track' },
    { icon: '🏆', title: 'Achievements', description: 'Unlock badges and rewards as you build consistent study habits' },
    { icon: '👥', title: 'Study Rooms', description: 'Join virtual rooms and study together with friends in real-time' },
    { icon: '🧠', title: 'Smart Quizzes', description: 'Test your knowledge with AI-powered adaptive quizzes' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 overflow-hidden relative">
      {/* Background effects */}
      <GradientOrbs />
      <ParticleField />
      
      {/* Animated grid background */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `linear-gradient(rgba(139, 92, 246, 0.3) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(139, 92, 246, 0.3) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
          animation: 'gridMove 20s linear infinite',
        }}
      />

      {/* Navigation */}
      <nav className="relative z-10 flex justify-between items-center px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
            <span className="text-white font-bold text-xl">S</span>
          </div>
          <span className="text-white font-bold text-xl">StudyFlow</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={onGetStarted}
            className="px-6 py-2.5 text-white/80 hover:text-white transition-colors font-medium"
          >
            Sign In
          </button>
          <button 
            onClick={onGetStarted}
            className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 hover:scale-105"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-8 pt-12 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div 
            className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}
          >
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur rounded-full px-4 py-2 mb-6 border border-white/10">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-white/80 text-sm">Join 10,000+ students learning smarter</span>
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Master Your
              <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                Learning Journey
              </span>
            </h1>
            
            <p className="text-xl text-white/60 mb-8 leading-relaxed max-w-lg">
              Transform the way you study with smart timers, progress tracking, and a community of learners. 
              Stay focused, stay motivated, achieve more.
            </p>

            <div className="flex flex-wrap gap-4 mb-12">
              <button 
                onClick={onGetStarted}
                className="group px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-2xl font-semibold text-lg hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 hover:scale-105 flex items-center gap-2"
              >
                Start Learning Free
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </button>
              <button className="px-8 py-4 bg-white/5 backdrop-blur text-white rounded-2xl font-semibold text-lg border border-white/10 hover:bg-white/10 transition-all duration-300 flex items-center gap-2">
                <span className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">▶</span>
                Watch Demo
              </button>
            </div>

            {/* Stats */}
            <div className="flex gap-8">
              {[
                { value: 10000, suffix: '+', label: 'Active Students' },
                { value: 500000, suffix: '+', label: 'Study Hours' },
                { value: 98, suffix: '%', label: 'Satisfaction' },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-3xl font-bold text-white mb-1">
                    <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-white/50 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right content - 3D Phone */}
          <div 
            className={`flex justify-center lg:justify-end transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}
          >
            <FloatingPhone />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 container mx-auto px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">
            Everything You Need to
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent"> Excel</span>
          </h2>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            Powerful features designed to help you study smarter, not harder
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <FeatureCard key={i} {...feature} delay={0.1 * i} />
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 container mx-auto px-8 py-20">
        <div className="relative bg-gradient-to-r from-purple-600/20 to-blue-600/20 backdrop-blur-xl rounded-3xl p-12 border border-white/10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10" />
          <div className="relative text-center">
            <h2 className="text-4xl font-bold text-white mb-4">Ready to Transform Your Study Habits?</h2>
            <p className="text-white/60 text-lg mb-8 max-w-2xl mx-auto">
              Join thousands of students who are already studying smarter with StudyFlow
            </p>
            <button 
              onClick={onGetStarted}
              className="px-10 py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-2xl font-semibold text-lg hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 hover:scale-105"
            >
              Get Started — It's Free
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-8">
        <div className="container mx-auto px-8 text-center text-white/40 text-sm">
          © 2026 StudyFlow. Built with 💜 for students everywhere.
        </div>
      </footer>

      {/* CSS Animations */}
      <style>{`
        @keyframes phoneFloat {
          0%, 100% { transform: rotateY(-15deg) rotateX(5deg) translateY(0px); }
          50% { transform: rotateY(-15deg) rotateX(5deg) translateY(-20px); }
        }
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
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }
        @keyframes gentleFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes steam {
          0% { opacity: 0.5; transform: translateY(0) scaleX(1); }
          100% { opacity: 0; transform: translateY(-20px) scaleX(2); }
        }
        @keyframes ideaFloat {
          0%, 100% { transform: translateY(0) rotate(-5deg); }
          50% { transform: translateY(-15px) rotate(5deg); }
        }
        @keyframes bookFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        @keyframes orbit {
          from { transform: rotate(0deg) translateX(150px) rotate(0deg); }
          to { transform: rotate(360deg) translateX(150px) rotate(-360deg); }
        }
        @keyframes symbol-float {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.1; }
          50% { transform: translateY(-30px) rotate(10deg); opacity: 0.2; }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
