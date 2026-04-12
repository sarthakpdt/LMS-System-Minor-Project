const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const { v4: uuidv4 } = require('uuid');
const Material = require('../models/Material');
const Teacher  = require('../models/Teacher');
const Student  = require('../models/Student');

// ── Ensure uploads dir exists ─────────────────────────────────
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// ── Multer config ─────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => cb(null, uuidv4() + path.extname(file.originalname))
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.pdf','.doc','.docx','.ppt','.pptx','.jpg','.jpeg','.png','.mp4'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error(`File type "${ext}" not allowed`), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 50 * 1024 * 1024 } });


// ── GET /api/materials — all published materials (with optional filters) ──
// Query params: courseId, subject, studentId (auto-filters by enrolled courses)
router.get('/', async (req, res) => {
  try {
    const { subject, courseId, studentId } = req.query;
    const filter = { isPublished: true };

    // If studentId provided → only show materials for their enrolled courses
    if (studentId) {
      const student = await Student.findById(studentId).lean();
      if (student && student.enrolledCourses && student.enrolledCourses.length > 0) {
        const enrolledCourseIds = student.enrolledCourses.map(c => c.courseId);
        filter.courseId = { $in: enrolledCourseIds };
      } else {
        // Student not found or no enrolled courses → return empty
        return res.json({ success: true, materials: [] });
      }
    }

    if (subject)  filter.subject  = subject;
    if (courseId && !studentId) filter.courseId = courseId;

    const materials = await Material.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, materials });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// ── GET /api/materials/teacher-courses/:teacherId
// Returns only the courses assigned to this teacher (for upload form dropdown)
router.get('/teacher-courses/:teacherId', async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.teacherId).lean();
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });

    const courses = teacher.assignedCourses || [];
    res.json({ success: true, courses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// ── GET /api/materials/my/:teacherId — teacher's own uploads ──
router.get('/my/:teacherId', async (req, res) => {
  try {
    const materials = await Material.find({ uploadedBy: req.params.teacherId }).sort({ createdAt: -1 });
    res.json({ success: true, materials });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// ── POST /api/materials/upload — upload a file ────────────────
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const { title, description, subject, courseId, courseName, category, uploadedBy, uploadedByName } = req.body;
    if (!title)      return res.status(400).json({ success: false, message: 'Title is required' });
    if (!uploadedBy) return res.status(400).json({ success: false, message: 'uploadedBy is required' });

    // ── Verify teacher is assigned to this course ──────────────
    // (skip check for admin — admin can upload to any course)
    if (courseId) {
      const teacher = await Teacher.findById(uploadedBy).lean();
      if (teacher) { // only validate for teachers (admins won't be in Teacher collection)
        const assigned = (teacher.assignedCourses || []).some(
          c => String(c.courseId) === String(courseId)
        );
        if (!assigned) {
          // Clean up uploaded file
          fs.unlinkSync(req.file.path);
          return res.status(403).json({
            success: false,
            message: 'You are not assigned to this course'
          });
        }
      }
    }

    const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '');

    const material = await Material.create({
      title,
      description:     description || '',
      subject:         subject || '',
      courseId:        courseId || null,
      courseName:      courseName || subject || '',
      category:        category || 'Other',
      materialType:    'file',
      fileType:        ext || 'other',
      fileName:        req.file.originalname,
      filePath:        req.file.filename,
      fileSize:        req.file.size,
      uploadedBy,
      uploadedByName:  uploadedByName || '',
      isPublished:     true,
      downloadCount:   0,
    });

    res.status(201).json({ success: true, material });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});


// ── POST /api/materials/link — save a reference link ─────────
router.post('/link', async (req, res) => {
  try {
    const { title, description, subject, courseId, courseName, category, uploadedBy, uploadedByName, youtubeUrl } = req.body;
    if (!title)      return res.status(400).json({ success: false, message: 'Title is required' });
    if (!youtubeUrl) return res.status(400).json({ success: false, message: 'URL is required' });
    if (!uploadedBy) return res.status(400).json({ success: false, message: 'uploadedBy is required' });

    // ── Verify teacher is assigned to this course ──────────────
    if (courseId) {
      const teacher = await Teacher.findById(uploadedBy).lean();
      if (teacher) {
        const assigned = (teacher.assignedCourses || []).some(
          c => String(c.courseId) === String(courseId)
        );
        if (!assigned) {
          return res.status(403).json({
            success: false,
            message: 'You are not assigned to this course'
          });
        }
      }
    }

    const material = await Material.create({
      title,
      description:    description || '',
      subject:        subject || '',
      courseId:       courseId || null,
      courseName:     courseName || subject || '',
      category:       category || 'Other',
      materialType:   'link',
      fileType:       'link',
      fileName:       youtubeUrl,
      filePath:       youtubeUrl,
      fileSize:       0,
      uploadedBy,
      uploadedByName: uploadedByName || '',
      isPublished:    true,
      downloadCount:  0,
    });

    res.status(201).json({ success: true, material });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// ── GET /api/materials/download/:id — serve file + increment counter ──
router.get('/download/:id', async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) return res.status(404).json({ success: false, message: 'Material not found' });

    await Material.findByIdAndUpdate(req.params.id, { $inc: { downloadCount: 1 } });

    if (material.fileType === 'link') {
      return res.json({ success: true, url: material.filePath });
    }

    const filePath = path.join(uploadDir, material.filePath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File not found on server.' });
    }

    if (material.fileType === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${material.fileName}"`);
      return fs.createReadStream(filePath).pipe(res);
    }

    res.download(filePath, material.fileName);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// ── DELETE /api/materials/:id ─────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) return res.status(404).json({ success: false, message: 'Material not found' });

    if (material.fileType !== 'link') {
      const filePath = path.join(uploadDir, material.filePath);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await Material.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;