import React, { useMemo } from 'react';
import type { StudyData, Achievement } from '../types';

interface AchievementsProps {
  studyData: StudyData;
}

export const Achievements: React.FC<AchievementsProps> = ({ studyData }) => {
  const { availableAchievements, unlockedAchievements, progress } = useMemo(() => {
    const achievements: Achievement[] = [
      { id: 'first-session', title: 'First Steps', description: 'Complete your first study session', icon: '🎯', unlockedAt: '', xpReward: 10 },
      { id: 'five-sessions', title: 'Getting Started', description: 'Complete 5 study sessions', icon: '🌱', unlockedAt: '', xpReward: 25 },
      { id: 'ten-sessions', title: 'Building Habits', description: 'Complete 10 study sessions', icon: '🔨', unlockedAt: '', xpReward: 50 },
      { id: 'hour-warrior', title: 'Hour Warrior', description: 'Study for 1 hour in a single session', icon: '⏰', unlockedAt: '', xpReward: 30 },
      { id: 'marathon', title: 'Marathon Runner', description: 'Study for 3+ hours in one day', icon: '🏃', unlockedAt: '', xpReward: 75 },
      { id: 'dedicated', title: 'Dedicated Learner', description: 'Study for 10 hours total', icon: '📖', unlockedAt: '', xpReward: 100 },
      { id: 'scholar', title: 'True Scholar', description: 'Study for 50 hours total', icon: '🎓', unlockedAt: '', xpReward: 300 },
      { id: 'focused-mind', title: 'Focused Mind', description: 'Complete 10 sessions with "focused" mood', icon: '🧘', unlockedAt: '', xpReward: 40 },
      { id: 'energetic-spirit', title: 'Energetic Spirit', description: 'Complete 5 sessions with "energetic" mood', icon: '⚡', unlockedAt: '', xpReward: 30 },
      { id: 'pomodoro-starter', title: 'Pomodoro Starter', description: 'Complete 5 pomodoros', icon: '🍅', unlockedAt: '', xpReward: 20 },
      { id: 'pomodoro-pro', title: 'Pomodoro Pro', description: 'Complete 25 pomodoros', icon: '🍅', unlockedAt: '', xpReward: 75 },
      { id: 'pomodoro-master', title: 'Pomodoro Master', description: 'Complete 100 pomodoros', icon: '👑', unlockedAt: '', xpReward: 200 },
      { id: 'subject-explorer', title: 'Subject Explorer', description: 'Add 3 different subjects', icon: '🗺️', unlockedAt: '', xpReward: 20 },
      { id: 'subject-collector', title: 'Subject Collector', description: 'Add 5 different subjects', icon: '📚', unlockedAt: '', xpReward: 40 },
      { id: 'level-5', title: 'Rising Star', description: 'Reach level 5', icon: '⭐', unlockedAt: '', xpReward: 50 },
      { id: 'level-10', title: 'Knowledge Seeker', description: 'Reach level 10', icon: '🌟', unlockedAt: '', xpReward: 100 },
      { id: 'level-25', title: 'Wisdom Keeper', description: 'Reach level 25', icon: '💫', unlockedAt: '', xpReward: 250 },
      { id: 'night-owl', title: 'Night Owl', description: 'Study after 10 PM', icon: '🦉', unlockedAt: '', xpReward: 15 },
      { id: 'early-bird', title: 'Early Bird', description: 'Study before 7 AM', icon: '🐦', unlockedAt: '', xpReward: 15 },
      { id: 'weekend-warrior', title: 'Weekend Warrior', description: 'Study on both Saturday and Sunday', icon: '🗓️', unlockedAt: '', xpReward: 35 },
      { id: 'century', title: 'Century Club', description: 'Complete 100 study sessions', icon: '💯', unlockedAt: '', xpReward: 500 },
      { id: 'perfectionist', title: 'Perfectionist', description: 'Complete a quiz with 100% score', icon: '✨', unlockedAt: '', xpReward: 50 }
    ];

    const unlocked: Achievement[] = [];
    const progress: Record<string, { current: number; target: number; percentage: number }> = {};

    const totalStudyMinutes = studyData.sessions.reduce((sum, s) => sum + s.duration, 0);
    const totalPomodoros = studyData.sessions.reduce((sum, s) => sum + s.pomodoroCount, 0);
    const maxSessionDuration = Math.max(...studyData.sessions.map(s => s.duration), 0);
    const studyDays = new Set(studyData.sessions.map(s => new Date(s.date).getDay()));
    const hasWeekendStudy = studyDays.has(0) && studyDays.has(6);
    const hasNightStudy = studyData.sessions.some(s => { const hour = new Date(s.date).getHours(); return hour >= 22 || hour < 5; });
    const hasMorningStudy = studyData.sessions.some(s => { const hour = new Date(s.date).getHours(); return hour >= 5 && hour < 7; });

    achievements.forEach(achievement => {
      let isUnlocked = false;
      let current = 0;
      let target = 1;

      switch (achievement.id) {
        case 'first-session': current = studyData.sessions.length; target = 1; isUnlocked = current >= target; break;
        case 'five-sessions': current = studyData.sessions.length; target = 5; isUnlocked = current >= target; break;
        case 'ten-sessions': current = studyData.sessions.length; target = 10; isUnlocked = current >= target; break;
        case 'hour-warrior': current = maxSessionDuration; target = 60; isUnlocked = current >= target; break;
        case 'marathon':
          const dailyTotals = studyData.sessions.reduce((acc, session) => { const date = session.date.split('T')[0]; acc[date] = (acc[date] || 0) + session.duration; return acc; }, {} as Record<string, number>);
          current = Math.max(...Object.values(dailyTotals), 0); target = 180; isUnlocked = current >= target; break;
        case 'dedicated': current = totalStudyMinutes; target = 600; isUnlocked = current >= target; break;
        case 'scholar': current = totalStudyMinutes; target = 3000; isUnlocked = current >= target; break;
        case 'focused-mind': current = studyData.sessions.filter(s => s.mood === 'focused').length; target = 10; isUnlocked = current >= target; break;
        case 'energetic-spirit': current = studyData.sessions.filter(s => s.mood === 'energetic').length; target = 5; isUnlocked = current >= target; break;
        case 'pomodoro-starter': current = totalPomodoros; target = 5; isUnlocked = current >= target; break;
        case 'pomodoro-pro': current = totalPomodoros; target = 25; isUnlocked = current >= target; break;
        case 'pomodoro-master': current = totalPomodoros; target = 100; isUnlocked = current >= target; break;
        case 'subject-explorer': current = studyData.subjects.length; target = 3; isUnlocked = current >= target; break;
        case 'subject-collector': current = studyData.subjects.length; target = 5; isUnlocked = current >= target; break;
        case 'level-5': current = studyData.level; target = 5; isUnlocked = current >= target; break;
        case 'level-10': current = studyData.level; target = 10; isUnlocked = current >= target; break;
        case 'level-25': current = studyData.level; target = 25; isUnlocked = current >= target; break;
        case 'night-owl': current = hasNightStudy ? 1 : 0; target = 1; isUnlocked = hasNightStudy; break;
        case 'early-bird': current = hasMorningStudy ? 1 : 0; target = 1; isUnlocked = hasMorningStudy; break;
        case 'weekend-warrior': current = (studyDays.has(0) ? 1 : 0) + (studyDays.has(6) ? 1 : 0); target = 2; isUnlocked = hasWeekendStudy; break;
        case 'century': current = studyData.sessions.length; target = 100; isUnlocked = current >= target; break;
        case 'perfectionist': current = 0; target = 1; isUnlocked = false; break;
      }

      progress[achievement.id] = { current, target, percentage: Math.min((current / target) * 100, 100) };
      if (isUnlocked) unlocked.push({ ...achievement, unlockedAt: studyData.sessions[studyData.sessions.length - 1]?.date || new Date().toISOString() });
    });

    return { availableAchievements: achievements, unlockedAchievements: unlocked, progress };
  }, [studyData]);

  const completionRate = Math.round((unlockedAchievements.length / availableAchievements.length) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 rounded-full blur-3xl" />
        <div className="relative">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Achievements 🏆</h2>
          <p className="text-gray-600 dark:text-gray-300">Track your study milestones and earn XP rewards</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: '🏆', value: unlockedAchievements.length, label: 'Achievements Unlocked', color: 'from-yellow-500 to-orange-500' },
          { icon: '⭐', value: studyData.totalXP, label: 'Total XP Earned', color: 'from-purple-500 to-blue-500' },
          { icon: '📈', value: `${completionRate}%`, label: 'Completion Rate', color: 'from-green-500 to-emerald-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 text-center group hover:border-purple-500/50 transition-all">
            <div className={`w-14 h-14 mx-auto bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center text-2xl shadow-lg mb-3 group-hover:scale-110 transition-transform`}>
              {stat.icon}
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Achievements Grid */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <span className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center text-sm">🎯</span>
          All Achievements
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availableAchievements.map((achievement) => {
            const isUnlocked = unlockedAchievements.find(u => u.id === achievement.id);
            const progressData = progress[achievement.id];
            
            return (
              <div
                key={achievement.id}
                className={`relative p-5 rounded-2xl border transition-all duration-300 ${
                  isUnlocked 
                    ? 'bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30' 
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                {isUnlocked && (
                  <div className="absolute top-3 right-3">
                    <span className="text-green-400 text-lg">✓</span>
                  </div>
                )}
                
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${
                    isUnlocked 
                      ? 'bg-gradient-to-br from-yellow-500 to-orange-500 shadow-lg shadow-orange-500/30' 
                      : 'bg-white/10 grayscale'
                  }`}>
                    {achievement.icon}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className={`font-semibold ${isUnlocked ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                        {achievement.title}
                      </h4>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        isUnlocked 
                          ? 'bg-yellow-500/20 text-yellow-400' 
                          : 'bg-white/10 text-gray-500'
                      }`}>
                        +{achievement.xpReward} XP
                      </span>
                    </div>
                    <p className={`text-sm mb-3 ${isUnlocked ? 'text-gray-600 dark:text-gray-300' : 'text-gray-500 dark:text-gray-500'}`}>
                      {achievement.description}
                    </p>
                    
                    {!isUnlocked && progressData && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Progress</span>
                          <span>{progressData.current} / {progressData.target}</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${progressData.percentage}%` }}
                          />
                        </div>
                      </div>
                    )}
                    
                    {isUnlocked && (
                      <div className="text-xs text-yellow-500 font-medium">
                        Unlocked {new Date(isUnlocked.unlockedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
