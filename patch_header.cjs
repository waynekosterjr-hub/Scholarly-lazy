const fs = require('fs');
let content = fs.readFileSync('src/components/Header.tsx', 'utf8');

// Import Moon and Sun icons
content = content.replace(
  'ChevronDown,',
  'ChevronDown,\n  Moon,\n  Sun,'
);

// Add props to interface
content = content.replace(
  'isProofreading?: boolean;',
  'isProofreading?: boolean;\n  isDarkMode: boolean;\n  onToggleDarkMode: () => void;'
);

// Add props to component signature
content = content.replace(
  'isProofreading,',
  'isProofreading,\n  isDarkMode,\n  onToggleDarkMode,'
);

// Add toggle button in the Main Action Bar (Right side)
content = content.replace(
  '{/* Show Your Work Integrity Report */}',
  '{/* Dark Mode Toggle */}\n          <button\n            type="button"\n            onClick={onToggleDarkMode}\n            className="flex items-center justify-center w-8 h-8 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 transition"\n            title="Toggle Theme"\n          >\n            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}\n          </button>\n          {/* Show Your Work Integrity Report */}'
);

fs.writeFileSync('src/components/Header.tsx', content);
console.log('Header.tsx patched');
