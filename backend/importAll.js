const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const MONGO_URI = 'mongodb://127.0.0.1:27017/kmit_elms';

async function importAll() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB Connected');

    const importFolder = path.join(__dirname, 'Full_DB_Export');
    if (!fs.existsSync(importFolder)) {
      console.error('❌ Folder "Full_DB_Export" not found! Make sure it is in the same folder as this script.');
      process.exit(1);
    }

    const files = fs.readdirSync(importFolder).filter(f => f.endsWith('.json'));
    const db = mongoose.connection.db;

    for (const file of files) {
      const collectionName = file.replace('.json', '');
      const filePath = path.join(importFolder, file);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

      if (data.length > 0) {
        // Drop existing collection to avoid duplicates if preferred
        // await db.collection(collectionName).drop().catch(e => {}); 
        
        await db.collection(collectionName).insertMany(data);
        console.log(`✅ Imported ${data.length} records into ${collectionName}`);
      } else {
        console.log(`ℹ️ Skipping empty collection: ${collectionName}`);
      }
    }

    console.log('\n✨ ALL DATA IMPORTED SUCCESSFULLY!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during import:', err);
    process.exit(1);
  }
}

importAll();
