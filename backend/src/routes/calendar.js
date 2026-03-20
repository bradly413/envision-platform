const router = require('express').Router();
const { requireAdmin } = require('../middleware/auth');
router.use(requireAdmin);
// TODO: implement calendar routes
router.get('/', (req, res) => res.json({ message: 'calendar routes — coming soon' }));
module.exports = router;
