const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

pkg.main = "electron/main.cjs";

pkg.scripts = {
  ...pkg.scripts,
  "electron:dev": "concurrently -k \"npm run dev\" \"wait-on http://localhost:3000 && electron .\"",
  "electron:build": "npm run build && electron-builder --win"
};

pkg.build = {
  "appId": "com.academicresearch.app",
  "productName": "Academic Research Studio",
  "directories": {
    "output": "release/"
  },
  "files": [
    "dist/**/*",
    "electron/**/*",
    "package.json",
    "firebase-applet-config.json"
  ],
  "win": {
    "target": "nsis"
  }
};

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
