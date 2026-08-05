const mongoose = require('mongoose');
const URI = 'mongodb+srv://numveda:numveda2026@numvedacluster.4n81s.mongodb.net/numveda?retryWrites=true&w=majority&appName=numvedacluster';

async function run() {
  await mongoose.connect(URI);
  const db = mongoose.connection.db;
  const events = await db.collection('events').countDocuments();
  const orders = await db.collection('orders').countDocuments();
  console.log('Events:', events);
  console.log('Orders:', orders);
  process.exit(0);
}
run();
