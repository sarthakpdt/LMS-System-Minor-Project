import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../theme/ThemeProvider';
import { 
  MessageSquare, Clock, Users, ArrowRight, X, Brain, Zap, 
  AlertCircle, ChevronDown, ChevronUp, Star, Award, Send 
} from 'lucide-react';
import { Card, Button, Badge } from '../../theme/components';
import { animationVariants } from '../../theme/animations';
import { motion, AnimatePresence } from 'framer-motion';

interface ReactionCounts {
  changedMyMind: number;
  strongPoint: number;
  iDisagree: number;
}

interface DiscussionResponse {
  id: string;
  studentName: string;
  studentId: string;
  responseText: string;
  createdAt: string;
  isInstructorFeatured: boolean; // Pinned "Instructor Pick" Spotlight
  reactions: ReactionCounts;
  userReaction?: 'changedMyMind' | 'strongPoint' | 'iDisagree' | null;
}

interface DiscussionPrompt {
  id: string;
  courseName: string;
  courseCode: string;
  promptText: string;
  description: string;
  closesAt: string; // ISO timestamp
  responses: DiscussionResponse[];
  isActive: boolean;
}

// Initial Mock Database
const INITIAL_DISCUSSIONS: DiscussionPrompt[] = [
  {
    id: 'disc-active-1',
    courseName: 'Artificial Intelligence',
    courseCode: 'CS302',
    promptText: 'Should AI assistants be integrated directly into all online exams for real-time guidance, or does this defeat the purpose of assessment?',
    description: 'Assessments are transitioning online. While AI tools can guide learning, they risk turning testing into an evaluation of prompt engineering rather than raw knowledge retention. Discuss your view.',
    isActive: true,
    closesAt: new Date(Date.now() + 18 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString(), // 18h 45m from now
    responses: [
      {
        id: 'resp-1',
        studentName: 'Prof. Sarah Jenkins',
        studentId: 'INS-01',
        responseText: 'AI can be a great tutor, but exams must verify individual recall. Assisting during tests hides learning gaps, making subsequent teaching adjustments impossible.',
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        isInstructorFeatured: true, // Spotlit pin
        reactions: { changedMyMind: 18, strongPoint: 42, iDisagree: 4 },
      },
      {
        id: 'resp-2',
        studentName: 'Alex Carter',
        studentId: 'STU-102',
        responseText: 'I believe we should embrace it. In the real world, engineers always use docs and copilot tools. Testing prompt structure and application is more relevant today.',
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        isInstructorFeatured: false,
        reactions: { changedMyMind: 6, strongPoint: 15, iDisagree: 21 },
      },
      {
        id: 'resp-3',
        studentName: 'Elena Rostova',
        studentId: 'STU-105',
        responseText: 'If exams allow AI guidance, they are no longer testing *us*. They are testing the AI. We need traditional tests to build confidence in our own baseline skills.',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        isInstructorFeatured: false,
        reactions: { changedMyMind: 14, strongPoint: 28, iDisagree: 2 },
      }
    ]
  },
  {
    id: 'disc-past-1',
    courseName: 'Programming Fundamentals',
    courseCode: 'CS101',
    promptText: 'Is Python a better first language than C++ for undergraduate engineering students?',
    description: 'Python offers readability and fast iteration, while C++ forces students to learn memory management, compilation steps, and lower-level logic right away.',
    isActive: false,
    closesAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // Closed 2 days ago
    responses: [
      {
        id: 'resp-p1',
        studentName: 'Dr. Michael Chen',
        studentId: 'INS-02',
        responseText: 'C++ provides a foundational understanding of computer architecture (pointers, memory address). Python abstracts too much, creating developers who don\'t understand hardware.',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 10 * 60 * 60 * 1000).toISOString(),
        isInstructorFeatured: true,
        reactions: { changedMyMind: 25, strongPoint: 80, iDisagree: 12 },
      },
      {
        id: 'resp-p2',
        studentName: 'Sophia Lin',
        studentId: 'STU-120',
        responseText: 'Python lets beginners build cool projects like websites or data models in week 1. That instant feedback keeps students motivated, whereas C++ syntax frustrates people early on.',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 6 * 60 * 60 * 1000).toISOString(),
        isInstructorFeatured: false,
        reactions: { changedMyMind: 38, strongPoint: 45, iDisagree: 8 },
      }
    ]
  },
  {
    id: 'disc-past-2',
    courseName: 'Professional Ethics',
    courseCode: 'HUM101',
    promptText: 'Should universities replace traditional letter grades (A-F) with Pass/Fail evaluations to improve mental health?',
    description: 'Some argue GPA pressure reduces deep learning and increases cheating, while others contend letter grades are essential for job market selection and grad school.',
    isActive: false,
    closesAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // Closed 5 days ago
    responses: [
      {
        id: 'resp-p3',
        studentName: 'Liam O\'Connor',
        studentId: 'STU-180',
        responseText: 'Under pass/fail, students do the bare minimum just to pass. A-F grades push students to push their boundaries and reward outstanding effort.',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 - 8 * 60 * 60 * 1000).toISOString(),
        isInstructorFeatured: false,
        reactions: { changedMyMind: 8, strongPoint: 32, iDisagree: 54 },
      },
      {
        id: 'resp-p4',
        studentName: 'Clara Oswald',
        studentId: 'STU-199',
        responseText: 'Traditional grades foster a toxic competitive culture instead of a collaborative one. Pass/fail shifts focus back to learning for utility, not for a score.',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 - 4 * 60 * 60 * 1000).toISOString(),
        isInstructorFeatured: true,
        reactions: { changedMyMind: 41, strongPoint: 62, iDisagree: 10 },
      }
    ]
  }
];

export default function StudentDiscussionOfTheDay() {
  const { user } = useAuth();
  const { theme } = useTheme();

  // Load from local storage if available, otherwise fallback to defaults
  const [discussions, setDiscussions] = useState<DiscussionPrompt[]>(() => {
    const saved = localStorage.getItem('lms_discussions');
    return saved ? JSON.parse(saved) : INITIAL_DISCUSSIONS;
  });

  const [selectedDiscussion, setSelectedDiscussion] = useState<DiscussionPrompt | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showPast, setShowPast] = useState(false);

  // Form input
  const [myResponse, setMyResponse] = useState('');
  const [timeLeft, setTimeLeft] = useState('');

  // Persist discussions to localStorage when updated
  useEffect(() => {
    localStorage.setItem('lms_discussions', JSON.stringify(discussions));
  }, [discussions]);

  const activeDisc = discussions.find(d => d.isActive) || discussions[0];

  // Tick Countdown Timer in Real-Time
  useEffect(() => {
    if (!activeDisc || !activeDisc.closesAt) return;

    const updateTimer = () => {
      const difference = new Date(activeDisc.closesAt).getTime() - Date.now();
      if (difference <= 0) {
        setTimeLeft('Discussion Closed');
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeDisc]);

  const hasAlreadyResponded = (disc: DiscussionPrompt) => {
    return disc.responses.some(r => r.studentId === user?.id);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // API Call Simulation: Post response
  const handleSubmitResponse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDiscussion || !user || !myResponse.trim() || myResponse.length > 200) return;
    if (hasAlreadyResponded(selectedDiscussion)) return;

    const newResponse: DiscussionResponse = {
      id: `resp-${Date.now()}`,
      studentName: user.name || 'Anonymous Student',
      studentId: user.id,
      responseText: myResponse.trim(),
      createdAt: new Date().toISOString(),
      isInstructorFeatured: false,
      reactions: { changedMyMind: 0, strongPoint: 0, iDisagree: 0 },
    };

    const updatedDiscs = discussions.map(disc => {
      if (disc.id === selectedDiscussion.id) {
        const nextDisc = {
          ...disc,
          responses: [...disc.responses, newResponse],
        };
        // Update selected view state
        setSelectedDiscussion(nextDisc);
        return nextDisc;
      }
      return disc;
    });

    setDiscussions(updatedDiscs);
    setMyResponse('');
  };

  // API Call Simulation: React to response
  const handleReact = (responseId: string, reactionType: 'changedMyMind' | 'strongPoint' | 'iDisagree') => {
    if (!selectedDiscussion) return;
    
    // Read-only check for past discussions
    if (!selectedDiscussion.isActive) return;

    const updatedDiscs = discussions.map(disc => {
      if (disc.id === selectedDiscussion.id) {
        const nextResponses = disc.responses.map(r => {
          if (r.id === responseId) {
            const hasSameReaction = r.userReaction === reactionType;
            let currentReactionState = r.userReaction;
            const nextReactions = { ...r.reactions };

            // Decrement old reaction if exists
            if (currentReactionState) {
              nextReactions[currentReactionState] = Math.max(0, nextReactions[currentReactionState] - 1);
            }

            // Set new reaction
            if (hasSameReaction) {
              currentReactionState = null;
            } else {
              currentReactionState = reactionType;
              nextReactions[reactionType] += 1;
            }

            return {
              ...r,
              reactions: nextReactions,
              userReaction: currentReactionState,
            };
          }
          return r;
        });

        const nextDisc = { ...disc, responses: nextResponses };
        setSelectedDiscussion(nextDisc);
        return nextDisc;
      }
      return disc;
    });

    setDiscussions(updatedDiscs);
  };

  const handleOpenDiscussion = (disc: DiscussionPrompt) => {
    setSelectedDiscussion(disc);
    setShowModal(true);
  };

  // Sorting spotlight instructor picks first, then by date desc
  const getSortedResponses = (disc: DiscussionPrompt) => {
    const spotlights = disc.responses.filter(r => r.isInstructorFeatured);
    const regular = disc.responses.filter(r => !r.isInstructorFeatured)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return [...spotlights, ...regular];
  };

  return (
    <div className="space-y-6">
      {/* Active Question/Discussion Card */}
      {activeDisc && (
        <Card hover className="p-6 border-l-4 border-l-purple-500 bg-white dark:bg-gray-800">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-900/30 rounded-md">
                  Question / Discussion of the Day
                </span>
                <span className="text-xs font-mono font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-purple-500 animate-pulse" />
                  {timeLeft}
                </span>
              </div>
              <p className="text-xs font-bold text-blue-650 dark:text-blue-450 mb-1.5">
                {activeDisc.courseName} ({activeDisc.courseCode})
              </p>
              <h3 className="text-base font-bold text-gray-900 dark:text-white leading-snug mb-2">
                {activeDisc.promptText}
              </h3>
              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 font-medium">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4 text-gray-450" />
                  {activeDisc.responses.length} response{activeDisc.responses.length !== 1 ? 's' : ''}
                </span>
                {hasAlreadyResponded(activeDisc) && (
                  <Badge variant="success" size="sm">✓ Responded</Badge>
                )}
              </div>
            </div>
            <div className="flex-shrink-0">
              <Button 
                variant="primary" 
                size="md" 
                onClick={() => handleOpenDiscussion(activeDisc)}
                className="bg-purple-650 hover:bg-purple-700 text-white font-bold flex items-center gap-2"
              >
                <span>{hasAlreadyResponded(activeDisc) ? 'View Discussion' : 'Join Discussion'}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Past Discussions Collapsible Section */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <button 
          onClick={() => setShowPast(!showPast)} 
          className="flex items-center justify-between w-full text-sm font-bold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-purple-500" />
            <span>Archived Question Logs (Read-only)</span>
          </div>
          {showPast ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        <AnimatePresence>
          {showPast && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-3 space-y-3 overflow-hidden"
            >
              {discussions.filter(d => !d.isActive).map(disc => (
                <Card key={disc.id} className="p-4 bg-gray-50/50 dark:bg-gray-800/40 border-l-4 border-l-gray-300 dark:border-l-gray-650 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">{disc.courseCode}</span>
                      <Badge variant="info" size="sm" className="bg-gray-100 text-gray-600 dark:bg-slate-900 dark:text-slate-400">Closed</Badge>
                    </div>
                    <h4 className="text-sm font-bold text-gray-800 dark:text-gray-250 truncate mb-1">
                      {disc.promptText}
                    </h4>
                    <p className="text-xs text-gray-500">{disc.responses.length} responses archived</p>
                  </div>
                  <Button 
                    variant="secondary" 
                    size="xs" 
                    onClick={() => handleOpenDiscussion(disc)}
                    className="flex-shrink-0 self-start sm:self-center"
                  >
                    Read Feed
                  </Button>
                </Card>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Discussion Modal Dialog */}
      <AnimatePresence>
        {showModal && selectedDiscussion && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] md:max-h-[90vh] my-auto md:my-8 flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-purple-650 to-indigo-650 px-5 py-4 flex items-center justify-between flex-shrink-0 text-white">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-extrabold uppercase bg-white/20 px-2 py-0.5 rounded">
                      {selectedDiscussion.courseCode}
                    </span>
                    <span className="text-xs font-mono opacity-90">
                      {selectedDiscussion.isActive ? `Closes in: ${timeLeft}` : 'Archived Feed'}
                    </span>
                  </div>
                  <h3 className="font-bold text-base truncate">
                    Question / Discussion of the Day
                  </h3>
                </div>
                <button 
                  onClick={() => setShowModal(false)} 
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Prompt Details */}
                <div className="bg-purple-50/50 dark:bg-purple-950/10 border border-purple-100 dark:border-purple-900/20 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-extrabold text-sm text-purple-750 dark:text-purple-400">Discussion Prompt</h4>
                    <button 
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="text-[10px] font-extrabold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-250 flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded border border-gray-250 dark:border-gray-700 transition"
                    >
                      <X className="w-3 h-3" />
                      <span>Close</span>
                    </button>
                  </div>
                  <p className="text-gray-900 dark:text-white font-bold text-sm leading-relaxed">
                    {selectedDiscussion.promptText}
                  </p>
                  {selectedDiscussion.description && (
                    <p className="text-xs text-gray-550 dark:text-gray-400 mt-2 leading-relaxed">
                      {selectedDiscussion.description}
                    </p>
                  )}
                </div>

                {/* Responses Feed */}
                <div className="space-y-4">
                  <h4 className="font-bold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Responses ({selectedDiscussion.responses.length})
                  </h4>

                  {selectedDiscussion.responses.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-6">Be the first to share your thoughts!</p>
                  ) : (
                    <div className="space-y-3">
                      {getSortedResponses(selectedDiscussion).map(resp => (
                        <div 
                          key={resp.id}
                          className={`p-4 rounded-xl border transition-all ${
                            resp.isInstructorFeatured 
                              ? 'bg-gradient-to-br from-amber-50/40 to-yellow-50/20 dark:from-yellow-950/10 dark:to-amber-950/5 border-amber-200 dark:border-amber-900/40' 
                              : 'bg-white dark:bg-gray-800/40 border-gray-150 dark:border-gray-700/50'
                          }`}
                        >
                          {/* Respondent Header */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white ${
                                resp.isInstructorFeatured 
                                  ? 'bg-gradient-to-br from-amber-500 to-yellow-500' 
                                  : 'bg-gradient-to-br from-blue-500 to-cyan-500'
                              }`}>
                                {getInitials(resp.studentName)}
                              </div>
                              <div>
                                <span className="font-bold text-xs text-gray-900 dark:text-slate-100 block">
                                  {resp.studentName}
                                </span>
                                <span className="text-[10px] text-gray-450">
                                  {new Date(resp.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>

                            {/* Spotlight Badge */}
                            {resp.isInstructorFeatured && (
                              <Badge variant="warning" size="sm" className="flex items-center gap-1 font-bold animate-pulse text-amber-800 border-amber-300 dark:text-amber-400 dark:border-amber-900/40 bg-amber-50">
                                <Award className="w-3.5 h-3.5 fill-amber-500" />
                                <span>Instructor Pick</span>
                              </Badge>
                            )}
                          </div>

                          {/* Response Text */}
                          <p className="text-sm text-gray-800 dark:text-gray-300 mb-3 whitespace-pre-line leading-relaxed pl-1">
                            {resp.responseText}
                          </p>

                          {/* Reactions bar */}
                          <div className="flex flex-wrap items-center gap-2">
                            {([
                              { type: 'changedMyMind' as const, label: 'Changed my mind', icon: Brain, color: 'text-purple-650 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/20 dark:text-purple-400' },
                              { type: 'strongPoint' as const, label: 'Strong point', icon: Zap, color: 'text-amber-600 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/20 dark:text-amber-400' },
                              { type: 'iDisagree' as const, label: 'I disagree', icon: AlertCircle, color: 'text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:text-rose-400' }
                            ] as const).map(reaction => {
                              const count = resp.reactions[reaction.type];
                              const isSelected = resp.userReaction === reaction.type;
                              return (
                                <button
                                  key={reaction.type}
                                  onClick={() => handleReact(resp.id, reaction.type)}
                                  disabled={!selectedDiscussion.isActive}
                                  className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-lg border transition ${
                                    isSelected 
                                      ? 'border-blue-500 dark:border-blue-400 bg-blue-50/70 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 scale-[1.03]' 
                                      : `${reaction.color} border-transparent disabled:opacity-75`
                                  }`}
                                >
                                  <reaction.icon className={`w-3.5 h-3.5 ${isSelected ? 'fill-current' : ''}`} />
                                  <span>{reaction.label}</span>
                                  {count > 0 && <span className="font-black ml-0.5">{count}</span>}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer / Participation Form */}
              <div className="border-t border-gray-150 dark:border-gray-700 p-4 bg-gray-50/50 dark:bg-gray-800/60 flex-shrink-0">
                {!selectedDiscussion.isActive ? (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-1.5">
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                      🔒 This discussion has closed. Responses are in read-only mode.
                    </span>
                    <Button variant="secondary" size="sm" onClick={() => setShowModal(false)} className="w-full sm:w-auto">
                      Close
                    </Button>
                  </div>
                ) : hasAlreadyResponded(selectedDiscussion) ? (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-1.5">
                    <span className="text-xs font-bold text-green-700 dark:text-green-400">
                      ✓ You have already shared your response to this discussion. One reply per student.
                    </span>
                    <Button variant="secondary" size="sm" onClick={() => setShowModal(false)} className="w-full sm:w-auto">
                      Close
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitResponse} className="space-y-3">
                    <div className="relative">
                      <textarea
                        value={myResponse}
                        onChange={(e) => setMyResponse(e.target.value.slice(0, 200))}
                        placeholder="Write your perspective here (max 200 characters)..."
                        rows={2}
                        className="w-full text-sm border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none pr-14"
                      />
                      <span className={`absolute right-3 bottom-3 text-[10px] font-bold ${
                        myResponse.length >= 190 ? 'text-red-500' : 'text-gray-400'
                      }`}>
                        {myResponse.length}/200
                      </span>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowModal(false)}
                      >
                        Close
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        disabled={!myResponse.trim() || myResponse.length > 200}
                        className="bg-purple-650 hover:bg-purple-700 text-white font-bold flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Post Response</span>
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
