const fs = require('fs');

let content = fs.readFileSync('src/components/auth/StudentAuthNew.tsx', 'utf8');

content = content.replace(/className=`([^`]*)text-black([^`]*)`/g, "style={{ color: '#000000', backgroundColor: 'rgba(255, 255, 255, 0.7)' }} className={`$1text-black$2`}");
content = content.replace(/className="([^"]*)text-black([^"]*)"/g, "style={{ color: '#000000', backgroundColor: 'rgba(255, 255, 255, 0.7)' }} className=\"$1text-black$2\"");

fs.writeFileSync('src/components/auth/StudentAuthNew.tsx', content);
console.log('Fixed inline black colors');
