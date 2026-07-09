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

let modifiedFiles = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    content = content.replace(/className="([^"]*?)"/g, (match, classes) => {
        let newClasses = classes;
        if (classes.includes('rounded-full') && classes.match(/\bh-\d+\b/)) {
            newClasses = newClasses.replace('hover:shadow-xl dark:hover:shadow-2xl hover:-translate-y-1 transition-all duration-300', '').trim();
            newClasses = newClasses.replace(/\s+/g, ' ');
        }
        return `className="${newClasses}"`;
    });

    if (content !== original) {
        fs.writeFileSync(file, content);
        modifiedFiles++;
    }
});

console.log(`Fixed progress bars in ${modifiedFiles} files.`);
