import React, { useState } from 'react';
import type { Subject } from '../types';

interface SubjectManagerProps {
  subjects: Subject[];
  onAddSubject: (subject: Omit<Subject, 'id' | 'totalTime' | 'sessionsCount'>) => void;
  onUpdateSubject: (id: string, updates: Partial<Subject>) => void;
  onDeleteSubject: (id: string) => void;
}

export const SubjectManager: React.FC<SubjectManagerProps> = ({
  subjects,
  onAddSubject,
  onUpdateSubject,
  onDeleteSubject
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [newSubject, setNewSubject] = useState<{
    name: string;
    color: string;
    icon: string;
    difficulty: 'easy' | 'medium' | 'hard';
    targetTime: number;
  }>({
    name: '',
    color: '#6366f1',
    icon: '📚',
    difficulty: 'medium',
    targetTime: 120
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
    { name: 'Custom', icon: '✏️', color: '#6366f1', difficulty: 'medium' as const }
  ];

  const subjectIcons = ['📚', '🔬', '🧮', '🎨', '💻', '🌍', '📝', '🎵', '⚖️', '🏥', '🔧', '📊', '⚗️', '🧬', '📜', '🗣️', '✏️'];
  const difficultyColors = {
    easy: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    hard: 'bg-red-100 text-red-800'
  };

  const handleQuickAdd = (presetName: string) => {
    if (presetName === 'Custom') {
      setShowAddForm(true);
      setShowQuickAdd(false);
      return;
    }

    const preset = presetSubjects.find(p => p.name === presetName);
    if (preset) {
      onAddSubject({
        name: preset.name,
        color: preset.color,
        icon: preset.icon,
        difficulty: preset.difficulty,
        targetTime: 120
      });
      setShowQuickAdd(false);
      setSelectedPreset('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubject.name.trim()) {
      onAddSubject(newSubject);
      setNewSubject({
        name: '',
        color: '#6366f1',
        icon: '📚',
        difficulty: 'medium',
        targetTime: 120
      });
      setShowAddForm(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Subject Management</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowQuickAdd(true)}
            className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
          >
            ➕ Quick Add
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            ✏️ Custom Subject
          </button>
        </div>
      </div>

      {/* Subjects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjects.map((subject) => (
          <div key={subject.id} className="bg-white rounded-xl p-6 shadow-lg border-l-4" style={{ borderLeftColor: subject.color }}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className="text-3xl">{subject.icon}</span>
                <div>
                  <h3 className="font-semibold text-gray-900">{subject.name}</h3>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${difficultyColors[subject.difficulty]}`}>
                    {subject.difficulty}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Time:</span>
                <span className="font-medium">{Math.floor(subject.totalTime / 60)}h {subject.totalTime % 60}m</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Sessions:</span>
                <span className="font-medium">{subject.sessionsCount}</span>
              </div>
              {subject.targetTime && (
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Weekly Goal:</span>
                    <span className="font-medium">{subject.targetTime}min</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${Math.min((subject.totalTime / subject.targetTime) * 100, 100)}%`,
                        backgroundColor: subject.color
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between">
              <button
                onClick={() => {
                  const newTarget = prompt('Enter weekly target (minutes):', subject.targetTime?.toString() || '120');
                  if (newTarget && !isNaN(Number(newTarget))) {
                    onUpdateSubject(subject.id, { targetTime: Number(newTarget) });
                  }
                }}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              >
                ⚙️ Edit Goal
              </button>
              <button
                onClick={() => {
                  if (confirm(`Are you sure you want to delete "${subject.name}"?`)) {
                    onDeleteSubject(subject.id);
                  }
                }}
                className="text-sm text-red-500 hover:text-red-700 font-medium"
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        ))}

        {subjects.length === 0 && (
          <div className="col-span-full text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No subjects yet</h3>
            <p className="text-gray-500 mb-4">Add your first subject to start tracking your study progress!</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowQuickAdd(true)}
                className="px-6 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
              >
                Quick Add Subject
              </button>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                Create Custom Subject
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Add Modal */}
      {showQuickAdd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Quick Add Subject</h3>
              <button
                onClick={() => setShowQuickAdd(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>
            
            <p className="text-gray-600 mb-6">Select a subject to add to your study list:</p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {presetSubjects.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => handleQuickAdd(preset.name)}
                  className="p-4 rounded-xl border-2 border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all duration-200 text-left"
                  style={{
                    borderColor: selectedPreset === preset.name ? preset.color : undefined,
                    backgroundColor: selectedPreset === preset.name ? `${preset.color}10` : undefined
                  }}
                >
                  <div className="text-3xl mb-2">{preset.icon}</div>
                  <div className="font-semibold text-gray-900">{preset.name}</div>
                  <div className="text-xs text-gray-500 mt-1 capitalize">{preset.difficulty}</div>
                </button>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-500">
                Don't see your subject? Use{' '}
                <button
                  onClick={() => {
                    setShowQuickAdd(false);
                    setShowAddForm(true);
                  }}
                  className="text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Custom Subject
                </button>
                {' '}to create your own.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Custom Add Subject Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Create Custom Subject</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject Name
                </label>
                <input
                  type="text"
                  value={newSubject.name}
                  onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                  placeholder="e.g., Mathematics, Physics, History"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Choose Icon
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {subjectIcons.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setNewSubject({ ...newSubject, icon })}
                      className={`p-3 text-2xl rounded-lg border-2 transition-all duration-200 ${
                        newSubject.icon === icon
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['easy', 'medium', 'hard'] as Array<'easy' | 'medium' | 'hard'>).map((difficulty) => (
                    <button
                      key={difficulty}
                      type="button"
                      onClick={() => setNewSubject({ ...newSubject, difficulty })}
                      className={`p-3 rounded-lg border-2 transition-all duration-200 capitalize ${
                        newSubject.difficulty === difficulty
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {difficulty}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weekly Goal (minutes)
                </label>
                <input
                  type="number"
                  value={newSubject.targetTime}
                  onChange={(e) => setNewSubject({ ...newSubject, targetTime: Number(e.target.value) })}
                  min="30"
                  max="1000"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color Theme
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewSubject({ ...newSubject, color })}
                      className={`w-10 h-10 rounded-lg border-2 transition-all duration-200 ${
                        newSubject.color === color
                          ? 'border-gray-400 scale-110'
                          : 'border-gray-200 hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-white bg-indigo-500 rounded-lg hover:bg-indigo-600 transition-colors"
                >
                  Add Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
