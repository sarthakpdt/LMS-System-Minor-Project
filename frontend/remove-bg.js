const fs = require('fs');
let c = fs.readFileSync('src/components/auth/StudentAuthNew.tsx', 'utf8');
c = c.replace(/, backgroundColor: 'rgba\(255, 255, 255, 0\.7\)'/g, '');
fs.writeFileSync('src/components/auth/StudentAuthNew.tsx', c);
console.log('Background removed.');
