const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) walkDir(dirPath, callback);
    else callback(path.join(dir, f));
  });
}

const targetClasses = new Set();
walkDir('src/components', function(filePath) {
  if (!filePath.endsWith('.tsx')) return;
  const content = fs.readFileSync(filePath, 'utf8');
  const classMatches = content.match(/className=(?:\{`|["'])([^`"']*)(?:`\}|["'])/g);
  if (classMatches) {
    classMatches.forEach(match => {
      if (match.includes('bg-white') && match.includes('rounded-') && (match.includes('shadow') || match.includes('border'))) {
        targetClasses.add(match);
      }
    });
  }
});

fs.writeFileSync('classes_to_replace.txt', Array.from(targetClasses).join('\n'));
console.log('Found ' + targetClasses.size + ' card classes.');
