import React, { useMemo } from 'react';
import type { StudyData, Achievement } from '../types';

interface AchievementsProps {
  studyData: StudyData;
}

export const Achievements: React.FC<AchievementsProps> = ({ studyData }) => {
  const { availableAchievements, unlockedAchievements, progress } = useMemo(() => {
    const achievements: Achievement[] = [
      // Beginner achievements
      {
        id: 'first-session',
        title: 'First Steps',
        description: 'Complete your first study session',
        icon: '🎯',
        unlockedAt: '',
        xpReward: 10
      },
      {
        id: 'five-sessions',
        title: 'Getting Started',
        description: 'Complete 5 study sessions',
        icon: '🌱',
        unlockedAt: '',
        xpReward: 25
      },
      {
        id: 'ten-sessions',
        title: 'Building Habits',
        description: 'Complete 10 study sessions',
        icon: '🔨',
        unlockedAt: '',
        xpReward: 50
      },
      // Time-based achievements
      {
        id: 'hour-warrior',
        title: 'Hour Warrior',
        description: 'Study for 1 hour in a single session',
        icon: '⏰',
        unlockedAt: '',
        xpReward: 30
      },
      {
        id: 'marathon',
        title: 'Marathon Runner',
        description: 'Study for 3+ hours in one day',
        icon: '🏃',
        unlockedAt: '',
        xpReward: 75
      },
      {
        id: 'dedicated',
        title: 'Dedicated Learner',
        description: 'Study for 10 hours total',
        icon: '📖',
        unlockedAt: '',
        xpReward: 100
      },
      {
        id: 'scholar',
        title: 'True Scholar',
        description: 'Study for 50 hours total',
        icon: '🎓',
        unlockedAt: '',
        xpReward: 300
      },
      // Mood achievements
      {
        id: 'focused-mind',
        title: 'Focused Mind',
        description: 'Complete 10 sessions with "focused" mood',
        icon: '🧘',
        unlockedAt: '',
        xpReward: 40
      },
      {
        id: 'energetic-spirit',
        title: 'Energetic Spirit',
        description: 'Complete 5 sessions with "energetic" mood',
        icon: '⚡',
        unlockedAt: '',
        xpReward: 30
      },
      // Pomodoro achievements
      {
        id: 'pomodoro-starter',
        title: 'Pomodoro Starter',
        description: 'Complete 5 pomodoros',
        icon: '🍅',
        unlockedAt: '',
        xpReward: 20
      },
      {
        id: 'pomodoro-pro',
        title: 'Pomodoro Pro',
        description: 'Complete 25 pomodoros',
        icon: '🍅',
        unlockedAt: '',
        xpReward: 75
      },
      {
        id: 'pomodoro-master',
        title: 'Pomodoro Master',
        description: 'Complete 100 pomodoros',
        icon: '👑',
        unlockedAt: '',
        xpReward: 200
      },
      // Subject achievements
      {
        id: 'subject-explorer',
        title: 'Subject Explorer',
        description: 'Add 3 different subjects',
        icon: '🗺️',
        unlockedAt: '',
        xpReward: 20
      },
      {
        id: 'subject-collector',
        title: 'Subject Collector',
        description: 'Add 5 different subjects',
        icon: '📚',
        unlockedAt: '',
        xpReward: 40
      },
      // Level achievements
      {
        id: 'level-5',
        title: 'Rising Star',
        description: 'Reach level 5',
        icon: '⭐',
        unlockedAt: '',
        xpReward: 50
      },
      {
        id: 'level-10',
        title: 'Knowledge Seeker',
        description: 'Reach level 10',
        icon: '🌟',
        unlockedAt: '',
        xpReward: 100
      },
      {
        id: 'level-25',
        title: 'Wisdom Keeper',
        description: 'Reach level 25',
        icon: '💫',
        unlockedAt: '',
        xpReward: 250
      },
      // Special achievements
      {
        id: 'night-owl',
        title: 'Night Owl',
        description: 'Study after 10 PM',
        icon: '🦉',
        unlockedAt: '',
        xpReward: 15
      },
      {
        id: 'early-bird',
        title: 'Early Bird',
        description: 'Study before 7 AM',
        icon: '🐦',
        unlockedAt: '',
        xpReward: 15
      },
      {
        id: 'weekend-warrior',
        title: 'Weekend Warrior',
        description: 'Study on both Saturday and Sunday',
        icon: '🗓️',
        unlockedAt: '',
        xpReward: 35
      },
      {
        id: 'century',
        title: 'Century Club',
        description: 'Complete 100 study sessions',
        icon: '💯',
        unlockedAt: '',
        xpReward: 500
      },
      {
        id: 'perfectionist',
        title: 'Perfectionist',
        description: 'Complete a quiz with 100% score',
        icon: '✨',
        unlockedAt: '',
        xpReward: 50
      }
    ];

    // Check which achievements are unlocked
    const unlocked: Achievement[] = [];
    const progress: Record<string, { current: number; target: number; percentage: number }> = {};

    const totalStudyMinutes = studyData.sessions.reduce((sum, s) => sum + s.duration, 0);
    const totalPomodoros = studyData.sessions.reduce((sum, s) => sum + s.pomodoroCount, 0);
    const maxSessionDuration = Math.max(...studyData.sessions.map(s => s.duration), 0);

    // Check for weekend study
    const studyDays = new Set(studyData.sessions.map(s => new Date(s.date).getDay()));
    const hasWeekendStudy = studyDays.has(0) && studyDays.has(6);

    // Check for night/morning study
    const hasNightStudy = studyData.sessions.some(s => {
      const hour = new Date(s.date).getHours();
      return hour >= 22 || hour < 5;
    });
    const hasMorningStudy = studyData.sessions.some(s => {
      const hour = new Date(s.date).getHours();
      return hour >= 5 && hour < 7;
    });

    achievements.forEach(achievement => {
      let isUnlocked = false;
      let current = 0;
      let target = 1;

      switch (achievement.id) {
        case 'first-session':
          current = studyData.sessions.length;
          target = 1;
          isUnlocked = current >= target;
          break;

        case 'five-sessions':
          current = studyData.sessions.length;
          target = 5;
          isUnlocked = current >= target;
          break;

        case 'ten-sessions':
          current = studyData.sessions.length;
          target = 10;
          isUnlocked = current >= target;
          break;

        case 'hour-warrior':
          current = maxSessionDuration;
          target = 60;
          isUnlocked = current >= target;
          break;

        case 'marathon':
          const dailyTotals = studyData.sessions.reduce((acc, session) => {
            const date = session.date.split('T')[0];
            acc[date] = (acc[date] || 0) + session.duration;
            return acc;
          }, {} as Record<string, number>);
          current = Math.max(...Object.values(dailyTotals), 0);
          target = 180;
          isUnlocked = current >= target;
          break;

        case 'dedicated':
          current = totalStudyMinutes;
          target = 600;
          isUnlocked = current >= target;
          break;

        case 'scholar':
          current = totalStudyMinutes;
          target = 3000;
          isUnlocked = current >= target;
          break;

        case 'focused-mind':
          current = studyData.sessions.filter(s => s.mood === 'focused').length;
          target = 10;
          isUnlocked = current >= target;
          break;

        case 'energetic-spirit':
          current = studyData.sessions.filter(s => s.mood === 'energetic').length;
          target = 5;
          isUnlocked = current >= target;
          break;

        case 'pomodoro-starter':
          current = totalPomodoros;
          target = 5;
          isUnlocked = current >= target;
          break;

        case 'pomodoro-pro':
          current = totalPomodoros;
          target = 25;
          isUnlocked = current >= target;
          break;

        case 'pomodoro-master':
          current = totalPomodoros;
          target = 100;
          isUnlocked = current >= target;
          break;

        case 'subject-explorer':
          current = studyData.subjects.length;
          target = 3;
          isUnlocked = current >= target;
          break;

        case 'subject-collector':
          current = studyData.subjects.length;
          target = 5;
          isUnlocked = current >= target;
          break;

        case 'level-5':
          current = studyData.level;
          target = 5;
          isUnlocked = current >= target;
          break;

        case 'level-10':
          current = studyData.level;
          target = 10;
          isUnlocked = current >= target;
          break;

        case 'level-25':
          current = studyData.level;
          target = 25;
          isUnlocked = current >= target;
          break;

        case 'night-owl':
          current = hasNightStudy ? 1 : 0;
          target = 1;
          isUnlocked = hasNightStudy;
          break;

        case 'early-bird':
          current = hasMorningStudy ? 1 : 0;
          target = 1;
          isUnlocked = hasMorningStudy;
          break;

        case 'weekend-warrior':
          current = (studyDays.has(0) ? 1 : 0) + (studyDays.has(6) ? 1 : 0);
          target = 2;
          isUnlocked = hasWeekendStudy;
          break;

        case 'century':
          current = studyData.sessions.length;
          target = 100;
          isUnlocked = current >= target;
          break;

        case 'perfectionist':
          // This would need quiz data - for now just show as locked
          current = 0;
          target = 1;
          isUnlocked = false;
          break;
      }

      progress[achievement.id] = {
        current,
        target,
        percentage: Math.min((current / target) * 100, 100)
      };

      if (isUnlocked) {
        unlocked.push({
          ...achievement,
          unlockedAt: studyData.sessions[studyData.sessions.length - 1]?.date || new Date().toISOString()
        });
      }
    });

    return {
      availableAchievements: achievements,
      unlockedAchievements: unlocked,
      progress
    };
  }, [studyData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Achievements</h2>
        <p className="text-gray-600">Track your study milestones and earn XP</p>
      </div>

      {/* Achievement Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-lg text-center">
          <div className="text-3xl mb-2">🏆</div>
          <div className="text-2xl font-bold text-gray-900">{unlockedAchievements.length}</div>
          <div className="text-sm text-gray-600">Achievements Unlocked</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-lg text-center">
          <div className="text-3xl mb-2">⭐</div>
          <div className="text-2xl font-bold text-gray-900">{studyData.totalXP}</div>
          <div className="text-sm text-gray-600">Total XP Earned</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-lg text-center">
          <div className="text-3xl mb-2">📈</div>
          <div className="text-2xl font-bold text-gray-900">
            {Math.round((unlockedAchievements.length / availableAchievements.length) * 100)}%
          </div>
          <div className="text-sm text-gray-600">Completion Rate</div>
        </div>
      </div>

      {/* Available Achievements */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Achievements</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availableAchievements.map((achievement) => {
            const isUnlocked = unlockedAchievements.find(unlocked => unlocked.id === achievement.id);
            const progressData = progress[achievement.id];
            
            return (
              <div
                key={achievement.id}
                className={`p-4 rounded-lg border-2 ${
                  isUnlocked 
                    ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200' 
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className={`text-3xl ${!isUnlocked ? 'grayscale' : ''}`}>
                      {achievement.icon}
                    </span>
                    <div>
                      <h4 className={`font-semibold ${isUnlocked ? 'text-gray-900' : 'text-gray-700'}`}>
                        {achievement.title}
                      </h4>
                      <p className={`text-sm ${isUnlocked ? 'text-gray-600' : 'text-gray-500'}`}>
                        {achievement.description}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-bold ${isUnlocked ? 'text-yellow-600' : 'text-gray-400'}`}>
                    +{achievement.xpReward} XP
                  </span>
                </div>
                
                {progressData && !isUnlocked && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Progress</span>
                      <span>{progressData.current} / {progressData.target}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${progressData.percentage}%` }}
                      />
                    </div>
                  </div>
                )}
                
                {isUnlocked && (
                  <div className="text-xs text-yellow-600 font-medium">
                    ✅ Unlocked {new Date(isUnlocked.unlockedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
