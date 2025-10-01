// const express = require('express');
// const router = express.Router();
// const { seedSettings } = require('../seeds/setting.seed');

// /**
//  * @swagger
//  * /setting/seed-settings:
//  *   post:
//  *     summary: Seed default settings into the database
//  *     tags:
//  *       - Settings
//  *     responses:
//  *       200:
//  *         description: Settings seeded successfully
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 message:
//  *                   type: string
//  *                   example: Seeded settings successfully
//  *       500:
//  *         description: Server error during seeding
//  */
// router.post('/seed-settings', async (req, res) => {
//     try {
//         await seedSettings();
//         res.status(200).json({ message: 'Seeded settings successfully' });
//     } catch (err) {
//         console.error('Seeding error:', err);
//         res.status(500).json({ error: 'Seeding failed' });
//     }
// });

// module.exports = router;