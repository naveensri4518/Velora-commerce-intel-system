const mysql = require('mysql2/promise');

async function seedImages() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root123',
    database: 'smartbarcode_db'
  });

  const updates = [
    { search: '%PROTEIN BAR%', url: 'https://loremflickr.com/500/500/protein,bar' },
    { search: '%Dove%', url: 'https://loremflickr.com/500/500/shampoo' },
    { search: '%Duracell%', url: 'https://loremflickr.com/500/500/battery,duracell' }
  ];

  for (const up of updates) {
    const [result] = await connection.execute(
      'UPDATE products SET image_url = ? WHERE name LIKE ?',
      [up.url, up.search]
    );
    console.log(`Updated ${result.affectedRows} products for ${up.search}`);
  }

  await connection.end();
}

seedImages().catch(console.error);
