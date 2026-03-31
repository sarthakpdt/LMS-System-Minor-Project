const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');

// ── GET /api/notifications/:userId/:role ─────────────────────
// Fetch notifications visible to this user (by role or direct target)
router.get('/:userId/:role', async (req, res) => {
  try {
    const { userId, role } = req.params;

    if (!userId || !role) {
      return res.status(400).json({ success: false, message: 'userId and role are required' });
    }

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
      isRead: n.readBy.some(id => id.toString() === userId.toString())
    }));

    res.json({ success: true, notifications: withReadStatus });
  } catch (err) {
    console.error('Notifications GET error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/notifications — create a notification ──────────
router.post('/', async (req, res) => {
  try {
    const { title, message, type, targetRole, targetUserId, createdBy, createdByName } = req.body;

    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and message are required' });
    }

    const notif = await Notification.create({
      title,
      message,
      type: type || 'info',
      targetRole: targetRole || 'all',
      targetUserId: targetUserId || null,
      createdBy: createdBy || null,
      createdByName: createdByName || 'System',
      readBy: [],
      isActive: true,
    });

    res.status(201).json({ success: true, notification: notif });
  } catch (err) {
    console.error('Notifications POST error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/notifications/read/:notifId — mark one as read ──
router.put('/read/:notifId', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ success: false, message: 'userId required' });

    await Notification.findByIdAndUpdate(
      req.params.notifId,
      { $addToSet: { readBy: userId } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/notifications/readall/:userId/:role — mark all as read ──
router.put('/readall/:userId/:role', async (req, res) => {
  try {
    const { userId, role } = req.params;

    await Notification.updateMany(
      {
        isActive: true,
        $or: [
          { targetRole: 'all' },
          { targetRole: role },
          { targetUserId: userId }
        ]
      },
      { $addToSet: { readBy: userId } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/notifications/:id — soft delete ──────────────
router.delete('/:id', async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Notification removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;