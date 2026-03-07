const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });
const Holiday = require('./models/Holiday');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const start = new Date('2026-03-19');
  const end = new Date('2026-03-19');
  const overlapping = await Holiday.findOne({
    $or: [{ startDate: { $lte: end }, endDate: { $gte: start } }]
  });
  console.log('Overlapping:', overlapping ? overlapping.name : 'None');
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
