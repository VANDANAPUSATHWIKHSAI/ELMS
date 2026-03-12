const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const exportDir = path.join(__dirname, 'database_export');

async function exportDatabase() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/kmit_elms');
    console.log('Connected to MongoDB');

    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir);
    }

    const collections = await mongoose.connection.db.collections();
    
    for (let collection of collections) {
      const collectionName = collection.collectionName;
      const data = await collection.find({}).toArray();
      
      const filePath = path.join(exportDir, `${collectionName}.json`);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      console.log(`Exported ${data.length} records from ${collectionName} to ${filePath}`);
    }

    console.log(`\nAll collections exported successfully to ${exportDir}`);
    process.exit(0);
  } catch (error) {
    console.error('Error exporting database:', error);
    process.exit(1);
  }
}

exportDatabase();
