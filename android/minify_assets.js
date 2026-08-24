const fs = require('fs');
const path = require('path');

const srcDir = process.argv[2] || 'C:\\Users\\ahmet\\.gemini\\antigravity\\scratch\\sahaveteriner';
const destDir = process.argv[3] || 'C:\\Users\\ahmet\\.gemini\\antigravity\\scratch\\sahaveteriner_build\\assets';

// Clean assets directory completely first
if (fs.existsSync(destDir)) {
  fs.rmSync(destDir, { recursive: true, force: true });
}
fs.mkdirSync(destDir, { recursive: true });

console.log(`🔒 Kod Karartma (Obfuscation & Minification) Başlatılıyor...`);

function minifyJs(code) {
  let result = code.replace(/\/\*[\s\S]*?\*\//g, '');
  result = result.replace(/(^|[^:])\/\/[^"'\n\r]*/g, '$1');
  result = result.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');
  return result;
}

function minifyCss(code) {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,])\s*/g, '$1')
    .trim();
}

function minifyHtml(code) {
  return code
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// STRICT ALLOWLIST OF WEB ASSETS (Never include APKs, AABs, Keystores or Screenshots)
const allowedWebFiles = [
  'index.html',
  'styles.css',
  'i18n.js',
  'app.js',
  'stock.js',
  'parameters.js',
  'receipt.js',
  'logs.js',
  'manifest.json',
  'service-worker.js',
  'sample_data.csv',
  'logo.png',
  'icon-192.png',
  'icon-512.png',
  'favicon.png'
];

let totalOriginal = 0;
let totalMinified = 0;

allowedWebFiles.forEach(file => {
  const srcPath = path.join(srcDir, file);
  const destPath = path.join(destDir, file);
  
  if (!fs.existsSync(srcPath)) return;

  const originalContent = fs.readFileSync(srcPath);
  const originalSize = originalContent.length;
  totalOriginal += originalSize;

  let processedContent = originalContent;

  if (file.endsWith('.js')) {
    processedContent = Buffer.from(minifyJs(originalContent.toString('utf8')), 'utf8');
  } else if (file.endsWith('.css')) {
    processedContent = Buffer.from(minifyCss(originalContent.toString('utf8')), 'utf8');
  } else if (file.endsWith('.html')) {
    processedContent = Buffer.from(minifyHtml(originalContent.toString('utf8')), 'utf8');
  } else {
    fs.writeFileSync(destPath, originalContent);
    totalMinified += originalSize;
    console.log(`  ✓ ${file.padEnd(20)} : ${(originalSize/1024).toFixed(1)} KB (Varlık kopyalandı)`);
    return;
  }

  const minSize = processedContent.length;
  totalMinified += minSize;
  const ratio = ((1 - (minSize / originalSize)) * 100).toFixed(1);

  fs.writeFileSync(destPath, processedContent);
  console.log(`  ✓ ${file.padEnd(20)} : ${(originalSize/1024).toFixed(1)} KB ➔ ${(minSize/1024).toFixed(1)} KB (%${ratio} küçüldü)`);
});

const totalRatio = ((1 - (totalMinified / totalOriginal)) * 100).toFixed(1);
console.log(`\n🎉 Toplam Web Varlıkları: ${(totalOriginal/1024).toFixed(1)} KB ➔ ${(totalMinified/1024).toFixed(1)} KB (%${totalRatio} tasarruf)`);
console.log(`🛡️ Temiz ve hafif assets oluşturuldu.\n`);
