const TtDepartment = require('../../models/TtDepartment');
const Teacher = require('../../models/Teacher');
const { mapMongoError, mongoErrorStatus } = require('../../utils/mongoErrorMapper');

// @desc    Get all departments
// @route   GET /api/timetable/manage/departments
exports.getAllDepartments = async (req, res) => {
  try {
    const departments = await TtDepartment.find({ isActive: true })
      .populate('headOfDepartment', 'name email employeeId')
      .sort({ code: 1 });
    res.status(200).json({ success: true, count: departments.length, data: departments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get department by ID
// @route   GET /api/timetable/manage/departments/:id
exports.getDepartmentById = async (req, res) => {
  try {
    const department = await TtDepartment.findOne({ _id: req.params.id, isActive: true })
      .populate('headOfDepartment', 'name email employeeId');
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found.' });
    }
    res.status(200).json({ success: true, data: department });
  } catch (error) {
    const status = mongoErrorStatus(error);
    const message = mapMongoError(error);
    res.status(status).json({ success: false, message });
  }
};

// @desc    Create department
// @route   POST /api/timetable/manage/departments
exports.createDepartment = async (req, res) => {
  try {
    const { code, name, headOfDepartment } = req.body;
    if (!code || !name) {
      return res.status(400).json({ success: false, message: 'Department code and name are required.' });
    }

    if (headOfDepartment) {
      const teacher = await Teacher.findOne({ _id: headOfDepartment, isActive: true });
      if (!teacher) {
        return res.status(400).json({ success: false, message: 'Invalid Head of Department ID.' });
      }
    }

    // Check duplicate code
    const existing = await TtDepartment.findOne({ code: code.toUpperCase(), isActive: true });
    if (existing) {
      return res.status(409).json({ success: false, message: `Department with code "${code.toUpperCase()}" already exists.` });
    }

    const department = await TtDepartment.create({
      code: code.toUpperCase(),
      name,
      headOfDepartment: headOfDepartment || null
    });

    res.status(201).json({ success: true, data: department });
  } catch (error) {
    const status = mongoErrorStatus(error);
    const message = mapMongoError(error);
    res.status(status).json({ success: false, message });
  }
};

// @desc    Update department
// @route   PUT /api/timetable/manage/departments/:id
exports.updateDepartment = async (req, res) => {
  try {
    const { code, name, headOfDepartment } = req.body;
    const department = await TtDepartment.findOne({ _id: req.params.id, isActive: true });
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found.' });
    }

    if (headOfDepartment) {
      const teacher = await Teacher.findOne({ _id: headOfDepartment, isActive: true });
      if (!teacher) {
        return res.status(400).json({ success: false, message: 'Invalid Head of Department ID.' });
      }
      department.headOfDepartment = headOfDepartment;
    } else if (headOfDepartment === null) {
      department.headOfDepartment = null;
    }

    if (code) {
      const existing = await TtDepartment.findOne({
        code: code.toUpperCase(),
        isActive: true,
        _id: { $ne: department._id }
      });
      if (existing) {
        return res.status(409).json({ success: false, message: `Department with code "${code.toUpperCase()}" already exists.` });
      }
      department.code = code.toUpperCase();
    }

    if (name) department.name = name;

    await department.save();
    res.status(200).json({ success: true, data: department });
  } catch (error) {
    const status = mongoErrorStatus(error);
    const message = mapMongoError(error);
    res.status(status).json({ success: false, message });
  }
};

// @desc    Delete department (soft-delete)
// @route   DELETE /api/timetable/manage/departments/:id
exports.deleteDepartment = async (req, res) => {
  try {
    const department = await TtDepartment.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found.' });
    }
    res.status(200).json({ success: true, message: 'Department deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
