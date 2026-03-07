const mongoose=require('mongoose'); 
require('dotenv').config({path: '.env'}); 
const User = require('./models/User'); 
const LeaveRequest=require('./models/LeaveRequest'); 

mongoose.connect(process.env.MONGO_URI).then(async ()=>{ 
  try {
    const searchRegex = new RegExp('s', 'i'); 
    const matchingUsers = await User.find({ 
      $or: [ 
        { firstName: searchRegex }, 
        { lastName: searchRegex }, 
        { employeeId: searchRegex } 
      ] 
    }); 
    const matchingIds = matchingUsers.map(u => u.employeeId); 
    console.log('Matching users:', matchingIds.length, matchingIds); 
    
    // Check leave requests for these exact IDs
    console.log('Finding leaves for:', { employeeId: { $in: matchingIds } });
    const leaves = await LeaveRequest.find({ employeeId: { $in: matchingIds } }); 
    console.log('Total leaves:', leaves.length); 
    
    // Inspect what an actual leave request employeeId looks like
    const anyLeave = await LeaveRequest.findOne();
    console.log('Sample leave employeeId type:', typeof anyLeave?.employeeId, anyLeave?.employeeId);
    console.log('Our matchingIds type:', typeof matchingIds[0], matchingIds[0]);

  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0); 
  }
});
