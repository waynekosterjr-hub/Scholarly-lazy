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
  // Fix LeftPanel percentage
  { regex: /bg-gray-200 text-gray-700 dark:text-gray-200/g, rep: 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200' },
  // Fix CenterEditor dividers
  { regex: /bg-gray-200 mx-1/g, rep: 'bg-gray-200 dark:bg-gray-700 mx-1' },
  // Fix Header progress bar background
  { regex: /bg-gray-200\/50 overflow-hidden/g, rep: 'bg-gray-200/50 dark:bg-gray-700/50 overflow-hidden' },
  // Fix RightPanel buttons that missed dark background
  { regex: /bg-gray-200 hover:bg-gray-300 text-gray-800 dark:text-gray-100/g, rep: 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100' },
  // Fix ShowYourWork timeline line
  { regex: /before:bg-gray-200/g, rep: 'before:bg-gray-200 dark:before:bg-gray-700' }
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
