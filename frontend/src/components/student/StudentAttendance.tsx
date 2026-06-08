import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:5000/api';

const StudentAttendance: React.FC<{ studentId: string }> = ({ studentId }) => {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/attendance/student/${studentId}`)
      .then(r => r.json())
      .then(data => { if (data.success) setRecords(data.records); })
      .finally(() => setLoading(false));
  }, [studentId]);

  const total = records.length;
  const present = records.filter(r => r.status === 'present').length;
  const absent = records.filter(r => r.status === 'absent').length;
  const late = records.filter(r => r.status === 'late').length;
  const pct = total > 0 ? Math.round((present / total) * 100) : 0;

  const statusStyle: Record<string, React.CSSProperties> = {
    present: { background: '#d1fae5', color: '#065f46' },
    absent: { background: '#fee2e2', color: '#991b1b' },
    late: { background: '#fef3c7', color: '#92400e' }
  };

  return (
    <div style={{ padding: '24px' }}>
      <h2 style={{ fontWeight: 700, fontSize: '24px', marginBottom: '24px' }}>📋 My Attendance</h2>

      {loading ? <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>Loading...</div> : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            {[['Total Classes', total, '#ede9fe'], ['Present', present, '#d1fae5'], ['Absent', absent, '#fee2e2'], ['Attendance %', pct + '%', pct >= 75 ? '#d1fae5' : '#fee2e2']].map(([label, value, bg]) => (
              <div key={String(label)} style={{ background: String(bg), borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
                <div style={{ fontSize: '28px', fontWeight: 700 }}>{value}</div>
                <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>{label}</div>
              </div>
            ))}
          </div>

          {pct < 75 && (
            <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '10px', padding: '14px 20px', marginBottom: '20px', color: '#991b1b', fontWeight: 500 }}>
              ⚠️ Your attendance is below 75%. Please attend more classes to avoid academic penalties.
            </div>
          )}

          {records.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280', background: '#f9fafb', borderRadius: '12px' }}>No attendance records found</div>
          ) : (
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    <th style={{ padding: '12px 20px', textAlign: 'left', fontWeight: 600, fontSize: '13px', color: '#6b7280' }}>Date</th>
                    <th style={{ padding: '12px 20px', textAlign: 'left', fontWeight: 600, fontSize: '13px', color: '#6b7280' }}>Subject</th>
                    <th style={{ padding: '12px 20px', textAlign: 'left', fontWeight: 600, fontSize: '13px', color: '#6b7280' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, i) => (
                    <tr key={i} style={{ borderTop: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '12px 20px' }}>{r.date}</td>
                      <td style={{ padding: '12px 20px', fontWeight: 500 }}>{r.subject}</td>
                      <td style={{ padding: '12px 20px' }}>
                        <span style={{ ...statusStyle[r.status], padding: '3px 10px', borderRadius: '12px', fontWeight: 600, fontSize: '13px', textTransform: 'capitalize' }}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StudentAttendance;