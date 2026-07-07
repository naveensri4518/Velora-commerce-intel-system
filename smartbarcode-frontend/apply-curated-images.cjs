const mysql = require('mysql2/promise');

const curatedImages = {
  1: [ // Beverages
    'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=320&q=80',
    'https://images.unsplash.com/photo-1556881286-fc6915169721?w=320&q=80',
    'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=320&q=80',
    'https://images.unsplash.com/photo-1527661591450-b444d9cdd0ee?w=320&q=80',
    'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=320&q=80'
  ],
  2: [ // Snacks
    'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=320&q=80',
    'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=320&q=80',
    'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=320&q=80',
    'https://images.unsplash.com/photo-1582293041079-7814c2f12063?w=320&q=80',
    'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=320&q=80'
  ],
  3: [ // Dairy
    'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=320&q=80',
    'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=320&q=80',
    'https://images.unsplash.com/photo-1571212515416-f4e813f56e01?w=320&q=80',
    'https://images.unsplash.com/photo-1517093602195-b40af9688b46?w=320&q=80',
    'https://images.unsplash.com/photo-1588710929895-6eeafe1ce512?w=320&q=80'
  ],
  4: [ // Personal Care
    'https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=320&q=80',
    'https://images.unsplash.com/photo-1608248593842-8021c6a8eaec?w=320&q=80',
    'https://images.unsplash.com/photo-1584305574647-0cc9ec9ce3f9?w=320&q=80',
    'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=320&q=80',
    'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=320&q=80'
  ],
  5: [ // Electronics
    'https://images.unsplash.com/photo-1616781296068-07de47721590?w=320&q=80',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=320&q=80',
    'https://images.unsplash.com/photo-1526862590217-10d9841f39f4?w=320&q=80',
    'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=320&q=80',
    'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=320&q=80'
  ],
  6: [ // Groceries
    'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?w=320&q=80',
    'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=320&q=80',
    'https://images.unsplash.com/photo-1586201375761-83865001e8ac?w=320&q=80',
    'https://images.unsplash.com/photo-1596647413661-bc571b02de60?w=320&q=80',
    'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?w=320&q=80'
  ],
  7: [ // Frozen Foods
    'https://images.unsplash.com/photo-1588964895597-cfccd6e2a099?w=320&q=80',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=320&q=80',
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=320&q=80',
    'https://images.unsplash.com/photo-1544982503-9f984c14501a?w=320&q=80',
    'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=320&q=80'
  ],
  8: [ // Bakery
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=320&q=80',
    'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?w=320&q=80',
    'https://images.unsplash.com/photo-1587668178277-295251f900ce?w=320&q=80',
    'https://images.unsplash.com/photo-1550617931-e17a7b70dce2?w=320&q=80',
    'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=320&q=80'
  ]
};

async function run() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root123',
    database: 'smartbarcode_db'
  });

  try {
    const [products] = await connection.execute('SELECT id, barcode, category_id FROM products');
    console.log('Assigning highly curated real images...');

    for (const [catId, urls] of Object.entries(curatedImages)) {
      const catProducts = products.filter(p => p.category_id == catId);
      for (let i = 0; i < catProducts.length; i++) {
        const p = catProducts[i];
        const imageUrl = urls[i % urls.length]; // Cycle through the 5 images
        await connection.execute('UPDATE products SET image_url = ? WHERE id = ?', [imageUrl, p.id]);
      }
    }

    console.log('Done assigning real, high-quality curated images!');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await connection.end();
  }
}

run();
