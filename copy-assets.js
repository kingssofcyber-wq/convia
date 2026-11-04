const fs = require('fs');
const path = require('path');

const standaloneDir = path.join(__dirname, '.next', 'standalone');

// 1. public फोल्डर कॉपी करें (इमेजेस के लिए)
const publicSrc = path.join(__dirname, 'public');
const publicDest = path.join(standaloneDir, 'public');
if (fs.existsSync(publicSrc)) {
  fs.cpSync(publicSrc, publicDest, { recursive: true });
  console.log('✅ Copied public folder');
}

// 2. .next/static फोल्डर कॉपी करें (CSS और JS के लिए)
const staticSrc = path.join(__dirname, '.next', 'static');
const staticDest = path.join(standaloneDir, '.next', 'static');
if (fs.existsSync(staticSrc)) {
  fs.cpSync(staticSrc, staticDest, { recursive: true });
  console.log('✅ Copied static folder');
}