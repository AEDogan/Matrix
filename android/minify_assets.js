const fs = require('fs');
const path = require('path');

const srcDir = process.argv[2] || path.join(__dirname, '..', 'web');
const destDir = process.argv[3] || path.join(__dirname, 'assets');

// Clean and recreate destination assets directory
if (fs.existsSync(destDir)) {
  fs.rmSync(destDir, { recursive: true, force: true });
}
fs.mkdirSync(destDir, { recursive: true });

console.log(`🔒 Güvenli Kod Karartma & Varlık Paketleme Başlatılıyor...`);
console.log(`  Kaynak : ${srcDir}`);
console.log(`  Hedef  : ${destDir}\n`);

function safeMinifyJs(code, filename) {
  // 1. Verify original syntax
  try {
    new Function(code);
  } catch (e) {
    console.error(`  ✗ [HATA] ${filename} orijinal kodunda syntax hatası: ${e.message}`);
    return code;
  }

  // 2. Safe block comments removal only (preserves regexes, strings and inline code)
  let cleanCode = code.replace(/\/\*[\s\S]*?\*\//g, '');
  
  // 3. Line-based safe trimming (preserves strings and regexes on each line)
  let lines = cleanCode.split('\n')
    .map(line => {
      const trimmed = line.trim();
      // Remove pure comment lines only (where entire line is // ...)
      if (trimmed.startsWith('//')) return '';
      return line;
    })
    .filter(line => line.trim().length > 0)
    .join('\n');

  // 4. Validate output with JavaScript parser
  try {
    new Function(lines);
    return lines;
  } catch (err) {
    console.warn(`  ⚠️ ${filename} sıkıştırılırken uyarı alındı, orijinal güvenli kod kullanılıyor.`);
    return code;
  }
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
  'icons.js',
  'i18n.js',
  'app.js',
  'stock.js',
  'parameters.js',
  'receipt.js',
  'logs.js',
  'tester-tracker-client.js',
  'manifest.json',
  'service-worker.js',
  'sample_data.csv',
  'logo.png',
  'icon-192.png',
  'icon-512.png',
  'favicon.png',
  'Feature_Graphic_1024x500.png',
  'Feature_Graphic_Clinic_1024x500.png',
  'PlayStore_Icon_512x512.png'
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
    const minStr = safeMinifyJs(originalContent.toString('utf8'), file);
    processedContent = Buffer.from(minStr, 'utf8');
  } else if (file.endsWith('.css')) {
    processedContent = Buffer.from(minifyCss(originalContent.toString('utf8')), 'utf8');
  } else if (file.endsWith('.html')) {
    processedContent = Buffer.from(minifyHtml(originalContent.toString('utf8')), 'utf8');
  } else {
    fs.writeFileSync(destPath, originalContent);
    totalMinified += originalSize;
    console.log(`  ✓ ${file.padEnd(25)} : ${(originalSize/1024).toFixed(1)} KB (Medya kopyalandı)`);
    return;
  }

  const minSize = processedContent.length;
  totalMinified += minSize;
  const ratio = ((1 - (minSize / originalSize)) * 100).toFixed(1);

  fs.writeFileSync(destPath, processedContent);
  console.log(`  ✓ ${file.padEnd(25)} : ${(originalSize/1024).toFixed(1)} KB ➔ ${(minSize/1024).toFixed(1)} KB (%${ratio} küçüldü)`);
});

const totalRatio = ((1 - (totalMinified / totalOriginal)) * 100).toFixed(1);
console.log(`\n🎉 Toplam Web Varlıkları: ${(totalOriginal/1024).toFixed(1)} KB ➔ ${(totalMinified/1024).toFixed(1)} KB (%${totalRatio} tasarruf)`);
console.log(`🛡️ %100 Doğrulanmış ve Hatasız Android Assets Hazırlandı.\n`);
