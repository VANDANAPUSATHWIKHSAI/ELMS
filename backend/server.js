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
// Replace with your MongoDB URI if different
const MONGO_URI = 'mongodb://127.0.0.1:27017/kmit_elms';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// --- API ROUTES ---

// 1. LOGIN ROUTE
app.post('/api/auth/login', async (req, res) => {
  const { employeeId, password } = req.body;

  try {
    // Find user by Employee ID
    const user = await User.findOne({ employeeId });
    
    // Check if user exists
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check Password (Simple comparison for now)
    // In production, we will use bcrypt to hash passwords
    if (user.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Send back success and user info (excluding password)
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
      { new: true } // Return the updated document
    );
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: "Update Failed" });
  }
});


// ... existing imports and setup ...

// 4. APPLY LEAVE ROUTE (Fixed: Removed Transactions for Local Dev)
app.post('/api/leave/apply', async (req, res) => {
  try {
    const { employeeId, leaveType, startDate, endDate, reason, adjustments } = req.body;

    // 1. Calculate number of days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeDiff = Math.abs(end - start);
    const days = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1;

    // 2. Fetch User to check balance
    const user = await User.findOne({ employeeId });
    if (!user) return res.status(404).json({ message: "User not found" });

    // 3. Check Balance Logic
    let balanceField = '';
    if (leaveType === 'CL') balanceField = 'cl';
    else if (leaveType === 'CCL') balanceField = 'ccl';
    else if (leaveType === 'AL') balanceField = 'al';
    
    if (balanceField && user.leaveBalance[balanceField] < days) {
      return res.status(400).json({ message: `Insufficient ${leaveType} balance. Available: ${user.leaveBalance[balanceField]}, Requested: ${days}` });
    }

    // 4. Deduct Balance (Update User First)
    if (balanceField) {
      user.leaveBalance[balanceField] -= days;
      await user.save();
    }

    // 5. Create Leave Request
    const newLeave = new LeaveRequest({
      employeeId,
      leaveType,
      startDate,
      endDate,
      reason,
      adjustments: adjustments || [], 
      status: 'Pending', 
      hodApproval: { status: 'Pending' }
    });
    await newLeave.save();

    // 6. Update Ledger
    if (balanceField) {
      await LeaveLedger.create({
        employeeId,
        transactionType: 'Debit',
        leaveType,
        amount: -days,
        reason: `Leave Application #${newLeave._id}`,
        referenceId: newLeave._id,
        balanceAfter: user.leaveBalance[balanceField]
      });
    }

    res.json({ message: "Leave applied successfully!", leaveId: newLeave._id });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});


// 5. GET LEAVE HISTORY ROUTE
app.get('/api/leave/history/:employeeId', async (req, res) => {
  try {
    const leaves = await LeaveRequest.find({ employeeId: req.params.employeeId })
      .sort({ appliedOn: -1 }); // Sort by newest first
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});