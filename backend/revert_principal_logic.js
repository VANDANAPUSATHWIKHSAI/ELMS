const fs = require('fs');
const path = require('path');

const serverPath = 'c:/Users/sathw/OneDrive/Desktop/projectelms/elmsprojectw/elms/backend/server.js';
let content = fs.readFileSync(serverPath, 'utf8');

function revertFilter(name, pattern, replacement) {
    if (content.match(pattern)) {
        content = content.replace(pattern, replacement);
        console.log(`✅ Reverted: ${name}`);
    } else {
        console.warn(`⚠️  Pattern not found for: ${name}`);
    }
}

// 1. P1: Stats
const p1Pattern = /\/\/ P1\. GET GLOBAL STATS[\s\S]*?res\.json\(\{ totalStaff, pendingLeaves, onLeaveToday, attendancePercent \}\);/;
const p1Replacement = `// P1. GET GLOBAL STATS
app.get('/api/principal/stats', authMiddleware, roleMiddleware(['Principal', 'Admin']), async (req, res) => {
  try {
     const totalStaff = await User.countDocuments({ role: { $in: ['Employee', 'HoD'] } });
     const pendingLeaves = await LeaveRequest.countDocuments({ status: 'Pending' });

     // Leaves today
     const today = new Date();
     const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
     const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

     const onLeaveToday = await LeaveRequest.countDocuments({
       status: { $in: ['Approved', 'Auto-Approved'] },
       startDate: { $lte: endOfDay },
       endDate: { $gte: startOfDay }
     });

     // Calculate attendance percentage (Staff - OnLeaveToday) / Staff
     const attendancePercent = totalStaff > 0 ? Math.round(((totalStaff - onLeaveToday) / totalStaff) * 100) : 100;

     res.json({ totalStaff, pendingLeaves, onLeaveToday, attendancePercent });`;

// 2. P2: Today Leaves
const p2Pattern = /\/\/ P2\. GET TODAY LEAVES ACROSS ALL DEPTS[\s\S]*?res\.json\(leavesWithNames\);\s+?\}\scatch\(err\)\s\{\sres\.status\(500\)\.json\(\{\smessage:\s"Server Error"\s\}\)\s\}\r?\n\}\);/;
const p2Replacement = `// P2. GET TODAY LEAVES ACROSS ALL DEPTS
app.get('/api/principal/today-leaves', authMiddleware, roleMiddleware(['Principal', 'Admin']), async (req, res) => {
  try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

      const leaves = await LeaveRequest.find({
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
          department: user ? user.department : 'Unknown'
        };
      });
      
      res.json(leavesWithNames);
  } catch(err) { res.status(500).json({ message: "Server Error" }) }
});`;

// 3. P3: Pending
const p3Pattern = /\/\/ P3\. GET GLOBAL PENDING FOR RATIFICATION[\s\S]*?const userIds\s=\sleaves\.map\(l\s=>\sl\.employeeId\);/;
const p3Replacement = `// P3. GET GLOBAL PENDING FOR RATIFICATION
app.get('/api/principal/pending', authMiddleware, roleMiddleware(['Principal', 'Admin']), async (req, res) => {
  try {
      const leaves = await LeaveRequest.find({ status: 'Pending' }).sort({ appliedOn: 1 });
      const userIds = leaves.map(l => l.employeeId);`;

// 4. P4: Leave History
const p4Pattern = /\/\/ P4\. GET GLOBAL LEAVE HISTORY[\s\S]*?const leaves\s=\sawait LeaveRequest\.find\(\{ employeeId: { \$in: employeeIds \} \}\)\.sort\(\{ appliedOn: -1 \}\)\.limit\(100\);/;
const p4Replacement = `// P4. GET GLOBAL LEAVE HISTORY
app.get('/api/principal/leave-history', authMiddleware, roleMiddleware(['Principal', 'Admin']), async (req, res) => {
  try {
     const leaves = await LeaveRequest.find().sort({ appliedOn: -1 }).limit(100);`;

// 5. P6 Analytics Trends (Partial revert of the loop content)
const p6Pattern = /const userQuery = { role: { \$in: \['Employee', 'HoD'\] \} \};[\s\S]*?const leaveCount = await LeaveRequest\.countDocuments\(\{[\s\S]*?employeeId: { \$in: employeeIds \},/;
const p6Replacement = `const leaveCount = await LeaveRequest.countDocuments({`;

// 6. 12: HOD Rejected
const h12Pattern = /\/\/ 12\. PRINCIPAL: HOD REJECTED LEAVES[\s\S]*?const rejectedLeaves\s=\sawait LeaveRequest\.find\(\{[\s\S]*?employeeId: { \$in: employeeIds \},/;
const h12Replacement = `// 12. PRINCIPAL: HOD REJECTED LEAVES
app.get('/api/principal/hod-rejected', authMiddleware, roleMiddleware(['Principal', 'Admin']), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0,0,0,0);

    const rejectedLeaves = await LeaveRequest.find({`;

// 7. A: Admin Reports Stats
const aPattern = /\/\/ A\. Global Stats \(Overall Institution or Year-Specific for Principal\)[\s\S]*?const pendingLeaves\s+=\s+await\s+LeaveRequest\.countDocuments\(\{[\s\S]*?employeeId: { \$in: employeeIds \},[\s\S]*?status: 'Pending'[\s\S]*?\}\);/;
const aReplacement = `// A. Global Stats for Dashboard
app.get('/api/admin/reports/stats', authMiddleware, roleMiddleware(['Admin', 'Principal']), async (req, res) => {
  try {
    const totalEmployees = await User.countDocuments();
    const totalDepartments = await Department.countDocuments();
    const pendingLeaves = await LeaveRequest.countDocuments({ status: 'Pending' });`;

// 8. B: Admin Reports History
const bPattern = /\/\/ B\. Global Leave History \(Overall or Year-Specific\)[\s\S]*?const leaves\s+=\s+await\s+LeaveRequest\.find\(\{\s+employeeId:\s+\{\s+\$in:\s+employeeIds\s+\}\s+\}\)\.sort\(\{ appliedOn: -1 \}\)\.limit\(100\);/;
const bReplacement = `// B. Global Leave History (All Departments)
app.get('/api/admin/reports/history', authMiddleware, roleMiddleware(['Admin', 'Principal']), async (req, res) => {
  try {
    const leaves = await LeaveRequest.find().sort({ appliedOn: -1 }).limit(100);`;

// 9. B2: Advanced Reports
const b2Pattern = /if \(req\.user\.role === 'Principal' && req\.user\.teachingYear\) \{[\s\S]*?query\.employeeId = \{ \$in: employeeIds \};\s+\}/;
const b2Replacement = ``;

// 10. Action DENIAL
const denyPattern = /if \(req\.user\.teachingYear\) \{[\s\S]*?return res\.status\(403\)\.json\(\{ message: \`Access Denied: You are Principal for \${req\.user\.teachingYear} only.\` \}\);\s+\}/;
const denyReplacement = ``;

// 11. Login removal of teachingYear in response
const loginPattern = /teachingYear: user\.teachingYear\s+\}/;
const loginReplacement = `}`;

revertFilter('P1: Stats', p1Pattern, p1Replacement);
revertFilter('P2: Today Leaves', p2Pattern, p2Replacement);
revertFilter('P3: Pending', p3Pattern, p3Replacement);
revertFilter('P4: History', p4Pattern, p4Replacement);
revertFilter('P6: Analytics', p6Pattern, p6Replacement);
revertFilter('12: Rejected', h12Pattern, h12Replacement);
revertFilter('A: Admin Reports Stats', aPattern, aReplacement);
revertFilter('B: Admin Reports History', bPattern, bReplacement);
revertFilter('B2: Advanced Reports', b2Pattern, b2Replacement);
revertFilter('Action Denial Restricted', denyPattern, denyReplacement);
revertFilter('Login Response Cleanup', loginPattern, loginReplacement);

fs.writeFileSync(serverPath, content);
console.log('🏁 Server.js reverted successfully!');
