const fs = require('fs');
let content = fs.readFileSync('src/index.css', 'utf8');
const idx = content.lastIndexOf('/* Dynamic Text Overrides */');
if (idx !== -1) {
  content = content.substring(0, idx);
}
content += `/* Dynamic Text Overrides */
.dynamic-text-muted {
  color: #6b7280;
}
.dark .dynamic-text-muted {
  color: #9ca3af;
}

/* Background overrides missing from tailwind compile */
.dynamic-bg-main {
  background-color: #f9fafb;
}
.dark .dynamic-bg-main {
  background-color: #030712;
}

/* Responsive Display Utilities */
.hidden { display: none !important; }
@media (min-width: 640px) {
  .sm\\:block { display: block !important; }
  .sm\\:flex { display: flex !important; }
  .sm\\:hidden { display: none !important; }
}
@media (min-width: 768px) {
  .md\\:block { display: block !important; }
  .md\\:flex { display: flex !important; }
  .md\\:hidden { display: none !important; }
}
@media (min-width: 1024px) {
  .lg\\:block { display: block !important; }
  .lg\\:flex { display: flex !important; }
  .lg\\:hidden { display: none !important; }
}
`;
fs.writeFileSync('src/index.css', content);
