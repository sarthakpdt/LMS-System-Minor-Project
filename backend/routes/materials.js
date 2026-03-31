const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const Material = require('../models/Material');

// ── Ensure uploads dir exists ─────────────────────────────────
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ── Multer config ─────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, uuidv4() + ext);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.jpg', '.jpeg', '.png', '.mp4'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error(`File type "${ext}" is not allowed`), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50 MB
});

// ── GET /api/materials — all published materials (student view) ──
router.get('/', async (req, res) => {
  try {
    const { subject, courseId } = req.query;
    const filter = { isPublished: true };
    if (subject) filter.subject = subject;
    if (courseId) filter.courseId = courseId;

    const materials = await Material.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, materials });
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

// ── POST /api/materials/upload — upload new material ─────────
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded or file type not allowed' });
    }

    const {
      title, description, subject, courseId, courseName,
      category, uploadedBy, uploadedByName
    } = req.body;

    if (!title) return res.status(400).json({ success: false, message: 'Title is required' });
    if (!uploadedBy) return res.status(400).json({ success: false, message: 'uploadedBy (teacherId) is required' });

    const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '');

    const material = new Material({
      title,
      description: description || '',
      subject: subject || '',
      courseId: courseId || null,
      courseName: courseName || subject || '',
      category: category || 'Other',
      fileType: ext || 'other',
      fileName: req.file.originalname,
      filePath: req.file.filename,
      fileSize: req.file.size,
      uploadedBy,
      uploadedByName: uploadedByName || '',
      isPublished: true,
      downloadCount: 0,
      viewCount: 0,
    });

    await material.save();
    res.status(201).json({ success: true, material });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/materials/download/:id — download/view file ─────
router.get('/download/:id', async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) return res.status(404).json({ success: false, message: 'Material not found' });

    const filePath = path.join(uploadDir, material.filePath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File not found on server. It may have been deleted.' });
    }

    // Increment download count
    material.downloadCount = (material.downloadCount || 0) + 1;
    await material.save();

    // For PDFs: allow inline viewing in browser (for preview)
    if (material.fileType === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${material.fileName}"`);
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.download(filePath, material.fileName);
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/materials/:id ─────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) return res.status(404).json({ success: false, message: 'Material not found' });

    // Delete physical file
    const filePath = path.join(uploadDir, material.filePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await Material.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Material deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;