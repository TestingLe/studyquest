import React, { useState } from 'react';
import type { Subject } from '../types';

interface SubjectManagerProps {
  subjects: Subject[];
  onAddSubject: (subject: Omit<Subject, 'id' | 'totalTime' | 'sessionsCount'>) => void;
  onUpdateSubject: (id: string, updates: Partial<Subject>) => void;
  onDeleteSubject: (id: string) => void;
}

export const SubjectManager: React.FC<SubjectManagerProps> = ({ subjects, onAddSubject, onUpdateSubject, onDeleteSubject }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [newSubject, setNewSubject] = useState<{ name: string; color: string; icon: string; difficulty: 'easy' | 'medium' | 'hard'; targetTime: number }>({
    name: '', color: '#6366f1', icon: '📚', difficulty: 'medium', targetTime: 120
  });

  const presetSubjects = [
    { name: 'Mathematics', icon: '🧮', color: '#6366f1', difficulty: 'hard' as const },
    { name: 'Physics', icon: '🔬', color: '#8b5cf6', difficulty: 'hard' as const },
    { name: 'Chemistry', icon: '⚗️', color: '#06b6d4', difficulty: 'hard' as const },
    { name: 'Biology', icon: '🧬', color: '#10b981', difficulty: 'medium' as const },
    { name: 'History', icon: '📜', color: '#f59e0b', difficulty: 'medium' as const },
    { name: 'Literature', icon: '📚', color: '#ef4444', difficulty: 'medium' as const },
    { name: 'Computer Science', icon: '💻', color: '#3b82f6', difficulty: 'hard' as const },
    { name: 'Art', icon: '🎨', color: '#ec4899', difficulty: 'easy' as const },
    { name: 'Music', icon: '🎵', color: '#a855f7', difficulty: 'easy' as const },
    { name: 'Geography', icon: '🌍', color: '#14b8a6', difficulty: 'medium' as const },
    { name: 'Economics', icon: '📊', color: '#f97316', difficulty: 'medium' as const },
    { name: 'Language', icon: '🗣️', color: '#84cc16', difficulty: 'medium' as const },
  ];

  const subjectIcons = ['📚', '🔬', '🧮', '🎨', '💻', '🌍', '📝', '🎵', '⚖️', '🏥', '🔧', '📊', '⚗️', '🧬', '📜', '🗣️', '✏️'];
  const difficultyConfig = {
    easy: { label: 'Easy', color: 'from-green-500 to-emerald-600', bg: 'bg-green-500/20 text-green-400' },
    medium: { label: 'Medium', color: 'from-yellow-500 to-orange-600', bg: 'bg-yellow-500/20 text-yellow-400' },
    hard: { label: 'Hard', color: 'from-red-500 to-pink-600', bg: 'bg-red-500/20 text-red-400' }
  };

  const handleQuickAdd = (preset: typeof presetSubjects[0]) => {
    onAddSubject({ name: preset.name, color: preset.color, icon: preset.icon, difficulty: preset.difficulty, targetTime: 120 });
    setShowQuickAdd(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubject.name.trim()) {
      onAddSubject(newSubject);
      setNewSubject({ name: '', color: '#6366f1', icon: '📚', difficulty: 'medium', targetTime: 120 });
      setShowAddForm(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-500/20 to-purple-500/20 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-indigo-400/20 to-purple-500/20 rounded-full blur-3xl" />
        <div className="relative flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Subject Management 📚</h2>
            <p className="text-gray-600 dark:text-gray-300">Organize your learning paths and track progress</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowQuickAdd(true)} className="px-5 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/30 transition-all hover:scale-105">
              ➕ Quick Add
            </button>
            <button onClick={() => setShowAddForm(true)} className="px-5 py-3 bg-white/10 backdrop-blur text-white rounded-xl font-medium border border-white/20 hover:bg-white/20 transition-all">
              ✏️ Custom
            </button>
          </div>
        </div>
      </div>

      {/* Subjects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.map((subject) => (
          <div key={subject.id} className="group bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-purple-500/50 transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg" style={{ backgroundColor: `${subject.color}30`, boxShadow: `0 10px 30px -10px ${subject.color}50` }}>
                  {subject.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{subject.name}</h3>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${difficultyConfig[subject.difficulty].bg}`}>
                    {difficultyConfig[subject.difficulty].label}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Total Time</span>
                <span className="font-medium text-gray-900 dark:text-white">{Math.floor(subject.totalTime / 60)}h {subject.totalTime % 60}m</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Sessions</span>
                <span className="font-medium text-gray-900 dark:text-white">{subject.sessionsCount}</span>
              </div>
              {subject.targetTime && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Weekly Goal</span>
                    <span className="font-medium text-gray-900 dark:text-white">{subject.targetTime}min</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                    <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min((subject.totalTime / subject.targetTime) * 100, 100)}%`, backgroundColor: subject.color }} />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-white/10 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => { const newTarget = prompt('Enter weekly target (minutes):', subject.targetTime?.toString() || '120'); if (newTarget && !isNaN(Number(newTarget))) onUpdateSubject(subject.id, { targetTime: Number(newTarget) }); }} className="text-sm text-purple-400 hover:text-purple-300 font-medium">⚙️ Edit Goal</button>
              <button onClick={() => { if (confirm(`Delete "${subject.name}"?`)) onDeleteSubject(subject.id); }} className="text-sm text-red-400 hover:text-red-300 font-medium">🗑️ Delete</button>
            </div>
          </div>
        ))}

        {subjects.length === 0 && (
          <div className="col-span-full bg-white/5 backdrop-blur-xl rounded-2xl p-12 border border-white/10 text-center">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-500 to-blue-500 rounded-3xl flex items-center justify-center text-4xl shadow-lg shadow-purple-500/30 mb-4">📚</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No subjects yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Add your first subject to start tracking your study progress!</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setShowQuickAdd(true)} className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/30 transition-all">Quick Add Subject</button>
              <button onClick={() => setShowAddForm(true)} className="px-6 py-3 bg-white/10 text-white rounded-xl font-medium border border-white/20 hover:bg-white/20 transition-all">Create Custom</button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Add Modal */}
      {showQuickAdd && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowQuickAdd(false)}>
          <div className="bg-gradient-to-br from-slate-900 to-purple-950 rounded-3xl p-8 max-w-2xl w-full border border-white/10 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Quick Add Subject</h3>
              <button onClick={() => setShowQuickAdd(false)} className="text-white/50 hover:text-white text-2xl">×</button>
            </div>
            <p className="text-white/60 mb-6">Select a subject to add to your study list:</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {presetSubjects.map((preset) => (
                <button key={preset.name} onClick={() => handleQuickAdd(preset)} className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/50 hover:bg-white/10 transition-all text-left group">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-3 group-hover:scale-110 transition-transform" style={{ backgroundColor: `${preset.color}30` }}>{preset.icon}</div>
                  <div className="font-semibold text-white">{preset.name}</div>
                  <div className={`text-xs mt-1 ${difficultyConfig[preset.difficulty].bg} inline-block px-2 py-0.5 rounded-full`}>{preset.difficulty}</div>
                </button>
              ))}
            </div>
            <div className="mt-6 pt-6 border-t border-white/10 text-center">
              <p className="text-sm text-white/50">Don't see your subject? <button onClick={() => { setShowQuickAdd(false); setShowAddForm(true); }} className="text-purple-400 hover:text-purple-300 font-medium">Create Custom</button></p>
            </div>
          </div>
        </div>
      )}

      {/* Custom Add Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAddForm(false)}>
          <div className="bg-gradient-to-br from-slate-900 to-purple-950 rounded-3xl p-8 max-w-md w-full border border-white/10" onClick={e => e.stopPropagation()}>
            <h3 className="text-2xl font-bold text-white mb-6">Create Custom Subject</h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Subject Name</label>
                <input type="text" value={newSubject.name} onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })} placeholder="e.g., Mathematics" className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Choose Icon</label>
                <div className="grid grid-cols-6 gap-2">
                  {subjectIcons.map((icon) => (
                    <button key={icon} type="button" onClick={() => setNewSubject({ ...newSubject, icon })} className={`p-3 text-xl rounded-xl border transition-all ${newSubject.icon === icon ? 'border-purple-500 bg-purple-500/20' : 'border-white/10 hover:border-white/30'}`}>{icon}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Difficulty</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['easy', 'medium', 'hard'] as const).map((d) => (
                    <button key={d} type="button" onClick={() => setNewSubject({ ...newSubject, difficulty: d })} className={`p-3 rounded-xl border capitalize transition-all ${newSubject.difficulty === d ? 'border-purple-500 bg-purple-500/20 text-white' : 'border-white/10 text-white/60 hover:border-white/30'}`}>{d}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Weekly Goal (minutes)</label>
                <input type="number" value={newSubject.targetTime} onChange={(e) => setNewSubject({ ...newSubject, targetTime: Number(e.target.value) })} min="30" max="1000" className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Color</label>
                <div className="grid grid-cols-6 gap-2">
                  {['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'].map((color) => (
                    <button key={color} type="button" onClick={() => setNewSubject({ ...newSubject, color })} className={`w-10 h-10 rounded-xl border-2 transition-all ${newSubject.color === color ? 'border-white scale-110' : 'border-transparent hover:scale-105'}`} style={{ backgroundColor: color }} />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 py-3 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-all">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/30 transition-all">Add Subject</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
