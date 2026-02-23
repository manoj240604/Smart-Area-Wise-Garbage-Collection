const Notification = require('../models/Notification');

// Get user notifications
exports.getNotifications = async (req, res) => {
    try {
        const { read } = req.query;
        const filter = { user: req.user._id };

        if (read !== undefined) {
            filter.read = read === 'true';
        }

        const notifications = await Notification.find(filter)
            .populate('relatedRequest', 'status garbageType')
            .sort({ createdAt: -1 })
            .limit(50);

        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;

        const notification = await Notification.findOneAndUpdate(
            { _id: id, user: req.user._id },
            { read: true, readAt: new Date() },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.json(notification);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { user: req.user._id, read: false },
            { read: true, readAt: new Date() }
        );

        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get unread count
exports.getUnreadCount = async (req, res) => {
    try {
        const count = await Notification.countDocuments({
            user: req.user._id,
            read: false
        });

        res.json({ count });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;

        const notification = await Notification.findOneAndDelete({
            _id: id,
            user: req.user._id
        });

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.json({ message: 'Notification deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
