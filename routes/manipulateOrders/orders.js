var express = require('express');
var router = express.Router();
const db = require('../../database/connection');

router.get('/api/latest-dvds', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Products ORDER BY created_at DESC LIMIT 10');
    res.status(200).json(rows);
  } catch (error) {
    console.error('An error occurred:', error);
    if (error.code === 'ER_BAD_DB_ERROR') {
      res.status(500).json({ message: 'Database Error' });
    } else {
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
});

router.get('/api/dvd/:id', async (req, res) => {
    const dvdId = req.params.id;
    try {
      const [rows] = await db.query(`SELECT * FROM Products WHERE id = ?`, [dvdId]);
      if (rows.length > 0) {
        res.json(rows[0]);
      } else {
        res.status(404).json({ message: 'DVD not found' });
      }
    } catch (error) {
      console.error('An error occurred:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
});

module.exports = router;
