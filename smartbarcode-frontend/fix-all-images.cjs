const mysql = require('mysql2/promise');

const categoryImages = {
  1: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&q=80', // Beverages (Coca Cola)
  2: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500&q=80', // Snacks (Chips)
  3: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&q=80', // Dairy (Milk)
  4: 'https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=500&q=80', // Personal Care (Lotion/Shampoo)
  5: 'https://images.unsplash.com/photo-1616781296068-07de47721590?w=500&q=80', // Electronics (Batteries/Cables)
  6: 'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?w=500&q=80', // Groceries (Pantry)
  7: 'https://images.unsplash.com/photo-1588964895597-cfccd6e2a099?w=500&q=80', // Frozen Foods (Veggies)
  8: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&q=80'  // Bakery (Bread/Croissant)
};

async function fixAllImages() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root123',
    database: 'smartbarcode_db'
  });

  try {
    let count = 0;
    for (const [catId, url] of Object.entries(categoryImages)) {
      const [result] = await connection.execute('UPDATE products SET image_url = ? WHERE category_id = ?', [url, parseInt(catId)]);
      count += result.affectedRows;
    }
    console.log(`Successfully fixed images for ${count} products using robust Unsplash images!`);
  } catch (err) {
    console.error('Error fixing all images:', err);
  } finally {
    await connection.end();
  }
}

fixAllImages();
