import React, { useState, useEffect } from 'react';

interface Material {
  _id: string;
  title: string;
  description: string;
  subject: string;
  fileType: string;
  fileName: string;
  fileSize: number;
  uploadedByName: string;
  downloadCount: number;
  createdAt: string;
}

const API_BASE = 'http://localhost:5000/api';

const StudentMaterials: React.FC = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [filtered, setFiltered] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState('');

  const subjects = ['All', 'Mathematics', 'Physics', 'Chemistry', 'Computer Science', 'English', 'Other'];

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/materials`)
      .then(r => r.json())
      .then(data => { if (data.success) { setMaterials(data.materials); setFiltered(data.materials); } })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = materials;
    if (subjectFilter !== 'All') result = result.filter(m => m.subject === subjectFilter);
    if (search) result = result.filter(m => m.title.toLowerCase().includes(search.toLowerCase()) || m.description.toLowerCase().includes(search.toLowerCase()));
    setFiltered(result);
  }, [search, subjectFilter, materials]);

  const handlePreview = (material: Material) => {
    if (material.fileType === 'pdf') {
      setPreviewUrl(`${API_BASE}/materials/download/${material._id}`);
      setPreviewName(material.fileName);
    } else {
      window.open(`${API_BASE}/materials/download/${material._id}`, '_blank');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const fileIcon = (type: string) => {
    const icons: Record<string, string> = { pdf: '📄', doc: '📝', docx: '📝', ppt: '📊', pptx: '📊', jpg: '🖼️', jpeg: '🖼️', png: '🖼️', mp4: '🎬' };
    return icons[type] || '📁';
  };

  return (
    <div style={{ padding: '24px' }}>
      <h2 style={{ fontWeight: 700, fontSize: '24px', marginBottom: '24px' }}>📚 Study Materials</h2>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search materials..." style={{ flex: 1, minWidth: '200px', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 14px' }} />
        <select value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)} style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 14px' }}>
          {subjects.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280', background: '#f9fafb', borderRadius: '12px' }}>No materials found</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {filtered.map(m => (
            <div key={m._id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                <span style={{ fontSize: '32px' }}>{fileIcon(m.fileType)}</span>
                <div>
                  <h4 style={{ margin: 0, fontWeight: 600 }}>{m.title}</h4>
                  <span style={{ background: '#ede9fe', color: '#6d28d9', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>{m.subject}</span>
                </div>
              </div>
              {m.description && <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '10px' }}>{m.description}</p>}
              <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '12px' }}>
                <div>👨‍🏫 {m.uploadedByName}</div>
                <div>💾 {formatSize(m.fileSize)} • 📅 {new Date(m.createdAt).toLocaleDateString()}</div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => handlePreview(m)} style={{ flex: 1, background: '#ede9fe', color: '#6d28d9', border: 'none', borderRadius: '6px', padding: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>
                  {m.fileType === 'pdf' ? '👁️ Preview' : '📥 Open'}
                </button>
                <a href={`${API_BASE}/materials/download/${m._id}`} download style={{ flex: 1, background: '#d1fae5', color: '#065f46', borderRadius: '6px', padding: '8px', textAlign: 'center', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>
                  ⬇️ Download
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PDF Preview Modal */}
      {previewUrl && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '16px', width: '80vw', height: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>📄 {previewName}</h3>
              <button onClick={() => setPreviewUrl(null)} style={{ background: '#f3f4f6', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontWeight: 600 }}>✕ Close</button>
            </div>
            <iframe src={previewUrl} style={{ flex: 1, border: 'none' }} title="PDF Preview" />
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentMaterials;