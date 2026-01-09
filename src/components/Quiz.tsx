import React, { useState, useCallback } from 'react';
import { playSound } from '../utils/sounds';

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  subject: string;
}

interface QuizSet {
  id: string;
  name: string;
  subject: string;
  questions: Question[];
  createdAt: string;
  timesPlayed: number;
  bestScore: number;
}

interface QuizProps {
  darkMode?: boolean;
}

export const Quiz: React.FC<QuizProps> = (_props) => {
  const [quizSets, setQuizSets] = useState<QuizSet[]>(() => {
    const saved = localStorage.getItem('studyquest-quizzes');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeQuiz, setActiveQuiz] = useState<QuizSet | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  
  // New quiz form state
  const [newQuizName, setNewQuizName] = useState('');
  const [newQuizSubject, setNewQuizSubject] = useState('');
  const [newQuestions, setNewQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [currentOptions, setCurrentOptions] = useState(['', '', '', '']);
  const [currentCorrectAnswer, setCurrentCorrectAnswer] = useState(0);

  const saveQuizSets = useCallback((sets: QuizSet[]) => {
    localStorage.setItem('studyquest-quizzes', JSON.stringify(sets));
    setQuizSets(sets);
  }, []);

  const startQuiz = useCallback((quiz: QuizSet) => {
    playSound('click');
    setActiveQuiz(quiz);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setQuizComplete(false);
  }, []);

  const handleAnswerSelect = useCallback((answerIndex: number) => {
    if (showResult) return;
    
    playSound('click');
    setSelectedAnswer(answerIndex);
  }, [showResult]);

  const submitAnswer = useCallback(() => {
    if (selectedAnswer === null || !activeQuiz) return;
    
    const isCorrect = selectedAnswer === activeQuiz.questions[currentQuestionIndex].correctAnswer;
    
    if (isCorrect) {
      playSound('correct');
      setScore(s => s + 1);
    } else {
      playSound('wrong');
    }
    
    setShowResult(true);
  }, [selectedAnswer, activeQuiz, currentQuestionIndex]);

  const nextQuestion = useCallback(() => {
    playSound('click');
    
    if (!activeQuiz) return;
    
    if (currentQuestionIndex < activeQuiz.questions.length - 1) {
      setCurrentQuestionIndex(i => i + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      // Quiz complete
      setQuizComplete(true);
      playSound('complete');
      
      // Update best score
      const finalScore = score + (selectedAnswer === activeQuiz.questions[currentQuestionIndex].correctAnswer ? 1 : 0);
      const updatedSets = quizSets.map(q => 
        q.id === activeQuiz.id 
          ? { ...q, timesPlayed: q.timesPlayed + 1, bestScore: Math.max(q.bestScore, finalScore) }
          : q
      );
      saveQuizSets(updatedSets);
    }
  }, [activeQuiz, currentQuestionIndex, score, selectedAnswer, quizSets, saveQuizSets]);

  const addQuestion = useCallback(() => {
    if (!currentQuestion.trim() || currentOptions.some(o => !o.trim())) return;
    
    playSound('click');
    
    const question: Question = {
      id: Date.now().toString(),
      question: currentQuestion,
      options: [...currentOptions],
      correctAnswer: currentCorrectAnswer,
      subject: newQuizSubject
    };
    
    setNewQuestions([...newQuestions, question]);
    setCurrentQuestion('');
    setCurrentOptions(['', '', '', '']);
    setCurrentCorrectAnswer(0);
    setShowAddQuestion(false);
  }, [currentQuestion, currentOptions, currentCorrectAnswer, newQuizSubject, newQuestions]);

  const createQuiz = useCallback(() => {
    if (!newQuizName.trim() || newQuestions.length === 0) return;
    
    playSound('complete');
    
    const newQuiz: QuizSet = {
      id: Date.now().toString(),
      name: newQuizName,
      subject: newQuizSubject || 'General',
      questions: newQuestions,
      createdAt: new Date().toISOString(),
      timesPlayed: 0,
      bestScore: 0
    };
    
    saveQuizSets([...quizSets, newQuiz]);
    setShowCreateModal(false);
    setNewQuizName('');
    setNewQuizSubject('');
    setNewQuestions([]);
  }, [newQuizName, newQuizSubject, newQuestions, quizSets, saveQuizSets]);

  const deleteQuiz = useCallback((quizId: string) => {
    playSound('click');
    if (confirm('Are you sure you want to delete this quiz?')) {
      saveQuizSets(quizSets.filter(q => q.id !== quizId));
    }
  }, [quizSets, saveQuizSets]);

  const exitQuiz = useCallback(() => {
    playSound('click');
    setActiveQuiz(null);
    setQuizComplete(false);
  }, []);

  // Quiz in progress view
  if (activeQuiz && !quizComplete) {
    const question = activeQuiz.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / activeQuiz.questions.length) * 100;

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={exitQuiz}
            className="text-gray-500 hover:text-gray-700 flex items-center gap-2"
          >
            ← Exit Quiz
          </button>
          <div className="text-right">
            <div className="text-sm text-gray-500">Question {currentQuestionIndex + 1} of {activeQuiz.questions.length}</div>
            <div className="text-lg font-bold text-indigo-600">Score: {score}</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Question card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">{question.question}</h3>
          
          <div className="space-y-3">
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                disabled={showResult}
                className={`w-full p-4 rounded-xl text-left transition-all duration-200 border-2 ${
                  showResult
                    ? index === question.correctAnswer
                      ? 'bg-green-100 border-green-500 text-green-800'
                      : index === selectedAnswer
                        ? 'bg-red-100 border-red-500 text-red-800'
                        : 'bg-gray-50 border-gray-200 text-gray-500'
                    : selectedAnswer === index
                      ? 'bg-indigo-100 border-indigo-500 text-indigo-800'
                      : 'bg-gray-50 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
                }`}
              >
                <span className="font-medium mr-3">{String.fromCharCode(65 + index)}.</span>
                {option}
              </button>
            ))}
          </div>

          {/* Action buttons */}
          <div className="mt-6 flex justify-end">
            {!showResult ? (
              <button
                onClick={submitAnswer}
                disabled={selectedAnswer === null}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  selectedAnswer === null
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-indigo-500 text-white hover:bg-indigo-600'
                }`}
              >
                Submit Answer
              </button>
            ) : (
              <button
                onClick={nextQuestion}
                className="px-6 py-3 bg-indigo-500 text-white rounded-xl font-semibold hover:bg-indigo-600 transition-all"
              >
                {currentQuestionIndex < activeQuiz.questions.length - 1 ? 'Next Question →' : 'See Results'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Quiz complete view
  if (quizComplete && activeQuiz) {
    const percentage = Math.round((score / activeQuiz.questions.length) * 100);
    
    return (
      <div className="max-w-md mx-auto text-center space-y-6">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-6xl mb-4">
            {percentage >= 80 ? '🎉' : percentage >= 60 ? '👍' : percentage >= 40 ? '📚' : '💪'}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Quiz Complete!</h2>
          <p className="text-gray-600 mb-6">{activeQuiz.name}</p>
          
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl p-6 text-white mb-6">
            <div className="text-5xl font-bold mb-2">{score}/{activeQuiz.questions.length}</div>
            <div className="text-indigo-100">{percentage}% Correct</div>
          </div>

          <div className="text-left bg-gray-50 rounded-xl p-4 mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Correct Answers</span>
              <span className="text-green-600 font-medium">{score}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Wrong Answers</span>
              <span className="text-red-600 font-medium">{activeQuiz.questions.length - score}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Best Score</span>
              <span className="text-indigo-600 font-medium">{Math.max(activeQuiz.bestScore, score)}/{activeQuiz.questions.length}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => startQuiz(activeQuiz)}
              className="flex-1 py-3 bg-indigo-500 text-white rounded-xl font-semibold hover:bg-indigo-600 transition-all"
            >
              Try Again
            </button>
            <button
              onClick={exitQuiz}
              className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all"
            >
              Back to Quizzes
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main quiz list view
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quiz Center</h2>
          <p className="text-gray-600">Create custom quizzes to test your knowledge</p>
        </div>
        <button
          onClick={() => { playSound('click'); setShowCreateModal(true); }}
          className="px-4 py-2 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-all flex items-center gap-2"
        >
          ➕ Create Quiz
        </button>
      </div>

      {/* Quiz grid */}
      {quizSets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizSets.map(quiz => (
            <div key={quiz.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-4 text-white">
                <h3 className="text-lg font-bold">{quiz.name}</h3>
                <p className="text-indigo-100 text-sm">{quiz.subject}</p>
              </div>
              <div className="p-4">
                <div className="flex justify-between text-sm text-gray-600 mb-4">
                  <span>📝 {quiz.questions.length} questions</span>
                  <span>🎯 Best: {quiz.bestScore}/{quiz.questions.length}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startQuiz(quiz)}
                    className="flex-1 py-2 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-all"
                  >
                    Start Quiz
                  </button>
                  <button
                    onClick={() => deleteQuiz(quiz.id)}
                    className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No quizzes yet</h3>
          <p className="text-gray-600 mb-4">Create your first quiz to start testing your knowledge!</p>
          <button
            onClick={() => { playSound('click'); setShowCreateModal(true); }}
            className="px-6 py-3 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-all"
          >
            Create Your First Quiz
          </button>
        </div>
      )}

      {/* Create Quiz Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Create New Quiz</h3>
                <button onClick={() => { playSound('click'); setShowCreateModal(false); }} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quiz Name</label>
                <input
                  type="text"
                  value={newQuizName}
                  onChange={e => setNewQuizName(e.target.value)}
                  placeholder="e.g., Biology Chapter 5"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={newQuizSubject}
                  onChange={e => setNewQuizSubject(e.target.value)}
                  placeholder="e.g., Biology"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Questions list */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Questions ({newQuestions.length})</label>
                  <button
                    onClick={() => { playSound('click'); setShowAddQuestion(true); }}
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    + Add Question
                  </button>
                </div>

                {newQuestions.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {newQuestions.map((q, i) => (
                      <div key={q.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-700 truncate flex-1">{i + 1}. {q.question}</span>
                        <button
                          onClick={() => { playSound('click'); setNewQuestions(newQuestions.filter(nq => nq.id !== q.id)); }}
                          className="text-red-500 hover:text-red-700 ml-2"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg text-gray-500">
                    No questions added yet
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => { playSound('click'); setShowCreateModal(false); }}
                className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={createQuiz}
                disabled={!newQuizName.trim() || newQuestions.length === 0}
                className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                  !newQuizName.trim() || newQuestions.length === 0
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-indigo-500 text-white hover:bg-indigo-600'
                }`}
              >
                Create Quiz
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Question Modal */}
      {showAddQuestion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddQuestion(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Add Question</h3>
                <button onClick={() => { playSound('click'); setShowAddQuestion(false); }} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
                <textarea
                  value={currentQuestion}
                  onChange={e => setCurrentQuestion(e.target.value)}
                  placeholder="Enter your question..."
                  rows={2}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Answer Options</label>
                <div className="space-y-2">
                  {currentOptions.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <button
                        onClick={() => { playSound('click'); setCurrentCorrectAnswer(index); }}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                          currentCorrectAnswer === index
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                      >
                        {String.fromCharCode(65 + index)}
                      </button>
                      <input
                        type="text"
                        value={option}
                        onChange={e => {
                          const newOptions = [...currentOptions];
                          newOptions[index] = e.target.value;
                          setCurrentOptions(newOptions);
                        }}
                        placeholder={`Option ${String.fromCharCode(65 + index)}`}
                        className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">Click the letter to mark the correct answer (green = correct)</p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => { playSound('click'); setShowAddQuestion(false); }}
                className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={addQuestion}
                disabled={!currentQuestion.trim() || currentOptions.some(o => !o.trim())}
                className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                  !currentQuestion.trim() || currentOptions.some(o => !o.trim())
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-indigo-500 text-white hover:bg-indigo-600'
                }`}
              >
                Add Question
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
