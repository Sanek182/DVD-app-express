var express = require('express');
var router = express.Router();
const db = require('../../database/connection');
const { isUserAuthenticated } = require('../../checks/authState')

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
    let query = 
      `SELECT P.* FROM Product P
      LEFT JOIN Movie_Genres MG ON P.id = MG.dvd_id
      LEFT JOIN Genre G ON MG.genre_id = G.id`
    ;    
    const params = [];
    
    if (req.query.genre && req.query.genre !== 'All') {
      query += ' WHERE G.genre_name = ?';
      params.push(req.query.genre);
    }
    
    if (req.query.decade && req.query.decade !== 'All') {
      query += req.query.genre && req.query.genre !== 'All' ? ' AND ' : ' WHERE ';
      query += "P.year_produced BETWEEN ? AND ?";
      params.push(`${req.query.decade}-01-01`, `${parseInt(req.query.decade) + 9}-12-31`);
    }
       
    if (req.query.country && req.query.country !== 'All') {
      query += (req.query.genre && req.query.genre !== 'All' || req.query.decade && req.query.decade !== 'All') ? ' AND ' : ' WHERE ';
      query += 'P.movie_country = ?';
      params.push(req.query.country);
    }

    query += ' GROUP BY P.id';

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

router.get('/api/dvds/search', async (req, res) => {
  try {
    const searchQuery = req.query.query;
    const query =
      `SELECT P.* FROM Product P
      WHERE P.movie_title LIKE ? OR P.original_title LIKE ?`;
    
    const param = `%${searchQuery}%`;

    const [rows] = await db.query(query, [param, param]);
    
    if (rows.length > 0) {
      res.status(200).json(rows);
    } else {
      res.status(404).json({ message: 'No DVDs found' });
    }
  } catch (error) {
    console.error('An error occurred:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.get('/api/cart-items', isUserAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;

    const query = `
      SELECT 
        Cart.id as cart_id, 
        Cart_Item.id as cart_item_id, 
        Product.id as dvd_id, 
        Product.price, 
        Product.product_type, 
        Product.stock_quantity, 
        Product.movie_title,
        Cart_Item.quantity,
        Cart_Item.added_at
      FROM Cart
      JOIN Cart_Item ON Cart.id = Cart_Item.cart_id
      JOIN Product ON Cart_Item.dvd_id = Product.id
      WHERE Cart.user_id = ?;
    `;

    const [rows] = await db.query(query, [userId]);
    res.status(200).json(rows);
  } catch (error) {
    console.error('An error occurred:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.post('/api/add-to-cart', isUserAuthenticated, async (req, res) => {
  const { dvdId } = req.body;
  const userId = req.session.user.id;

  try {
    let [existingCart] = await db.query(
      'SELECT id FROM Cart WHERE user_id = ?',
      [userId]
    );
    
    let cartId;
    if (existingCart.length === 0) {
      const [newCart] = await db.query(
        'INSERT INTO Cart (user_id, created_at, updated_at) VALUES (?, NOW(), NOW())',
        [userId]
      );
      cartId = newCart.insertId;
    } else {
      cartId = existingCart[0].id;
    }
    
    await db.query(
      'INSERT INTO Cart_Item (cart_id, dvd_id, added_at, quantity) VALUES (?, ?, NOW(), ?)',
      [cartId, dvdId, 1]
    );
    
    res.status(200).json({ success: true, message: 'DVD added to cart' });
  } catch (error) {
    console.error('An error occurred:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

router.put('/api/update-cart-item', isUserAuthenticated, async (req, res) => {
  const { cartItemId, newQuantity } = req.body;
  try {
    await db.query('UPDATE Cart_Item SET quantity = ? WHERE id = ?', [newQuantity, cartItemId]);
    res.status(200).json({ success: true, message: 'Cart item updated' });
  } catch (error) {
    console.error('An error occurred:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

router.delete('/api/delete-cart-item', isUserAuthenticated, async (req, res) => {
  const { cartItemId } = req.body;
  try {
    await db.query('DELETE FROM Cart_Item WHERE id = ?', [cartItemId]);
    res.status(200).json({ success: true, message: 'Cart item deleted' });
  } catch (error) {
    console.error('An error occurred:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

router.post('/api/create-order', isUserAuthenticated, async (req, res) => {
  const { userId, cartId, specificDetails, addExpenses, totalSum } = req.body;

  try {
    const [order] = await db.query(
      'INSERT INTO `Order` (user_id, cart_id, created_at, specific_details, add_expenses, total_sum) VALUES (?, ?, NOW(), ?, ?, ?)',
      [Number(userId), Number(cartId), specificDetails, Number(addExpenses), parseFloat(totalSum)]
    );
    const orderId = order.insertId;

    const [cartItems] = await db.query('SELECT * FROM Cart_Item WHERE cart_id = ?', [cartId]);

    for (const item of cartItems) {
      await db.query(
        'INSERT INTO Order_Item (order_id, dvd_id, price, quantity) VALUES (?, ?, ?, ?)',
        [orderId, item.dvd_id, item.price, item.quantity]
      );
    }

    res.status(200).json({ success: true, message: 'Order created' });
  } catch (error) {
    console.error('An error occurred:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

router.get('/api/initial-state', isUserAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;

    const [cartRows] = await db.query('SELECT id FROM Cart WHERE user_id = ?', [userId]);
    const cartId = cartRows.length > 0 ? cartRows[0].id : null;

    const [sumRows] = await db.query(`
      SELECT SUM(Product.price * Cart_Item.quantity) as total_sum 
      FROM Cart_Item 
      JOIN Product ON Cart_Item.dvd_id = Product.id
      WHERE Cart_Item.cart_id = ?`, [cartId]
    );
    const totalSum = sumRows.length > 0 ? sumRows[0].total_sum : 0;

    res.status(200).json({
      userId,
      cartId,
      totalSum
    });
  } catch (error) {
    console.error('An error occurred:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


module.exports = router;
