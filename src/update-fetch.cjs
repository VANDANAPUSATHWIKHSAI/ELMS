const fs = require('fs');
const path = require('path');

function walk(dir, done) {
  let results = [];
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);
    let i = 0;
    (function next() {
      let file = list[i++];
      if (!file) return done(null, results);
      file = path.resolve(dir, file);
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, function(err, res) {
            results = results.concat(res);
            next();
          });
        } else {
          results.push(file);
          next();
        }
      });
    })();
  });
}

walk('c:/Users/sathw/OneDrive/Desktop/proje/elms/elms/src/components', (err, files) => {
  files.forEach(file => {
    if (file.endsWith('.jsx')) {
      let content = fs.readFileSync(file, 'utf8');
      if (content.includes('fetch(')) {
        content = content.replace(/fetch\(/g, 'apiFetch(');
        const relativePath = path.relative(path.dirname(file), 'c:/Users/sathw/OneDrive/Desktop/proje/elms/elms/src/utils/api').replace(/\\/g, '/');
        const importStmt = `import { apiFetch } from "${relativePath}";\n`;
        content = importStmt + content;
        fs.writeFileSync(file, content);
        console.log('Updated ' + file);
      }
    }
  });
});
