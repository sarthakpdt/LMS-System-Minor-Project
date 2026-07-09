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

const badClasses = [
  'bg-white', 'dark:bg-slate-800', 'dark:bg-slate-900', 'dark:bg-slate-900/50', 'dark:bg-gray-800/90', 'dark:bg-gray-800',
  'rounded-[1.5rem]', 'rounded-xl', 'rounded-2xl', 'rounded-3xl',
  'border-gray-200/80', 'border-gray-200', 'border-gray-100', 'border-slate-200', 'border-gray-300', 
  'dark:border-slate-700/50', 'dark:border-slate-800', 'dark:border-slate-700', 'dark:border-gray-700',
  'shadow-sm', 'shadow-md', 'shadow-lg', 'shadow-xl', 'shadow-2xl', 'shadow-xs',
  'hover:shadow-xl', 'hover:shadow-2xl', 'dark:hover:shadow-2xl', 'hover:shadow-md', 'hover:shadow-sm',
  'hover:-translate-y-1', 'hover:-translate-y-0.5',
  'transition-all', 'transition-shadow', 'transition',
  'duration-300', 'duration-200'
];

let filesModified = 0;

walkDir('src/components', processFile);
walkDir('src/theme', processFile);

function processFile(filePath) {
  if (!filePath.endsWith('.tsx')) return;
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // We find className="something" or className={`something`}
  const classRegex = /className=(?:\{`|["'])([^`"']*?)(?:`\}|["'])/g;
  
  content = content.replace(classRegex, (match, classList) => {
    // Skip inputs
    if (classList.includes('focus:') || classList.includes('appearance-none')) return match;
    // Skip small badges/icons
    if (classList.includes('text-xs') && classList.includes('py-0.5')) return match;
    if (classList.match(/w-\d+ h-\d+/)) return match;
    // Skip transparent backgrounds
    if (classList.includes('bg-white/')) return match;
    
    // Only target things that have bg-white AND border AND rounded AND are not tiny
    if (classList.includes('bg-white') && classList.includes('rounded-') && classList.includes('border')) {
      
      let classes = classList.split(/\s+/);
      let newClasses = classes.filter(c => !badClasses.includes(c));
      newClasses.unshift('premium-card');
      
      // Preserve any leading/trailing quote/backtick logic from match
      let newMatch = match.replace(classList, newClasses.join(' '));
      return newMatch;
    }
    return match;
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    filesModified++;
  }
}

console.log(`Modified ${filesModified} files.`);
