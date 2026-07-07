const fs = require('fs');
const https = require('https');
const path = require('path');
const mysql = require('mysql2/promise');

const imagesDir = path.join(__dirname, 'public', 'product-images');

async function downloadImage(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307 || res.statusCode === 308) {
        return downloadImage(res.headers.location, dest).then(resolve).catch(reject);
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

  const [products] = await connection.execute('SELECT id, barcode FROM products');
  
  let active = 0;
  let index = 0;

  // We are going to retry any missing images using picsum photos for 100% reliability
  const missingProducts = products.filter(p => !fs.existsSync(path.join(imagesDir, `${p.barcode}.jpg`)));
  
  console.log(`Found ${missingProducts.length} missing images, patching with picsum...`);

  return new Promise((resolve) => {
    function next() {
      if (index >= missingProducts.length && active === 0) {
        console.log('All missing images patched!');
        connection.end();
        resolve();
        return;
      }
      while (active < 10 && index < missingProducts.length) {
        const p = missingProducts[index++];
        active++;
        const url = `https://picsum.photos/seed/${p.barcode}/320/320`;
        const dest = path.join(imagesDir, `${p.barcode}.jpg`);
        
        downloadImage(url, dest).then(async () => {
          await connection.execute('UPDATE products SET image_url = ? WHERE id = ?', [`/product-images/${p.barcode}.jpg`, p.id]);
          console.log(`Patched ${p.barcode}`);
          active--;
          next();
        }).catch(err => {
          console.error(`Error patching ${p.barcode}:`, err.message);
          active--;
          next();
        });
      }
    }
    next();
  });
}

run();
