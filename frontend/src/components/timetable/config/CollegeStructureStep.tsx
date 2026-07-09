import React, { useState } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, Save, Building2, GraduationCap } from 'lucide-react';
import { manageApi } from '../manageApi';
import { TtAcademicYear, TtBranch, TtDepartment, TtSection, TtSemester, UnifiedTtConfig } from '../types';
import { buildSectionLabels } from '../sectionUtils';
import { StepHeader, FieldLabel, inputClass, btnPrimary, btnSecondary, idOf } from './shared';

interface Props {
  academicYearId: string;
  unified: UnifiedTtConfig | null;
  departments: TtDepartment[];
  onRefresh: () => Promise<void>;
  onDirty: () => void;
}

const YEAR_LABELS = ['First Year', 'Second Year', 'Third Year', 'Fourth Year', 'Fifth Year'];

export default function CollegeStructureStep({
  academicYearId,
  unified,
  departments,
  onRefresh,
  onDirty,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [ayForm, setAyForm] = useState({ label: '', startDate: '', endDate: '' });
  const [branchForm, setBranchForm] = useState({
    code: '',
    name: '',
    departmentId: '',
    yearsCount: 4,
    sectionsPerSemester: 2,
    defaultStudentCount: 60,
  });
  const [deptForm, setDeptForm] = useState({ code: '', name: '' });

  const branches = unified?.branches || [];
  const semesters = unified?.semesters || [];
  const sections = unified?.sections || [];
  const academicYear = unified?.academicYear;

  const handleCreateAcademicYear = async () => {
    if (!ayForm.label.trim() || !ayForm.startDate || !ayForm.endDate) {
      toast.error('Academic year label and dates are required.');
      return;
    }
    setSaving(true);
    try {
      await manageApi.createAcademicYear({
        label: ayForm.label.trim(),
        startDate: ayForm.startDate,
        endDate: ayForm.endDate,
        isCurrent: true,
      });
      toast.success('Academic year created.');
      setAyForm({ label: '', startDate: '', endDate: '' });
      await onRefresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create academic year.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateDepartment = async () => {
    if (!deptForm.code.trim() || !deptForm.name.trim()) {
      toast.error('Department code and name are required.');
      return;
    }
    setSaving(true);
    try {
      await manageApi.createDepartment({
        code: deptForm.code.toUpperCase(),
        name: deptForm.name.trim(),
      });
      toast.success('Department created.');
      setDeptForm({ code: '', name: '' });
      await onRefresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create department.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddBranch = async () => {
    if (!academicYearId) {
      toast.error('Select or create an academic year first.');
      return;
    }
    if (!branchForm.code.trim() || !branchForm.name.trim()) {
      toast.error('Branch code and name are required.');
      return;
    }
    if (!branchForm.departmentId) {
      toast.error('Select a department for this branch.');
      return;
    }
    if (departments.some((d) => branches.some((b) => b.code === branchForm.code.toUpperCase() && idOf(b.academicYearId) === academicYearId))) {
      toast.error('This branch code already exists for the selected academic year.');
      return;
    }

    setSaving(true);
    try {
      const { data: branch } = await manageApi.createBranch({
        code: branchForm.code.toUpperCase(),
        name: branchForm.name.trim(),
        academicYearId,
        departmentId: branchForm.departmentId,
      });

      const sectionLabels = buildSectionLabels(branchForm.sectionsPerSemester);
      for (let y = 1; y <= branchForm.yearsCount; y++) {
        for (let semOffset = 0; semOffset < 2; semOffset++) {
          const semesterNumber = (y - 1) * 2 + semOffset + 1;
          const { data: semester } = await manageApi.createSemester({
            semesterNumber,
            branchId: branch._id!,
            academicYearId,
          });
          for (const label of sectionLabels) {
            await manageApi.createSection({
              label,
              semesterId: semester._id!,
              branchId: branch._id!,
              studentCount: branchForm.defaultStudentCount,
            });
          }
        }
      }

      toast.success(`Branch ${branch.code} with semesters and sections created.`);
      setBranchForm({
        code: '',
        name: '',
        departmentId: branchForm.departmentId,
        yearsCount: 4,
        sectionsPerSemester: 2,
        defaultStudentCount: 60,
      });
      onDirty();
      await onRefresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to add branch.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBranch = async (branch: TtBranch) => {
    if (!window.confirm(`Delete branch ${branch.code}? Semesters and sections will remain in database but branch will be deactivated.`)) return;
    setSaving(true);
    try {
      await manageApi.deleteBranch(branch._id!);
      toast.success('Branch deleted.');
      onDirty();
      await onRefresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete branch.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSectionCount = async (section: TtSection, studentCount: number) => {
    if (studentCount < 0) return;
    try {
      await manageApi.updateSection(section._id!, { studentCount });
      onDirty();
      await onRefresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update section.');
    }
  };

  const handleSaveStructure = async () => {
    if (!academicYearId) return;
    setSaving(true);
    try {
      await manageApi.syncLegacyConfig(academicYearId);
      toast.success('College structure saved and synced.');
      onDirty();
      await onRefresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Save failed. Complete constraints (working days, slots, lunch) first.');
    } finally {
      setSaving(false);
    }
  };

  const branchSemesters = (branchId: string) =>
    semesters.filter((s) => idOf(s.branchId) === branchId).sort((a, b) => a.semesterNumber - b.semesterNumber);

  const semesterSections = (semesterId: string) =>
    sections.filter((s) => idOf(s.semesterId) === semesterId).sort((a, b) => a.label.localeCompare(b.label));

  return (
    <div className="space-y-6">
      <StepHeader
        title="Step 1 — College Structure"
        description="Configure academic year, branches, semesters, sections, and student counts per section."
      />

      {!academicYear && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-4">
          <h4 className="text-sm font-bold text-amber-900 flex items-center gap-2">
            <Building2 className="w-4 h-4" /> Create Academic Year
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <FieldLabel>Label</FieldLabel>
              <input className={inputClass()} placeholder="2026-27" value={ayForm.label} onChange={(e) => setAyForm({ ...ayForm, label: e.target.value })} />
            </div>
            <div>
              <FieldLabel>Start Date</FieldLabel>
              <input type="date" className={inputClass()} value={ayForm.startDate} onChange={(e) => setAyForm({ ...ayForm, startDate: e.target.value })} />
            </div>
            <div>
              <FieldLabel>End Date</FieldLabel>
              <input type="date" className={inputClass()} value={ayForm.endDate} onChange={(e) => setAyForm({ ...ayForm, endDate: e.target.value })} />
            </div>
          </div>
          <button type="button" className={btnPrimary(saving)} disabled={saving} onClick={handleCreateAcademicYear}>
            <Plus className="w-4 h-4" /> Create Academic Year
          </button>
        </div>
      )}

      {academicYear && (
        <div className="bg-purple-50 border border-purple-100 rounded-xl px-4 py-3 text-xs text-purple-800">
          Active year: <strong>{academicYear.label}</strong> ({new Date(academicYear.startDate).toLocaleDateString()} – {new Date(academicYear.endDate).toLocaleDateString()})
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 space-y-3">
            <h4 className="text-sm font-bold text-gray-800">Add Department</h4>
            <div>
              <FieldLabel>Code</FieldLabel>
              <input className={inputClass()} placeholder="CS" value={deptForm.code} onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })} />
            </div>
            <div>
              <FieldLabel>Name</FieldLabel>
              <input className={inputClass()} placeholder="Computer Science" value={deptForm.name} onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })} />
            </div>
            <button type="button" className={btnSecondary()} disabled={saving} onClick={handleCreateDepartment}>Add Department</button>
          </div>

          <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 space-y-3">
            <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-purple-600" /> Add Branch
            </h4>
            <div>
              <FieldLabel>Branch Code</FieldLabel>
              <input className={inputClass()} placeholder="BTECH" value={branchForm.code} onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value })} />
            </div>
            <div>
              <FieldLabel>Branch Name</FieldLabel>
              <input className={inputClass()} placeholder="Bachelor of Technology" value={branchForm.name} onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })} />
            </div>
            <div>
              <FieldLabel>Department</FieldLabel>
              <select className={inputClass()} value={branchForm.departmentId} onChange={(e) => setBranchForm({ ...branchForm, departmentId: e.target.value })}>
                <option value="">Select department</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>{d.code} — {d.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <FieldLabel>Years</FieldLabel>
                <select className={inputClass()} value={branchForm.yearsCount} onChange={(e) => setBranchForm({ ...branchForm, yearsCount: Number(e.target.value) })}>
                  {[1, 2, 3, 4, 5].map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <FieldLabel>Sections / Sem</FieldLabel>
                <input type="number" min={1} max={26} className={inputClass()} value={branchForm.sectionsPerSemester} onChange={(e) => setBranchForm({ ...branchForm, sectionsPerSemester: Number(e.target.value) })} />
              </div>
            </div>
            <div>
              <FieldLabel>Default Students / Section</FieldLabel>
              <input type="number" min={1} className={inputClass()} value={branchForm.defaultStudentCount} onChange={(e) => setBranchForm({ ...branchForm, defaultStudentCount: Number(e.target.value) })} />
            </div>
            <button type="button" className={btnPrimary(saving)} disabled={saving || !academicYearId} onClick={handleAddBranch}>
              <Plus className="w-4 h-4" /> Add Branch
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <h4 className="text-sm font-bold text-gray-800">Configured Branches</h4>
          {branches.length === 0 ? (
            <p className="text-xs text-gray-400 py-8 text-center border border-dashed border-gray-200 rounded-xl">No branches yet. Add BTech, BBA, or BDes using the form.</p>
          ) : (
            branches.map((branch) => (
              <div key={branch._id} className="border border-gray-100 rounded-xl p-4 bg-white shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">{branch.code}</span>
                    <h5 className="font-bold text-sm text-gray-900 mt-1">{branch.name}</h5>
                  </div>
                  <button type="button" onClick={() => handleDeleteBranch(branch)} className="text-gray-400 hover:text-red-500 p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {Array.from(new Set(branchSemesters(branch._id!).map((s) => s.year))).sort().map((yearNum) => (
                  <div key={yearNum} className="mb-3 last:mb-0">
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">{YEAR_LABELS[yearNum - 1] || `Year ${yearNum}`}</p>
                    <div className="space-y-2">
                      {branchSemesters(branch._id!).filter((s) => s.year === yearNum).map((sem) => (
                        <div key={sem._id} className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs font-semibold text-gray-700 mb-2">Semester {sem.semesterNumber}</p>
                          <div className="flex flex-wrap gap-2">
                            {semesterSections(sem._id!).map((sec) => (
                              <div key={sec._id} className="flex items-center gap-2 bg-white border border-gray-100 rounded-lg px-2 py-1">
                                <span className="text-xs font-bold text-purple-600">Sec {sec.label}</span>
                                <input
                                  type="number"
                                  min={0}
                                  className="w-16 border border-gray-200 rounded px-1 py-0.5 text-xs text-center"
                                  value={sec.studentCount}
                                  onChange={(e) => handleUpdateSectionCount(sec, Number(e.target.value))}
                                  title="Students in section"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex justify-end pt-2 border-t border-gray-100">
        <button type="button" className={btnPrimary(saving)} disabled={saving || !academicYearId} onClick={handleSaveStructure}>
          <Save className="w-4 h-4" /> Save College Structure
        </button>
      </div>
    </div>
  );
}
