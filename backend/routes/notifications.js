const express = require('express');
const router  = express.Router();
const Notification = require('../models/Notification');

// ── GET /api/notifications/:userId/:role ──────────────────────
// BUG FIX: teacher sends to targetRole:'student' — student must
// see it. Query includes all 4 conditions so nothing is missed.
router.get('/:userId/:role', async (req, res) => {
  try {
    const { userId, role } = req.params;
    if (!userId || !role)
      return res.status(400).json({ success: false, message: 'userId and role are required' });

    const notifs = await Notification.find({
      isActive: true,
      $or: [
        { targetRole: 'all' },          // broadcast to everyone
        { targetRole: role },            // targeted to this role (e.g. 'student')
        { targetUserId: userId },        // direct message to this specific user
        { createdBy: userId },           // creator always sees their own
      ]
    }).sort({ createdAt: -1 }).limit(50);

    const withReadStatus = notifs.map(n => ({
      ...n.toObject(),
      isRead: n.readBy.map(String).includes(String(userId))
    }));

    res.json({ success: true, notifications: withReadStatus });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/notifications ───────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { title, message, type, targetRole, targetUserId, createdBy, createdByName } = req.body;
    if (!title || !message)
      return res.status(400).json({ success: false, message: 'Title and message are required' });

    const notif = await Notification.create({
      title, message,
      type:         type        || 'info',
      targetRole:   targetRole  || 'all',
      targetUserId: targetUserId || null,
      createdBy:    createdBy   || null,
      createdByName: createdByName || 'System',
      readBy:   [],
      isActive: true,
    });
    res.status(201).json({ success: true, notification: notif });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/notifications/read/:notifId ─────────────────────
router.put('/read/:notifId', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ success: false, message: 'userId required' });
    await Notification.findByIdAndUpdate(req.params.notifId, { $addToSet: { readBy: userId } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/notifications/readall/:userId/:role ──────────────
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

// ── DELETE /api/notifications/:id ────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;