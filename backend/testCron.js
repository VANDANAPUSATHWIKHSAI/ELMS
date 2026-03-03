const mongoose = require('mongoose');
const { autoApproveLeaves, autoRejectLeaves, monthlyCleanup, yearlyReset } = require('./cronJobs');

// --- DATABASE CONNECTION ---
const MONGO_URI = 'mongodb://127.0.0.1:27017/kmit_elms';

const runTest = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB for testing.');

    const arg = process.argv[2];

    switch (arg) {
      case 'approve':
        await autoApproveLeaves();
        break;
      case 'reject':
        await autoRejectLeaves();
        break;
      case 'monthly':
        // Note: monthlyCleanup only runs on the last day of the month by default.
        // You may need to temporarily comment out the "tomorrow.getDate() !== 1" check in cronJobs.js for testing.
        await monthlyCleanup();
        break;
      case 'yearly':
        await yearlyReset();
        break;
      default:
        console.log('Usage: node testCron.js [approve|reject|monthly|yearly]');
    }

    console.log('Test execution finished.');
    process.exit(0);
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
};

runTest();
