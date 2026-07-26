import React, { useState, useEffect } from 'react';
import { api } from './api';
import { TtConfig, TtSubject, TtRoom, TtFacultyConstraint, BranchConfig, TimeSlot, Teacher } from './types';
import { Plus, Trash2, Edit2, Check, AlertCircle, Clock, BookOpen, MapPin, Shield, Calendar, UserCheck, GraduationCap, Users } from 'lucide-react';
import { buildSectionLabels } from './sectionUtils';
import CourseManager from './CourseManager';
import StudentAssignmentPanel from './StudentAssignmentPanel';
import OperationalSettings from './OperationalSettings';

export type ConfigWizardStep = 'structure' | 'courses' | 'students' | 'rooms' | 'faculty';

interface ConfigPanelProps {
  embeddedStep?: ConfigWizardStep;
  hideHeader?: boolean;
  onStructureSaved?: () => void;
}

export default function ConfigPanel({ embeddedStep, hideHeader, onStructureSaved }: ConfigPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<'structure' | 'courses' | 'students' | 'rooms' | 'subjects' | 'faculty'>(
    embeddedStep || 'structure',
  );

  useEffect(() => {
    if (embeddedStep) setActiveSubTab(embeddedStep);
  }, [embeddedStep]);

  // Data states
  const [config, setConfig] = useState<TtConfig | null>(null);
  const [subjects, setSubjects] = useState<TtSubject[]>([]);
  const [rooms, setRooms] = useState<TtRoom[]>([]);
  const [constraints, setConstraints] = useState<TtFacultyConstraint[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  // Loading/feedback states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [branchForm, setBranchForm] = useState({ code: '', name: '', semestersCount: 8, defaultSectionCount: 2 });
  const [roomForm, setRoomForm] = useState({ id: '', name: '', type: 'classroom' as 'classroom' | 'lab', capacity: 60, labType: '' });
  const [subjectForm, setSubjectForm] = useState({ id: '', name: '', code: '', type: 'theory' as 'theory' | 'lab', branch: '', semester: 1, credits: 4, weeklyHours: 3, labDuration: 2, facultyId: '' });
  const [constraintForm, setConstraintForm] = useState({ facultyId: '', maxHoursPerDay: 6, maxHoursPerWeek: 24, day: 'Monday', startTime: '09:00', endTime: '11:00', reason: 'Other engagement' });

  // Fetch all setup data
  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [configRes, subjectsRes, roomsRes, constraintsRes, teachersRes] = await Promise.all([
        api.getConfig(),
        api.getSubjects(),
        api.getRooms(),
        api.getFacultyConstraints(),
        api.getTeachers()
      ]);
      setConfig(configRes.config);
      setSubjects(subjectsRes.subjects);
      setRooms(roomsRes.rooms);
      setConstraints(constraintsRes.constraints);
      setTeachers(teachersRes.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load configuration data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showSuccessMessage = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  // --- STRUCTURE MANAGERS ---
  const validateConfig = (cfg: TtConfig): string | null => {
    if (!cfg.academicYear?.trim()) return 'Academic year is required.';
    if (!cfg.branches?.length) return 'Add at least one branch before saving.';
    if (!cfg.workingDays?.length) return 'Select at least one working day.';
    if (!cfg.timeSlots?.length) return 'Add at least one time slot.';
    for (const slot of cfg.timeSlots) {
      if (!slot.startTime || !slot.endTime) return 'All time slots must have start and end times.';
      if (slot.startTime >= slot.endTime) return `Invalid slot times: ${slot.label || 'check start/end order'}.`;
    }
    if (!cfg.lunchBreak?.startTime || !cfg.lunchBreak?.endTime) {
      return 'Lunch period start and end times are required.';
    }
    return null;
  };

  const handleSaveStructure = async () => {
    if (!config || saving) return;
    const validationError = validateConfig(config);
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await api.saveConfig(config);
      setConfig(res.config);
      onStructureSaved?.();
      showSuccessMessage('Configuration saved successfully!');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error saving configuration.');
    } finally {
      setSaving(false);
    }
  };

  const addBranch = () => {
    if (!config || !branchForm.code.trim() || !branchForm.name.trim()) return;

    // Prepare semesters structure
    const semesters = [];
    for (let i = 1; i <= branchForm.semestersCount; i++) {
      let label = `Semester ${i}`;
      semesters.push({
        semesterNumber: i,
        label,
        sections: Array.from({ length: branchForm.defaultSectionCount }, (_, idx) => String.fromCharCode(65 + idx))
      });
    }

    const newBranch: BranchConfig = {
      code: branchForm.code.toUpperCase(),
      name: branchForm.name,
      semesters
    };

    setConfig({
      ...config,
      branches: [...config.branches, newBranch]
    });
    setBranchForm({ code: '', name: '', semestersCount: 8, defaultSectionCount: 2 });
  };

  const updateSemesterSectionCount = (branchCode: string, semesterNumber: number, count: number) => {
    const sections = Array.from({ length: Math.max(1, count) }, (_, i) => String.fromCharCode(65 + i));
    setConfig(prev => {
      if (!prev) return null;
      return {
        ...prev,
        branches: prev.branches.map(b => b.code === branchCode
          ? {
            ...b,
            semesters: b.semesters.map((s) =>
              s.semesterNumber === semesterNumber ? { ...s, sections } : s
            )
          }
          : b
        )
      };
    });
  };

  const removeBranch = (code: string) => {
    if (!config) return;
    setConfig({
      ...config,
      branches: config.branches.filter(b => b.code !== code)
    });
  };

  // --- ROOM MANAGERS ---
  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomForm.name.trim()) return;
    setSaving(true);
    try {
      await api.saveRoom({
        _id: roomForm.id || undefined,
        name: roomForm.name,
        type: roomForm.type,
        capacity: Number(roomForm.capacity),
        labType: roomForm.type === 'lab' ? roomForm.labType : ''
      } as any);
      setRoomForm({ id: '', name: '', type: 'classroom', capacity: 60, labType: '' });
      loadData();
      showSuccessMessage('Room configuration updated!');
    } catch (err: any) {
      setError(err.message || 'Error saving room.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditRoom = (room: TtRoom) => {
    setRoomForm({
      id: room._id || '',
      name: room.name,
      type: room.type,
      capacity: room.capacity,
      labType: room.labType || ''
    });
  };

  const handleDeleteRoom = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this room?')) return;
    try {
      await api.deleteRoom(id);
      loadData();
      showSuccessMessage('Room deleted.');
    } catch (err: any) {
      setError(err.message || 'Error deleting room.');
    }
  };

  // --- SUBJECT MANAGERS ---
  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectForm.name.trim() || !subjectForm.code.trim() || !subjectForm.branch) return;
    setSaving(true);
    try {
      await api.saveSubject({
        id: subjectForm.id || undefined,
        name: subjectForm.name,
        code: subjectForm.code.toUpperCase(),
        type: subjectForm.type,
        branch: subjectForm.branch,
        year: Math.ceil(Number(subjectForm.semester) / 2),
        semester: Number(subjectForm.semester),
        credits: Number(subjectForm.credits),
        weeklyHours: Number(subjectForm.weeklyHours),
        labDuration: Number(subjectForm.labDuration),
        facultyId: subjectForm.facultyId || null,
        facultyName: ''
      });
      setSubjectForm({ id: '', name: '', code: '', type: 'theory', branch: '', semester: 1, credits: 4, weeklyHours: 3, labDuration: 2, facultyId: '' });
      loadData();
      showSuccessMessage('Subject details saved successfully!');
    } catch (err: any) {
      setError(err.message || 'Error saving subject.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditSubject = (sub: any) => {
    setSubjectForm({
      id: sub._id || '',
      name: sub.name,
      code: sub.code,
      type: sub.type,
      branch: sub.branch,
      semester: sub.semester || 1,
      credits: sub.credits || 4,
      weeklyHours: sub.weeklyHours,
      labDuration: sub.labDuration || 2,
      facultyId: sub.facultyId || ''
    });
  };

  const handleDeleteSubject = async (id: string) => {
    if (!window.confirm('Delete this subject?')) return;
    try {
      await api.deleteSubject(id);
      loadData();
      showSuccessMessage('Subject removed.');
    } catch (err: any) {
      setError(err.message || 'Error removing subject.');
    }
  };

  // --- FACULTY CONSTRAINT MANAGERS ---
  const handleSaveConstraint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!constraintForm.facultyId) return;
    setSaving(true);
    try {
      const existing = constraints.find(c => c.facultyId === constraintForm.facultyId);
      const unavailSlots = existing ? [...existing.unavailableSlots] : [];

      // If user filled unavailability fields, push it
      if (constraintForm.startTime && constraintForm.endTime) {
        unavailSlots.push({
          day: constraintForm.day,
          startTime: constraintForm.startTime,
          endTime: constraintForm.endTime,
          reason: constraintForm.reason || 'Other duties'
        });
      }

      await api.saveFacultyConstraint({
        facultyId: constraintForm.facultyId,
        maxHoursPerDay: Number(constraintForm.maxHoursPerDay),
        maxHoursPerWeek: Number(constraintForm.maxHoursPerWeek),
        unavailableSlots: unavailSlots
      });

      setConstraintForm({
        facultyId: '',
        maxHoursPerDay: 6,
        maxHoursPerWeek: 24,
        day: 'Monday',
        startTime: '09:00',
        endTime: '11:00',
        reason: 'Other engagement'
      });

      loadData();
      showSuccessMessage('Faculty constraint saved.');
    } catch (err: any) {
      setError(err.message || 'Error saving constraint.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveUnavailableSlot = async (facultyId: string, slotId: string) => {
    const existing = constraints.find(c => c.facultyId === facultyId);
    if (!existing) return;
    setSaving(true);
    try {
      const filtered = existing.unavailableSlots.filter(s => s._id !== slotId);
      await api.saveFacultyConstraint({
        facultyId: existing.facultyId,
        maxHoursPerDay: existing.maxHoursPerDay,
        maxHoursPerWeek: existing.maxHoursPerWeek,
        unavailableSlots: filtered
      });
      loadData();
      showSuccessMessage('Availability slot removed.');
    } catch (err: any) {
      setError(err.message || 'Error removing slot.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <Clock className="w-10 h-10 animate-spin text-purple-600 mb-3" />
        <p className="text-sm font-medium">Loading Timetable Engine Configuration...</p>
      </div>
    );
  }

  const stepTitles: Record<ConfigWizardStep, { title: string; desc: string }> = {
    structure: { title: 'Academic Structure', desc: 'Define branches, semesters, sections, working days, and bell schedule.' },
    courses: { title: 'Course Configuration', desc: 'Add unlimited subjects per branch and semester with faculty and room preferences.' },
    faculty: { title: 'Faculty Constraints', desc: 'Set workload limits and blocked availability slots.' },
    rooms: { title: 'Room Registry', desc: 'Register classrooms and labs available for scheduling.' },
    students: { title: 'Enrollment Constraints', desc: 'Assign students to sections and course enrollments.' },
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {!hideHeader ? (
        <div className="bg-gradient-to-r from-purple-700 to-indigo-800 p-6 text-white">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-200" /> College Setup & Parameters
          </h3>
          <p className="text-xs text-purple-200 mt-1">Configure structural layers, room inventories, course workload, and faculty availability guidelines.</p>

          <div className="flex gap-2 mt-6 overflow-x-auto">
            {[
              { id: 'structure', label: 'College Structure', icon: Calendar },
              { id: 'courses', label: 'Course Management', icon: GraduationCap },
              { id: 'students', label: 'Student Assignment', icon: Users },
              { id: 'rooms', label: 'Room Registry', icon: MapPin },
              { id: 'faculty', label: 'Faculty Workload', icon: UserCheck },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as ConfigWizardStep)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${activeSubTab === tab.id
                    ? 'bg-white text-purple-900 shadow-md font-bold'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
              >
                <tab.icon className="w-4 h-4" /> {tab.label}
              </button>
            ))}
          </div>
        </div>
      ) : embeddedStep && (
        <div className="px-6 pt-6 pb-2 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-900">{stepTitles[embeddedStep].title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{stepTitles[embeddedStep].desc}</p>
        </div>
      )}

      <div className="p-6">
        {error && (
          <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}
        {success && (
          <div className="mb-4 flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 text-xs">
            <Check className="w-4 h-4 flex-shrink-0" /> {success}
          </div>
        )}

        {/* ── COLLEGE STRUCTURE TAB ── */}
        {activeSubTab === 'structure' && config && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Form: Add Branch */}
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 space-y-4 h-fit">
                <h4 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-purple-600" /> Add Academic Branch
                </h4>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Branch Code (uppercase)</label>
                  <input
                    type="text"
                    value={branchForm.code}
                    onChange={e => setBranchForm({ ...branchForm, code: e.target.value })}
                    placeholder="e.g. BTECH"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400 uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Branch Name</label>
                  <input
                    type="text"
                    value={branchForm.name}
                    onChange={e => setBranchForm({ ...branchForm, name: e.target.value })}
                    placeholder="e.g. Bachelor of Technology"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Duration (Semesters)</label>
                  <select
                    value={branchForm.semestersCount}
                    onChange={e => setBranchForm({ ...branchForm, semestersCount: Number(e.target.value) })}
                    className="w-full border border-gray-200 rounded-md p-1.5 text-xs text-gray-700 bg-gray-50"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(s => <option key={s} value={s}>{s} Semester{s !== 1 ? 's' : ''}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Sections per semester (default)</label>
                  <input
                    type="number"
                    min={1}
                    max={26}
                    value={branchForm.defaultSectionCount}
                    onChange={e => setBranchForm({ ...branchForm, defaultSectionCount: Number(e.target.value) })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>
                <button
                  onClick={addBranch}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-lg py-2 text-xs font-semibold transition"
                >
                  Add Branch Layer
                </button>
              </div>

              {/* Middle/Right Display: Configured Branches */}
              <div className="md:col-span-2 space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h4 className="font-bold text-gray-800 text-sm">Active Academic Layers</h4>
                  <span className="text-[10px] text-gray-400">Specify branches and dynamic semester ranges</span>
                </div>

                {config.branches.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 text-xs">No branches configured yet. Add one on the left.</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {config.branches.map(branch => (
                      <div key={branch.code} className="border border-gray-100 rounded-xl p-4 bg-white shadow-sm hover:shadow transition space-y-3 relative group">
                        <button
                          onClick={() => removeBranch(branch.code)}
                          className="absolute top-3 right-3 text-gray-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div>
                          <span className="bg-purple-50 text-purple-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">{branch.code}</span>
                          <h5 className="font-bold text-gray-800 text-xs mt-1">{branch.name}</h5>
                        </div>
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Semester Classes & Sections</p>
                          {branch.semesters?.map(s => (
                            <div key={s.semesterNumber} className="flex flex-wrap items-center gap-2 text-xs py-1 border-b border-gray-50 last:border-0">
                              <span className="w-24 font-medium text-gray-600 truncate">{s.label}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-gray-400">Sections:</span>
                                <input
                                  type="number" min={1} max={10}
                                  value={s.sections.length}
                                  onChange={(e) => updateSemesterSectionCount(branch.code, s.semesterNumber, Number(e.target.value))}
                                  className="w-14 border border-gray-200 rounded px-2 py-1 text-center text-xs"
                                  title="Number of sections"
                                />
                                <span className="font-semibold text-purple-600 text-[10px]">
                                  {s.sections.join(', ')}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <OperationalSettings
                  config={config}
                  onChange={(updated) => setConfig(updated)}
                />

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleSaveStructure}
                    disabled={saving}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg px-6 py-2.5 text-xs font-semibold transition shadow-sm"
                  >
                    {saving ? 'Saving...' : 'Save Configuration'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'courses' && (
          <CourseManager config={config} teachers={teachers} onSaved={loadData} />
        )}

        {activeSubTab === 'students' && (
          <StudentAssignmentPanel config={config} subjects={subjects} />
        )}

        {/* ── ROOMS REGISTRY TAB ── */}
        {activeSubTab === 'rooms' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Add Room Form */}
              <form onSubmit={handleSaveRoom} className="bg-gray-50 border border-gray-100 rounded-xl p-5 space-y-4 h-fit">
                <h4 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-purple-600" /> {roomForm.id ? 'Edit' : 'Add'} Room Asset
                </h4>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Room Label / Number *</label>
                  <input
                    type="text"
                    value={roomForm.name}
                    onChange={e => setRoomForm({ ...roomForm, name: e.target.value })}
                    placeholder="e.g. Room 101 or Lab A"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Capacity (Seats) *</label>
                  <input
                    type="number"
                    value={roomForm.capacity}
                    onChange={e => setRoomForm({ ...roomForm, capacity: Number(e.target.value) })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Room Classification</label>
                  <select
                    value={roomForm.type}
                    onChange={e => setRoomForm({ ...roomForm, type: e.target.value as any })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                  >
                    <option value="classroom">Classroom (Theory)</option>
                    <option value="lab">Specialized Lab</option>
                  </select>
                </div>
                {roomForm.type === 'lab' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">Lab Department (e.g. Computer, Electronics)</label>
                    <input
                      type="text"
                      value={roomForm.labType}
                      onChange={e => setRoomForm({ ...roomForm, labType: e.target.value })}
                      placeholder="e.g. Computer"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg py-2 text-xs font-semibold transition"
                  >
                    {roomForm.id ? 'Update Room' : 'Add Room'}
                  </button>
                  {roomForm.id && (
                    <button
                      type="button"
                      onClick={() => setRoomForm({ id: '', name: '', type: 'classroom', capacity: 60, labType: '' })}
                      className="border border-gray-200 hover:bg-gray-100 rounded-lg px-3 py-2 text-xs text-gray-500"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </form>

              {/* Room Inventory */}
              <div className="md:col-span-2 space-y-4">
                <h4 className="font-bold text-gray-800 text-sm border-b pb-2">Room Assets Inventory ({rooms.length})</h4>

                {rooms.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 text-xs">No rooms available in registry. Add one to the left.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase text-[10px]">
                          <th className="py-2.5 px-3">Room Name</th>
                          <th className="py-2.5 px-3">Classification</th>
                          <th className="py-2.5 px-3 text-center">Seat Capacity</th>
                          <th className="py-2.5 px-3">Lab Speciality</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {rooms.map(room => (
                          <tr key={room._id} className="hover:bg-gray-50/50 transition">
                            <td className="py-2.5 px-3 font-semibold text-gray-800">{room.name}</td>
                            <td className="py-2.5 px-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${room.type === 'lab' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'
                                }`}>
                                {room.type}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center text-gray-600">{room.capacity} Seats</td>
                            <td className="py-2.5 px-3 text-gray-500">{room.labType || '-'}</td>
                            <td className="py-2.5 px-3 text-right space-x-2">
                              <button
                                onClick={() => handleEditRoom(room)}
                                className="text-gray-400 hover:text-purple-600 transition"
                              >
                                <Edit2 className="w-3.5 h-3.5 inline" />
                              </button>
                              <button
                                onClick={() => handleDeleteRoom(room._id!)}
                                className="text-gray-400 hover:text-red-500 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5 inline" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Subject Registry removed from wizard — use Course Management */}
        {activeSubTab === 'subjects' && !hideHeader && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Subject Form */}
              <form onSubmit={handleSaveSubject} className="bg-gray-50 border border-gray-100 rounded-xl p-5 space-y-4 h-fit">
                <h4 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-purple-600" /> {subjectForm.id ? 'Edit' : 'Add'} Subject Layer
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">Subject Code *</label>
                    <input
                      type="text"
                      value={subjectForm.code}
                      onChange={e => setSubjectForm({ ...subjectForm, code: e.target.value })}
                      placeholder="e.g. CS301"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400 uppercase"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">Subject Name *</label>
                    <input
                      type="text"
                      value={subjectForm.name}
                      onChange={e => setSubjectForm({ ...subjectForm, name: e.target.value })}
                      placeholder="e.g. DBMS"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">Branch *</label>
                    <select
                      value={subjectForm.branch}
                      onChange={e => setSubjectForm({ ...subjectForm, branch: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                      required
                    >
                      <option value="">Select Branch...</option>
                      {config?.branches.map(b => (
                        <option key={b.code} value={b.code}>{b.code} - {b.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">Semester *</label>
                    <select
                      value={subjectForm.semester}
                      onChange={e => setSubjectForm({ ...subjectForm, semester: Number(e.target.value) })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                      required
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">Classification</label>
                    <select
                      value={subjectForm.type}
                      onChange={e => setSubjectForm({ ...subjectForm, type: e.target.value as any })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                    >
                      <option value="theory">Theory Lecture</option>
                      <option value="lab">Consecutive Lab</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">Credits *</label>
                    <input
                      type="number"
                      value={subjectForm.credits}
                      onChange={e => setSubjectForm({ ...subjectForm, credits: Number(e.target.value) })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400"
                      min="1"
                      max="6"
                      required
                    />
                  </div>
                </div>

                <div>
                  {subjectForm.type === 'theory' ? (
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">Weekly Classes *</label>
                      <input
                        type="number"
                        value={subjectForm.weeklyHours}
                        onChange={e => setSubjectForm({ ...subjectForm, weeklyHours: Number(e.target.value) })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400"
                        min="1"
                        max="10"
                        required
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">Lab Duration (hrs) *</label>
                      <select
                        value={subjectForm.labDuration}
                        onChange={e => setSubjectForm({ ...subjectForm, labDuration: Number(e.target.value), weeklyHours: Number(e.target.value) })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                        required
                      >
                        <option value="2">2 Hour block</option>
                        <option value="3">3 Hour block</option>
                        <option value="4">4 Hour block</option>
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Faculty Assignment</label>
                  <select
                    value={subjectForm.facultyId}
                    onChange={e => setSubjectForm({ ...subjectForm, facultyId: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                  >
                    <option value="">No Instructor Assigned</option>
                    {teachers.map(t => (
                      <option key={t._id} value={t._id}>{t.name} ({t.employeeId})</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg py-2 text-xs font-semibold transition"
                  >
                    {subjectForm.id ? 'Update Subject' : 'Add Subject'}
                  </button>
                  {subjectForm.id && (
                    <button
                      type="button"
                    onClick={() => setSubjectForm({ id: '', name: '', code: '', type: 'theory', branch: '', semester: 1, credits: 4, weeklyHours: 3, labDuration: 2, facultyId: '' })}
                      className="border border-gray-200 hover:bg-gray-100 rounded-lg px-3 py-2 text-xs text-gray-500"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </form>

              {/* Subject registry view */}
              <div className="md:col-span-2 space-y-4">
                <h4 className="font-bold text-gray-800 text-sm border-b pb-2">Course Subjects Registry ({subjects.length})</h4>

                {subjects.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 text-xs">No subjects available in database. Add one to the left.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase text-[10px]">
                          <th className="py-2.5 px-3">Subject</th>
                          <th className="py-2.5 px-3">Branch & Semester (Credits)</th>
                          <th className="py-2.5 px-3 text-center">Type</th>
                          <th className="py-2.5 px-3 text-center">Weekly Hours</th>
                          <th className="py-2.5 px-3">Assigned Faculty</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {subjects.map(sub => (
                          <tr key={sub._id} className="hover:bg-gray-50/50 transition">
                            <td className="py-2.5 px-3">
                              <span className="font-bold text-gray-800">{sub.code}</span>
                              <span className="block text-gray-500 text-[10px]">{sub.name}</span>
                            </td>
                            <td className="py-2.5 px-3 text-gray-600">
                              {sub.branch} (Sem {sub.semester || 1}, {sub.credits || 4} credits)
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${sub.type === 'lab' ? 'bg-amber-50 text-amber-700' : 'bg-purple-50 text-purple-700'
                                }`}>
                                {sub.type}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center text-gray-600">
                              {sub.type === 'lab' ? `${sub.labDuration} hrs` : `${sub.weeklyHours} hrs`}
                            </td>
                            <td className="py-2.5 px-3 font-medium text-gray-700">
                              {sub.facultyName || <span className="text-red-400 italic">Unassigned</span>}
                            </td>
                            <td className="py-2.5 px-3 text-right space-x-2">
                              <button
                                onClick={() => handleEditSubject(sub)}
                                className="text-gray-400 hover:text-purple-600 transition"
                              >
                                <Edit2 className="w-3.5 h-3.5 inline" />
                              </button>
                              <button
                                onClick={() => handleDeleteSubject(sub._id!)}
                                className="text-gray-400 hover:text-red-500 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5 inline" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── FACULTY CONSTRAINTS TAB ── */}
        {activeSubTab === 'faculty' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Set Constraint Form */}
              <form onSubmit={handleSaveConstraint} className="bg-gray-50 border border-gray-100 rounded-xl p-5 space-y-4 h-fit">
                <h4 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-purple-600" /> Faculty Constraint Rules
                </h4>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Select Faculty Member *</label>
                  <select
                    value={constraintForm.facultyId}
                    onChange={e => {
                      const cid = e.target.value;
                      const match = constraints.find(c => c.facultyId === cid);
                      setConstraintForm({
                        ...constraintForm,
                        facultyId: cid,
                        maxHoursPerDay: match?.maxHoursPerDay || 6,
                        maxHoursPerWeek: match?.maxHoursPerWeek || 24
                      });
                    }}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                    required
                  >
                    <option value="">Select Faculty...</option>
                    {teachers.map(t => (
                      <option key={t._id} value={t._id}>{t.name} ({t.employeeId})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">Max Daily Lects</label>
                    <input
                      type="number"
                      value={constraintForm.maxHoursPerDay}
                      onChange={e => setConstraintForm({ ...constraintForm, maxHoursPerDay: Number(e.target.value) })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">Max Weekly Lects</label>
                    <input
                      type="number"
                      value={constraintForm.maxHoursPerWeek}
                      onChange={e => setConstraintForm({ ...constraintForm, maxHoursPerWeek: Number(e.target.value) })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                  </div>
                </div>

                <div className="border-t pt-3 mt-1 space-y-3">
                  <h5 className="font-bold text-gray-700 text-xs">Add Unavailable Slot (Block Out)</h5>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-400 mb-1">DAY</label>
                      <select
                        value={constraintForm.day}
                        onChange={e => setConstraintForm({ ...constraintForm, day: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                      >
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-400 mb-1">REASON</label>
                      <input
                        type="text"
                        value={constraintForm.reason}
                        onChange={e => setConstraintForm({ ...constraintForm, reason: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-400 mb-1">START TIME</label>
                      <input
                        type="time"
                        value={constraintForm.startTime}
                        onChange={e => setConstraintForm({ ...constraintForm, startTime: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-400 mb-1">END TIME</label>
                      <input
                        type="time"
                        value={constraintForm.endTime}
                        onChange={e => setConstraintForm({ ...constraintForm, endTime: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-lg py-2.5 text-xs font-semibold transition"
                >
                  Save Limits & Unavailability
                </button>
              </form>

              {/* View constraints list */}
              <div className="md:col-span-2 space-y-4">
                <h4 className="font-bold text-gray-800 text-sm border-b pb-2">Configured Availability Guidelines ({constraints.length})</h4>

                {constraints.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 text-xs">No active constraint rules set. Define one to the left.</div>
                ) : (
                  <div className="space-y-3">
                    {constraints.map(c => (
                      <div key={c._id} className="border border-gray-100 rounded-xl p-4 bg-white shadow-sm space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="font-bold text-gray-800 text-xs">{c.facultyName}</h5>
                            <div className="flex gap-4 mt-1 text-[10px] text-gray-500">
                              <span>Max Daily: <strong className="text-gray-700">{c.maxHoursPerDay} hrs</strong></span>
                              <span>Max Weekly: <strong className="text-gray-700">{c.maxHoursPerWeek} hrs</strong></span>
                            </div>
                          </div>
                        </div>

                        {c.unavailableSlots.length > 0 && (
                          <div className="pt-2 border-t border-gray-50 space-y-1">
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Blocked Scheduling Periods:</span>
                            <div className="flex flex-wrap gap-1.5">
                              {c.unavailableSlots.map(slot => (
                                <span key={slot._id} className="inline-flex items-center gap-1 bg-red-50 text-red-700 border border-red-100 rounded-full px-2.5 py-0.5 text-[10px]">
                                  {slot.day} ({slot.startTime}-{slot.endTime}) : {slot.reason}
                                  <button
                                    onClick={() => handleRemoveUnavailableSlot(c.facultyId, slot._id!)}
                                    className="hover:text-red-900 ml-1 text-red-400 text-xs font-bold"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
