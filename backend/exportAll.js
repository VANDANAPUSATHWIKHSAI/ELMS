const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const MONGO_URI = 'mongodb://127.0.0.1:27017/kmit_elms';

async function exportAll() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB Connected');

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    const exportFolder = path.join(__dirname, 'Full_DB_Export');
    if (!fs.existsSync(exportFolder)) {
      fs.mkdirSync(exportFolder);
    }

    for (const collection of collections) {
      const name = collection.name;
      const data = await db.collection(name).find({}).toArray();
      
      const filePath = path.join(exportFolder, `${name}.json`);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      console.log(`📦 Exported ${data.length} records from ${name}`);
    }

    console.log(`\n✨ SUCCESS! Everything is inside the folder: ${exportFolder}`);
    console.log(`📁 You can now ZIP this folder and send it to your friend.`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during export:', err);
    process.exit(1);
  }
}

exportAll();
