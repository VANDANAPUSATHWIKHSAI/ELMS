const fs = require('fs');
const serverPath = 'c:/Users/sathw/OneDrive/Desktop/projectelms/elmsprojectw/elms/backend/server.js';
let content = fs.readFileSync(serverPath, 'utf8');

// Fix Login JWT and Response
const loginPattern = /user: \{\s+employeeId: user\.employeeId,\s+firstName: user\.firstName,\s+lastName: user\.lastName,\s+role: user\.role,\s+department: user\.department\s+\}/;
const loginReplacement = `user: {
        employeeId: user.employeeId,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        department: user.department,
        teachingYear: user.teachingYear
      }`;

if (content.match(loginPattern)) {
    content = content.replace(loginPattern, loginReplacement);
    console.log("✅ Fixed Login Response object.");
} else {
    console.warn("⚠️  Login Response pattern not found.");
}

// Double check JWT payload
if (!content.includes("teachingYear: user.teachingYear")) {
    content = content.replace(
        "role: user.role,",
        "role: user.role,\n        teachingYear: user.teachingYear,"
    );
    console.log("✅ Fixed JWT Payload.");
}

fs.writeFileSync(serverPath, content);
console.log('🏁 Login patch applied.');
