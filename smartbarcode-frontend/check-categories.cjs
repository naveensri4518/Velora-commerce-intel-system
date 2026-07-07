const mysql = require('mysql2/promise');

async function checkCategories() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root123',
    database: 'smartbarcode_db'
  });

  const [categories] = await connection.execute('SELECT id, name FROM categories');
  console.log(categories);

  const [suppliers] = await connection.execute('SELECT id, name FROM suppliers');
  console.log(suppliers);

  await connection.end();
}

checkCategories().catch(console.error);
