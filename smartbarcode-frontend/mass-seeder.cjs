const mysql = require('mysql2/promise');

const categoriesData = {
  1: { // Beverages
    tag: 'beverage',
    names: ["Coke Can 330ml", "Pepsi 500ml", "Sprite 2L", "Fanta Orange 600ml", "Tropicana Mango Juice", "Real Apple Juice 1L", "Minute Maid Orange", "Red Bull Energy 250ml", "Monster Energy 500ml", "Nescafe Cold Coffee", "Lipton Iced Tea Lemon", "Tetley Green Tea Bags", "Taj Mahal Tea 250g", "Minute Maid Lemonade", "Kinley Water 1L", "Bisleri Water 500ml", "Schweppes Tonic Water", "Schweppes Ginger Ale", "Silk Soy Milk", "Blue Diamond Almond Milk"]
  },
  2: { // Snacks
    tag: 'snack',
    names: ["Lays Magic Masala", "Kurkure Kurkure", "Bingo Mad Angles", "Doritos Nacho Cheese", "Cheetos Flamin Hot", "Pringles Original", "Act II Popcorn", "Cornitos Nachos", "Haldiram Peanuts", "Happilo Almonds", "Nutraj Cashews", "Tulsi Walnuts", "Miltop Pistachios", "Lion Raisins", "Kimia Dates", "Cadbury Dairy Milk", "RiteBite Protein Bar", "Yoga Bar Energy", "Nature Valley Granola", "Fab Box Fruit Bar"]
  },
  3: { // Dairy
    tag: 'dairy',
    names: ["Amul Taaza Milk 1L", "Amul Butter 500g", "Britannia Cheese Slices", "Amul Paneer 200g", "Epigamia Greek Yogurt", "Nestle Curd 400g", "Amul Buttermilk", "Mother Dairy Lassi", "Amul Pure Ghee 1L", "Amul Fresh Cream", "Nutralite Margarine", "Milkmaid Condensed Milk", "Carnation Evaporated Milk", "EveryDay Powdered Milk", "Kwality Walls Ice Cream", "Baskin Robbins Gelato", "London Dairy Sorbet", "Cocoberry Frozen Yogurt", "Keventers Milkshake", "Hersheys Flavored Milk"]
  },
  4: { // Personal Care
    tag: 'shampoo',
    names: ["Dove Hair Fall Shampoo", "Pantene Conditioner", "Pears Pure Soap", "Nivea Body Wash", "Himalaya Face Wash", "Everyuth Face Scrub", "Ponds Face Cream", "Vaseline Body Lotion", "Dettol Hand Wash", "Lifebuoy Sanitizer", "Colgate Toothpaste", "Oral-B Toothbrush", "Listerine Mouthwash", "Nivea Deodorant Men", "Fogg Perfume", "Parachute Hair Oil", "Set Wet Hair Gel", "Gillette Shaving Cream", "Gillette Mach 3 Razor", "Old Spice Aftershave"]
  },
  5: { // Electronics
    tag: 'electronics',
    names: ["Duracell AA Battery 4s", "Energizer AAA Battery 4s", "Boat USB C Cable", "Apple 20W Charger", "JBL Wired Earphones", "Sony Wireless Headphones", "Mi Power Bank 10000mAh", "SanDisk 64GB Pen Drive", "Samsung 128GB MicroSD", "Logitech Wireless Mouse", "Dell Wired Keyboard", "AmazonBasics Mousepad", "Belkin HDMI Cable 2m", "HP VGA Cable", "D-Link Ethernet Cable", "TP-Link WiFi Router", "Netgear 5-Port Switch", "Targus USB Hub", "Logitech C920 Webcam", "Blue Yeti Microphone"]
  },
  6: { // Groceries
    tag: 'grocery',
    names: ["India Gate Basmati 5kg", "Aashirvaad Atta 5kg", "Fortune Besan 1kg", "Madhur Sugar 1kg", "Tata Salt 1kg", "Tata Sampann Toor Dal", "Organic Tattva Masoor Dal", "Rajdhani Rajma 1kg", "Everest Garam Masala", "Saffola Gold Oil 1L", "Patanjali Cow Ghee", "Brooke Bond Red Label", "Bru Gold Coffee", "Maggi Pazzta 70g", "Ching's Hakka Noodles", "Kissan Tomato Ketchup", "Maggi Hot & Sweet", "Kissan Mixed Fruit Jam", "Dabur Honey 250g", "Pintola Peanut Butter"]
  },
  7: { // Frozen Foods
    tag: 'frozenfood',
    names: ["Safal Frozen Peas", "McCain Frozen Corn", "Sumeru Mixed Veggies", "McCain French Fries", "Yummiez Chicken Nuggets", "Venky's Burger Patties", "Amul Frozen Pizza", "Haldiram Frozen Paratha", "Haldiram Frozen Samosa", "Sumeru Spring Rolls", "Prasuma Veg Momos", "Godrej Yummiez Fish", "Venky's Frozen Chicken", "ITC MasterChef Prawns", "Licious Frozen Meat", "Prasuma Pork Sausages", "Sumeru Chicken Kebabs", "Venky's Chicken Tikka", "ITC Mutton Seekh", "Sumeru Chicken Malai"]
  },
  8: { // Bakery
    tag: 'bakery',
    names: ["Modern White Bread", "Britannia Brown Bread", "Harvest Multigrain Bread", "Bakehouse Sweet Buns", "English Oven Burger Buns", "Harvest Hotdog Buns", "Modern Pizza Base", "Bauli Croissant", "Winkies Muffin", "Elite Cupcake", "Britannia Fruit Cake", "Bakehouse Chocolate Pastry", "Theobroma Brownie", "Unibic Choco Cookies", "Parle-G Biscuits", "Britannia Premium Rusk", "Haldiram Khari", "Bakehouse Veg Puff", "Elite Jam Tart", "Bakehouse Apple Pie"]
  }
};

async function seedMassData() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root123',
    database: 'smartbarcode_db'
  });

  try {
    const supplierId = 1; // fallback supplier
    const createdAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    // Check current max barcode to start sequential barcodes safely
    const [maxBarcodeRow] = await connection.execute('SELECT MAX(barcode) as m FROM products');
    let startBarcode = 9000000000000;
    if (maxBarcodeRow[0].m) {
      const mb = parseInt(maxBarcodeRow[0].m);
      if (!isNaN(mb)) startBarcode = mb + 1000;
    }

    let insertCount = 0;

    for (const [catId, data] of Object.entries(categoriesData)) {
      for (let i = 0; i < data.names.length; i++) {
        const productName = data.names[i];
        // Generate pseudo-random realistic prices based on category
        let purchasePrice = Math.floor(Math.random() * 200) + 15; // 15 to 215
        if (catId == 5) purchasePrice = Math.floor(Math.random() * 1500) + 200; // electronics more expensive
        const sellingPrice = Math.floor(purchasePrice * (1.2 + Math.random() * 0.3)); // 20% to 50% margin
        const stock = Math.floor(Math.random() * 100) + 20; // 20 to 120
        const barcode = (startBarcode++).toString();
        
        // Lock image so it doesn't change on reload, tag makes it relevant
        const imageUrl = `https://loremflickr.com/500/500/${data.tag}?lock=${i + parseInt(catId) * 100}`;
        
        await connection.execute(
          `INSERT INTO products (
            barcode, name, brand, category_id, supplier_id, purchase_price, selling_price,
            tax_rate, current_stock, min_stock_level, unit, image_url, active, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            barcode, productName, 'Generic', parseInt(catId), supplierId, purchasePrice, sellingPrice,
            18.00, stock, 10, 'pcs', imageUrl, 1, createdAt, createdAt
          ]
        );
        insertCount++;
      }
    }

    console.log(`Successfully seeded ${insertCount} products!`);

  } catch (err) {
    console.error('Error seeding mass data:', err);
  } finally {
    await connection.end();
  }
}

seedMassData();
