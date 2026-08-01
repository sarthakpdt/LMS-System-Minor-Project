const TtLab = require('../../models/TtLab');
const TtDepartment = require('../../models/TtDepartment');
const { mapMongoError, mongoErrorStatus } = require('../../utils/mongoErrorMapper');

// @desc    Get all labs
// @route   GET /api/timetable/manage/labs
exports.getAllLabs = async (req, res) => {
  try {
    const labs = await TtLab.find({ isActive: true })
      .populate('departmentId', 'code name')
      .sort({ name: 1 });
    res.status(200).json({ success: true, count: labs.length, data: labs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get lab by ID
// @route   GET /api/timetable/manage/labs/:id
exports.getLabById = async (req, res) => {
  try {
    const lab = await TtLab.findOne({ _id: req.params.id, isActive: true })
      .populate('departmentId', 'code name');
    if (!lab) {
      return res.status(404).json({ success: false, message: 'Lab not found.' });
    }
    res.status(200).json({ success: true, data: lab });
  } catch (error) {
    const status = mongoErrorStatus(error);
    const message = mapMongoError(error);
    res.status(status).json({ success: false, message });
  }
};

// @desc    Create lab
// @route   POST /api/timetable/manage/labs
exports.createLab = async (req, res) => {
  try {
    const { name, labType, capacity, building, floor, equipment, departmentId } = req.body;
    if (!name || !labType || !capacity || !departmentId) {
      return res.status(400).json({ success: false, message: 'Name, labType, capacity, and departmentId are required.' });
    }

    if (Number(capacity) <= 0) {
      return res.status(400).json({ success: false, message: 'Lab capacity must be greater than zero.' });
    }

    // Verify Department exists
    const dept = await TtDepartment.findOne({ _id: departmentId, isActive: true });
    if (!dept) {
      return res.status(400).json({ success: false, message: 'Invalid Department ID.' });
    }

    // Check duplicate name
    const existing = await TtLab.findOne({ name, isActive: true });
    if (existing) {
      return res.status(409).json({ success: false, message: `Lab with name "${name}" already exists.` });
    }

    const lab = await TtLab.create({
      name,
      labType,
      capacity: Number(capacity),
      building: building || '',
      floor: floor || '',
      equipment: Array.isArray(equipment) ? equipment : [],
      departmentId
    });

    res.status(201).json({ success: true, data: lab });
  } catch (error) {
    const status = mongoErrorStatus(error);
    const message = mapMongoError(error);
    res.status(status).json({ success: false, message });
  }
};

// @desc    Update lab
// @route   PUT /api/timetable/manage/labs/:id
exports.updateLab = async (req, res) => {
  try {
    const { name, labType, capacity, building, floor, equipment, departmentId } = req.body;
    const lab = await TtLab.findOne({ _id: req.params.id, isActive: true });
    if (!lab) {
      return res.status(404).json({ success: false, message: 'Lab not found.' });
    }

    if (departmentId) {
      const dept = await TtDepartment.findOne({ _id: departmentId, isActive: true });
      if (!dept) {
        return res.status(400).json({ success: false, message: 'Invalid Department ID.' });
      }
      lab.departmentId = departmentId;
    }

    if (capacity !== undefined) {
      if (Number(capacity) <= 0) {
        return res.status(400).json({ success: false, message: 'Lab capacity must be greater than zero.' });
      }
      lab.capacity = Number(capacity);
    }

    if (name) {
      const existing = await TtLab.findOne({
        name,
        isActive: true,
        _id: { $ne: lab._id }
      });
      if (existing) {
        return res.status(409).json({ success: false, message: `Lab with name "${name}" already exists.` });
      }
      lab.name = name;
    }

    if (labType) lab.labType = labType;
    if (building !== undefined) lab.building = building;
    if (floor !== undefined) lab.floor = floor;
    if (equipment) lab.equipment = Array.isArray(equipment) ? equipment : [];

    await lab.save();
    res.status(200).json({ success: true, data: lab });
  } catch (error) {
    const status = mongoErrorStatus(error);
    const message = mapMongoError(error);
    res.status(status).json({ success: false, message });
  }
};

// @desc    Delete lab (soft-delete)
// @route   DELETE /api/timetable/manage/labs/:id
exports.deleteLab = async (req, res) => {
  try {
    const lab = await TtLab.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!lab) {
      return res.status(404).json({ success: false, message: 'Lab not found.' });
    }
    res.status(200).json({ success: true, message: 'Lab deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
