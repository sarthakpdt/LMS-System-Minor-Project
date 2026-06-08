import { useState, useEffect, useRef } from 'react';
import {
  Search, FileText, Download, Eye, Upload, Link,
  FolderOpen, Trash2, Loader2, BookOpen, File, Video,
  ChevronDown, ChevronRight, BookMarked
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const API = 'http://localhost:5000/api';

interface Material {
  _id: string;
  title: string;
  description: string;
  subject: string;
  courseName: string;
  courseId: string;
  category: string;
  materialType: 'file' | 'link';
  fileType: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  uploadedByName: string;
  downloadCount: number;
  createdAt: string;
}

interface Course {
  _id?: string;
  courseId?: string;
  courseName: string;
  courseCode: string;
  semester?: string;
}

const CATEGORIES = [
  'Lecture Notes', 'Practice Sheet', 'Assignment', 'Reference Material',
  'Lab Manual', 'Previous Year Paper', 'Visual Aids', 'Guidelines', 'Other'
];

const FILE_TYPE_LABELS: Record<string, string> = {
  pdf: 'PDF', doc: 'Word', docx: 'Word',
  ppt: 'PPT', pptx: 'PPT',
  jpg: 'Image', jpeg: 'Image', png: 'Image',
  link: 'Link',
};

const FILE_TYPE_COLORS: Record<string, string> = {
  pdf:  'bg-red-100 text-red-700',
  doc:  'bg-blue-100 text-blue-700',
  docx: 'bg-blue-100 text-blue-700',
  ppt:  'bg-orange-100 text-orange-700',
  pptx: 'bg-orange-100 text-orange-700',
  jpg:  'bg-green-100 text-green-700',
  jpeg: 'bg-green-100 text-green-700',
  png:  'bg-green-100 text-green-700',
  link: 'bg-purple-100 text-purple-700',
};

const FILE_TYPE_TABS = ['All', 'PDF', 'Word', 'PPT', 'Image', 'Link'];

function formatBytes(b: number) {
  if (!b) return '—';
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB';
  return (b / (1024 * 1024)).toFixed(1) + ' MB';
}

function FileIcon({ type }: { type: string }) {
  const cls = 'w-5 h-5';
  if (type === 'link') return <Link className={`${cls} text-purple-500`} />;
  if (type === 'pdf')  return <FileText className={`${cls} text-red-500`} />;
  if (['jpg', 'jpeg', 'png'].includes(type)) return <Video className={`${cls} text-green-500`} />;
  if (['ppt', 'pptx'].includes(type)) return <File className={`${cls} text-orange-500`} />;
  return <File className={`${cls} text-blue-500`} />;
}

function getYouTubeId(url: string) {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  return m ? m[1] : null;
}

function matchesTypeFilter(fileType: string, filter: string) {
  if (filter === 'All')   return true;
  if (filter === 'PDF')   return fileType === 'pdf';
  if (filter === 'Word')  return ['doc', 'docx'].includes(fileType);
  if (filter === 'PPT')   return ['ppt', 'pptx'].includes(fileType);
  if (filter === 'Image') return ['jpg', 'jpeg', 'png'].includes(fileType);
  if (filter === 'Link')  return fileType === 'link';
  return true;
}

// ── Material Card ──────────────────────────────────────────────────────────
function MaterialCard({
  m,
  isTeacher,
  isAdmin,
  onDelete,
  onDownload,
  onPreview,
}: {
  m: Material;
  isTeacher: boolean;
  isAdmin: boolean;
  onDelete: (id: string, name: string) => void;
  onDownload: (m: Material) => void;
  onPreview: (url: string, name: string) => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col">
      <div className="flex items-start justify-between p-4 pb-2">
        <div className="w-10 h-10 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center flex-shrink-0">
          <FileIcon type={m.fileType} />
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ml-2 ${FILE_TYPE_COLORS[m.fileType] || 'bg-gray-100 text-gray-600'}`}>
          {FILE_TYPE_LABELS[m.fileType] || m.fileType?.toUpperCase()}
        </span>
      </div>

      <div className="px-4 pb-4 flex-1 flex flex-col">
        <h4 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 min-h-[2.5rem] mb-1">
          {m.title}
        </h4>
        <p className="text-xs text-indigo-600 font-medium truncate mb-1">
          {m.category || '—'}
        </p>
        {m.description ? (
          <p className="text-xs text-gray-400 line-clamp-2 mb-3">{m.description}</p>
        ) : (
          <div className="mb-3" />
        )}

        <div className="mt-auto space-y-1.5 mb-3 pt-2 border-t border-gray-50">
          {[
            { label: 'By',   value: m.uploadedByName || '—' },
            { label: 'Date', value: new Date(m.createdAt).toLocaleDateString('en-IN') },
            ...(m.fileType !== 'link' ? [{ label: 'Size', value: formatBytes(m.fileSize) }] : []),
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between gap-2">
              <span className="text-xs text-gray-400 flex-shrink-0">{label}</span>
              <span className="text-xs font-medium text-gray-700 truncate text-right max-w-[60%]">{value}</span>
            </div>
          ))}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-gray-400 flex-shrink-0">Downloads</span>
            <span className="text-xs font-semibold text-blue-600">{m.downloadCount || 0}</span>
          </div>
        </div>

        <div className="flex gap-2">
          {m.fileType === 'link' ? (
            <a href={m.filePath} target="_blank" rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold transition">
              <Eye className="w-3.5 h-3.5" /> Open Link
            </a>
          ) : m.fileType === 'pdf' ? (
            <>
              <button
                onClick={() => onPreview(`${API}/materials/download/${m._id}`, m.title || m.fileName)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition">
                <Eye className="w-3.5 h-3.5" /> Preview
              </button>
              <button
                onClick={() => onDownload(m)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold transition">
                <Download className="w-3.5 h-3.5" /> Download
              </button>
            </>
          ) : (
            <button
              onClick={() => onDownload(m)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition">
              <Download className="w-3.5 h-3.5" /> Download
            </button>
          )}
          {(isTeacher || isAdmin) && (
            <button onClick={() => onDelete(m._id, m.title)}
              className="p-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition flex-shrink-0"
              title="Delete">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Subject Section (student view) ────────────────────────────────────────
function SubjectSection({
  courseName,
  materials,
  isTeacher,
  isAdmin,
  onDelete,
  onDownload,
  onPreview,
}: {
  courseName: string;
  materials: Material[];
  isTeacher: boolean;
  isAdmin: boolean;
  onDelete: (id: string, name: string) => void;
  onDownload: (m: Material) => void;
  onPreview: (url: string, name: string) => void;
}) {
  const [open, setOpen]           = useState(true);
  const [typeFilter, setTypeFilter] = useState('All');

  const filtered = materials.filter(m => matchesTypeFilter(m.fileType, typeFilter));

  // Count by type for badges
  const counts: Record<string, number> = {};
  FILE_TYPE_TABS.slice(1).forEach(t => {
    const c = materials.filter(m => matchesTypeFilter(m.fileType, t)).length;
    if (c > 0) counts[t] = c;
  });

  return (
    <div className="mb-6 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Subject Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 bg-gradient-to-r from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100 transition"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <BookMarked className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <p className="font-bold text-gray-900 text-sm">{courseName}</p>
            <p className="text-xs text-gray-500">{materials.length} material{materials.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Type badge counts */}
          {Object.entries(counts).map(([t, c]) => (
            <span key={t} className={`text-xs font-semibold px-2 py-0.5 rounded-full ${FILE_TYPE_COLORS[
              t === 'PDF' ? 'pdf' : t === 'Word' ? 'doc' : t === 'PPT' ? 'ppt' : t === 'Image' ? 'jpg' : 'link'
            ] || 'bg-gray-100 text-gray-600'}`}>
              {c} {t}
            </span>
          ))}
          {open ? <ChevronDown className="w-4 h-4 text-gray-400 ml-1" /> : <ChevronRight className="w-4 h-4 text-gray-400 ml-1" />}
        </div>
      </button>

      {open && (
        <div className="p-4">
          {/* Type filter tabs */}
          <div className="flex gap-2 flex-wrap mb-4">
            {FILE_TYPE_TABS.map(t => (
              <button key={t} onClick={() => setTypeFilter(t)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition border ${
                  typeFilter === t
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}>
                {t}
                {t !== 'All' && counts[t] ? ` (${counts[t]})` : ''}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-6">No {typeFilter !== 'All' ? typeFilter : ''} materials yet</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map(m => (
                <MaterialCard key={m._id} m={m}
                  isTeacher={isTeacher} isAdmin={isAdmin}
                  onDelete={onDelete} onDownload={onDownload} onPreview={onPreview} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export function StudyMaterials() {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';
  const isAdmin   = user?.role === 'admin';
  const isStudent = user?.role === 'student';

  const [materials, setMaterials]     = useState<Material[]>([]);
  const [courses,   setCourses]       = useState<Course[]>([]);
  const [loading,   setLoading]       = useState(true);
  const [search,    setSearch]        = useState('');
  const [typeFilter, setTypeFilter]   = useState('All');
  const [showForm,  setShowForm]      = useState(false);
  const [tab,       setTab]           = useState<'file' | 'link'>('file');
  const [uploading, setUploading]     = useState(false);
  const [error,     setError]         = useState('');
  const [success,   setSuccess]       = useState('');
  const [previewUrl,  setPreviewUrl]  = useState<string | null>(null);
  const [previewName, setPreviewName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // Form state
  const [title,       setTitle]       = useState('');
  const [description, setDesc]        = useState('');
  const [courseId,    setCourseId]    = useState('');
  const [category,    setCategory]    = useState('');
  const [fileTypeExp, setFileTypeExp] = useState('pdf');
  const [file,        setFile]        = useState<File | null>(null);
  const [linkUrl,     setLinkUrl]     = useState('');

  useEffect(() => {
    loadMaterials();
    loadCourses();
  }, [user]);

  // ── Load materials ──────────────────────────────────────────
  const loadMaterials = async () => {
    setLoading(true);
    try {
      // Students: pass studentId to get only their enrolled course materials
      const url = isStudent && user?.id
        ? `${API}/materials?studentId=${user.id}`
        : `${API}/materials`;

      const res  = await fetch(url);
      const data = await res.json();
      if (data.success) setMaterials(data.materials);
      else setError('Failed to load materials.');
    } catch {
      setError('Failed to load materials. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  // ── Load courses for upload form ────────────────────────────
  // Teachers: only their assigned courses
  // Admin: all courses
  const loadCourses = async () => {
    try {
      if (isTeacher && user?.id) {
        const res  = await fetch(`${API}/materials/teacher-courses/${user.id}`);
        const data = await res.json();
        if (data.success && data.courses?.length > 0) {
          // teacher-courses returns assignedCourses array: {courseId, courseCode, courseName, semester}
          // normalize to {_id, courseCode, courseName} for the form
          setCourses(
            data.courses.map((c: any) => ({
              _id: c.courseId,
              courseCode: c.courseCode,
              courseName: c.courseName,
              semester: c.semester,
            }))
          );
          return;
        }
      }

      // Admin fallback: all courses
      const res  = await fetch(`${API}/admin/courses`);
      const data = await res.json();
      const list = data.data || data.courses || [];
      if (Array.isArray(list) && list.length > 0) {
        setCourses(list);
      } else {
        const res2  = await fetch(`${API}/courses`);
        const data2 = await res2.json();
        setCourses(Array.isArray(data2) ? data2 : data2.courses || []);
      }
    } catch {}
  };

  const resetForm = () => {
    setTitle(''); setDesc(''); setCourseId(''); setCategory('');
    setFileTypeExp('pdf'); setFile(null); setLinkUrl('');
    setError(''); setShowForm(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  // ── Upload file ─────────────────────────────────────────────
  const handleUpload = async () => {
    setError('');
    if (!title.trim()) return setError('Title is required');
    if (!courseId)      return setError('Select a course');
    if (!category)      return setError('Select a category');
    if (!file)          return setError('Select a file');

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const allowed: Record<string, string[]> = {
      pdf: ['pdf'], doc: ['doc', 'docx'],
      ppt: ['ppt', 'pptx'], image: ['jpg', 'jpeg', 'png']
    };
    if (!allowed[fileTypeExp]?.includes(ext)) {
      return setError(`Wrong file type! Expected .${fileTypeExp} but got .${ext}`);
    }

    setUploading(true);
    try {
      const course = courses.find(c => (c._id || c.courseId) === courseId);
      const fd = new FormData();
      fd.append('file', file);
      fd.append('title', title.trim());
      fd.append('description', description.trim());
      fd.append('subject', course?.courseName || '');
      fd.append('courseId', courseId);
      fd.append('courseName', `${course?.courseName} (${course?.courseCode})`);
      fd.append('category', category);
      fd.append('uploadedBy', user?.id || '');
      fd.append('uploadedByName', user?.name || '');

      const res  = await fetch(`${API}/materials/upload`, { method: 'POST', body: fd });
      const data = await res.json();
      if (!data.success) return setError(data.message || 'Upload failed');

      setSuccess('Material uploaded! Students can now see it.');
      resetForm();
      loadMaterials();
      setTimeout(() => setSuccess(''), 4000);
    } catch {
      setError('Server error. Is backend running?');
    } finally {
      setUploading(false);
    }
  };

  // ── Add link ────────────────────────────────────────────────
  const handleLink = async () => {
    setError('');
    if (!title.trim())   return setError('Title is required');
    if (!courseId)        return setError('Select a course');
    if (!category)        return setError('Select a category');
    if (!linkUrl.trim())  return setError('Enter a URL');

    setUploading(true);
    try {
      const course = courses.find(c => (c._id || c.courseId) === courseId);
      const res = await fetch(`${API}/materials/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          subject: course?.courseName || '',
          courseId,
          courseName: `${course?.courseName} (${course?.courseCode})`,
          category,
          uploadedBy: user?.id,
          uploadedByName: user?.name,
          youtubeUrl: linkUrl.trim(),
        })
      });
      const data = await res.json();
      if (!data.success) return setError(data.message || 'Failed to add link');

      setSuccess('Reference link added!');
      resetForm();
      loadMaterials();
      setTimeout(() => setSuccess(''), 4000);
    } catch {
      setError('Server error.');
    } finally {
      setUploading(false);
    }
  };

  // ── Delete ──────────────────────────────────────────────────
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      const res  = await fetch(`${API}/materials/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setMaterials(m => m.filter(x => x._id !== id));
        setSuccess('Deleted.'); setTimeout(() => setSuccess(''), 2000);
      } else {
        setError(data.message || 'Delete failed.');
      }
    } catch { setError('Delete failed.'); }
  };

  // ── Download ────────────────────────────────────────────────
  const handleDownload = (m: Material) => {
    setMaterials(prev =>
      prev.map(x => x._id === m._id ? { ...x, downloadCount: (x.downloadCount || 0) + 1 } : x)
    );
    window.open(`${API}/materials/download/${m._id}`, '_blank');
  };

  // ── Filtered materials (teacher/admin flat view) ─────────────
  const filtered = materials.filter(m => {
    const matchSearch =
      !search ||
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.courseName?.toLowerCase().includes(search.toLowerCase());
    return matchSearch && matchesTypeFilter(m.fileType, typeFilter);
  });

  // ── Group by subject for student view ───────────────────────
  const groupedBySubject: Record<string, Material[]> = {};
  materials.forEach(m => {
    const key = m.courseName || m.subject || 'General';
    if (!groupedBySubject[key]) groupedBySubject[key] = [];
    groupedBySubject[key].push(m);
  });

  // Apply search filter to grouped view
  const filteredGrouped: Record<string, Material[]> = {};
  Object.entries(groupedBySubject).forEach(([course, mats]) => {
    const f = mats.filter(m =>
      !search ||
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.courseName?.toLowerCase().includes(search.toLowerCase())
    );
    if (f.length > 0) filteredGrouped[course] = f;
  });

  const totalDownloads = materials.reduce((s, m) => s + (m.downloadCount || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* ── Header ── */}
      <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Study Materials</h2>
          <p className="text-gray-500 text-sm mt-0.5">
            {isStudent
              ? 'Materials for your enrolled courses, grouped by subject.'
              : 'Upload and manage lecture notes, references, and resources.'}
          </p>
        </div>
        {(isTeacher || isAdmin) && (
          <button
            onClick={() => { setShowForm(!showForm); setError(''); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm text-sm"
          >
            <Upload className="w-4 h-4" />
            {showForm ? 'Cancel' : 'Upload Material'}
          </button>
        )}
      </div>

      {/* ── Alerts ── */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-2 text-red-400 hover:text-red-600 flex-shrink-0">✕</button>
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{success}</div>
      )}

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Materials', value: materials.length,                                   bg: 'bg-blue-50',   icon: FolderOpen, ic: 'text-blue-600'   },
          { label: 'PDFs',            value: materials.filter(m => m.fileType === 'pdf').length,  bg: 'bg-red-50',    icon: FileText,   ic: 'text-red-600'    },
          { label: 'Links',           value: materials.filter(m => m.fileType === 'link').length, bg: 'bg-purple-50', icon: Link,       ic: 'text-purple-600' },
          { label: 'Total Downloads', value: totalDownloads,                                     bg: 'bg-green-50',  icon: Download,   ic: 'text-green-600'  },
        ].map(({ label, value, bg, icon: Icon, ic }) => (
          <div key={label} className={`${bg} rounded-xl p-4`}>
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center mb-2 shadow-sm">
              <Icon className={`w-4 h-4 ${ic}`} />
            </div>
            <p className="text-xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Upload Form (teacher / admin only) ── */}
      {showForm && (isTeacher || isAdmin) && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
          <h3 className="font-semibold text-gray-800 text-sm mb-3">
            {isTeacher ? '📚 Upload to your assigned courses' : '📚 Upload Material'}
          </h3>

          <div className="flex gap-2 mb-4">
            {(['file', 'link'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                  tab === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                {t === 'file' ? '📁 Upload File' : '🔗 Add Link'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Title *</label>
              <input value={title} onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Chapter 3 – Linked Lists"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Course * {isTeacher && <span className="text-indigo-500">(your assigned courses only)</span>}
              </label>
              {courses.length === 0 ? (
                <div className="w-full border border-amber-200 bg-amber-50 rounded-lg px-3 py-2 text-sm text-amber-700">
                  {isTeacher ? 'No courses assigned to you yet. Contact admin.' : 'No courses found.'}
                </div>
              ) : (
                <select value={courseId} onChange={e => setCourseId(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400">
                  <option value="">Select course...</option>
                  {courses.map(c => (
                    <option key={c._id || c.courseId} value={c._id || c.courseId}>
                      {c.courseName} ({c.courseCode})
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Category *</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400">
                <option value="">Select category...</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Description (optional)</label>
              <input value={description} onChange={e => setDesc(e.target.value)}
                placeholder="Brief description"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
          </div>

          {tab === 'file' ? (
            <>
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-600 mb-2">File Type *</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { val: 'pdf',   label: '📄 PDF' },
                    { val: 'doc',   label: '📝 Word' },
                    { val: 'ppt',   label: '📊 PowerPoint' },
                    { val: 'image', label: '🖼️ Image' },
                  ].map(({ val, label }) => (
                    <button key={val}
                      onClick={() => { setFileTypeExp(val); setFile(null); if (fileRef.current) fileRef.current.value = ''; }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                        fileTypeExp === val
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                      }`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/20 transition mb-4">
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />
                    <div className="text-left min-w-0">
                      <p className="font-semibold text-sm text-gray-800 truncate max-w-xs">{file.name}</p>
                      <p className="text-xs text-gray-400">{formatBytes(file.size)}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-400">
                    <Upload className="w-7 h-7 mx-auto mb-1.5" />
                    <p className="text-sm font-medium">Click to browse file</p>
                    <p className="text-xs mt-1">Max 50MB</p>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" className="hidden"
                accept={
                  fileTypeExp === 'pdf'   ? '.pdf' :
                  fileTypeExp === 'doc'   ? '.doc,.docx' :
                  fileTypeExp === 'ppt'   ? '.ppt,.pptx' :
                  '.jpg,.jpeg,.png'
                }
                onChange={e => setFile(e.target.files?.[0] || null)} />
            </>
          ) : (
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Reference URL * (YouTube, Google Drive, any link)
              </label>
              <input value={linkUrl} onChange={e => setLinkUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=... or any URL"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              {linkUrl && getYouTubeId(linkUrl) && (
                <div className="mt-3 rounded-lg overflow-hidden border border-gray-200">
                  <img src={`https://img.youtube.com/vi/${getYouTubeId(linkUrl)}/hqdefault.jpg`}
                    alt="YouTube thumbnail" className="w-full h-28 object-cover" />
                  <p className="text-xs text-center text-green-600 py-1 bg-green-50">✅ Valid YouTube link</p>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={tab === 'file' ? handleUpload : handleLink} disabled={uploading}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg text-sm font-semibold">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploading ? 'Saving...' : tab === 'file' ? 'Upload File' : 'Add Link'}
            </button>
            <button onClick={resetForm}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Search ── */}
      <div className="flex gap-3 flex-wrap mb-5">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by title or course..."
            className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
        </div>
        {/* Type filter only for teacher/admin flat view */}
        {!isStudent && (
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400">
            {FILE_TYPE_TABS.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        )}
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="flex items-center justify-center py-14 text-gray-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading materials...
        </div>
      ) : materials.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center text-gray-400">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-sm">
            {isStudent ? 'No materials available for your courses yet' : 'No materials uploaded yet'}
          </p>
          {isStudent && (
            <p className="text-xs mt-1 text-gray-300">Materials will appear here once your teachers upload them</p>
          )}
        </div>
      ) : isStudent ? (
        // ── STUDENT VIEW: grouped by subject ──────────────────
        <>
          {Object.keys(filteredGrouped).length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 py-16 text-center text-gray-400">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium text-sm">No results found</p>
            </div>
          ) : (
            Object.entries(filteredGrouped).map(([courseName, mats]) => (
              <SubjectSection
                key={courseName}
                courseName={courseName}
                materials={mats}
                isTeacher={false}
                isAdmin={false}
                onDelete={handleDelete}
                onDownload={handleDownload}
                onPreview={(url, name) => { setPreviewUrl(url); setPreviewName(name); }}
              />
            ))
          )}
        </>
      ) : (
        // ── TEACHER / ADMIN VIEW: flat grid with filters ───────
        filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 py-16 text-center text-gray-400">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium text-sm">No results found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(m => (
              <MaterialCard key={m._id} m={m}
                isTeacher={isTeacher} isAdmin={isAdmin}
                onDelete={handleDelete} onDownload={handleDownload}
                onPreview={(url, name) => { setPreviewUrl(url); setPreviewName(name); }} />
            ))}
          </div>
        )
      )}

      {/* ── PDF Preview Modal ── */}
      {previewUrl && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl h-[88vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span className="truncate">{previewName}</span>
              </h3>
              <button onClick={() => setPreviewUrl(null)}
                className="ml-3 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium flex-shrink-0">
                ✕ Close
              </button>
            </div>
            <iframe src={previewUrl} className="flex-1 border-none" title="PDF Preview" />
          </div>
        </div>
      )}
    </div>
  );
}