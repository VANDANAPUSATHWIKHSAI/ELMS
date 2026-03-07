const fs = require('fs');
const path = require('path');

const serverPath = 'c:/Users/sathw/OneDrive/Desktop/projectelms/elmsprojectw/elms/backend/server.js';
let content = fs.readFileSync(serverPath, 'utf8');

// Debug injection for Stats
if (content.indexOf("[DEBUG] Principal Stats") === -1) {
    content = content.replace(
        "app.get('/api/principal/stats', authMiddleware, roleMiddleware(['Principal', 'Admin']), async (req, res) => {",
        "app.get('/api/principal/stats', authMiddleware, roleMiddleware(['Principal', 'Admin']), async (req, res) => {\n  console.log(`[DEBUG] Principal Stats Request. ID: ${req.user.employeeId}, Role: ${req.user.role}, Year: ${req.user.teachingYear}`);"
    );
    console.log("✅ Injected debug log into stats route.");
}

fs.writeFileSync(serverPath, content);
console.log('🏁 Debug patch applied.');
