const fs = require('fs');
const content = fs.readFileSync('server.js', 'utf8');
const requires = content.match(/require\(['"]([^'"]+)['"]\)/g);
if (requires) {
    requires.forEach(req => {
        const moduleName = req.match(/require\(['"]([^'"]+)['"]\)/)[1];
        if (!moduleName.startsWith('.')) {
            try {
                require(moduleName);
                console.log(`✅ ${moduleName} - OK`);
            } catch (e) {
                console.log(`❌ ${moduleName} - MISSING`);
            }
        }
    });
}
