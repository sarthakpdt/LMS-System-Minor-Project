import { useState, useEffect, useRef } from 'react';
import {
  Upload, FileText, Trash2, Download, Loader2, AlertCircle,
  CheckCircle, Eye, Search, BookOpen, Video, Image as ImageIcon,
  File, FolderOpen, TrendingDown
} from 'lucide-react';

const API = 'http://localhost:5000/api';

interface Material {
  _id: string;
  title: string;
  description: string;
  subject: string;
  courseId?: string;
  courseName?: string;
  category: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  downloadCount: number;
  viewCount: number;
  createdAt: string;
  uploadedByName: string;
}

interface Course {
  _id: string;
  courseName: string;
  courseCode: string;
}

interface Props {
  teacherId?: string;
  teacherName?: string;
}

const CATEGORIES = [
  'Lecture Notes', 'Practice Sheet', 'Assignment', 'Video Lecture',
  'Reference Material', 'Lab Manual', 'Previous Year Paper', 'Visual Aids', 'Guidelines', 'Other'
];

const FILE_COLORS: Record<string, string> = {
  pdf: 'text-red-500 bg-red-50',
  doc: 'text-blue-500 bg-blue-50', docx: 'text-blue-500 bg-blue-50',
  ppt: 'text-orange-500 bg-orange-50', pptx: 'text-orange-500 bg-orange-50',
  jpg: 'text-green-500 bg-green-50', jpeg: 'text-green-500 bg-green-50', png: 'text-green-500 bg-green-50',
  mp4: 'text-purple-500 bg-purple-50',
};

const CATEGORY_COLORS: Record<string, string> = {
  'Lecture Notes': 'bg-blue-100 text-blue-700',
  'Practice Sheet': 'bg-green-100 text-green-700',
  'Assignment': 'bg-purple-100 text-purple-700',
  'Video Lecture': 'bg-pink-100 text-pink-700',
  'Reference Material': 'bg-orange-100 text-orange-700',
  'Lab Manual': 'bg-teal-100 text-teal-700',
  'Previous Year Paper': 'bg-yellow-100 text-yellow-700',
  'Visual Aids': 'bg-indigo-100 text-indigo-700',
  'Guidelines': 'bg-cyan-100 text-cyan-700',
  'Other': 'bg-gray-100 text-gray-600',
};

function formatBytes(bytes: number) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileTypeIcon({ type }: { type: string }) {
  const cls = `w-5 h-5 ${FILE_COLORS[type]?.split(' ')[0] || 'text-gray-500'}`;
  if (type === 'mp4') return <Video className={cls} />;
  if (['jpg', 'jpeg', 'png'].includes(type)) return <ImageIcon className={cls} />;
  if (type === 'pdf') return <FileText className={cls} />;
  return <File className={cls} />;
}

export default function StudyMaterials({ teacherId, teacherName }: Props) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [myCourses, setMyCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const fileRef = useRef<HTMLInputElement>(null);

  // Form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [category, setCategory] = useState('');
  const [file, setFile] = useState<File | null>(null);

  // ── Fetch teacher's assigned courses ─────────────────────────
  const fetchMyCourses = async () => {
    if (!teacherId) return;
    try {
      const res = await fetch(`http://localhost:5000/api/admin/courses`);
      const json = await res.json();
      const all: any[] = json.data || [];
      // Filter only courses where this teacher is assigned
      const mine = all.filter(
        (c: any) =>
          String(c.teacher?._id || c.teacher) === String(teacherId)
      );
      setMyCourses(mine);
    } catch {}
  };

  // ── Fetch materials uploaded by this teacher ──────────────────
  const fetchMaterials = async () => {
    if (!teacherId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/materials/my/${teacherId}`);
      const json = await res.json();
      if (json.success) setMaterials(json.materials || []);
      else setError('Failed to load materials.');
    } catch {
      setError('Network error. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyCourses();
    fetchMaterials();
  }, [teacherId]);

  const resetForm = () => {
    setTitle(''); setDescription(''); setSelectedCourse(''); setCategory(''); setFile(null);
    if (fileRef.current) fileRef.current.value = '';
    setShowForm(false); setError(''); setSuccess('');
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');

    if (!title.trim()) { setError('Please enter a title.'); return; }
    if (!selectedCourse) { setError('Please select a course.'); return; }
    if (!category) { setError('Please select a category.'); return; }
    if (!file) { setError('Please select a file to upload.'); return; }
    if (!teacherId) { setError('Session expired. Please log out and log in again.'); return; }

    setUploading(true);
    try {
      const course = myCourses.find(c => c._id === selectedCourse);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('subject', course?.courseName || '');
      formData.append('courseId', selectedCourse);
      formData.append('courseName', course?.courseName || '');
      formData.append('category', category);
      formData.append('uploadedBy', teacherId);
      formData.append('uploadedByName', teacherName || '');

      const res = await fetch(`${API}/materials/upload`, {
        method: 'POST',
        body: formData, // ← DO NOT set Content-Type header manually
      });

      const json = await res.json();
      if (json.success) {
        setSuccess('Material uploaded successfully!');
        resetForm();
        fetchMaterials();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(json.message || 'Upload failed. Please try again.');
      }
    } catch {
      setError('Network error. Make sure the backend is running at localhost:5000.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${API}/materials/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setMaterials(prev => prev.filter(m => m._id !== id));
        setSuccess('Material deleted.'); setTimeout(() => setSuccess(''), 2500);
      } else { setError(json.message || 'Delete failed.'); }
    } catch { setError('Network error during delete.'); }
  };

  // ── Derived stats ─────────────────────────────────────────────
  const pdfCount = materials.filter(m => m.fileType === 'pdf').length;
  const videoCount = materials.filter(m => m.fileType === 'mp4').length;
  const totalDownloads = materials.reduce((a, m) => a + (m.downloadCount || 0), 0);

  // ── Filter ────────────────────────────────────────────────────
  const filtered = materials.filter(m => {
    const matchSearch = !search ||
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.courseName?.toLowerCase().includes(search.toLowerCase()) ||
      m.subject?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'All Types' ||
      (typeFilter === 'PDF Documents' && m.fileType === 'pdf') ||
      (typeFilter === 'Video Lectures' && m.fileType === 'mp4') ||
      (typeFilter === 'Images' && ['jpg', 'jpeg', 'png'].includes(m.fileType)) ||
      (typeFilter === 'Documents' && ['doc', 'docx'].includes(m.fileType)) ||
      (typeFilter === 'Presentations' && ['ppt', 'pptx'].includes(m.fileType));
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Study Materials</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Centralized repository for lecture notes, study materials, and academic resources.
          </p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setError(''); setSuccess(''); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition shadow-sm"
        >
          <Upload className="w-4 h-4" />
          {showForm ? 'Cancel' : 'Upload Material'}
        </button>
      </div>

      {/* ── Alerts ── */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">✕</button>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">
          <CheckCircle className="w-4 h-4 flex-shrink-0" /> {success}
        </div>
      )}

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Materials', value: materials.length, icon: FolderOpen, bg: 'bg-blue-50', iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
          { label: 'PDF Documents', value: pdfCount, icon: FileText, bg: 'bg-red-50', iconBg: 'bg-red-100', iconColor: 'text-red-600' },
          { label: 'Video Lectures', value: videoCount, icon: Video, bg: 'bg-purple-50', iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
          { label: 'Total Downloads', value: totalDownloads, icon: TrendingDown, bg: 'bg-green-50', iconBg: 'bg-green-100', iconColor: 'text-green-600' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl p-5 border border-white`}>
            <div className={`w-10 h-10 ${s.iconBg} rounded-lg flex items-center justify-center mb-3`}>
              <s.icon className={`w-5 h-5 ${s.iconColor}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Upload Form ── */}
      {showForm && (
        <form onSubmit={handleUpload} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Upload className="w-4 h-4 text-blue-500" /> Upload New Material
          </h3>

          {myCourses.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-sm text-yellow-800">
              ⚠️ No courses assigned to you yet. Ask admin to assign courses before uploading materials.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Title *</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Chapter 3 – Data Structures"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Course * (your assigned courses)</label>
              <select
                value={selectedCourse}
                onChange={e => setSelectedCourse(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
              >
                <option value="">Select course…</option>
                {myCourses.map(c => (
                  <option key={c._id} value={c._id}>{c.courseName} ({c.courseCode})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Category *</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
              >
                <option value="">Select category…</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Brief description (optional)"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">File * (max 50MB — PDF, DOC, PPT, JPG, PNG, MP4)</label>
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-xl px-4 py-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors"
            >
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileTypeIcon type={file.name.split('.').pop()?.toLowerCase() || ''} />
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-800">{file.name}</p>
                    <p className="text-xs text-gray-400">{formatBytes(file.size)}</p>
                  </div>
                </div>
              ) : (
                <div className="text-gray-400">
                  <Upload className="w-7 h-7 mx-auto mb-2" />
                  <p className="text-sm font-medium">Click to browse or drag & drop</p>
                  <p className="text-xs mt-1">PDF, DOC, PPT, JPG, PNG, MP4</p>
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
              disabled={uploading || myCourses.length === 0}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg text-sm font-semibold transition"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploading ? 'Uploading…' : 'Upload Material'}
            </button>
            <button type="button" onClick={resetForm} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* ── Search & Filter ── */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search materials by title or course..."
            className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          {['All Types', 'PDF Documents', 'Video Lectures', 'Images', 'Documents', 'Presentations'].map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* ── Materials Grid (Image 1 style) ── */}
      {loading ? (
        <div className="flex items-center justify-center py-14 text-gray-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading materials…
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center text-gray-400">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-sm">{materials.length === 0 ? 'No materials uploaded yet' : 'No results for your search'}</p>
          <p className="text-xs mt-1">{materials.length === 0 ? 'Click "Upload Material" to add your first file.' : 'Try different search terms.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(m => (
            <div key={m._id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              {/* Card header */}
              <div className="flex items-start justify-between p-5 pb-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${FILE_COLORS[m.fileType] || 'text-gray-500 bg-gray-100'}`}>
                  <FileTypeIcon type={m.fileType} />
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${CATEGORY_COLORS[m.category] || 'bg-gray-100 text-gray-600'}`}>
                  {m.category || m.fileType?.toUpperCase()}
                </span>
              </div>

              {/* Card body */}
              <div className="px-5 pb-4">
                <h4 className="font-semibold text-gray-900 text-sm leading-tight mb-1 line-clamp-2">{m.title}</h4>
                <p className="text-xs text-gray-500 mb-3">{m.courseName || m.subject}</p>

                <div className="space-y-1 text-xs text-gray-500 mb-4">
                  <div className="flex justify-between">
                    <span>Uploaded by:</span>
                    <span className="font-medium text-gray-700">{m.uploadedByName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date:</span>
                    <span className="font-medium text-gray-700">{new Date(m.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Size:</span>
                    <span className="font-medium text-gray-700">{formatBytes(m.fileSize)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Downloads:</span>
                    <span className="font-medium text-gray-700">{m.downloadCount || 0}</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  <a
                    href={`${API}/materials/download/${m._id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition"
                  >
                    <Eye className="w-3.5 h-3.5" /> View
                  </a>
                  <a
                    href={`${API}/materials/download/${m._id}`}
                    download
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold transition"
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </a>
                  <button
                    onClick={() => handleDelete(m._id, m.title)}
                    className="p-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}