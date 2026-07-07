const https = require('https');
const mysql = require('mysql2/promise');

const categoriesMap = {
  1: 'beverage drink',
  2: 'chips snacks',
  3: 'milk cheese dairy',
  4: 'shampoo lotion soap',
  5: 'electronics battery',
  6: 'grocery pantry',
  7: 'frozen food',
  8: 'bakery bread pastry'
};

async function fetchUnsplashUrls(query) {
  return new Promise((resolve, reject) => {
    https.get(`https://unsplash.com/s/photos/${encodeURIComponent(query)}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        // Regex to find unsplash image urls
        const matches = [...data.matchAll(/(https:\/\/images\.unsplash\.com\/photo-[a-zA-Z0-9\-]+)/g)];
        const urls = [...new Set(matches.map(m => m[1] + '?w=500&q=80'))]; // deduplicate and resize
        resolve(urls.slice(0, 10)); // return top 10
      });
    }).on('error', reject);
  });
}

async function run() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root123',
    database: 'smartbarcode_db'
  });

  try {
    const [products] = await connection.execute('SELECT id, barcode, category_id FROM products');
    console.log('Fetching amazing real images from Unsplash...');

    for (const [catId, query] of Object.entries(categoriesMap)) {
      console.log(`Scraping images for: ${query}...`);
      const urls = await fetchUnsplashUrls(query);
      console.log(`Found ${urls.length} images for ${query}`);
      
      if (urls.length === 0) continue;

      // Assign these URLs to the products in this category
      const catProducts = products.filter(p => p.category_id == catId);
      for (let i = 0; i < catProducts.length; i++) {
        const p = catProducts[i];
        const imageUrl = urls[i % urls.length]; // Cycle through the 10 images
        await connection.execute('UPDATE products SET image_url = ? WHERE id = ?', [imageUrl, p.id]);
      }
    }

    console.log('Done assigning real, high-quality images!');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await connection.end();
  }
}

run();
