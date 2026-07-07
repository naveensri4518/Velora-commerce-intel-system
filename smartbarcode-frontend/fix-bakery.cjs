const mysql = require('mysql2/promise');

async function fixBakeryImages() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root123',
    database: 'smartbarcode_db'
  });

  try {
    const [products] = await connection.execute('SELECT id FROM products WHERE category_id = 8');
    
    let count = 0;
    for (const p of products) {
      // update image url to use cake,bread instead of bakery
      const imageUrl = `https://loremflickr.com/500/500/cake,bread?lock=${p.id}`;
      await connection.execute('UPDATE products SET image_url = ? WHERE id = ?', [imageUrl, p.id]);
      count++;
    }
    
    console.log(`Fixed images for ${count} bakery products!`);
  } catch (err) {
    console.error('Error fixing bakery images:', err);
  } finally {
    await connection.end();
  }
}

fixBakeryImages();
