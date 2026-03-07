const fs = require('fs');
const path = require('path');

const serverPath = 'c:/Users/sathw/OneDrive/Desktop/projectelms/elmsprojectw/elms/backend/server.js';
let content = fs.readFileSync(serverPath, 'utf8');

// Helper to wrap regex replacements safely
function applyFilter(name, pattern, replacement) {
    if (content.match(pattern)) {
        content = content.replace(pattern, replacement);
        console.log(`✅ Applied filter for: ${name}`);
    } else {
        console.warn(`⚠️  Pattern not found for: ${name}`);
    }
}

// 1. P2: Today Leaves
const p2Pattern = /\/\/ P2\. GET TODAY LEAVES ACROSS ALL DEPTS\r?\napp\.get\('\/api\/principal\/today-leaves'[\s\S]*?res\.json\(leavesWithNames\);\s+?\}\scatch\(err\)\s\{\sres\.status\(500\)\.json\(\{\smessage:\s"Server Error"\s\}\)\s\}\r?\n\}\);/;
const p2Replacement = `// P2. GET TODAY LEAVES ACROSS ALL DEPTS
app.get('/api/principal/today-leaves', authMiddleware, roleMiddleware(['Principal', 'Admin']), async (req, res) => {
  try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

      const userQuery = { role: { $in: ['Employee', 'HoD'] } };
      if (req.user.role === 'Principal' && req.user.teachingYear) {
        userQuery.teachingYear = req.user.teachingYear;
      }
      const usersInYear = await User.find(userQuery).select('employeeId');
      const employeeIds = usersInYear.map(u => u.employeeId);

      const leaves = await LeaveRequest.find({
        employeeId: { $in: employeeIds },
        status: { $in: ['Approved', 'Auto-Approved'] },
        startDate: { $lte: endOfDay },
        endDate: { $gte: startOfDay }
      });
      
      const userIds = leaves.map(l => l.employeeId);
      const users = await User.find({ employeeId: { $in: userIds } });
      
      const leavesWithNames = leaves.map(leave => {
        const user = users.find(u => u.employeeId === leave.employeeId);
        return {
          ...leave.toObject(),
          employeeName: user ? \`\${user.firstName} \${user.lastName}\` : 'Unknown',
          department: user ? user.department : 'Unknown',
          teachingYear: user ? user.teachingYear : 'N/A'
        };
      });
      
      res.json(leavesWithNames);
  } catch(err) { res.status(500).json({ message: "Server Error" }) }
});`;

// 2. P3: Pending Ratification
const p3Pattern = /\/\/ P3\. GET GLOBAL PENDING FOR RATIFICATION\r?\napp\.get\('\/api\/principal\/pending'[\s\S]*?const userIds\s=\sleaves\.map\(l\s=>\sl\.employeeId\);/;
const p3Replacement = `// P3. GET GLOBAL PENDING FOR RATIFICATION
app.get('/api/principal/pending', authMiddleware, roleMiddleware(['Principal', 'Admin']), async (req, res) => {
  try {
      const userQuery = { role: { $in: ['Employee', 'HoD'] } };
      if (req.user.role === 'Principal' && req.user.teachingYear) {
        userQuery.teachingYear = req.user.teachingYear;
      }
      const usersInYear = await User.find(userQuery).select('employeeId');
      const employeeIds = usersInYear.map(u => u.employeeId);

      const leaves = await LeaveRequest.find({ 
        employeeId: { $in: employeeIds },
        status: 'Pending' 
      }).sort({ appliedOn: 1 });
      const userIds = leaves.map(l => l.employeeId);`;

// 3. P6: Analytics trends
const p6Pattern = /const count = await LeaveRequest\.countDocuments\(\{\s+status: \{ \$in: \['Approved', 'Auto-Approved'\] \},\s+\$or: \[\r?\n\s+\{ startDate: \{ \$lte: end, \$gte: start \} \},\r?\n\s+\{ endDate: \{ \$lte: end, \$gte: start \} \}\s+\]\s+\}\);/;
const p6Replacement = `const userQuery = { role: { $in: ['Employee', 'HoD'] } };
      if (req.user.role === 'Principal' && req.user.teachingYear) {
        userQuery.teachingYear = req.user.teachingYear;
      }
      const usersInYear = await User.find(userQuery).select('employeeId');
      const employeeIds = usersInYear.map(u => u.employeeId);

      const count = await LeaveRequest.countDocuments({
        employeeId: { $in: employeeIds },
        status: { $in: ['Approved', 'Auto-Approved'] },
        $or: [
          { startDate: { $lte: end, $gte: start } },
          { endDate: { $lte: end, $gte: start } }
        ]
      });`;

applyFilter('P2: Today Leaves', p2Pattern, p2Replacement);
applyFilter('P3: Pending', p3Pattern, p3Replacement);
applyFilter('P6: Analytics Trends', p6Pattern, p6Replacement);

fs.writeFileSync(serverPath, content);
console.log('🏁 Server.js patched successfully!');
