const fs = require('fs');
const path = require('path');

const standalonePath = path.join(process.cwd(), '.next', 'standalone');

// 1. .next/static (CSS/JS) को standalone में कॉपी करें
const staticSrc = path.join(process.cwd(), '.next', 'static');
const staticDest = path.join(standalonePath, '.next', 'static');
if (fs.existsSync(staticSrc)) {
  fs.cpSync(staticSrc, staticDest, { recursive: true });
  console.log('✅ Copied static files (CSS/JS) successfully!');
} else {
  console.error('❌ .next/static not found!');
}

// 2. public (Images) को standalone में कॉपी करें
const publicSrc = path.join(process.cwd(), 'public');
const publicDest = path.join(standalonePath, 'public');
if (fs.existsSync(publicSrc)) {
  fs.cpSync(publicSrc, publicDest, { recursive: true });
  console.log('✅ Copied public files (Images) successfully!');
} else {
  console.warn('⚠️ public folder not found.');
}