const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Add dark mode state
content = content.replace(
  'const [studentDirection, setStudentDirection] = useState<string>(defaultScenario.thesis);',
  'const [studentDirection, setStudentDirection] = useState<string>(defaultScenario.thesis);\n  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);\n\n  useEffect(() => {\n    if (isDarkMode) {\n      document.documentElement.classList.add("dark");\n    } else {\n      document.documentElement.classList.remove("dark");\n    }\n  }, [isDarkMode]);'
);

// Add to header props
content = content.replace(
  'isProofreading={isProofreading}',
  'isProofreading={isProofreading}\n        isDarkMode={isDarkMode}\n        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}'
);

fs.writeFileSync('src/App.tsx', content);
console.log('App.tsx patched');
