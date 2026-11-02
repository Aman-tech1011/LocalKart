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
  ['Google Pixel 6a, 128 GB', 'Mobiles', 14999, 'Good', 'Unlocked phone with a clean display, case and charging cable.', 'Hostel Block C', 'photo-1592750475338-74b7b21085ab'],
  ['Samsung Galaxy M34 5G', 'Mobiles', 10999, 'Excellent', 'Long-lasting battery, original charger and protective case.', 'Student Centre', 'photo-1511707171634-5f897ff02aa9'],
  ['iPhone 11, 64 GB', 'Mobiles', 17999, 'Good', 'All cameras work well; includes a clear case and cable.', 'Academic Block', 'photo-1598327105666-5b89351aff97'],
  ['Nothing Phone 1, 128 GB', 'Mobiles', 16999, 'Like New', 'Clean condition, bright display and original charging cable.', 'Library Road', 'photo-1512499617640-c74ae3a79d37'],
  ['Redmi Note 11, 128 GB', 'Mobiles', 8999, 'Good', 'Reliable daily-use phone with a fresh screen protector.', 'North Hostel', 'photo-1605236453806-6ff36851218e'],
  ['Acer Aspire 5, Ryzen 5', 'Laptops', 31999, 'Good', 'Fast SSD laptop for coursework; charger and sleeve included.', 'Hostel Block C', 'photo-1496181133206-80ce9b88a853'],
  ['Lenovo ThinkPad T480', 'Laptops', 25999, 'Excellent', 'Business-class laptop with a comfortable keyboard and charger.', 'Student Centre', 'photo-1588872657578-7efd1f1555ed'],
  ['HP 15s, Ryzen 3', 'Laptops', 22999, 'Good', 'Lightweight laptop for assignments and browsing, fully working.', 'Academic Block', 'photo-1496181133206-80ce9b88a853'],
  ['ASUS TUF Gaming F15', 'Laptops', 52999, 'Excellent', 'Dedicated graphics laptop with original power adapter.', 'Library Road', 'photo-1588872657578-7efd1f1555ed'],
  ['Dell Latitude 5420', 'Laptops', 37999, 'Like New', 'Portable Core i5 laptop with SSD and a healthy battery.', 'North Hostel', 'photo-1517336714731-489689fd1ca8'],
  ['Apple AirPods 2nd Generation', 'Audio', 4999, 'Good', 'Both earbuds and charging case work well; cleaned and ready.', 'Hostel Block A', 'photo-1606220945770-b5b6c2c55bf1'],
  ['Noise Buds VS104', 'Audio', 899, 'Excellent', 'Compact earbuds with working microphone and charging case.', 'Main Gate', 'photo-1606400082777-ef05f3c5e2e4'],
  ['JBL Go 3 Bluetooth Speaker', 'Audio', 1599, 'Like New', 'Portable waterproof speaker with USB-C charging cable.', 'North Hostel', 'photo-1608043152269-423dbba4e7e1'],
  ['Realme Buds Wireless 3', 'Audio', 1299, 'Good', 'Neckband earphones with clear audio and magnetic earbuds.', 'Hostel Block B', 'photo-1546435770-a3e426bf472b'],
  ['Sennheiser HD 206 Headphones', 'Audio', 1199, 'Good', 'Comfortable wired headphones with both channels working.', 'Computer Lab', 'photo-1484704849700-f032a568e944'],
  ['Logitech Pebble M350 Mouse', 'Accessories', 999, 'Like New', 'Slim silent Bluetooth mouse with its USB receiver.', 'Student Centre', 'photo-1527814050087-3793815479db'],
  ['HP USB-C Hub, 7-in-1', 'Accessories', 1799, 'Excellent', 'Working multiport adapter with HDMI, USB and card reader.', 'North Hostel', 'photo-1527864550417-7fd91fc51a46'],
  ['Laptop Stand, Aluminium', 'Accessories', 799, 'Good', 'Adjustable foldable stand with non-slip pads.', 'Hostel Block C', 'photo-1511467687858-23d96c32e4ae'],
  ['Sandisk Ultra 128 GB USB Drive', 'Accessories', 599, 'Like New', 'Fast USB 3.0 storage drive; tested and formatted.', 'Library Road', 'photo-1587829741301-dc798b83add3'],
  ['Ambrane 20000 mAh Power Bank', 'Accessories', 1199, 'Good', 'Both USB ports work; includes charging cable.', 'Academic Block', 'photo-1558618666-fcd25c85cd64'],
  ['Operating Systems: Three Easy Pieces', 'Books', 550, 'Good', 'Complete computer science reference with light highlighting.', 'Hostel Block C', 'photo-1544947950-fa07a98d237f'],
  ['Introduction to Algorithms, 3rd Edition', 'Books', 950, 'Good', 'Complete hardcover textbook with a few neat study notes.', 'Student Centre', 'photo-1512820790803-83ca734da794'],
  ['Calculus: Early Transcendentals', 'Books', 475, 'Excellent', 'Clean course textbook with no missing pages.', 'Main Gate', 'photo-1544947950-fa07a98d237f'],
  ['Computer Networks by Tanenbaum', 'Books', 625, 'Like New', 'Well-preserved reference book, ideal for networking courses.', 'North Hostel', 'photo-1512820790803-83ca734da794'],
  ['Discrete Mathematics and Its Applications', 'Books', 525, 'Good', 'Complete edition with light pencil annotations.', 'Hostel Block A', 'photo-1544947950-fa07a98d237f'],
  ['BTwin Rockrider ST30', 'Cycles', 8999, 'Excellent', 'Mountain bike with working gears and recently serviced brakes.', 'Hostel Block B', 'photo-1541625602330-2277a4c46182'],
  ['Decathlon Riverside 100', 'Cycles', 6499, 'Good', 'Comfortable commuter bike with a rear carrier and bell.', 'Academic Block', 'photo-1485965120184-e220f721d03e'],
  ['Gear Cycle, 21 Speed', 'Cycles', 5799, 'Good', 'Smooth gear changes and new front brake pads.', 'North Hostel', 'photo-1507035895480-2b3156c31fc8'],
  ['Hero Sprint Pro, 26 Inch', 'Cycles', 4599, 'Like New', 'Lightweight campus cycle with stand and bottle holder.', 'Library Road', 'photo-1511994298241-608e28f14fde'],
  ['Firefox Road Runner', 'Cycles', 7299, 'Excellent', 'Recently tuned cycle with responsive brakes and fresh tyres.', 'Student Centre', 'photo-1485965120184-e220f721d03e'],
  ['IKEA MICKE Study Desk', 'Furniture', 2999, 'Excellent', 'Compact desk with cable outlet and a roomy drawer.', 'Hostel Block C', 'photo-1518455027359-f3f8164ba6bd'],
  ['Adjustable Mesh Office Chair', 'Furniture', 3199, 'Good', 'Height-adjustable chair with a supportive mesh back.', 'Student Centre', 'photo-1505843490701-5be5d8aeb7c5'],
  ['Wooden Bedside Organizer', 'Furniture', 699, 'Like New', 'Small side table with a shelf for books and essentials.', 'Academic Block', 'photo-1499933374294-4584851497cc'],
  ['Metal Folding Study Table', 'Furniture', 1099, 'Good', 'Space-saving foldable table, stable and easy to store.', 'Library Road', 'photo-1594620302200-9a762244a156'],
  ['Rechargeable Desk Lamp', 'Furniture', 599, 'Excellent', 'LED lamp with three brightness levels and USB charging.', 'North Hostel', 'photo-1507473885765-e6ed057f782c'],
  ['Nataraj Geometry Box', 'Study Materials', 120, 'Good', 'Complete compass set with ruler and useful drawing tools.', 'Hostel Block A', 'photo-1509228468518-180dd4864904'],
  ['GATE Mechanical Engineering Notes', 'Study Materials', 375, 'Like New', 'Organized revision notes covering core mechanical subjects.', 'Main Gate', 'photo-1456513080510-7bf3a84b82f8'],
  ['Semester 5 Computer Science Notes', 'Study Materials', 275, 'Good', 'Subject-wise printed notes, neatly bound and complete.', 'Student Centre', 'photo-1434030216411-0b793f4b4173'],
  ['Casio FX-82MS Scientific Calculator', 'Study Materials', 499, 'Excellent', 'All functions work and the battery was recently replaced.', 'North Hostel', 'photo-1587145820266-a5951ee6f620'],
  ['Engineering Lab Record Book Set', 'Study Materials', 225, 'Like New', 'Unused practical record books for the current semester.', 'Library Road', 'photo-1588072432836-e10032774350'],
  ['GoPro Hero 7 Black', 'Electronics', 9999, 'Good', 'Action camera with battery, frame mount and USB cable.', 'Hostel Block C', 'photo-1516035069371-29a1b244cc32'],
  ['Amazon Kindle 8th Generation', 'Electronics', 3999, 'Good', 'E-reader with a responsive screen and protective cover.', 'Academic Block', 'photo-1544716278-ca5e3f4abd8c'],
  ['Noise ColorFit Pulse Smartwatch', 'Electronics', 1199, 'Excellent', 'Fitness tracking watch with its original magnetic charger.', 'Main Gate', 'photo-1523275335684-37898b6baf30'],
  ['TP-Link Archer C6 Router', 'Electronics', 1499, 'Like New', 'Dual-band Wi-Fi router with adapter and setup guide.', 'North Hostel', 'photo-1551703599-6b3e8379aa8b'],
  ['Portronics SoundDrum Speaker', 'Electronics', 899, 'Good', 'Portable Bluetooth speaker with a working battery and cable.', 'Library Road', 'photo-1608043152269-423dbba4e7e1'],
  ['American Tourister Laptop Backpack', 'Others', 1299, 'Excellent', 'Durable backpack with padded laptop storage and clean lining.', 'Hostel Block B', 'photo-1553062407-98eeb64c6a62'],
  ['Quechua Rain Jacket, Size M', 'Others', 999, 'Good', 'Lightweight rain jacket with working zippers and hood.', 'Academic Block', 'photo-1544923246-77307dd654cb'],
  ['Milton Insulated Lunch Box', 'Others', 399, 'Like New', 'Clean stainless steel lunch container with an insulated case.', 'North Hostel', 'photo-1602143407151-7111542de6e8'],
  ['Casio Digital Sports Watch', 'Others', 799, 'Good', 'Water-resistant digital watch with a fresh battery.', 'Hostel Block A', 'photo-1524805444758-089113d48a6d'],
  ['Cosco Badminton Racket Set', 'Others', 1199, 'Excellent', 'Pair of lightweight rackets with shuttlecocks and carry cover.', 'Student Centre', 'photo-1626224583764-f87db24ac4ea'],
  ['Samsung Galaxy Tab A8', 'Gadgets', 9999, 'Good', 'Tablet with a clear display and protective folio case.', 'Hostel Block C', 'photo-1544244015-0df4b3ffc6b0'],
  ['Amazon Echo Dot, 4th Gen', 'Gadgets', 1999, 'Excellent', 'Smart speaker with power adapter and responsive voice controls.', 'Academic Block', 'photo-1543512214-318c7553f230'],
  ['Wacom One Drawing Tablet', 'Gadgets', 2499, 'Good', 'Working pen tablet with USB cable, ideal for digital notes.', 'Library Road', 'photo-1585790050230-5dd28404ccb9'],
  ['SanDisk Extreme 1 TB SSD', 'Gadgets', 4999, 'Like New', 'Portable solid-state drive with USB-C cable and case.', 'Student Centre', 'photo-1597872200969-2b65d56bd16b'],
  ['DJI Osmo Mobile 3 Gimbal', 'Gadgets', 3999, 'Good', 'Foldable phone stabilizer with tripod and charging cable.', 'North Hostel', 'photo-1516035069371-29a1b244cc32'],
  ['Campus Hoodie, Size M', 'Clothes', 499, 'Good', 'Comfortable fleece hoodie, freshly washed and gently used.', 'Hostel Block A', 'photo-1556821840-3a63f95609a7'],
  ['Levi Strauss Denim Jacket, Size L', 'Clothes', 999, 'Excellent', 'Classic denim jacket with clean lining and intact buttons.', 'Main Gate', 'photo-1591047139829-d91aecb6caea'],
  ['Cotton Kurta, Size M', 'Clothes', 399, 'Like New', 'Lightweight cotton kurta in excellent condition.', 'Student Centre', 'photo-1598033129183-c4f50c736f10'],
  ['Slim Fit Jeans, Waist 32', 'Clothes', 599, 'Good', 'Comfortable dark-wash jeans with no stains or damage.', 'Academic Block', 'photo-1542272604-787c3835535d'],
  ['Sports Track Jacket, Size L', 'Clothes', 699, 'Excellent', 'Lightweight zip-up jacket suitable for everyday campus wear.', 'Library Road', 'photo-1551028719-00167b16eac5'],
  ['Canvas High-Top Sneakers, Size 8', 'Clothes', 899, 'Good', 'Clean everyday sneakers with intact soles and laces.', 'Hostel Block B', 'photo-1542291026-7eec264c27ff'],
  ['LED Ring Light with Phone Holder', 'Gadgets', 699, 'Like New', 'Adjustable desk ring light with working brightness controls.', 'Main Gate', 'photo-1526170375885-4d8ecf77b99f'],
  ['Portronics MODESK Universal Stand', 'Gadgets', 499, 'Excellent', 'Foldable stand for tablets and phones, easy to carry.', 'Hostel Block A', 'photo-1585790050230-5dd28404ccb9'],
  ['USB-C Portable DVD Drive', 'Gadgets', 1199, 'Good', 'External optical drive with USB-C cable, tested and working.', 'Academic Block', 'photo-1597872200969-2b65d56bd16b'],
  ['Zebronics USB Microphone', 'Gadgets', 1499, 'Like New', 'Plug-and-play microphone for presentations and online classes.', 'Library Road', 'photo-1590602847861-f357a9332bbc'],
  ['Checked Casual Shirt, Size M', 'Clothes', 299, 'Good', 'Freshly washed cotton shirt with intact buttons.', 'North Hostel', 'photo-1596755094514-f87e34085b2c'],
  ['Puma Training T-Shirt, Size L', 'Clothes', 349, 'Excellent', 'Breathable sports tee in great condition.', 'Hostel Block C', 'photo-1521572163474-6864f9cf17ab'],
  ['Formal Trousers, Waist 34', 'Clothes', 499, 'Like New', 'Well-kept formal trousers, ideal for interviews and events.', 'Student Centre', 'photo-1473966968600-fa801b869a1a'],
  ['Wool Blend Winter Sweater, Size M', 'Clothes', 599, 'Good', 'Warm pullover with no tears or loose seams.', 'Main Gate', 'photo-1576566588028-4147f3842f27'],
  ['Wireless Game Controller', 'Gadgets', 1299, 'Good', 'Responsive wireless controller with USB receiver and cable.', 'North Hostel', 'photo-1593305841991-05c297ba4575'],
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
