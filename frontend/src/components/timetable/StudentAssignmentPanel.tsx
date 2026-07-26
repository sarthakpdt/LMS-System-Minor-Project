import React, { useCallback, useEffect, useState } from 'react';
import { api } from './api';
import { TtConfig, TtSubject } from './types';
import { Users, Check, AlertCircle } from 'lucide-react';

interface StudentRow {
  _id: string;
  name: string;
  email: string;
  studentId: string;
  department: string;
  semester: string;
  section?: string | null;
  enrolledCourses?: { courseId: string; courseName: string }[];
}

interface Props {
  config: TtConfig | null;
  subjects: TtSubject[];
}

export default function StudentAssignmentPanel({ config, subjects }: Props) {
  const [branch, setBranch] = useState('');
  const [semester, setSemester] = useState(1);
  const [section, setSection] = useState('A');
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const branchSubjects = subjects.filter(
    (s) => s.branch === branch && s.semester === semester,
  );

  const sectionsForSemester = config?.branches
    .find((b) => b.code === branch)
    ?.semesters?.find((s) => s.semesterNumber === semester)?.sections || ['A'];

  const loadStudents = useCallback(async () => {
    if (!branch) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.getStudentsForAssignment({ branch, semester });
      setStudents(res.students);
      const init: Record<string, string[]> = {};
      res.students.forEach((s: StudentRow) => {
        init[s._id] = [];
      });
      setSelected(init);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load students.');
    } finally {
      setLoading(false);
    }
  }, [branch, semester]);

  useEffect(() => {
    if (!config?.branches.length) return;
    setBranch(config.branches[0].code);
    setSemester(config.branches[0].semesters?.[0]?.semesterNumber || 1);
  }, [config]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  useEffect(() => {
    if (sectionsForSemester.length && !sectionsForSemester.includes(section)) {
      setSection(sectionsForSemester[0]);
    }
  }, [sectionsForSemester, section]);

  const toggleSubject = (studentId: string, subjectId: string) => {
    setSelected((prev) => {
      const list = prev[studentId] || [];
      const has = list.includes(subjectId);
      return {
        ...prev,
        [studentId]: has ? list.filter((id) => id !== subjectId) : [...list, subjectId],
      };
    });
  };

  const handleAssign = async () => {
    const assignments = Object.entries(selected)
      .filter(([, subjectIds]) => subjectIds.length > 0)
      .map(([studentId, subjectIds]) => ({ studentId, subjectIds }));

    if (!assignments.length) {
      setError('Select at least one course for one student.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const res = await api.assignStudents({ branch, section, assignments });
      setSuccess(`Assigned section ${section} and courses for ${res.updated} student(s).`);
      loadStudents();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Assignment failed.');
    } finally {
      setSaving(false);
    }
  };

  if (!config) return null;

  return (
    <div className="space-y-6">
      <div className="bg-violet-50 border border-violet-100 rounded-xl p-4">
        <h4 className="font-bold text-violet-900 text-sm flex items-center gap-2">
          <Users className="w-4 h-4" /> Student Section & Course Assignment
        </h4>
        <p className="text-xs text-violet-700 mt-1">
          Group students by section, enroll them in chosen courses, and link faculty attendance sheets.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-xs">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 text-xs">
          <Check className="w-4 h-4" /> {success}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <select value={branch} onChange={(e) => setBranch(e.target.value)} className="border rounded-lg px-3 py-2 text-xs">
          {config.branches.map((b) => (
            <option key={b.code} value={b.code}>{b.name}</option>
          ))}
        </select>
        <select value={semester} onChange={(e) => setSemester(Number(e.target.value))} className="border rounded-lg px-3 py-2 text-xs">
          {config.branches.find((b) => b.code === branch)?.semesters?.map((s) => (
            <option key={s.semesterNumber} value={s.semesterNumber}>{s.label}</option>
          ))}
        </select>
        <select value={section} onChange={(e) => setSection(e.target.value)} className="border rounded-lg px-3 py-2 text-xs">
          {sectionsForSemester.map((s) => (
            <option key={s} value={s}>Section {s}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleAssign}
          disabled={saving}
          className="bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-semibold disabled:opacity-60"
        >
          {saving ? 'Saving...' : `Assign to Section ${section}`}
        </button>
      </div>

      {loading ? (
        <p className="text-xs text-gray-500 text-center py-8">Loading students...</p>
      ) : students.length === 0 ? (
        <p className="text-xs text-gray-500 text-center py-8">No approved students found for this branch/semester.</p>
      ) : (
        <div className="overflow-x-auto border border-gray-100 rounded-xl">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="text-left p-3">Student</th>
                <th className="text-left p-3">Current Section</th>
                <th className="text-left p-3">Enroll in Courses</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student._id} className="border-t border-gray-50">
                  <td className="p-3">
                    <p className="font-semibold text-gray-800">{student.name}</p>
                    <p className="text-gray-400">{student.studentId} · Sem {student.semester}</p>
                  </td>
                  <td className="p-3">{student.section || '—'}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      {branchSubjects.map((sub) => {
                        const checked = (selected[student._id] || []).includes(sub._id || '');
                        return (
                          <label
                            key={sub._id}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border cursor-pointer ${
                              checked ? 'bg-violet-100 border-violet-300 text-violet-800' : 'bg-white border-gray-200'
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={checked}
                              onChange={() => sub._id && toggleSubject(student._id, sub._id)}
                            />
                            {sub.code} ({sub.facultyName || 'No faculty'})
                          </label>
                        );
                      })}
                      {branchSubjects.length === 0 && (
                        <span className="text-gray-400">Add courses in Course Wizard first.</span>
                      )}
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
