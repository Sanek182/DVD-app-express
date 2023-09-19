var express = require('express');
var router = express.Router();
const db = require('../../database/connection');

router.get('/api/latest-dvds', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Product ORDER BY created_at DESC LIMIT 10');
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

router.get('/api/all-dvds', async (req, res) => {
  try {
    let query = 'SELECT * FROM Product';
    const params = [];
    
    if (req.query.genre) {
      query += ' WHERE genre_name = ?';
      params.push(req.query.genre);
    }
    if (req.query.decade) {
      query += req.query.genre ? ' AND ' : ' WHERE ';
      query += 'YEAR(year_produced) BETWEEN ? AND ?';
      params.push(req.query.decade, parseInt(req.query.decade) + 9);
    }
    if (req.query.country) {
      query += (req.query.genre || req.query.decade) ? ' AND ' : ' WHERE ';
      query += 'movie_country = ?';
      params.push(req.query.country);
    }
    const [rows] = await db.query(query, params);
    res.status(200).json(rows);
  } catch (error) {
    console.error('An error occurred:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.get('/api/dvd/:id', async (req, res) => {
    const dvdId = req.params.id;

    try {
      const [productRows] = await db.query('SELECT * FROM Product WHERE id = ?', [dvdId]);
      const [actorRows] = await db.query('SELECT actor_name FROM Actor JOIN Movie_Actors ON Actor.id = Movie_Actors.actor_id WHERE Movie_Actors.dvd_id = ?', [dvdId]);
      const [directorRows] = await db.query('SELECT director_name FROM Director JOIN Movie_Directors ON Director.id = Movie_Directors.director_id WHERE Movie_Directors.dvd_id = ?', [dvdId]);
      const [genreRows] = await db.query('SELECT genre_name FROM Genre JOIN Movie_Genres ON Genre.id = Movie_Genres.genre_id WHERE Movie_Genres.dvd_id = ?', [dvdId]);
      const [tagRows] = await db.query('SELECT tag_name FROM Tag JOIN Movie_Tags ON Tag.id = Movie_Tags.tag_id WHERE Movie_Tags.dvd_id = ?', [dvdId]);
      const [galleryRows] = await db.query('SELECT gallery_path FROM Movie_Gallery WHERE dvd_id = ?', [dvdId]);
      
      if (productRows.length > 0) {
        const dvd = {
          ...productRows[0],
          actors: actorRows.map(row => row.actor_name),
          directors: directorRows.map(row => row.director_name),
          genres: genreRows.map(row => row.genre_name),
          tags: tagRows.map(row => row.tag_name),
          gallery: galleryRows.map(row => row.gallery_path)
      };
      res.json(dvd);      
    } else {
        res.status(404).json({ message: 'DVD not found' });
      }
    } catch (error) {
      console.error('An error occurred:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
});

module.exports = router;
