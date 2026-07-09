import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Save, Trash2, Copy, Pencil, Loader2 } from 'lucide-react';
import { engineApi } from '../manageApi';
import { TtBranch, TtSubject, Teacher, UnifiedTtConfig } from '../types';
import { StepHeader, FieldLabel, inputClass, btnPrimary, idOf } from './shared';

interface Props {
  unified: UnifiedTtConfig | null;
  teachers: Teacher[];
  onRefresh: () => Promise<void>;
  onDirty: () => void;
}

const emptySubject = (branch: string, year: number): Partial<TtSubject> => ({
  name: '',
  code: '',
  type: 'theory',
  branch,
  year,
  weeklyHours: 3,
  labDuration: 2,
  lectureDuration: 50,
  hasLab: false,
  labSessionsPerWeek: 1,
  facultyId: null,
  facultyName: '',
  preferredDays: [],
  preferredSlots: [],
  roomType: 'classroom',
});

export default function SubjectStep({ unified, teachers, onRefresh, onDirty }: Props) {
  const branches = unified?.branches || [];
  const [branch, setBranch] = useState('');
  const [year, setYear] = useState(1);
  const [subjects, setSubjects] = useState<TtSubject[]>([]);
  const [editing, setEditing] = useState<Partial<TtSubject> | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (branches.length && !branch) {
      setBranch(branches[0].code);
    }
  }, [branches, branch]);

  const loadSubjects = async () => {
    if (!branch) return;
    setLoading(true);
    try {
      const res = await engineApi.getSubjects({ branch, year });
      setSubjects(res.subjects);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to load subjects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubjects();
  }, [branch, year]);

  const validate = (): string | null => {
    if (!editing?.name?.trim()) return 'Subject name is required.';
    if (!editing?.code?.trim()) return 'Subject code is required.';
    if (subjects.some((s) => s.code === editing.code?.toUpperCase() && s._id !== editing._id)) {
      return 'Subject code already exists for this branch/year.';
    }
    if ((editing.weeklyHours || 0) < 1) return 'Weekly classes must be at least 1.';
    if ((editing.lectureDuration || 0) < 30 || (editing.lectureDuration || 0) > 180) {
      return 'Lecture duration must be between 30 and 180 minutes.';
    }
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    setSaving(true);
    try {
      const faculty = teachers.find((t) => t._id === editing?.facultyId);
      await engineApi.saveSubject({
        ...editing,
        id: editing?._id,
        branch,
        year,
        code: editing!.code!.toUpperCase(),
        facultyName: faculty?.name || '',
      });
      toast.success('Subject saved.');
      setEditing(null);
      onDirty();
      await loadSubjects();
      await onRefresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save subject.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this subject?')) return;
    try {
      await engineApi.deleteSubject(id);
      toast.success('Subject deleted.');
      onDirty();
      await loadSubjects();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete subject.');
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await engineApi.duplicateSubject(id);
      toast.success('Subject duplicated.');
      onDirty();
      await loadSubjects();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to duplicate subject.');
    }
  };

  const branchYears = (b: TtBranch) => {
    const sems = (unified?.semesters || []).filter((s) => idOf(s.branchId) === b._id);
    return [...new Set(sems.map((s) => s.year))].sort();
  };

  return (
    <div className="space-y-6">
      <StepHeader
        title="Step 2 — Subject Management"
        description="Add, edit, duplicate, and delete subjects with credits, type, duration, and faculty assignment."
      />

      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <FieldLabel>Branch</FieldLabel>
          <select className={inputClass('min-w-[140px]')} value={branch} onChange={(e) => setBranch(e.target.value)}>
            {branches.map((b) => (
              <option key={b._id} value={b.code}>{b.code} — {b.name}</option>
            ))}
          </select>
        </div>
        <div>
          <FieldLabel>Year</FieldLabel>
          <select className={inputClass('min-w-[100px]')} value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {(branches.find((b) => b.code === branch) ? branchYears(branches.find((b) => b.code === branch)!) : [1]).map((y) => (
              <option key={y} value={y}>Year {y}</option>
            ))}
          </select>
        </div>
        <button type="button" className={btnPrimary()} onClick={() => setEditing(emptySubject(branch, year))}>
          <Plus className="w-4 h-4" /> Add Subject
        </button>
      </div>

      {editing && (
        <div className="border border-purple-100 bg-purple-50/30 rounded-xl p-5 space-y-3">
          <h4 className="text-sm font-bold text-gray-800">{editing._id ? 'Edit Subject' : 'New Subject'}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <FieldLabel>Subject Name *</FieldLabel>
              <input className={inputClass()} value={editing.name || ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </div>
            <div>
              <FieldLabel>Subject Code *</FieldLabel>
              <input className={inputClass()} value={editing.code || ''} onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })} />
            </div>
            <div>
              <FieldLabel>Type</FieldLabel>
              <select className={inputClass()} value={editing.type || 'theory'} onChange={(e) => setEditing({ ...editing, type: e.target.value as 'theory' | 'lab' })}>
                <option value="theory">Theory</option>
                <option value="lab">Lab</option>
              </select>
            </div>
            <div>
              <FieldLabel>Weekly Classes</FieldLabel>
              <input type="number" min={1} className={inputClass()} value={editing.weeklyHours || 3} onChange={(e) => setEditing({ ...editing, weeklyHours: Number(e.target.value) })} />
            </div>
            <div>
              <FieldLabel>Lecture Duration (min)</FieldLabel>
              <input type="number" min={30} max={180} className={inputClass()} value={editing.lectureDuration || 50} onChange={(e) => setEditing({ ...editing, lectureDuration: Number(e.target.value) })} />
            </div>
            <div>
              <FieldLabel>Faculty</FieldLabel>
              <select className={inputClass()} value={editing.facultyId || ''} onChange={(e) => setEditing({ ...editing, facultyId: e.target.value || null })}>
                <option value="">Unassigned</option>
                {teachers.map((t) => (
                  <option key={t._id} value={t._id}>{t.name} ({t.employeeId})</option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel>Room Preference</FieldLabel>
              <select className={inputClass()} value={editing.roomType || 'classroom'} onChange={(e) => setEditing({ ...editing, roomType: e.target.value as 'classroom' | 'lab' | 'any' })}>
                <option value="classroom">Classroom</option>
                <option value="lab">Lab</option>
                <option value="any">Any</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <label className="flex items-center gap-2 text-xs text-gray-600 pb-2">
                <input type="checkbox" checked={!!editing.hasLab} onChange={(e) => setEditing({ ...editing, hasLab: e.target.checked })} />
                Lab component required
              </label>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" className={btnPrimary(saving)} disabled={saving} onClick={handleSave}>
              <Save className="w-4 h-4" /> Save Subject
            </button>
            <button type="button" className="text-xs text-gray-500 px-3" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-purple-600" /></div>
      ) : subjects.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-10 border border-dashed rounded-xl">No subjects for {branch} Year {year}. Add one above.</p>
      ) : (
        <div className="overflow-x-auto border border-gray-100 rounded-xl">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 text-[10px] uppercase text-gray-400">
              <tr>
                <th className="text-left p-3">Code</th>
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Type</th>
                <th className="text-left p-3">Weekly</th>
                <th className="text-left p-3">Faculty</th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((s) => (
                <tr key={s._id} className="border-t border-gray-50 hover:bg-gray-50/50">
                  <td className="p-3 font-mono font-bold text-purple-700">{s.code}</td>
                  <td className="p-3">{s.name}</td>
                  <td className="p-3 capitalize">{s.type}</td>
                  <td className="p-3">{s.weeklyHours}/wk</td>
                  <td className="p-3">{s.facultyName || '—'}</td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button type="button" className="p-1.5 text-gray-400 hover:text-purple-600" onClick={() => setEditing({ ...s })}><Pencil className="w-3.5 h-3.5" /></button>
                      <button type="button" className="p-1.5 text-gray-400 hover:text-blue-600" onClick={() => handleDuplicate(s._id!)}><Copy className="w-3.5 h-3.5" /></button>
                      <button type="button" className="p-1.5 text-gray-400 hover:text-red-500" onClick={() => handleDelete(s._id!)}><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
