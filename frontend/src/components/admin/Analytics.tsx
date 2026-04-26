import React, { useEffect, useMemo, useState } from 'react';

const API_BASE = 'http://localhost:5000/api';

type StudentRow = {
  _id: string;
  name: string;
  email: string;
  studentId?: string;
  department?: string;
  semester?: string;
  level?: string;
  gpa?: number;
  score: number;
  bucket: 'Weak' | 'Medium' | 'Advanced';
};

const scoreToBucket = (score: number): 'Weak' | 'Medium' | 'Advanced' => {
  if (score < 50) return 'Weak';
  if (score < 75) return 'Medium';
  return 'Advanced';
};

const normalizeLevel = (level?: string): 'Weak' | 'Medium' | 'Advanced' | null => {
  if (!level) return null;
  const v = level.toLowerCase();
  if (v === 'beginner') return 'Weak';
  if (v === 'intermediate' || v === 'medium') return 'Medium';
  if (v === 'advanced') return 'Advanced';
  return null;
};

const Analytics: React.FC = () => {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${API_BASE}/admin/students/approved`);
        const data = await res.json();
        if (!data?.success) throw new Error(data?.message || 'Failed to load students');

        const rows: StudentRow[] = (data.data || []).map((s: any) => {
          const gpa = Number(s.gpa || 0);
          const scoreFromGpa = Math.max(0, Math.min(100, Math.round((gpa / 4) * 100)));
          const scoreFromCourses = Array.isArray(s.courses) && s.courses.length > 0
            ? Math.round(
                s.courses.reduce((sum: number, c: any) => sum + Number(c.marks || 0), 0) / s.courses.length
              )
            : null;
          const score = scoreFromCourses ?? scoreFromGpa;
          const levelBucket = normalizeLevel(s.level);
          const bucket = levelBucket || scoreToBucket(score);

          return {
            _id: s._id,
            name: s.name || 'Student',
            email: s.email || '',
            studentId: s.studentId || '',
            department: s.department || '',
            semester: s.semester || '',
            level: s.level || '',
            gpa,
            score,
            bucket,
          };
        });

        setStudents(rows);
      } catch (e: any) {
        setError(e?.message || 'Could not load analytics');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const totals = useMemo(() => {
    const weak = students.filter(s => s.bucket === 'Weak');
    const medium = students.filter(s => s.bucket === 'Medium');
    const advanced = students.filter(s => s.bucket === 'Advanced');
    const sortedAll = [...students].sort((a, b) => b.score - a.score);
    return {
      weak,
      medium,
      advanced,
      sortedAll,
      avgScore: students.length ? Math.round(students.reduce((sum, s) => sum + s.score, 0) / students.length) : 0,
    };
  }, [students]);

  const topN = (arr: StudentRow[], n = 5) => [...arr].sort((a, b) => b.score - a.score).slice(0, n);

  if (loading) return <div style={{ padding: '48px', textAlign: 'center', color: '#6b7280' }}>Loading analytics...</div>;
  if (error) return <div style={{ padding: '24px', color: '#b91c1c' }}>{error}</div>;

  const topWeak = topN(totals.weak, 5);
  const topMedium = topN(totals.medium, 5);
  const topAdvanced = topN(totals.advanced, 5);
  const topOverall = topN(totals.sortedAll, 10);

  const ListCard = ({ title, subtitle, rows, color }: { title: string; subtitle: string; rows: StudentRow[]; color: string }) => (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '16px 18px', borderBottom: '1px solid #f3f4f6', background: color }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{title}</h3>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: '#4b5563' }}>{subtitle}</p>
      </div>
      {rows.length === 0 ? (
        <div style={{ padding: 16, fontSize: 13, color: '#6b7280' }}>No students in this bucket.</div>
      ) : (
        <div style={{ padding: 12, display: 'grid', gap: 8 }}>
          {rows.map((s, i) => (
            <div key={s._id} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 12px', display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{i + 1}. {s.name}</div>
                <div style={{ fontSize: 11, color: '#6b7280' }}>{s.studentId || s.email}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{s.score}%</div>
                <div style={{ fontSize: 11, color: '#6b7280' }}>GPA {Number(s.gpa || 0).toFixed(2)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontWeight: 700, fontSize: 24, marginBottom: 20 }}>📊 Student Bucket Analytics</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        <div style={{ background: '#eff6ff', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{students.length}</div>
          <div style={{ fontSize: 12, color: '#4b5563' }}>Total Approved Students</div>
        </div>
        <div style={{ background: '#fef2f2', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{totals.weak.length}</div>
          <div style={{ fontSize: 12, color: '#4b5563' }}>Weak Bucket</div>
        </div>
        <div style={{ background: '#fffbeb', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{totals.medium.length}</div>
          <div style={{ fontSize: 12, color: '#4b5563' }}>Medium Bucket</div>
        </div>
        <div style={{ background: '#ecfdf5', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{totals.advanced.length}</div>
          <div style={{ fontSize: 12, color: '#4b5563' }}>Advanced Bucket</div>
        </div>
      </div>

      <div style={{ marginBottom: 20, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Overall Class Snapshot</div>
        <div style={{ fontSize: 13, color: '#4b5563' }}>
          Average score: <strong>{totals.avgScore}%</strong> | Weak: <strong>{totals.weak.length}</strong> | Medium: <strong>{totals.medium.length}</strong> | Advanced: <strong>{totals.advanced.length}</strong>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
        <ListCard title="Top Weak Students" subtitle="Highest performers within Weak bucket" rows={topWeak} color="#fef2f2" />
        <ListCard title="Top Medium Students" subtitle="Highest performers within Medium bucket" rows={topMedium} color="#fffbeb" />
        <ListCard title="Top Advanced Students" subtitle="Top performers in Advanced bucket" rows={topAdvanced} color="#ecfdf5" />
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '16px 18px', borderBottom: '1px solid #f3f4f6' }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>🏆 Top Students Overall</h3>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#4b5563' }}>Across all three buckets</p>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, color: '#6b7280' }}>Rank</th>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, color: '#6b7280' }}>Student</th>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, color: '#6b7280' }}>ID</th>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, color: '#6b7280' }}>Bucket</th>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, color: '#6b7280' }}>Score</th>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, color: '#6b7280' }}>GPA</th>
            </tr>
          </thead>
          <tbody>
            {topOverall.map((s, i) => (
              <tr key={s._id} style={{ borderTop: '1px solid #f3f4f6' }}>
                <td style={{ padding: '10px 14px', fontWeight: 700 }}>{i + 1}</td>
                <td style={{ padding: '10px 14px' }}>{s.name}</td>
                <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: 12 }}>{s.studentId || '-'}</td>
                <td style={{ padding: '10px 14px' }}>{s.bucket}</td>
                <td style={{ padding: '10px 14px' }}>{s.score}%</td>
                <td style={{ padding: '10px 14px' }}>{Number(s.gpa || 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Analytics;