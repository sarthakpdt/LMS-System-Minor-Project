import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Flame, 
  CheckCircle2, 
  Clock, 
  BookOpen, 
  AlertCircle, 
  Award, 
  Trophy, 
  Sparkles, 
  CalendarDays, 
  ListTodo 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { PageTransition, animationVariants } from '../../theme/animations';
import { Card, Button } from '../../theme/components';

// ==========================================
// interfaces
// ==========================================
export interface StudyTask {
  id: string;
  title: string;
  subject: string;
  priority: 'High' | 'Medium' | 'Low';
  estimatedMinutes: number;
  completed: boolean;
}

export interface Deadline {
  id: string;
  title: string;
  courseCode: string;
  dueDate: string;
  priority: 'High' | 'Medium' | 'Low';
}

export interface UpcomingQuiz {
  id: string;
  title: string;
  courseCode: string;
  date: string;
  timeLimit: number;
  priority: 'High' | 'Medium' | 'Low';
}

export interface WeakSubject {
  subject: string;
  score: number;
  recommendation: string;
  tips: string[];
}

export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string | null;
}

// ==========================================
// Mock Data (Self-contained & Modular)
// ==========================================
const MOCK_TASKS: StudyTask[] = [
  { id: 't1', title: 'Review Lecture 4 on Red-Black Trees', subject: 'Data Structures', priority: 'High', estimatedMinutes: 45, completed: false },
  { id: 't2', title: 'Practice 10 SQL Queries on Joins & Indexing', subject: 'Database Systems', priority: 'Medium', estimatedMinutes: 30, completed: false },
  { id: 't3', title: 'Read Chapter 3 of Operating Systems textbook', subject: 'Operating Systems', priority: 'Low', estimatedMinutes: 60, completed: false },
  { id: 't4', title: 'Draft schema diagrams for assignment database design', subject: 'System Design', priority: 'High', estimatedMinutes: 40, completed: false }
];

const MOCK_DEADLINES: Deadline[] = [
  { id: 'd1', title: 'Assignment 3: Graph Algorithms', courseCode: 'CS101', dueDate: 'Tomorrow at 11:59 PM', priority: 'High' },
  { id: 'd2', title: 'OS Lab 2: Process Scheduling', courseCode: 'CS202', dueDate: 'In 3 days', priority: 'Medium' },
  { id: 'd3', title: 'DBMS Project Milestone 1', courseCode: 'CS303', dueDate: 'Next Monday', priority: 'Low' }
];

const MOCK_QUIZZES: UpcomingQuiz[] = [
  { id: 'q1', title: 'Quiz 2: Transactions & Recovery', courseCode: 'CS303', date: 'Wednesday at 10:00 AM', timeLimit: 20, priority: 'High' },
  { id: 'q2', title: 'Midterm Quiz: Memory Architecture', courseCode: 'CS202', date: 'Friday at 2:00 PM', timeLimit: 45, priority: 'High' }
];

const MOCK_WEAK_SUBJECTS: WeakSubject[] = [
  { 
    subject: 'Data Structures', 
    score: 55, 
    recommendation: 'Focus on Graph traversals (DFS/BFS) and Tree balancing techniques.',
    tips: [
      'Watch visual animations of Red-Black Trees balancing',
      'Implement BFS and DFS from scratch without looking at references',
      'Solve 5 basic tree manipulation problems on LeetCode'
    ]
  },
  { 
    subject: 'Operating Systems', 
    score: 64, 
    recommendation: 'Review Process Synchronization & Deadlock Prevention.',
    tips: [
      'Draw the Banker\'s Algorithm allocation matrix step-by-step',
      'Read the Producer-Consumer classic solutions using semaphores',
      'Practice drawing CPU scheduling Gantt charts'
    ]
  }
];

// ==========================================
// Mock Services (Simulates Asynchronous API calls)
// ==========================================
export const getStudyTasks = (): Promise<StudyTask[]> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(MOCK_TASKS), 400);
  });
};

export const getUpcomingDeadlines = (): Promise<Deadline[]> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(MOCK_DEADLINES), 400);
  });
};

export const getUpcomingQuizzes = (): Promise<UpcomingQuiz[]> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(MOCK_QUIZZES), 400);
  });
};

export const getWeakSubjects = (): Promise<WeakSubject[]> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(MOCK_WEAK_SUBJECTS), 400);
  });
};

// ==========================================
// LocalStorage Streak Helper Logic
// ==========================================
const LOCAL_STORAGE_KEY = 'study_streak_state';

const getLocalDateString = (date: Date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getYesterdayDateString = () => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return getLocalDateString(date);
};

export const loadStreakState = (): StreakState => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed: StreakState = JSON.parse(saved);
      const todayStr = getLocalDateString();
      const yesterdayStr = getYesterdayDateString();
      
      // If the last study date is older than yesterday, reset current streak to 0 (broken streak)
      if (parsed.lastStudyDate !== todayStr && parsed.lastStudyDate !== yesterdayStr) {
        const updatedState = { ...parsed, currentStreak: 0 };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedState));
        return updatedState;
      }
      return parsed;
    }
  } catch (e) {
    console.error('Error loading streak state:', e);
  }
  
  return {
    currentStreak: 0,
    longestStreak: 0,
    lastStudyDate: null
  };
};

export const saveStreakState = (state: StreakState): void => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Error saving streak state:', e);
  }
};

// ==========================================
// Component Page Implementation
// ==========================================
export function StudentStudyPlanner() {
  const { user } = useAuth();
  
  // States
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [quizzes, setQuizzes] = useState<UpcomingQuiz[]>([]);
  const [weakSubjects, setWeakSubjects] = useState<WeakSubject[]>([]);
  const [streak, setStreak] = useState<StreakState>({ currentStreak: 0, longestStreak: 0, lastStudyDate: null });
  const [loading, setLoading] = useState(true);

  // Initialize data
  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      try {
        const [fetchedTasks, fetchedDeadlines, fetchedQuizzes, fetchedWeak] = await Promise.all([
          getStudyTasks(),
          getUpcomingDeadlines(),
          getUpcomingQuizzes(),
          getWeakSubjects()
        ]);
        setTasks(fetchedTasks);
        setDeadlines(fetchedDeadlines);
        setQuizzes(fetchedQuizzes);
        setWeakSubjects(fetchedWeak);
        
        // Load streak configuration
        const loadedStreak = loadStreakState();
        setStreak(loadedStreak);
      } catch (err) {
        console.error('Failed to load study planner mock data', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadAllData();
  }, [user?.id]);

  // Complete a specific study task locally
  const toggleTaskCompletion = (taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  // Mark overall study plan complete today and update streaks
  const handleMarkTodayComplete = () => {
    const todayStr = getLocalDateString();
    const yesterdayStr = getYesterdayDateString();
    
    let newCurrent = streak.currentStreak;
    let newLongest = streak.longestStreak;
    
    if (streak.lastStudyDate === todayStr) {
      return; // Already completed today
    } else if (streak.lastStudyDate === yesterdayStr) {
      newCurrent += 1;
    } else {
      newCurrent = 1;
    }
    
    newLongest = Math.max(newCurrent, newLongest);
    
    const newState: StreakState = {
      currentStreak: newCurrent,
      longestStreak: newLongest,
      lastStudyDate: todayStr
    };
    
    setStreak(newState);
    saveStreakState(newState);
    
    // Automatically check all tasks as completed for visual reward
    setTasks(prev => prev.map(task => ({ ...task, completed: true })));
  };

  // Helper variables for UI states
  const todayStr = getLocalDateString();
  const isCompletedToday = streak.lastStudyDate === todayStr;
  const completedTasksCount = tasks.filter(t => t.completed).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedTasksCount / tasks.length) * 100) : 0;

  // Render priorities badges helper
  const renderPriorityBadge = (priority: 'High' | 'Medium' | 'Low') => {
    const colors = {
      High: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800/30',
      Medium: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800/30',
      Low: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800/30'
    };
    return (
      <span className={`px-2 py-0.5 text-xs font-semibold rounded-md border ${colors[priority]}`}>
        {priority}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-950/20">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 font-medium">Assembling your study plan...</p>
        </div>
      </div>
    );
  }

  return (
    <PageTransition className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-950/20">
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        
        {/* Header Block */}
        <motion.div
          variants={animationVariants.slideInDown}
          initial="initial"
          animate="animate"
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200/50 pb-6"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl text-white shadow-md shadow-indigo-500/10">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-400 dark:to-blue-400 bg-clip-text text-transparent">
                Smart Study Planner
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Optimized study recommendations and daily learning trackers.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg border border-indigo-100 dark:border-indigo-900/50">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
              Mock Integration Active
            </span>
          </div>
        </motion.div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: Streaks & Analytics + Weak Subjects */}
          <div className="lg:col-span-1 space-y-8">
            
            {/* Learning Streak Card */}
            <motion.div
              variants={animationVariants.scaleIn}
              initial="initial"
              animate="animate"
            >
              <Card hover={false} className="relative overflow-hidden border-amber-200 dark:border-amber-900/30 shadow-md">
                <div className="absolute -right-10 -top-10 w-32 h-32 bg-amber-500/10 rounded-full blur-xl" />
                
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    <h2 className="font-bold text-gray-800 dark:text-white">Learning Streak</h2>
                  </div>
                  <span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 rounded-full border border-amber-200/50 dark:border-amber-800/30">
                    Daily Goal
                  </span>
                </div>

                <div className="flex items-center gap-6 mb-6">
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/25">
                      <Flame className="w-12 h-12 text-white animate-pulse" />
                    </div>
                    {streak.currentStreak > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-extrabold w-6 h-6 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800">
                        {streak.currentStreak}
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Current Streak</p>
                    <p className="text-3xl font-extrabold text-gray-900 dark:text-white">
                      {streak.currentStreak} {streak.currentStreak === 1 ? 'Day' : 'Days'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-gray-100 dark:border-gray-700/50 pt-4 mb-6">
                  <div className="space-y-0.5">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Longest Streak</p>
                    <p className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-orange-500" />
                      {streak.longestStreak} Days
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Last Study Date</p>
                    <p className="text-sm font-semibold text-gray-800 dark:text-white">
                      {streak.lastStudyDate ? streak.lastStudyDate : 'Never'}
                    </p>
                  </div>
                </div>

                {/* Progress bar for tasks */}
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-gray-500">Tasks Completed Today</span>
                    <span className="text-indigo-600 dark:text-indigo-400">{completedTasksCount}/{tasks.length} ({progressPercent}%)</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500" 
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Mark Complete Button */}
                <Button 
                  onClick={handleMarkTodayComplete}
                  variant={isCompletedToday ? 'success' : 'primary'}
                  disabled={isCompletedToday}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isCompletedToday ? "Today's Plan Completed! 🎉" : "Mark Today's Plan Complete"}
                </Button>
              </Card>
            </motion.div>

            {/* Weak Subjects Card */}
            <motion.div
              variants={animationVariants.scaleIn}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.1 }}
            >
              <Card hover={false} className="shadow-md">
                <div className="flex items-center gap-2 mb-4 border-b border-gray-100 dark:border-gray-700 pb-3">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <h2 className="font-bold text-gray-800 dark:text-white">Weak Subject Insights</h2>
                </div>
                
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  AI detected learning gaps based on recent assessment and quiz scores.
                </p>

                <div className="space-y-5">
                  {weakSubjects.map((item, index) => (
                    <div 
                      key={index} 
                      className="p-4 bg-gradient-to-br from-red-50/50 to-orange-50/20 dark:from-red-950/10 dark:to-orange-950/5 rounded-xl border border-red-100/50 dark:border-red-900/20"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-sm text-gray-800 dark:text-white">
                          {item.subject}
                        </span>
                        <span className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-100/70 dark:bg-red-900/30 px-2 py-0.5 rounded-full">
                          Score: {item.score}%
                        </span>
                      </div>
                      
                      <p className="text-xs text-gray-600 dark:text-gray-300 font-medium mb-3">
                        {item.recommendation}
                      </p>

                      <div className="space-y-1.5 border-t border-red-100/50 dark:border-red-900/20 pt-2">
                        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Suggested Tips</p>
                        {item.tips.map((tip, tipIndex) => (
                          <div key={tipIndex} className="flex gap-1.5 items-start text-xs text-gray-500 dark:text-gray-400">
                            <span className="text-red-400 mt-1 font-bold">•</span>
                            <span>{tip}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>

          </div>

          {/* RIGHT COLUMN (GRID SPAN 2): Tasks & Deadlines & Quizzes */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Daily Tasks */}
            <motion.div
              variants={animationVariants.slideInUp}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.1 }}
            >
              <Card hover={false} className="shadow-md">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-4 mb-6">
                  <div className="flex items-center gap-2">
                    <ListTodo className="w-5 h-5 text-indigo-500" />
                    <h2 className="font-bold text-gray-800 dark:text-white">Today's Study Plan</h2>
                  </div>
                  <span className="text-xs font-semibold text-gray-500">
                    {completedTasksCount} of {tasks.length} Completed
                  </span>
                </div>

                <div className="space-y-4">
                  {tasks.map((task) => (
                    <div 
                      key={task.id}
                      onClick={() => toggleTaskCompletion(task.id)}
                      className={`group flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                        task.completed 
                          ? 'bg-gray-50/50 border-gray-200 dark:bg-gray-800/20 dark:border-gray-800 animate-fade-in' 
                          : 'bg-white border-gray-200/80 hover:border-indigo-200 hover:shadow-sm dark:bg-gray-800 dark:border-gray-700 dark:hover:border-indigo-900/50'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 flex-1 pr-4">
                        {task.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                        ) : (
                          <div className="w-5 h-5 rounded-md border border-gray-300 dark:border-gray-600 flex items-center justify-center group-hover:border-indigo-400 flex-shrink-0 transition-colors">
                            <div className="w-2.5 h-2.5 bg-indigo-500 rounded-sm scale-0 group-hover:scale-100 transition-transform" />
                          </div>
                        )}
                        
                        <div className="space-y-0.5">
                          <p className={`text-sm font-semibold transition-all ${
                            task.completed 
                              ? 'line-through text-gray-400 dark:text-gray-500' 
                              : 'text-gray-800 dark:text-gray-200'
                          }`}>
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 font-medium">
                              {task.subject}
                            </span>
                            <span className="text-gray-300 dark:text-gray-700">•</span>
                            <span className="text-[11px] text-gray-400 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {task.estimatedMinutes} mins
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex-shrink-0">
                        {renderPriorityBadge(task.priority)}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>

            {/* Assignments & Quizzes Split */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Deadlines */}
              <motion.div
                variants={animationVariants.slideInUp}
                initial="initial"
                animate="animate"
                transition={{ delay: 0.2 }}
              >
                <Card hover={false} className="shadow-md h-full">
                  <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-3 mb-4">
                    <BookOpen className="w-5 h-5 text-indigo-500" />
                    <h2 className="font-bold text-gray-800 dark:text-white">Upcoming Assignments</h2>
                  </div>
                  
                  <div className="space-y-3">
                    {deadlines.map((item) => (
                      <div 
                        key={item.id}
                        className="p-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-lg flex flex-col gap-2"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <p className="text-xs font-bold text-gray-800 dark:text-gray-200 line-clamp-2 leading-snug">
                            {item.title}
                          </p>
                          {renderPriorityBadge(item.priority)}
                        </div>
                        
                        <div className="flex justify-between items-center text-[10px] font-medium text-gray-400 mt-1 border-t border-gray-100 dark:border-gray-800 pt-2">
                          <span>Course: {item.courseCode}</span>
                          <span className="text-red-500 font-semibold">{item.dueDate}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>

              {/* Quizzes */}
              <motion.div
                variants={animationVariants.slideInUp}
                initial="initial"
                animate="animate"
                transition={{ delay: 0.3 }}
              >
                <Card hover={false} className="shadow-md h-full">
                  <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-3 mb-4">
                    <CalendarDays className="w-5 h-5 text-indigo-500" />
                    <h2 className="font-bold text-gray-800 dark:text-white">Upcoming Quizzes</h2>
                  </div>
                  
                  <div className="space-y-3">
                    {quizzes.map((item) => (
                      <div 
                        key={item.id}
                        className="p-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-lg flex flex-col gap-2"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <p className="text-xs font-bold text-gray-800 dark:text-gray-200 line-clamp-2 leading-snug">
                            {item.title}
                          </p>
                          {renderPriorityBadge(item.priority)}
                        </div>
                        
                        <div className="flex justify-between items-center text-[10px] font-medium text-gray-400 mt-1 border-t border-gray-100 dark:border-gray-800 pt-2">
                          <span>{item.courseCode} ({item.timeLimit} mins)</span>
                          <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{item.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>

            </div>

          </div>

        </div>

      </div>
    </PageTransition>
  );
}
