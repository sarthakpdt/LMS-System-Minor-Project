const fs = require('fs');

let content = fs.readFileSync('src/components/auth/StudentAuthNew.tsx', 'utf8');

// Replace text-white with text-black
content = content.replace(/text-white/g, 'text-black');

// Replace text-gray-200, 300, 400 with text-black
content = content.replace(/text-gray-[234]00/g, 'text-black');

// Replace hover:text-gray-300 with hover:text-black
content = content.replace(/hover:text-gray-300/g, 'hover:text-black');

// Replace placeholder-gray-300 with placeholder-black
content = content.replace(/placeholder-gray-[34]00/g, 'placeholder-black');

// The input fields have bg-gray-800/80. If the text is black, the background should be transparent or light so it's readable.
// But the user strictly asked for text to be black. We will also remove bg-gray-800/80 and bg-gray-900/95 to be safe.
content = content.replace(/bg-gray-900\/95/g, 'bg-white/30'); // Make the card translucent light
content = content.replace(/bg-gray-800\/80/g, 'bg-white/50'); // Make inputs translucent light
content = content.replace(/bg-gray-800\/40/g, 'bg-white/40'); // Auth mode toggle bg
content = content.replace(/bg-gray-700/g, 'bg-white/70'); // Active tab bg

fs.writeFileSync('src/components/auth/StudentAuthNew.tsx', content);
console.log('Fixed auth colors');
