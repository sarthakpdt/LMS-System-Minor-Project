const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');

// GET notifications for a user (by role or direct target)
router.get('/:userId/:role', async (req, res) => {
  try {
    const { userId, role } = req.params;
    const notifs = await Notification.find({
      isActive: true,
      $or: [
        { targetRole: 'all' },
        { targetRole: role },
        { targetUserId: userId }
      ]
    }).sort({ createdAt: -1 }).limit(50);

    const withReadStatus = notifs.map(n => ({
      ...n.toObject(),
      isRead: n.readBy.some(id => id.toString() === userId)
    }));
    res.json({ success: true, notifications: withReadStatus });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create notification (admin/teacher)
router.post('/', async (req, res) => {
  try {
    const notif = await Notification.create(req.body);
    res.status(201).json({ success: true, notification: notif });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT mark as read
router.put('/read/:notifId', async (req, res) => {
  try {
    const { userId } = req.body;
    await Notification.findByIdAndUpdate(req.params.notifId, { $addToSet: { readBy: userId } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT mark all as read
router.put('/readall/:userId/:role', async (req, res) => {
  try {
    const { userId, role } = req.params;
    await Notification.updateMany(
      { isActive: true, $or: [{ targetRole: 'all' }, { targetRole: role }, { targetUserId: userId }] },
      { $addToSet: { readBy: userId } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE notification (admin only)
router.delete('/:id', async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;