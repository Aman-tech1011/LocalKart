const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const Message = require('../models/Message');
const Product = require('../models/Product');
const User = require('../models/User');

const campus = (process.env.CAMPUS_NAME || 'GLA').trim();
const demoPassword = process.env.DEMO_SEED_PASSWORD;

const sellers = [
  'Aarav Sharma',
  'Ananya Verma',
  'Kabir Singh',
  'Meera Gupta',
  'Rohan Kumar',
  'Sana Khan',
  'Dev Patel',
  'Isha Yadav',
  'Arjun Mehta',
  'Priya Joshi',
];

const items = [
  ['iPhone 12, 128 GB', 'Mobiles', 24999, 'Like New', 'Unlocked, battery health is good and all cameras work perfectly.', 'North Hostel', 'photo-1592750475338-74b7b21085ab'],
  ['Samsung Galaxy A54 5G', 'Mobiles', 18499, 'Good', 'Dual SIM Android phone with charger and a clear case.', 'Main Gate', 'photo-1511707171634-5f897ff02aa9'],
  ['OnePlus Nord CE 3 Lite', 'Mobiles', 15999, 'Excellent', 'Fast charging, clean screen, original box included.', 'Hostel Block B', 'photo-1598327105666-5b89351aff97'],
  ['Redmi Note 12 Pro', 'Mobiles', 13999, 'Good', 'Great battery and display; selling after upgrading.', 'Academic Block', 'photo-1512499617640-c74ae3a79d37'],
  ['iPhone SE 2022', 'Mobiles', 16999, 'Excellent', 'Compact phone, Touch ID works, includes a protective case.', 'Library Road', 'photo-1605236453806-6ff36851218e'],
  ['Lenovo IdeaPad Slim 3, 8 GB', 'Laptops', 28999, 'Good', 'Reliable laptop for assignments, browsing and online classes.', 'Computer Lab', 'photo-1496181133206-80ce9b88a853'],
  ['HP Pavilion 14, i5', 'Laptops', 39999, 'Excellent', 'Core i5 laptop with SSD, charger and a fresh Windows install.', 'Hostel Block A', 'photo-1588872657578-7efd1f1555ed'],
  ['Dell Inspiron 15', 'Laptops', 32999, 'Good', '15-inch laptop in working condition, ideal for everyday study.', 'Student Centre', 'photo-1496181133206-80ce9b88a853'],
  ['ASUS VivoBook 14', 'Laptops', 35999, 'Like New', 'Lightweight laptop with charger and laptop sleeve.', 'North Hostel', 'photo-1588872657578-7efd1f1555ed'],
  ['MacBook Air M1', 'Laptops', 48999, 'Excellent', 'Fast M1 MacBook, great battery health and original adapter.', 'Main Gate', 'photo-1517336714731-489689fd1ca8'],
  ['Sony WH-CH720N Headphones', 'Audio', 5999, 'Excellent', 'Comfortable wireless headphones with noise cancellation.', 'Library Road', 'photo-1505740420928-5e560c06d30e'],
  ['JBL Tune 760NC', 'Audio', 3499, 'Good', 'Bluetooth headphones with working ANC and charging cable.', 'Hostel Block C', 'photo-1484704849700-f032a568e944'],
  ['OnePlus Buds 3', 'Audio', 2999, 'Like New', 'Clean earbuds and case; both buds hold charge well.', 'Academic Block', 'photo-1606220945770-b5b6c2c55bf1'],
  ['boAt Airdopes 141', 'Audio', 699, 'Good', 'Backup earbuds, case and charging cable included.', 'Student Centre', 'photo-1606400082777-ef05f3c5e2e4'],
  ['Logitech H390 USB Headset', 'Audio', 1499, 'Excellent', 'Clear microphone for online classes and group calls.', 'Computer Lab', 'photo-1546435770-a3e426bf472b'],
  ['Logitech M331 Silent Mouse', 'Accessories', 699, 'Good', 'Quiet wireless mouse with USB receiver and battery.', 'Library Road', 'photo-1527814050087-3793815479db'],
  ['Dell KM3322W Keyboard Mouse Set', 'Accessories', 1499, 'Excellent', 'Wireless full-size keyboard and mouse set, ready to use.', 'Hostel Block A', 'photo-1527864550417-7fd91fc51a46'],
  ['Mechanical Keyboard, Red Switches', 'Accessories', 2299, 'Good', 'Compact mechanical keyboard, all keys and backlight work.', 'Computer Lab', 'photo-1511467687858-23d96c32e4ae'],
  ['Logitech C270 Webcam', 'Accessories', 1199, 'Excellent', 'HD webcam for interviews, classes and video calls.', 'North Hostel', 'photo-1587829741301-dc798b83add3'],
  ['Portronics Power Plate 5', 'Accessories', 899, 'Like New', 'Desk extension board with USB charging ports.', 'Main Gate', 'photo-1558618666-fcd25c85cd64'],
  ['Engineering Mathematics Textbook', 'Books', 350, 'Good', 'Clean copy with a few pencil notes; useful for first year.', 'Library Road', 'photo-1544947950-fa07a98d237f'],
  ['Data Structures in C, 2nd Edition', 'Books', 420, 'Good', 'Complete textbook, no missing pages, light highlighting.', 'Academic Block', 'photo-1512820790803-83ca734da794'],
  ['Concepts of Physics Vol. 1', 'Books', 280, 'Excellent', 'Well-kept reference book with a clean cover.', 'Hostel Block B', 'photo-1544947950-fa07a98d237f'],
  ['Organic Chemistry Study Guide', 'Books', 310, 'Good', 'Quick revision guide with bookmarked important chapters.', 'Student Centre', 'photo-1512820790803-83ca734da794'],
  ['English Communication Skills', 'Books', 225, 'Like New', 'Nearly unused course book; no writing inside.', 'North Hostel', 'photo-1544947950-fa07a98d237f'],
  ['Hero Sprint Campus Cycle', 'Cycles', 4999, 'Good', 'Serviced single-speed cycle, perfect for daily campus travel.', 'Main Gate', 'photo-1541625602330-2277a4c46182'],
  ['Firefox Bad Attitude Mountain Bike', 'Cycles', 8499, 'Excellent', '21 gears, recently serviced and ready to ride.', 'Hostel Block A', 'photo-1485965120184-e220f721d03e'],
  ['Btwin Riverside Hybrid Cycle', 'Cycles', 6799, 'Good', 'Comfortable hybrid cycle with lights and a sturdy stand.', 'Student Centre', 'photo-1507035895480-2b3156c31fc8'],
  ['Folding Campus Cycle', 'Cycles', 7299, 'Like New', 'Space-saving foldable bicycle, easy to keep in hostel.', 'Hostel Block C', 'photo-1511994298241-608e28f14fde'],
  ['Montra Downtown Commuter', 'Cycles', 5499, 'Good', 'Lightweight city cycle with recently replaced tyres.', 'Library Road', 'photo-1485965120184-e220f721d03e'],
  ['Study Desk with Drawer', 'Furniture', 1799, 'Good', 'Sturdy compact desk; can be collected from the hostel.', 'North Hostel', 'photo-1518455027359-f3f8164ba6bd'],
  ['Ergonomic Study Chair', 'Furniture', 2499, 'Excellent', 'Comfortable adjustable chair for long study sessions.', 'Hostel Block B', 'photo-1505843490701-5be5d8aeb7c5'],
  ['Clip-on LED Study Lamp', 'Furniture', 499, 'Like New', 'Three brightness settings, USB powered and space-saving.', 'Library Road', 'photo-1507473885765-e6ed057f782c'],
  ['Bookshelf, 4 Tier', 'Furniture', 1399, 'Good', 'Assembled lightweight bookshelf with plenty of room.', 'Main Gate', 'photo-1594620302200-9a762244a156'],
  ['Bedside Table, White', 'Furniture', 999, 'Good', 'Small bedside table with storage shelf, clean condition.', 'Hostel Block A', 'photo-1499933374294-4584851497cc'],
  ['Engineering Drawing Kit', 'Study Materials', 450, 'Excellent', 'Complete compass and geometry set for engineering drawing.', 'Academic Block', 'photo-1509228468518-180dd4864904'],
  ['GATE CSE Previous Year Papers', 'Study Materials', 325, 'Good', 'Solved previous year questions with useful annotations.', 'Library Road', 'photo-1456513080510-7bf3a84b82f8'],
  ['Semester 3 Printed Notes Bundle', 'Study Materials', 250, 'Like New', 'Organised subject-wise notes, printed and spiral bound.', 'Hostel Block C', 'photo-1434030216411-0b793f4b4173'],
  ['Scientific Calculator FX-991ES', 'Study Materials', 699, 'Excellent', 'All buttons work; includes a protective case.', 'Student Centre', 'photo-1587145820266-a5951ee6f620'],
  ['College Lab Coat, Size M', 'Study Materials', 299, 'Good', 'Clean lab coat with pockets; freshly washed.', 'Academic Block', 'photo-1588072432836-e10032774350'],
  ['Canon EOS 200D Camera', 'Electronics', 23999, 'Good', 'Great starter DSLR for photography; lens and strap included.', 'Student Centre', 'photo-1516035069371-29a1b244cc32'],
  ['Kindle Paperwhite 10th Gen', 'Electronics', 6499, 'Excellent', 'E-reader with a clear screen and protective sleeve.', 'Library Road', 'photo-1544716278-ca5e3f4abd8c'],
  ['Mi Band 7 Fitness Tracker', 'Electronics', 1499, 'Good', 'Tracks steps and sleep, with original magnetic charger.', 'Hostel Block A', 'photo-1523275335684-37898b6baf30'],
  ['TP-Link Wi-Fi Router', 'Electronics', 999, 'Excellent', 'Dual-band router with power adapter and ethernet cable.', 'Hostel Block B', 'photo-1551703599-6b3e8379aa8b'],
  ['Portable Bluetooth Speaker', 'Electronics', 1299, 'Like New', 'Compact loud speaker with great battery and USB charging.', 'Main Gate', 'photo-1608043152269-423dbba4e7e1'],
  ['Nike Campus Backpack', 'Others', 899, 'Good', 'Roomy laptop compartment and comfortable shoulder straps.', 'North Hostel', 'photo-1553062407-98eeb64c6a62'],
  ['Wildcraft Rain Jacket', 'Others', 749, 'Excellent', 'Lightweight waterproof jacket, size L.', 'Hostel Block C', 'photo-1544923246-77307dd654cb'],
  ['Milton Thermosteel Bottle', 'Others', 499, 'Like New', 'Keeps drinks hot or cold; includes the original lid.', 'Student Centre', 'photo-1602143407151-7111542de6e8'],
  ['Fastrack Analog Watch', 'Others', 1099, 'Good', 'Classic daily-wear watch with a fresh battery.', 'Academic Block', 'photo-1524805444758-089113d48a6d'],
  ['Badminton Racket with Cover', 'Others', 799, 'Excellent', 'Lightweight racket in good condition, cover included.', 'Main Gate', 'photo-1626224583764-f87db24ac4ea'],
];

async function seedDemoData() {
  if (!process.env.MONGO_URI) throw new Error('Set MONGO_URI in backend/.env before seeding demo listings.');
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.startsWith('replace-')) {
    throw new Error('Set a private JWT_SECRET in backend/.env before seeding demo users.');
  }
  if (!demoPassword || demoPassword.length < 12) {
    throw new Error('Set DEMO_SEED_PASSWORD to at least 12 characters in backend/.env.');
  }

  await mongoose.connect(process.env.MONGO_URI);
  const password = await bcrypt.hash(demoPassword, 10);
  const users = [];

  for (const [index, name] of sellers.entries()) {
    const email = `seller${String(index + 1).padStart(2, '0')}@localkart-demo.test`;
    const user = await User.findOneAndUpdate(
      { email },
      {
        $set: { name, college: campus, role: 'student' },
        $setOnInsert: { email, password },
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    users.push(user);
  }

  for (const [index, [title, category, price, condition, description, location, imageId]] of items.entries()) {
    await Product.updateOne(
      { title: `LocalKart Demo ${String(index + 1).padStart(2, '0')}: ${title}` },
      {
        $set: {
          title: `LocalKart Demo ${String(index + 1).padStart(2, '0')}: ${title}`,
          category,
          price,
          condition,
          description,
          location,
          images: [`https://images.unsplash.com/${imageId}?auto=format&fit=crop&w=900&q=80`],
          seller: users[index % users.length]._id,
          college: campus,
          status: 'active',
          isDemo: true,
        },
      },
      { upsert: true, runValidators: true }
    );
  }

  const seededTitles = items.map((item, index) => `LocalKart Demo ${String(index + 1).padStart(2, '0')}: ${item[0]}`);
  const seededProducts = await Product.find({ title: { $in: seededTitles } })
    .populate('seller', 'name email college')
    .sort({ title: 1 });
  const distribution = seededProducts.reduce((counts, product) => {
    counts[product.category] = (counts[product.category] || 0) + 1;
    return counts;
  }, {});

  console.log(`Ready: ${seededProducts.length} active demo listings for ${campus}.`);
  console.log(`Categories: ${Object.entries(distribution).map(([category, count]) => `${category} ${count}`).join(', ')}`);
  console.log(`Demo seller login (all 10): seller01@localkart-demo.test through seller10@localkart-demo.test`);
  console.log(`Demo password: ${demoPassword}`);
}

seedDemoData()
  .catch((error) => {
    console.error('Could not seed demo listings:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
