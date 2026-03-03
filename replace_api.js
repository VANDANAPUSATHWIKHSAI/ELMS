const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            replaceInDir(fullPath);
        } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            // Safely replace both single quotes and backticks wrapping the URL
            const regex = /['"`]http:\/\/localhost:5000([^'"`]*)['"`]/g;
            const newContent = content.replace(regex, (match, pathSuffix) => {
                return '`http://${window.location.hostname}:5000' + pathSuffix + '`';
            });
            if(content !== newContent) {
                fs.writeFileSync(fullPath, newContent);
                console.log('Updated: ' + fullPath);
            }
        }
    }
}

replaceInDir(path.join(__dirname, 'src'));
console.log("Done replacing URLs.");
