const router = require('express').Router();
const { requireAdmin } = require('../middleware/auth');
router.use(requireAdmin);
// TODO: implement finance routes
router.get('/', (req, res) => res.json({ message: 'finance routes — coming soon' }));
module.exports = router;
