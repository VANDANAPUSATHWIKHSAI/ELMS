// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const User = require('./models/User');
const LeaveRequest = require('./models/LeaveRequest');
const LeaveLedger = require('./models/LeaveLedger');

const app = express();
const PORT = 5000;

// --- Middleware ---
app.use(cors()); // Allow Frontend to talk to Backend
app.use(bodyParser.json());

// --- Database Connection ---
const MONGO_URI = 'mongodb://127.0.0.1:27017/kmit_elms';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// --- API ROUTES ---

// 1. LOGIN ROUTE
app.post('/api/auth/login', async (req, res) => {
  const { employeeId, password } = req.body;
  try {
    const user = await User.findOne({ employeeId });
    if (!user) return res.status(404).json({ message: "User not found" });
    
    // In production, use bcrypt.compare here
    if (user.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.json({
      message: "Login Successful",
      user: {
        employeeId: user.employeeId,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        department: user.department
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

// 2. GET PROFILE ROUTE
app.get('/api/user/:id', async (req, res) => {
  try {
    const user = await User.findOne({ employeeId: req.params.id });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

// 3. UPDATE PROFILE ROUTE
app.put('/api/user/:id', async (req, res) => {
  try {
    const updatedUser = await User.findOneAndUpdate(
      { employeeId: req.params.id },
      req.body,
      { new: true }
    );
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: "Update Failed" });
  }
});

// 4. APPLY LEAVE ROUTE
app.post('/api/leave/apply', async (req, res) => {
  try {
    const { employeeId, leaveType, startDate, endDate, reason, adjustments } = req.body;

    // 1. Calculate days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeDiff = Math.abs(end - start);
    const days = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1;

    // 2. Check Balance
    const user = await User.findOne({ employeeId });
    if (!user) return res.status(404).json({ message: "User not found" });

    let balanceField = '';
    if (leaveType === 'CL') balanceField = 'cl';
    else if (leaveType === 'CCL') balanceField = 'ccl';
    else if (leaveType === 'AL') balanceField = 'al';
    
    if (balanceField && user.leaveBalance[balanceField] < days) {
      return res.status(400).json({ message: `Insufficient ${leaveType} balance.` });
    }

    // 3. Deduct Balance
    if (balanceField) {
      user.leaveBalance[balanceField] -= days;
      await user.save();
    }

    // 4. Create Request
    const newLeave = new LeaveRequest({
      employeeId, leaveType, startDate, endDate, reason,
      adjustments: adjustments || [], 
      status: 'Pending', 
      hodApproval: { status: 'Pending' }
    });
    await newLeave.save();

    // 5. Update Ledger
    if (balanceField) {
      await LeaveLedger.create({
        employeeId, transactionType: 'Debit', leaveType, amount: -days,
        reason: `Leave Application #${newLeave._id}`, referenceId: newLeave._id,
        balanceAfter: user.leaveBalance[balanceField]
      });
    }

    res.json({ message: "Leave applied successfully!", leaveId: newLeave._id });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

// 5. GET LEAVE HISTORY
app.get('/api/leave/history/:employeeId', async (req, res) => {
  try {
    const leaves = await LeaveRequest.find({ employeeId: req.params.employeeId })
      .sort({ appliedOn: -1 });
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

// --- NEW ROUTES ADDED BELOW ---

// 6. GET PENDING LEAVES FOR HoD (By Department)
app.get('/api/leave/pending/:department', async (req, res) => {
  try {
    // Find users in department
    const usersInDept = await User.find({ department: req.params.department }).select('employeeId');
    const employeeIds = usersInDept.map(u => u.employeeId);

    // Find pending leaves
    const leaves = await LeaveRequest.find({
      employeeId: { $in: employeeIds },
      status: 'Pending'
    }).sort({ appliedOn: 1 });

    // Attach names
    const leavesWithNames = await Promise.all(leaves.map(async (leave) => {
      const user = await User.findOne({ employeeId: leave.employeeId });
      return {
        ...leave.toObject(),
        employeeName: user ? `${user.firstName} ${user.lastName}` : 'Unknown'
      };
    }));

    res.json(leavesWithNames);
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

// 7. APPROVE / REJECT ACTION
app.post('/api/leave/action', async (req, res) => {
  try {
    const { leaveId, action, comment } = req.body;
    const leave = await LeaveRequest.findById(leaveId);
    if (!leave) return res.status(404).json({ message: "Leave not found" });

    leave.status = action;
    leave.hodApproval = { status: action, comment, date: new Date() };

    // Refund if Rejected
    if (action === 'Rejected' && leave.leaveType !== 'LoP') {
       const user = await User.findOne({ employeeId: leave.employeeId });
       const typeMap = { 'CL': 'cl', 'CCL': 'ccl', 'AL': 'al' };
       const balanceField = typeMap[leave.leaveType];
       
       if (user && balanceField) {
         const start = new Date(leave.startDate);
         const end = new Date(leave.endDate);
         const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
         user.leaveBalance[balanceField] += days;
         await user.save();
       }
    }
    await leave.save();
    res.json({ message: `Leave ${action} Successfully` });
  } catch (err) {
    res.status(500).json({ message: "Action failed", error: err.message });
  }
});

// 8. EMPLOYEE SEARCH API (THIS WAS MISSING!)
app.get('/api/users/search', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.json([]);

    const searchRegex = new RegExp(query, 'i'); // Case-insensitive

    const users = await User.find({
      role: { $in: ['Employee', 'HoD'] },
      $or: [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { employeeId: searchRegex },
        { department: searchRegex }
      ]
    }).select('employeeId firstName lastName department designation email mobile');

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Search failed", error: err.message });
  }
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});