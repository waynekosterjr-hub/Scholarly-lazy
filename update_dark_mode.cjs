const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      results.push(file);
    }
  });
  return results;
}

const files = walk('src').filter(f => f.endsWith('.tsx'));

const replacements = [
  { regex: /bg-\[\#F3F3F3\]/g, rep: 'bg-[#F3F3F3] dark:bg-[#121212]' },
  { regex: /text-\[\#1C1C1C\]/g, rep: 'text-[#1C1C1C] dark:text-gray-100' },
  { regex: /(?<!dark:)bg-white/g, rep: 'bg-white dark:bg-gray-900' },
  { regex: /(?<!dark:)border-gray-200/g, rep: 'border-gray-200 dark:border-gray-800' },
  { regex: /(?<!dark:)border-gray-300/g, rep: 'border-gray-300 dark:border-gray-700' },
  { regex: /(?<!dark:)bg-gray-50(?!0)/g, rep: 'bg-gray-50 dark:bg-gray-800/50' },
  { regex: /(?<!dark:)bg-gray-100/g, rep: 'bg-gray-100 dark:bg-gray-800' },
  { regex: /(?<!dark:)hover:bg-gray-200/g, rep: 'hover:bg-gray-200 dark:hover:bg-gray-700' },
  { regex: /(?<!dark:)hover:bg-gray-100/g, rep: 'hover:bg-gray-100 dark:hover:bg-gray-800' },
  { regex: /(?<!dark:)text-gray-400/g, rep: 'text-gray-400 dark:text-gray-500' },
  { regex: /(?<!dark:)text-gray-500/g, rep: 'text-gray-500 dark:text-gray-400' },
  { regex: /(?<!dark:)text-gray-600/g, rep: 'text-gray-600 dark:text-gray-300' },
  { regex: /(?<!dark:)text-gray-700/g, rep: 'text-gray-700 dark:text-gray-200' },
  { regex: /(?<!dark:)text-gray-800/g, rep: 'text-gray-800 dark:text-gray-100' },
  { regex: /(?<!dark:)text-gray-900/g, rep: 'text-gray-900 dark:text-gray-50' },
  { regex: /(?<!dark:)ring-gray-200/g, rep: 'ring-gray-200 dark:ring-gray-800' }
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  replacements.forEach(rule => {
    content = content.replace(rule.regex, rule.rep);
  });
  
  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
});
