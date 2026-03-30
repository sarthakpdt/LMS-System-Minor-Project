import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const API_BASE = 'http://localhost:5000/api';

const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'];

const Analytics: React.FC = () => {
  const [quizStats, setQuizStats] = useState<any[]>([]);
  const [studentPerf, setStudentPerf] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch quizzes
        const qRes = await fetch(`${API_BASE}/quiz`);
        const qData = await qRes.json();
        if (qData.success) {
          const quizzes = qData.quizzes || [];

          // Build bar chart data per subject
          const subjectMap: Record<string, { total: number; count: number }> = {};
          quizzes.forEach((q: any) => {
            const s = q.subject || 'General';
            if (!subjectMap[s]) subjectMap[s] = { total: 0, count: 0 };
            subjectMap[s].count += 1;
          });
          setQuizStats(Object.entries(subjectMap).map(([subject, v]) => ({
            subject,
            quizzes: v.count
          })));
        }

        // Fetch students
        const uRes = await fetch(`${API_BASE}/auth/users`);
        const uData = await uRes.json();
        if (uData.success) {
          const students = (uData.users || []).filter((u: any) => u.role === 'student');
          // Mock GPA distribution for demo if no real score data
          const gpaData = students.slice(0, 10).map((s: any, i: number) => ({
            name: s.name?.split(' ')[0] || `Student ${i + 1}`,
            gpa: (2.5 + Math.random() * 1.5).toFixed(2),
            quizScore: Math.floor(60 + Math.random() * 40)
          }));
          setStudentPerf(gpaData);
        }
      } catch (e) {
        console.error('Analytics fetch error:', e);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const pieData = [
    { name: 'Excellent (A)', value: 25 },
    { name: 'Good (B)', value: 35 },
    { name: 'Average (C)', value: 25 },
    { name: 'Below Avg (D)', value: 10 },
    { name: 'Failing (F)', value: 5 },
  ];

  if (loading) return <div style={{ padding: '48px', textAlign: 'center', color: '#6b7280' }}>Loading analytics...</div>;

  return (
    <div style={{ padding: '24px' }}>
      <h2 style={{ fontWeight: 700, fontSize: '24px', marginBottom: '24px' }}>📊 Performance Analytics</h2>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Total Students', value: studentPerf.length, icon: '👥', color: '#ede9fe' },
          { label: 'Avg GPA', value: (studentPerf.reduce((a, s) => a + parseFloat(s.gpa), 0) / (studentPerf.length || 1)).toFixed(2), icon: '🎓', color: '#d1fae5' },
          { label: 'Quizzes Created', value: quizStats.reduce((a, q) => a + q.quizzes, 0), icon: '📝', color: '#fef3c7' },
          { label: 'Pass Rate', value: '78%', icon: '✅', color: '#dbeafe' },
        ].map(stat => (
          <div key={stat.label} style={{ background: stat.color, borderRadius: '12px', padding: '20px' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>{stat.icon}</div>
            <div style={{ fontSize: '28px', fontWeight: 700 }}>{stat.value}</div>
            <div style={{ fontSize: '13px', color: '#6b7280' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Charts grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* Bar chart - Quizzes by subject */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontWeight: 600 }}>Quizzes by Subject</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={quizStats.length > 0 ? quizStats : [{ subject: 'Math', quizzes: 4 }, { subject: 'Physics', quizzes: 3 }, { subject: 'CS', quizzes: 5 }]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="subject" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="quizzes" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart - Grade distribution */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontWeight: 600 }}>Grade Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {pieData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Line chart - Student quiz scores */}
      {studentPerf.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontWeight: 600 }}>Student Quiz Performance</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={studentPerf}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="quizScore" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} name="Quiz Score" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* GPA Table */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb' }}>
          <h3 style={{ margin: 0, fontWeight: 600 }}>Student GPA Overview</h3>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              <th style={{ padding: '12px 24px', textAlign: 'left', fontWeight: 600, fontSize: '13px', color: '#6b7280' }}>Student</th>
              <th style={{ padding: '12px 24px', textAlign: 'left', fontWeight: 600, fontSize: '13px', color: '#6b7280' }}>GPA</th>
              <th style={{ padding: '12px 24px', textAlign: 'left', fontWeight: 600, fontSize: '13px', color: '#6b7280' }}>Quiz Score</th>
              <th style={{ padding: '12px 24px', textAlign: 'left', fontWeight: 600, fontSize: '13px', color: '#6b7280' }}>Grade</th>
            </tr>
          </thead>
          <tbody>
            {studentPerf.map((s, i) => {
              const gpa = parseFloat(s.gpa);
              const grade = gpa >= 3.7 ? 'A' : gpa >= 3.3 ? 'A-' : gpa >= 3.0 ? 'B+' : gpa >= 2.7 ? 'B' : gpa >= 2.3 ? 'B-' : 'C';
              const gradeColor = gpa >= 3.5 ? '#065f46' : gpa >= 2.7 ? '#1e40af' : '#92400e';
              const gradeBg = gpa >= 3.5 ? '#d1fae5' : gpa >= 2.7 ? '#dbeafe' : '#fef3c7';
              return (
                <tr key={i} style={{ borderTop: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '14px 24px', fontWeight: 500 }}>{s.name}</td>
                  <td style={{ padding: '14px 24px' }}>{s.gpa}</td>
                  <td style={{ padding: '14px 24px' }}>{s.quizScore}%</td>
                  <td style={{ padding: '14px 24px' }}>
                    <span style={{ background: gradeBg, color: gradeColor, padding: '2px 10px', borderRadius: '12px', fontWeight: 600, fontSize: '13px' }}>{grade}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Analytics;