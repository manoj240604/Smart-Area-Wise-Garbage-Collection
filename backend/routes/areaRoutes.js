const express = require('express');
const router = express.Router();
const {
    getAreas,
    createArea,
    updateArea,
    deleteArea,
    getBinsByArea,
    createBin,
    updateBinLevel,
    collectBin,
    assignWorkersToArea
} = require('../controllers/areaController');
const { protect, admin, worker } = require('../middleware/authMiddleware');

router.route('/areas').get(protect, getAreas).post(protect, admin, createArea);
router.route('/areas/:id').put(protect, admin, updateArea).delete(protect, admin, deleteArea);
router.route('/areas/:areaId/workers').put(protect, admin, assignWorkersToArea);
router.route('/areas/:areaId/bins').get(protect, getBinsByArea);
router.route('/bins').post(protect, admin, createBin);
router.route('/bins/:id/level').put(protect, updateBinLevel);
router.route('/bins/:id/collect').put(protect, worker, collectBin);

module.exports = router;
