const express = require('express');
const router = express.Router();
const {
  createInventory,
  getAllInventory,
  getInventoryGroupedBySupplier
} = require('../controllers/inventoryController');

router.post('/', createInventory);
router.get('/', getAllInventory);
router.get('/grouped', getInventoryGroupedBySupplier);

module.exports = router;
