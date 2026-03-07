const mongoose = require('mongoose');
const User = require('./models/User');

const MONGO_URI = 'mongodb://127.0.0.1:27017/kmit_elms';

async function updateHods() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const mapping = {
      'cse_hod_1': '601', 'cse_hod_2': '602', 'cse_hod_3': '603', 'cse_hod_4': '604',
      'csm_hod_1': '605', 'csm_hod_2': '606', 'csm_hod_3': '607', 'csm_hod_4': '608'
    };

    for (const [oldId, newId] of Object.entries(mapping)) {
      const res = await User.updateOne({ employeeId: oldId }, { $set: { employeeId: newId } });
      console.log(`Updated ${oldId} to ${newId}: ${res.modifiedCount > 0 ? 'Success' : 'No change (already updated or not found)'}`);
    }

    console.log('🚀 HoD ID Update complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error updating HoDs:', err);
    process.exit(1);
  }
}

updateHods();
