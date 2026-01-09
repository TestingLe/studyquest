import React, { useMemo } from 'react';
import type { StudyData } from '../types';

interface ProgressAnalyticsProps {
  studyData: StudyData;
}

export const ProgressAnalytics: React.FC<ProgressAnalyticsProps> = ({ studyData }) => {
  const analytics = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentSessions = studyData.sessions.filter(session => 
      new Date(session.date) >= thirtyDaysAgo
    );

    const weekSessions = studyData.sessions.filter(session => 
      new Date(session.date) >= sevenDaysAgo
    );

    // Daily study time for the last 30 days
    const dailyData = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const daySessions = recentSessions.filter(session => 
        session.date.startsWith(dateStr)
      );
      const totalTime = daySessions.reduce((sum, session) => sum + session.duration, 0);
      
      return {
        date: dateStr,
        day: date.getDate(),
        time: totalTime,
        sessions: daySessions.length
      };
    });

    // Subject breakdown
    const subjectStats = studyData.subjects.map(subject => {
      const subjectSessions = recentSessions.filter(session => session.subjectId === subject.id);
      const totalTime = subjectSessions.reduce((sum, session) => sum + session.duration, 0);
      
      return {
        ...subject,
        recentTime: totalTime,
        recentSessions: subjectSessions.length,
        avgSessionLength: subjectSessions.length > 0 ? totalTime / subjectSessions.length : 0
      };
    }).sort((a, b) => b.recentTime - a.recentTime);

    // Mood analysis
    const moodStats = recentSessions.reduce((acc, session) => {
      acc[session.mood] = (acc[session.mood] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      dailyData,
      subjectStats,
      moodStats,
      totalRecentTime: recentSessions.reduce((sum, session) => sum + session.duration, 0),
      avgDailyTime: recentSessions.reduce((sum, session) => sum + session.duration, 0) / 30,
      weeklyTime: weekSessions.reduce((sum, session) => sum + session.duration, 0)
    };
  }, [studyData]);

  const maxDailyTime = Math.max(...analytics.dailyData.map(d => d.time), 60);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Progress Analytics</h2>
        <p className="text-gray-600">Insights into your study patterns and progress over time</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Week</p>
              <p className="text-2xl font-bold text-gray-900">{Math.floor(analytics.weeklyTime / 60)}h {analytics.weeklyTime % 60}m</p>
            </div>
            <div className="text-3xl">📊</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Daily Average</p>
              <p className="text-2xl font-bold text-gray-900">{Math.floor(analytics.avgDailyTime)}min</p>
            </div>
            <div className="text-3xl">⏱️</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{studyData.sessions.length}</p>
            </div>
            <div className="text-3xl">📈</div>
          </div>
        </div>
      </div>

      {/* Daily Activity Chart */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Study Time (Last 30 Days)</h3>
        <div className="space-y-2">
          <div className="flex items-end space-x-1 h-32">
            {analytics.dailyData.map((day, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-gradient-to-t from-indigo-500 to-purple-500 rounded-t transition-all duration-300 hover:from-indigo-600 hover:to-purple-600"
                  style={{
                    height: `${(day.time / maxDailyTime) * 100}%`,
                    minHeight: day.time > 0 ? '4px' : '0px'
                  }}
                  title={`${day.time} minutes on ${day.date}`}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>30 days ago</span>
            <span>Today</span>
          </div>
        </div>
      </div>

      {/* Subject Performance */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Subject Performance</h3>
        <div className="space-y-4">
          {analytics.subjectStats.slice(0, 5).map((subject) => (
            <div key={subject.id} className="flex items-center space-x-3">
              <span className="text-2xl">{subject.icon}</span>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-gray-900">{subject.name}</span>
                  <span className="text-sm text-gray-600">{Math.floor(subject.recentTime / 60)}h {subject.recentTime % 60}m</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${analytics.totalRecentTime > 0 ? (subject.recentTime / analytics.totalRecentTime) * 100 : 0}%`,
                      backgroundColor: subject.color
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{subject.recentSessions} sessions</span>
                  <span>Avg: {Math.floor(subject.avgSessionLength)}min</span>
                </div>
              </div>
            </div>
          ))}
          {analytics.subjectStats.length === 0 && (
            <p className="text-gray-500 text-center py-4">No study data available yet. Start studying to see your progress!</p>
          )}
        </div>
      </div>

      {/* Mood Analysis */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Study Mood Analysis</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { mood: 'focused', emoji: '🎯', label: 'Focused', color: 'bg-green-100 text-green-800' },
            { mood: 'energetic', emoji: '⚡', label: 'Energetic', color: 'bg-yellow-100 text-yellow-800' },
            { mood: 'tired', emoji: '😴', label: 'Tired', color: 'bg-blue-100 text-blue-800' },
            { mood: 'distracted', emoji: '😵', label: 'Distracted', color: 'bg-red-100 text-red-800' }
          ].map(({ mood, emoji, label, color }) => {
            const count = analytics.moodStats[mood] || 0;
            const total = Object.values(analytics.moodStats).reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
            
            return (
              <div key={mood} className={`p-4 rounded-xl ${color}`}>
                <div className="text-3xl mb-2">{emoji}</div>
                <div className="font-semibold">{label}</div>
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-sm opacity-75">{percentage}% of sessions</div>
              </div>
            );
          })}
        </div>
        {Object.keys(analytics.moodStats).length === 0 && (
          <p className="text-gray-500 text-center py-4">Complete some study sessions to see your mood patterns!</p>
        )}
      </div>
    </div>
  );
};
