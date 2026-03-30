const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const Material = require('../models/Material');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = uuidv4() + ext;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.jpg', '.jpeg', '.png', '.mp4'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// GET all materials (student/teacher/admin)
router.get('/', async (req, res) => {
  try {
    const { subject, uploadedBy } = req.query;
    const filter = { isPublished: true };
    if (subject) filter.subject = subject;
    if (uploadedBy) filter.uploadedBy = uploadedBy;

    const materials = await Material.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, materials });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET materials uploaded by a teacher (teacher dashboard)
router.get('/my/:teacherId', async (req, res) => {
  try {
    const materials = await Material.find({ uploadedBy: req.params.teacherId }).sort({ createdAt: -1 });
    res.json({ success: true, materials });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST upload new material
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { title, description, subject, uploadedBy, uploadedByName } = req.body;
    const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '');

    const material = new Material({
      title,
      description,
      subject,
      fileType: ext || 'other',
      fileName: req.file.originalname,
      filePath: req.file.filename,
      fileSize: req.file.size,
      uploadedBy,
      uploadedByName
    });

    await material.save();
    res.status(201).json({ success: true, material });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET download a file
router.get('/download/:id', async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) return res.status(404).json({ success: false, message: 'Material not found' });

    const filePath = path.join(uploadDir, material.filePath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File not found on server' });
    }

    material.downloadCount += 1;
    await material.save();

    res.download(filePath, material.fileName);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE material (teacher only)
router.delete('/:id', async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) return res.status(404).json({ success: false, message: 'Material not found' });

    const filePath = path.join(uploadDir, material.filePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await Material.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Material deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;