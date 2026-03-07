import { useState, useEffect } from 'react';
import { Search, Plus, Users, BookOpen, X, ChevronDown, ChevronUp, Loader2, UserCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const DEPARTMENTS = [
  { value: 'CS',  label: 'Computer Science & Engineering' },
  { value: 'IT',  label: 'Information Technology' },
  { value: 'ECE', label: 'Electronics & Communication' },
  { value: 'EE',  label: 'Electrical Engineering' },
  { value: 'ME',  label: 'Mechanical Engineering' },
  { value: 'CE',  label: 'Civil Engineering' },
  { value: 'CH',  label: 'Chemical Engineering' },
  { value: 'BT',  label: 'Biotechnology' },
  { value: 'MBA', label: 'MBA' },
  { value: 'MCA', label: 'MCA' },
];

const BASE = 'http://localhost:5000/api/admin';

export function Courses() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isTeacher = user?.role === 'teacher';

  const [courses, setCourses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('all');
  const [filterSem, setFilterSem] = useState('all');

  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [courseStudents, setCourseStudents] = useState<Record<string, any[]>>({});
  const [loadingStudents, setLoadingStudents] = useState<string | null>(null);

  // Create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ courseCode: '', courseName: '', department: '', semester: '', teacherId: '', description: '' });
  const [creating, setCreating] = useState(false);

  // Enroll modal
  const [enrollModal, setEnrollModal] = useState<{ courseId: string; courseName: string; dept: string; sem: string } | null>(null);
  const [enrollDept, setEnrollDept] = useState('');
  const [enrollSem, setEnrollSem] = useState('');
  const [enrolling, setEnrolling] = useState(false);

  // Assign teacher modal
  const [assignModal, setAssignModal] = useState<{ courseId: string; courseName: string; currentTeacherId: string } | null>(null);
  const [assignTeacherId, setAssignTeacherId] = useState('');
  const [assigning, setAssigning] = useState(false);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/courses`);
      const json = await res.json();
      let data: any[] = json.data || [];
      if (isTeacher && user?.assignedCourses?.length) {
        const myCourseIds = new Set(user.assignedCourses.map((c: any) => String(c.courseId)));
        data = data.filter((c: any) => myCourseIds.has(String(c._id)));
      }
      setCourses(data);
    } catch { toast.error('Failed to load courses'); }
    finally { setLoading(false); }
  };

  const fetchTeachers = async () => {
    try {
      const res = await fetch(`${BASE}/teachers/approved`);
      const json = await res.json();
      setTeachers(json.data || []);
    } catch {/* ignore */}
  };

  useEffect(() => {
    fetchCourses();
    if (isAdmin) fetchTeachers();
  }, [user]);

  const toggleCourseStudents = async (courseId: string) => {
    if (expandedCourse === courseId) { setExpandedCourse(null); return; }
    setExpandedCourse(courseId);
    if (courseStudents[courseId]) return;
    setLoadingStudents(courseId);
    try {
      const res = await fetch(`${BASE}/courses/${courseId}/students`);
      const json = await res.json();
      setCourseStudents(prev => ({ ...prev, [courseId]: json.data || [] }));
    } catch { toast.error('Failed to load students'); }
    finally { setLoadingStudents(null); }
  };

  const handleCreateCourse = async () => {
    if (!createForm.courseCode || !createForm.courseName || !createForm.department || !createForm.semester) {
      toast.error('Fill all required fields'); return;
    }
    setCreating(true);
    try {
      const res = await fetch(`${BASE}/courses`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.message); return; }
      toast.success('Course created!');
      setShowCreateModal(false);
      setCreateForm({ courseCode: '', courseName: '', department: '', semester: '', teacherId: '', description: '' });
      fetchCourses();
    } catch { toast.error('Server error'); }
    finally { setCreating(false); }
  };

  const handleEnroll = async () => {
    if (!enrollDept || !enrollSem || !enrollModal) { toast.error('Select department and semester'); return; }
    setEnrolling(true);
    try {
      const res = await fetch(`${BASE}/courses/${enrollModal.courseId}/enroll`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ department: enrollDept, semester: enrollSem }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.message); return; }
      toast.success(json.message);
      setCourseStudents(prev => { const n = { ...prev }; delete n[enrollModal.courseId]; return n; });
      setEnrollModal(null);
      fetchCourses();
    } catch { toast.error('Server error'); }
    finally { setEnrolling(false); }
  };

  // ── Assign Teacher ────────────────────────────────────────────────────────
  const handleAssignTeacher = async () => {
    if (!assignTeacherId || !assignModal) { toast.error('Select a teacher'); return; }
    setAssigning(true);
    try {
      const res = await fetch(`${BASE}/courses/${assignModal.courseId}/assign-teacher`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId: assignTeacherId }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.message); return; }
      toast.success(json.message);
      setAssignModal(null);
      setAssignTeacherId('');
      fetchCourses();
    } catch { toast.error('Server error'); }
    finally { setAssigning(false); }
  };

  const filtered = courses.filter(c => {
    const matchSearch = c.courseName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.courseCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.teacher?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDept = filterDept === 'all' || c.department === filterDept;
    const matchSem = filterSem === 'all' || c.semester === filterSem;
    return matchSearch && matchDept && matchSem;
  });

  const deptLabel = (val: string) => DEPARTMENTS.find(d => d.value === val)?.label || val;

  return (
    <div className="p-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-gray-900 mb-2">Courses</h2>
          <p className="text-gray-600">{isAdmin ? 'Create courses, assign teachers, and enroll students by semester.' : 'Your assigned courses and enrolled students.'}</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" /> Add Course
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Search by course name, code, or teacher..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          {isAdmin && (
            <>
              <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                <option value="all">All Departments</option>
                {DEPARTMENTS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
              <select value={filterSem} onChange={e => setFilterSem(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                <option value="all">All Semesters</option>
                {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={String(s)}>Semester {s}</option>)}
              </select>
            </>
          )}
        </div>
      </div>

      {/* Course Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-500"><Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading courses...</div>
      ) : (
        <div className="space-y-4">
          {filtered.map(course => (
            <div key={course._id} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <h3 className="text-lg font-semibold text-gray-900">{course.courseName}</h3>
                        <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{course.courseCode}</span>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">{deptLabel(course.department)}</span>
                        <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-xs font-medium">Semester {course.semester}</span>
                        {course.teacher ? (
                          <span className="text-gray-600 text-sm flex items-center gap-1">
                            <UserCheck className="w-3.5 h-3.5 text-green-500" /> {course.teacher.name}
                          </span>
                        ) : (
                          <span className="text-orange-500 text-xs font-medium">⚠ No teacher assigned</span>
                        )}
                      </div>
                      {course.description && <p className="text-sm text-gray-500 mt-1.5">{course.description}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                    <div className="text-right mr-1">
                      <p className="text-2xl font-bold text-gray-900">{course.enrolledStudents?.length || 0}</p>
                      <p className="text-xs text-gray-400">enrolled</p>
                    </div>

                    {isAdmin && (
                      <>
                        {/* Assign Teacher button */}
                        <button
                          onClick={() => {
                            setAssignModal({ courseId: course._id, courseName: course.courseName, currentTeacherId: course.teacher?._id || '' });
                            setAssignTeacherId(course.teacher?._id || '');
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          <UserCheck className="w-4 h-4" />
                          {course.teacher ? 'Change Teacher' : 'Assign Teacher'}
                        </button>

                        {/* Enroll Students button */}
                        <button
                          onClick={() => { setEnrollModal({ courseId: course._id, courseName: course.courseName, dept: course.department, sem: course.semester }); setEnrollDept(course.department); setEnrollSem(course.semester); }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <Users className="w-4 h-4" /> Enroll Students
                        </button>
                      </>
                    )}

                    {/* Toggle students */}
                    <button onClick={() => toggleCourseStudents(course._id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors">
                      {expandedCourse === course._id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />} Students
                    </button>
                  </div>
                </div>
              </div>

              {/* Enrolled Students Panel */}
              {expandedCourse === course._id && (
                <div className="border-t border-gray-100 bg-gray-50 px-6 py-4">
                  {loadingStudents === course._id ? (
                    <div className="flex items-center gap-2 text-gray-500 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Loading students...</div>
                  ) : (courseStudents[course._id] || []).length === 0 ? (
                    <p className="text-sm text-gray-500 py-1">No students enrolled yet. {isAdmin && 'Use "Enroll Students" to add them.'}</p>
                  ) : (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-3">{courseStudents[course._id].length} Enrolled Students</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {courseStudents[course._id].map((s: any) => (
                          <div key={s._id} className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-3 py-2">
                            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold text-indigo-600">{s.name?.[0]?.toUpperCase()}</span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate">{s.name}</p>
                              <p className="text-xs text-gray-500 truncate">{s.email}</p>
                            </div>
                            {s.level && (
                              <span className={`text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 ${s.level === 'Advanced' ? 'bg-green-100 text-green-700' : s.level === 'Intermediate' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                {s.level}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {filtered.length === 0 && !loading && (
            <div className="text-center py-16 text-gray-400">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No courses found.</p>
            </div>
          )}
        </div>
      )}

      {/* ── Create Course Modal ── */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-900">Create New Course</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course Code *</label>
                  <input value={createForm.courseCode} onChange={e => setCreateForm({ ...createForm, courseCode: e.target.value })} placeholder="e.g. CS301"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course Name *</label>
                  <input value={createForm.courseName} onChange={e => setCreateForm({ ...createForm, courseName: e.target.value })} placeholder="e.g. Data Structures"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                  <select value={createForm.department} onChange={e => setCreateForm({ ...createForm, department: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select…</option>
                    {DEPARTMENTS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Semester *</label>
                  <select value={createForm.semester} onChange={e => setCreateForm({ ...createForm, semester: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select…</option>
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={String(s)}>Semester {s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign Teacher (optional)</label>
                <select value={createForm.teacherId} onChange={e => setCreateForm({ ...createForm, teacherId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">No teacher yet</option>
                  {teachers.map(t => <option key={t._id} value={t._id}>{t.name} — {t.department}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={createForm.description} onChange={e => setCreateForm({ ...createForm, description: e.target.value })} rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setShowCreateModal(false)} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium">Cancel</button>
              <button onClick={handleCreateCourse} disabled={creating} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2">
                {creating && <Loader2 className="w-4 h-4 animate-spin" />} {creating ? 'Creating...' : 'Create Course'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Assign Teacher Modal ── */}
      {assignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Assign Teacher</h3>
                <p className="text-sm text-gray-500 mt-0.5">{assignModal.courseName}</p>
              </div>
              <button onClick={() => setAssignModal(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm text-purple-800">
                Select an approved teacher to assign to this course. They will be able to see this course and its students in their dashboard.
              </div>
              {teachers.length === 0 ? (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No approved teachers found. Approve teachers first from Student Approvals.
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {teachers.map(t => (
                    <button
                      key={t._id}
                      onClick={() => setAssignTeacherId(t._id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                        assignTeacherId === t._id ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm ${assignTeacherId === t._id ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                        {t.name?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900">{t.name}</p>
                        <p className="text-xs text-gray-500">{t.email} · {t.department}</p>
                      </div>
                      {assignTeacherId === t._id && (
                        <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setAssignModal(null)} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium">Cancel</button>
              <button onClick={handleAssignTeacher} disabled={assigning || !assignTeacherId} className="flex-1 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2">
                {assigning && <Loader2 className="w-4 h-4 animate-spin" />} {assigning ? 'Assigning...' : 'Assign Teacher'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Enroll Students Modal ── */}
      {enrollModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Enroll Students</h3>
                <p className="text-sm text-gray-500 mt-0.5">{enrollModal.courseName}</p>
              </div>
              <button onClick={() => setEnrollModal(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                All <strong>approved students</strong> matching the selected department and semester will be enrolled together.
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                <select value={enrollDept} onChange={e => setEnrollDept(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select department…</option>
                  {DEPARTMENTS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Semester *</label>
                <select value={enrollSem} onChange={e => setEnrollSem(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select semester…</option>
                  {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={String(s)}>Semester {s}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setEnrollModal(null)} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium">Cancel</button>
              <button onClick={handleEnroll} disabled={enrolling} className="flex-1 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2">
                {enrolling && <Loader2 className="w-4 h-4 animate-spin" />} {enrolling ? 'Enrolling...' : 'Enroll Students'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}