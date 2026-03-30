import { useState, useEffect, useRef } from 'react';
import { Upload, FileText, Trash2, Download, Loader2, AlertCircle, CheckCircle, File } from 'lucide-react';

const API = 'http://localhost:5000/api';

interface Material {
  _id: string;
  title: string;
  description: string;
  subject: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  downloadCount: number;
  createdAt: string;
}

interface Props {
  teacherId?: string;
  teacherName?: string;
}

const SUBJECTS = [
  'Mathematics', 'Physics', 'Chemistry', 'Computer Science',
  'Data Structures', 'Algorithms', 'Database Systems', 'Operating Systems',
  'Computer Networks', 'Software Engineering', 'Web Development',
  'Machine Learning', 'Digital Electronics', 'Engineering Drawing', 'Other'
];

const FILE_ICON_COLOR: Record<string, string> = {
  pdf: 'text-red-500', doc: 'text-blue-500', docx: 'text-blue-500',
  ppt: 'text-orange-500', pptx: 'text-orange-500',
  jpg: 'text-green-500', jpeg: 'text-green-500', png: 'text-green-500',
  mp4: 'text-purple-500',
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function StudyMaterials({ teacherId, teacherName }: Props) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const fetchMaterials = async () => {
    if (!teacherId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/materials/my/${teacherId}`);
      const json = await res.json();
      if (json.success) setMaterials(json.materials || []);
      else setError('Failed to load materials.');
    } catch {
      setError('Network error loading materials.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMaterials(); }, [teacherId]);

  const resetForm = () => {
    setTitle(''); setDescription(''); setSubject(''); setFile(null);
    if (fileRef.current) fileRef.current.value = '';
    setShowForm(false); setError(''); setSuccess('');
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');

    if (!title.trim()) { setError('Please enter a title.'); return; }
    if (!subject) { setError('Please select a subject.'); return; }
    if (!file) { setError('Please select a file to upload.'); return; }
    if (!teacherId) { setError('Teacher ID missing. Please log out and log in again.'); return; }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('subject', subject);
      formData.append('uploadedBy', teacherId);
      formData.append('uploadedByName', teacherName || '');

      const res = await fetch(`${API}/materials/upload`, {
        method: 'POST',
        // DO NOT set Content-Type header — browser sets it automatically with boundary for FormData
        body: formData,
      });

      const json = await res.json();
      if (json.success) {
        setSuccess('Material uploaded successfully!');
        resetForm();
        fetchMaterials();
      } else {
        setError(json.message || 'Upload failed. Please try again.');
      }
    } catch (err) {
      setError('Network error. Check that the backend server is running.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, fileName: string) => {
    if (!confirm(`Delete "${fileName}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${API}/materials/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setMaterials(prev => prev.filter(m => m._id !== id));
        setSuccess('Material deleted.');
        setTimeout(() => setSuccess(''), 2500);
      } else {
        setError(json.message || 'Delete failed.');
      }
    } catch {
      setError('Network error during delete.');
    }
  };

  const handleDownload = async (id: string) => {
    window.open(`${API}/materials/download/${id}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Study Materials</h2>
          <p className="text-sm text-gray-500 mt-0.5">Upload and manage course materials for your students.</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setError(''); setSuccess(''); }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Upload className="w-4 h-4" />
          {showForm ? 'Cancel' : 'Upload Material'}
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">
          <CheckCircle className="w-4 h-4 flex-shrink-0" /> {success}
        </div>
      )}

      {/* Upload Form */}
      {showForm && (
        <form onSubmit={handleUpload} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <Upload className="w-4 h-4 text-emerald-500" /> Upload New Material
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Title *</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Chapter 3 – Data Structures"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Subject *</label>
              <select
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
              >
                <option value="">Select subject…</option>
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Optional description or notes about this material"
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">File * (max 50MB)</label>
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-lg px-4 py-6 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-colors"
            >
              {file ? (
                <div className="flex items-center justify-center gap-2 text-sm text-emerald-700">
                  <File className="w-5 h-5" />
                  <span className="font-medium">{file.name}</span>
                  <span className="text-gray-400">({formatBytes(file.size)})</span>
                </div>
              ) : (
                <div className="text-gray-400">
                  <Upload className="w-6 h-6 mx-auto mb-1" />
                  <p className="text-sm">Click to browse file</p>
                  <p className="text-xs mt-0.5">PDF, DOC, PPT, JPG, PNG, MP4</p>
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.mp4"
              onChange={e => setFile(e.target.files?.[0] || null)}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={uploading}
              className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploading ? 'Uploading…' : 'Upload'}
            </button>
            <button type="button" onClick={resetForm} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Materials List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-500" /> My Uploaded Materials
          </h3>
          <span className="text-xs text-gray-400">{materials.length} files</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-gray-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading…
          </div>
        ) : materials.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-medium">No materials uploaded yet</p>
            <p className="text-xs mt-1">Click "Upload Material" to add your first file.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {materials.map(m => (
              <div key={m._id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition group">
                <div className={`w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 ${FILE_ICON_COLOR[m.fileType] || 'text-gray-500'}`}>
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{m.title}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs text-gray-400">{m.subject}</span>
                    <span className="text-gray-300">·</span>
                    <span className="text-xs text-gray-400 uppercase">{m.fileType}</span>
                    <span className="text-gray-300">·</span>
                    <span className="text-xs text-gray-400">{formatBytes(m.fileSize)}</span>
                    {m.downloadCount > 0 && (
                      <>
                        <span className="text-gray-300">·</span>
                        <span className="text-xs text-blue-500">{m.downloadCount} downloads</span>
                      </>
                    )}
                  </div>
                  {m.description && <p className="text-xs text-gray-400 mt-0.5 truncate">{m.description}</p>}
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleDownload(m._id)}
                    title="Download"
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(m._id, m.fileName)}
                    title="Delete"
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-xs text-gray-300 flex-shrink-0 ml-2">
                  {new Date(m.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}