const fs = require('fs');
const path = require('path');

const walkSync = function(dir, filelist) {
    const files = fs.readdirSync(dir);
    filelist = filelist || [];
    files.forEach(function(file) {
        if (fs.statSync(path.join(dir, file)).isDirectory()) {
            filelist = walkSync(path.join(dir, file), filelist);
        }
        else {
            filelist.push(path.join(dir, file));
        }
    });
    return filelist;
};

const files = walkSync('src/components').filter(f => f.endsWith('.tsx'));

const hoverStyles = 'hover:shadow-xl dark:hover:shadow-2xl hover:-translate-y-1 transition-all duration-300';
const darkStyles = 'dark:bg-slate-800 dark:border-slate-700/50';

let modifiedFiles = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    content = content.replace(/className="([^"]*?bg-white[^"]*?)"/g, (match, classes) => {
        let newClasses = classes;
        
        // Ensure rounded is upgraded
        if (newClasses.includes('rounded-lg')) {
            newClasses = newClasses.replace('rounded-lg', 'rounded-[1.5rem]');
        } else if (newClasses.includes('rounded-md')) {
            newClasses = newClasses.replace('rounded-md', 'rounded-xl');
        }

        // Upgrade padding if rounded-[1.5rem] is present
        if (newClasses.includes('rounded-[1.5rem]') && newClasses.includes('p-6')) {
            newClasses = newClasses.replace(/\bp-6\b/g, 'p-8');
        }

        // Add dark mode background and border if missing
        if (!newClasses.includes('dark:bg-') && !newClasses.includes('bg-transparent')) {
            newClasses += ' dark:bg-slate-800';
        }
        if (newClasses.includes('border') && !newClasses.includes('dark:border-')) {
            newClasses += ' dark:border-slate-700/50';
        }

        // Upgrade border color to border-gray-200/80
        if (newClasses.includes('border-gray-200') && !newClasses.includes('border-gray-200/80')) {
            newClasses = newClasses.replace('border-gray-200', 'border-gray-200/80');
        }

        // Add hover styles
        if (!newClasses.includes('hover:-translate-y-1')) {
            newClasses += ' ' + hoverStyles;
        }

        return `className="${newClasses.trim().replace(/\s+/g, ' ')}"`;
    });

    if (content !== original) {
        fs.writeFileSync(file, content);
        modifiedFiles++;
    }
});

console.log(`Modified ${modifiedFiles} files.`);
