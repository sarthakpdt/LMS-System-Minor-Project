import { useState, useEffect } from 'react';
import { Users, TrendingUp, Settings, Award, ChevronRight, RefreshCw, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface Course {
  _id: string;
  courseName: string;
  courseCode: string;
}

interface BucketEntry {
  _id: string;
  studentId: { _id: string; name: string; email: string; studentId: string };
  bucket: 'Easy' | 'Medium' | 'Hard';
  promotionHistory: {
    from: string; to: string; promotedAt: string; triggeredByScore: number;
  }[];
}

interface Threshold {
  easyToMedium: number;
  mediumToHard: number;
}

interface PromotionOverview {
  easy: BucketEntry[];
  medium: BucketEntry[];
  hard: BucketEntry[];
  recentPromotions: {
    student: { name: string; studentId: string };
    from: string; to: string; score: number; promotedAt: string;
  }[];
}

const API = 'http://localhost:5000';

const BUCKET_STYLE = {
  Easy:   { bg: 'bg-green-50', border: 'border-green-200', badge: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  Medium: { bg: 'bg-yellow-50', border: 'border-yellow-200', badge: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
  Hard:   { bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
};

export function BucketDashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [overview, setOverview] = useState<PromotionOverview | null>(null);
  const [threshold, setThreshold] = useState<Threshold>({ easyToMedium: 70, mediumToHard: 85 });
  const [editThreshold, setEditThreshold] = useState(false);
  const [thresholdForm, setThresholdForm] = useState({ easyToMedium: 70, mediumToHard: 85 });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => { fetchCourses(); }, []);
  useEffect(() => { if (selectedCourse) { fetchOverview(); fetchThreshold(); } }, [selectedCourse]);

  const fetchCourses = async () => {
    try {
      const res = await fetch(`${API}/api/courses`);
      const data = await res.json();
      setCourses(data);
      if (data.length > 0) setSelectedCourse(data[0]._id);
    } catch (e) { console.error(e); }
  };

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/buckets/course/${selectedCourse}/overview`);
      const data = await res.json();
      setOverview(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const fetchThreshold = async () => {
    try {
      const res = await fetch(`${API}/api/buckets/threshold/${selectedCourse}`);
      const data = await res.json();
      setThreshold(data);
      setThresholdForm({ easyToMedium: data.easyToMedium, mediumToHard: data.mediumToHard });
    } catch (e) { console.error(e); }
  };

  const saveThreshold = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/buckets/threshold/${selectedCourse}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId: user?.id, ...thresholdForm }),
      });
      const data = await res.json();
      setThreshold(data.threshold);
      setEditThreshold(false);
      setSavedMsg('Thresholds saved!');
      setTimeout(() => setSavedMsg(''), 3000);
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const overrideBucket = async (studentId: string, bucket: string) => {
    if (!confirm(`Move student to ${bucket} bucket?`)) return;
    try {
      await fetch(`${API}/api/buckets/student/${studentId}/course/${selectedCourse}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bucket }),
      });
      fetchOverview();
    } catch (e) { console.error(e); }
  };

  const totalStudents = overview
    ? overview.easy.length + overview.medium.length + overview.hard.length
    : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Student Bucket Dashboard</h2>
        <p className="text-gray-500 text-sm mt-1">
          View student difficulty levels per subject, set promotion thresholds, and track promotions.
        </p>
      </div>

      {/* Course selector */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <label className="text-sm font-medium text-gray-700">Select Subject:</label>
        <select
          value={selectedCourse}
          onChange={e => setSelectedCourse(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        >
          {courses.map(c => (
            <option key={c._id} value={c._id}>{c.courseName} ({c.courseCode})</option>
          ))}
        </select>
        <button onClick={fetchOverview} className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
        {savedMsg && (
          <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
            <CheckCircle className="w-4 h-4" /> {savedMsg}
          </span>
        )}
      </div>

      {/* Threshold Panel */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Promotion Thresholds</h3>
          </div>
          {!editThreshold ? (
            <button
              onClick={() => setEditThreshold(true)}
              className="text-sm text-blue-600 hover:underline font-medium"
            >
              Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => setEditThreshold(false)} className="text-sm text-gray-500 hover:underline">Cancel</button>
              <button
                onClick={saveThreshold}
                disabled={saving}
                className="text-sm text-white bg-blue-600 px-3 py-1 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Easy → Medium */}
          <div className={`rounded-lg p-4 border ${editThreshold ? 'border-yellow-300 bg-yellow-50' : 'border-gray-100 bg-gray-50'}`}>
            <p className="text-xs text-gray-500 mb-1 font-medium">🟢 Easy → 🟡 Medium</p>
            {editThreshold ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={thresholdForm.easyToMedium}
                  onChange={e => setThresholdForm({ ...thresholdForm, easyToMedium: Number(e.target.value) })}
                  min={1} max={100}
                  className="w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <span className="text-sm text-gray-600">% average score required</span>
              </div>
            ) : (
              <p className="text-2xl font-bold text-yellow-600">{threshold.easyToMedium}%</p>
            )}
          </div>

          {/* Medium → Hard */}
          <div className={`rounded-lg p-4 border ${editThreshold ? 'border-red-300 bg-red-50' : 'border-gray-100 bg-gray-50'}`}>
            <p className="text-xs text-gray-500 mb-1 font-medium">🟡 Medium → 🔴 Hard</p>
            {editThreshold ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={thresholdForm.mediumToHard}
                  onChange={e => setThresholdForm({ ...thresholdForm, mediumToHard: Number(e.target.value) })}
                  min={1} max={100}
                  className="w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <span className="text-sm text-gray-600">% average score required</span>
              </div>
            ) : (
              <p className="text-2xl font-bold text-red-600">{threshold.mediumToHard}%</p>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : overview ? (
        <>
          {/* Bucket summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {(['Easy', 'Medium', 'Hard'] as const).map(b => {
              const students = overview[b.toLowerCase() as 'easy' | 'medium' | 'hard'];
              const style = BUCKET_STYLE[b];
              const pct = totalStudents > 0 ? Math.round((students.length / totalStudents) * 100) : 0;
              return (
                <div key={b} className={`rounded-xl border p-5 ${style.bg} ${style.border}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${style.dot}`} />
                      <span className="font-semibold text-gray-900">{b}</span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${style.badge}`}>
                      {students.length} students
                    </span>
                  </div>
                  <div className="h-2 bg-white rounded-full overflow-hidden mb-2">
                    <div className={`h-full rounded-full ${style.dot}`} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-gray-500">{pct}% of total ({totalStudents})</p>
                </div>
              );
            })}
          </div>

          {/* Student tables per bucket */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            {(['Easy', 'Medium', 'Hard'] as const).map(b => {
              const students = overview[b.toLowerCase() as 'easy' | 'medium' | 'hard'];
              const style = BUCKET_STYLE[b];
              const targets = b === 'Easy' ? ['Medium', 'Hard'] : b === 'Medium' ? ['Easy', 'Hard'] : ['Easy', 'Medium'];
              return (
                <div key={b} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className={`px-4 py-3 border-b ${style.bg} ${style.border}`}>
                    <h4 className="font-semibold text-gray-900 text-sm">{b} Bucket</h4>
                  </div>
                  <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                    {students.length === 0 ? (
                      <p className="text-center text-gray-400 text-sm py-6">No students</p>
                    ) : students.map(entry => (
                      <div key={entry._id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{entry.studentId?.name}</p>
                          <p className="text-xs text-gray-500">{entry.studentId?.studentId}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {targets.map(t => (
                            <button
                              key={t}
                              onClick={() => overrideBucket(entry.studentId._id, t)}
                              className={`text-xs px-2 py-1 rounded ${BUCKET_STYLE[t as 'Easy'|'Medium'|'Hard'].badge} border ${BUCKET_STYLE[t as 'Easy'|'Medium'|'Hard'].border} hover:opacity-80`}
                            >
                              → {t}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recent Promotions */}
          {overview.recentPromotions.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-gray-900">Recent Promotions</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {overview.recentPromotions.map((p, i) => (
                  <div key={i} className="px-5 py-3 flex items-center gap-4 hover:bg-gray-50">
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900">{p.student?.name}</span>
                      <span className="text-xs text-gray-500 ml-2">({p.student?.studentId})</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${BUCKET_STYLE[p.from as 'Easy'|'Medium'|'Hard']?.badge}`}>{p.from}</span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                      <span className={`px-2 py-0.5 rounded-full text-xs ${BUCKET_STYLE[p.to as 'Easy'|'Medium'|'Hard']?.badge}`}>{p.to}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-800">{p.score}%</p>
                      <p className="text-xs text-gray-400">{new Date(p.promotedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>Select a course to view student buckets.</p>
        </div>
      )}
    </div>
  );
}
