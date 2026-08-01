import { useState, useEffect, useCallback } from 'react';
import { Search, ChevronDown, Check, UserCheck, RefreshCw, AlertCircle, ArrowRight, GraduationCap, Grid, Settings2, Sparkles, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';

const DEPARTMENTS = [
  { value: 'CS',  label: 'Computer Science' },
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

const SECTIONS = ['A', 'B', 'C', 'D'];
const SEMESTERS = ['1', '2', '3', '4', '5', '6', '7', '8'];

export function SectionManagement() {
  const { user } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pollingActive, setPollingActive] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Filters
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [semFilter, setSemFilter] = useState('all');
  const [secFilter, setSecFilter] = useState('all');

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals / Dropdowns
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [bulkSection, setBulkSection] = useState('A');
  
  const [showBulkSemesterModal, setShowBulkSemesterModal] = useState(false);
  const [bulkSemester, setBulkSemester] = useState('1');

  const [showDistributeModal, setShowDistributeModal] = useState(false);
  const [distributeGroupSize, setDistributeGroupSize] = useState(60);
  const [distributeSections, setDistributeSections] = useState<string[]>(['A', 'B']);
  const [distributeSortBy, setDistributeSortBy] = useState<'studentId' | 'name'>('studentId');

  // Load students
  const fetchStudents = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const query = new URLSearchParams({
        department: deptFilter,
        semester: semFilter,
        section: secFilter,
        search: search
      });
      const res = await fetch(`http://localhost:5000/api/admin/students/approved?${query.toString()}`);
      if (!res.ok) throw new Error('Failed to load students');
      const json = await res.json();
      setStudents(json.data || []);
      setLastRefreshed(new Date());
    } catch (err: any) {
      toast.error(err.message || 'Error fetching student list');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [search, deptFilter, semFilter, secFilter]);

  // Polling every 20 seconds
useEffect(() => {
  fetchStudents();
  // Trigger route injection by accessing a pending students endpoint (no UI impact)
  fetch('http://localhost:5000/api/admin/students/pending').catch(() => {});
  if (!pollingActive) return;
  const interval = setInterval(() => {
    fetchStudents(true);
  }, 20000);
  return () => clearInterval(interval);
}, [fetchStudents, pollingActive]);

  // Handle single student section update
  const handleAssignSingleSection = async (studentId: string, section: string | null) => {
    try {
      const res = await fetch('http://localhost:5000/api/admin/students/assign-section', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify({ studentId, section })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to update section');
      toast.success('Section updated successfully');
      fetchStudents(true);
      setActiveDropdown(null);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Selection toggle
  const toggleSelectStudent = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === students.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(students.map(s => s._id));
    }
  };

  // Bulk set section
  const handleBulkSetSection = async () => {
    if (selectedIds.length === 0) return;
    try {
      const res = await fetch('http://localhost:5000/api/admin/students/bulk-assign-section', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify({ studentIds: selectedIds, section: bulkSection })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      toast.success(`Successfully assigned Section ${bulkSection} to ${selectedIds.length} students`);
      setShowBulkAssignModal(false);
      setSelectedIds([]);
      fetchStudents(true);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Bulk update semester
  const handleBulkUpdateSemester = async () => {
    if (selectedIds.length === 0) return;
    try {
      const res = await fetch('http://localhost:5000/api/admin/students/bulk-update-semester', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify({ studentIds: selectedIds, semester: bulkSemester })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      toast.success(`Successfully updated semester for ${selectedIds.length} students`);
      setShowBulkSemesterModal(false);
      setSelectedIds([]);
      fetchStudents(true);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Bulk promote
  const handleBulkPromote = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to promote ${selectedIds.length} students to their next semester?`)) return;
    try {
      const res = await fetch('http://localhost:5000/api/admin/students/bulk-promote', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify({ studentIds: selectedIds })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      toast.success(`Successfully promoted selected students to the next semester.`);
      setSelectedIds([]);
      fetchStudents(true);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Bulk distribute
  const handleBulkDistribute = async () => {
    if (selectedIds.length === 0) return;
    if (distributeSections.length === 0) {
      toast.error('Select at least one section for distribution');
      return;
    }
    try {
      const res = await fetch('http://localhost:5000/api/admin/students/bulk-distribute', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify({
          studentIds: selectedIds,
          groupSize: distributeGroupSize,
          sections: distributeSections,
          sortBy: distributeSortBy
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      toast.success(`Successfully distributed ${selectedIds.length} students across sections`);
      setShowDistributeModal(false);
      setSelectedIds([]);
      fetchStudents(true);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const toggleSectionSelectInDistribute = (sec: string) => {
    setDistributeSections(prev =>
      prev.includes(sec) ? prev.filter(x => x !== sec) : [...prev, sec]
    );
  };

  return (
    <div className="space-y-6">
      {/* Overview/Header Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" /> Student Section & Academic Mapping
          </h3>
          <p className="text-sm text-gray-500">
            Assign students to sections, update academic semesters, and promote students semester-wise.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white border px-3 py-1.5 rounded-lg shadow-sm text-xs text-gray-500">
          <button 
            onClick={() => fetchStudents()}
            className="hover:text-indigo-600 flex items-center gap-1 transition-colors"
            title="Manual refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refreshed {lastRefreshed.toLocaleTimeString()}
          </button>
          <div className="h-4 w-px bg-gray-200" />
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input 
              type="checkbox" 
              checked={pollingActive} 
              onChange={() => setPollingActive(!pollingActive)}
              className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
            />
            Real-time Sync (20s)
          </label>
        </div>
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Name, Roll No..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            >
              <option value="all">All Departments/Branches</option>
              {DEPARTMENTS.map(d => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>

          {/* Semester Filter */}
          <div>
            <select
              value={semFilter}
              onChange={e => setSemFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            >
              <option value="all">All Semesters</option>
              {SEMESTERS.map(s => (
                <option key={s} value={s}>Semester {s}</option>
              ))}
            </select>
          </div>

          {/* Section Filter */}
          <div>
            <select
              value={secFilter}
              onChange={e => setSecFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            >
              <option value="all">All Sections</option>
              {SECTIONS.map(s => (
                <option key={s} value={s}>Section {s}</option>
              ))}
              <option value="unassigned">Unassigned Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Selected Items Floating Action Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-indigo-900 text-white px-6 py-4 rounded-xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-2">
            <span className="bg-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-full">{selectedIds.length} Selected</span>
            <p className="text-sm font-medium">Bulk Operations on selected students:</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setShowBulkAssignModal(true)}
              className="bg-indigo-800 hover:bg-indigo-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 border border-indigo-700"
            >
              <Grid className="w-3.5 h-3.5" /> Set Section
            </button>
            <button
              onClick={() => setShowDistributeModal(true)}
              className="bg-indigo-800 hover:bg-indigo-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 border border-indigo-700"
            >
              <Sparkles className="w-3.5 h-3.5" /> Bulk Distribute Wizard
            </button>
            <button
              onClick={() => setShowBulkSemesterModal(true)}
              className="bg-indigo-800 hover:bg-indigo-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 border border-indigo-700"
            >
              <Settings2 className="w-3.5 h-3.5" /> Set Semester
            </button>
            <button
              onClick={handleBulkPromote}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 border border-emerald-500"
            >
              <GraduationCap className="w-3.5 h-3.5" /> Promote Semester
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="text-indigo-200 hover:text-white text-xs font-semibold px-3.5 py-2 transition-all"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Main Student List Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-500 bg-white border rounded-xl">
          <RefreshCw className="w-6 h-6 animate-spin mr-2 text-indigo-500" /> Loading student database...
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white border border-gray-100 rounded-xl">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-semibold text-gray-500 text-lg">No Approved Students Found</p>
          <p className="text-sm mt-1 max-w-md mx-auto">No approved students match the current filters or query settings. Try adjusting the search.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 w-12 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === students.length}
                      onChange={toggleSelectAll}
                      className="rounded text-indigo-600 focus:ring-indigo-500 border-gray-300 w-4 h-4 cursor-pointer"
                    />
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Student Details</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Roll Number</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Branch</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Semester</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Section</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Quick Assign</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map(student => (
                  <tr key={student._id} className={`hover:bg-indigo-50/20 transition-colors ${selectedIds.includes(student._id) ? 'bg-indigo-50/10' : ''}`}>
                    {/* Checkbox */}
                    <td className="px-6 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(student._id)}
                        onChange={() => toggleSelectStudent(student._id)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 border-gray-300 w-4 h-4 cursor-pointer"
                      />
                    </td>

                    {/* Student details */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-sm shadow-sm flex-shrink-0">
                          {student.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{student.name}</p>
                          <p className="text-xs text-gray-400">{student.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Roll No */}
                    <td className="px-6 py-4 font-mono text-xs text-gray-600">{student.studentId || '--'}</td>

                    {/* Branch */}
                    <td className="px-6 py-4">
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-semibold border border-blue-100">
                        {student.department}
                      </span>
                    </td>

                    {/* Semester */}
                    <td className="px-6 py-4">
                      <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-xs font-semibold border border-purple-100">
                        Sem {student.semester}
                      </span>
                    </td>

                    {/* Section */}
                    <td className="px-6 py-4">
                      {student.section ? (
                        <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-bold border border-emerald-100">
                          Section {student.section}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs italic flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-500" /> Unassigned
                        </span>
                      )}
                    </td>

                    {/* Quick Section Assign */}
                    <td className="px-6 py-4 relative text-center">
                      <div className="flex justify-center items-center gap-1">
                        {SECTIONS.map(sec => (
                          <button
                            key={sec}
                            onClick={() => handleAssignSingleSection(student._id, sec)}
                            className={`px-2 py-1 text-xs font-bold rounded transition-all ${student.section === sec ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-indigo-100 hover:text-indigo-600'}`}
                          >
                            {sec}
                          </button>
                        ))}
                        {student.section && (
                          <button
                            onClick={() => handleAssignSingleSection(student._id, null)}
                            className="px-2 py-1 text-xs font-bold bg-rose-50 text-rose-500 rounded border border-rose-100 hover:bg-rose-500 hover:text-white transition-all ml-1"
                            title="Unassign Section"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MODALS ── */}

      {/* Bulk Section Assign Modal */}
      {showBulkAssignModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100">
              <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Grid className="w-5 h-5 text-indigo-500" /> Bulk Set Section
              </h4>
              <p className="text-xs text-gray-500 mt-1">Assign a single section to the {selectedIds.length} selected students.</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Select Target Section</label>
                <div className="grid grid-cols-4 gap-2">
                  {SECTIONS.map(sec => (
                    <button
                      key={sec}
                      onClick={() => setBulkSection(sec)}
                      className={`py-3 rounded-xl border-2 font-bold text-sm transition-all ${bulkSection === sec ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50 text-gray-600'}`}
                    >
                      {sec}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setBulkSection('unassigned')}
                  className={`w-full py-2.5 rounded-lg border text-xs font-semibold transition-all ${bulkSection === 'unassigned' ? 'border-rose-500 bg-rose-50 text-rose-600' : 'border-gray-200 hover:bg-gray-50 text-gray-500'}`}
                >
                  Clear/Unassign Section
                </button>
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6 pt-2">
              <button onClick={() => setShowBulkAssignModal(false)} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-semibold transition-colors">Cancel</button>
              <button onClick={handleBulkSetSection} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-md transition-colors">Apply Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Semester Assign Modal */}
      {showBulkSemesterModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100">
              <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-indigo-500" /> Set Academic Semester
              </h4>
              <p className="text-xs text-gray-500 mt-1">Change the semester mapping for the {selectedIds.length} selected students.</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Select Semester</label>
                <div className="grid grid-cols-4 gap-2">
                  {SEMESTERS.map(sem => (
                    <button
                      key={sem}
                      onClick={() => setBulkSemester(sem)}
                      className={`py-2 rounded-xl border-2 font-bold text-sm transition-all ${bulkSemester === sem ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50 text-gray-600'}`}
                    >
                      Sem {sem}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6 pt-2">
              <button onClick={() => setShowBulkSemesterModal(false)} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-semibold transition-colors">Cancel</button>
              <button onClick={handleBulkUpdateSemester} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-md transition-colors">Apply Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Distribute Wizard Modal */}
      {showDistributeModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100">
              <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" /> Section Distribution Wizard
              </h4>
              <p className="text-xs text-gray-500 mt-1">Automatically distribute {selectedIds.length} students into groups.</p>
            </div>
            <div className="p-6 space-y-4 text-left">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Group size (students per section) *</label>
                <input
                  type="number"
                  min="5"
                  max="200"
                  value={distributeGroupSize}
                  onChange={e => setDistributeGroupSize(parseInt(e.target.value) || 60)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Available sections for distribution</label>
                <div className="grid grid-cols-4 gap-2">
                  {SECTIONS.map(sec => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => toggleSectionSelectInDistribute(sec)}
                      className={`py-2 font-bold text-sm border rounded-lg transition-all ${distributeSections.includes(sec) ? 'bg-indigo-600 text-white border-indigo-600 shadow' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                    >
                      {sec}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Sort Criteria (to define group order)</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer text-sm font-medium">
                    <input
                      type="radio"
                      name="sortBy"
                      checked={distributeSortBy === 'studentId'}
                      onChange={() => setDistributeSortBy('studentId')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    Roll Number (studentId)
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-sm font-medium">
                    <input
                      type="radio"
                      name="sortBy"
                      checked={distributeSortBy === 'name'}
                      onChange={() => setDistributeSortBy('name')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    Student Name
                  </label>
                </div>
              </div>

              <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-lg text-xs text-indigo-700 flex gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-indigo-500" />
                <div>
                  <p className="font-semibold">How it works:</p>
                  <p>Students are sorted by {distributeSortBy === 'studentId' ? 'Roll Number' : 'Name'}, then divided into buckets of {distributeGroupSize} students. Each bucket is assigned in sequence to the selected sections.</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6 pt-2">
              <button onClick={() => setShowDistributeModal(false)} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-semibold transition-colors">Cancel</button>
              <button onClick={handleBulkDistribute} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-md transition-colors flex items-center justify-center gap-2">
                Run Distribution <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
