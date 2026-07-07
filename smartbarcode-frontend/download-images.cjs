const fs = require('fs');
const https = require('https');
const path = require('path');
const mysql = require('mysql2/promise');

const categoriesMap = {
  1: 'beverage',
  2: 'snack',
  3: 'dairy',
  4: 'shampoo',
  5: 'electronics',
  6: 'grocery',
  7: 'frozen',
  8: 'bakery'
};

const imagesDir = path.join(__dirname, 'public', 'product-images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

async function downloadImage(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadImage(res.headers.location.startsWith('http') ? res.headers.location : `https://loremflickr.com${res.headers.location}`, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to get '${url}' (${res.statusCode})`));
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
      file.on('error', reject);
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

  const [products] = await connection.execute('SELECT id, barcode, category_id FROM products');
  
  console.log(`Starting download for ${products.length} products...`);
  
  // Download with concurrency of 5
  let active = 0;
  let index = 0;

  return new Promise((resolve) => {
    function next() {
      if (index >= products.length && active === 0) {
        console.log('All downloads finished!');
        connection.end();
        resolve();
        return;
      }
      while (active < 10 && index < products.length) {
        const p = products[index++];
        active++;
        const tag = categoriesMap[p.category_id] || 'product';
        const url = `https://loremflickr.com/320/320/${tag}?lock=${p.id}`;
        const dest = path.join(imagesDir, `${p.barcode}.jpg`);
        
        downloadImage(url, dest).then(async () => {
          await connection.execute('UPDATE products SET image_url = ? WHERE id = ?', [`/product-images/${p.barcode}.jpg`, p.id]);
          console.log(`Downloaded ${tag} for ${p.barcode}`);
          active--;
          next();
        }).catch(err => {
          console.error(`Error downloading for ${p.barcode}:`, err.message);
          active--;
          next();
        });
      }
    }
    next();
  });
}

run();
