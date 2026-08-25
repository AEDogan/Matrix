/**
 * VetAssist - Modern Interactive Controller & i18n Engine
 */

// --- 1. Multilingual Dictionary (EN / TR) ---
const i18nData = {
  en: {
    brandName: "VetAssist",
    brandTag: "V1.0 RELEASE",
    navFeatures: "Features",
    navWorkflow: "Workflow",
    navDemo: "Live Demo",
    navPrivacy: "Privacy Policy",
    navDownload: "Download App",
    
    // Hero
    heroBadge: "The #1 Field Assistant for Large & Small Animal Vets",
    heroTitlePrefix: "Precision Veterinary Billing & Stock.",
    heroTitleGradient: "Zero Internet Needed.",
    heroSubtitle: "Empower your field practice with instantaneous medication billing, automated KM mileage calculation, inventory alerts, and instant WhatsApp slip generation.",
    btnGetStarted: "Try Live Demo",
    btnLearnMore: "Explore Features",
    statOffline: "100% Offline",
    statOfflineLabel: "Works in Remote Farms",
    statSlip: "< 0.5s",
    statSlipLabel: "JPG Slip Generation",
    statActiveVets: "50+ Clinics",
    statActiveVetsLabel: "Field Tested & Approved",
    
    // Live Simulator Card
    simTopTitle: "LIVE BILLING SIMULATOR",
    simSelectLabel: "Clinical Service / Treatment",
    simItem1: "Antibiotic Injection + General Exam ($45.00)",
    simItem2: "Vaccination Protocol (3 Head) ($60.00)",
    simItem3: "Bovine Calving & Obstetric Care ($120.00)",
    simItem4: "Surgical Wound Treatment & Dressing ($85.00)",
    simKmLabel: "Field Travel Distance (KM)",
    simKmRateNote: "($0.75 / KM)",
    simSubtotal: "Medication & Service",
    simKmFee: "Mileage Allowance",
    simVat: "Estimated Tax (18%)",
    simTotal: "Total Due",
    simNotice: "OFFICIAL VETERINARY FIELD SLIP (PREVIEW)",
    btnSimShare: "Share via WhatsApp (Simulated)",
    
    // Features / Bento Grid
    featSectionTag: "ENGINEERED FOR THE FIELD",
    featSectionTitle: "Every tool a field vet needs in one pocket.",
    featSectionDesc: "Eliminate manual bookkeeping, calculate accurate farm-visit bills on the spot, and share professional visual slips with livestock owners in seconds.",
    
    bento1Title: "Offline-First Engine",
    bento1Desc: "Full functionality without cellular reception. Calculate costs, check stock, and produce slips deep in mountain pastures or rural farmsteads.",
    
    bento2Title: "Visual JPG Receipt Generator",
    bento2Desc: "Generates high-contrast ~35KB lightweight image slips with bank IBAN, clinic branding, and itemized costs ready to share via WhatsApp with one tap.",
    
    bento3Title: "Smart Distance & KM Engine",
    bento3Desc: "Automatic round-trip mileage calculation with instant preset distance chips (+5, +10, +15, +25 KM) tailored to veterinary travel fees.",
    
    bento4Title: "Live Stock & Critical Alerts",
    bento4Desc: "Prevents running out of life-saving medicine with automatic minimum threshold warnings and seamless Google Sheets CSV synchronization.",
    
    bento5Title: "Confidential Cost Masking",
    bento5Desc: "Customize profit margins and clinical overheads. Group internal expenses under 'Service Fee' so proprietary costs remain private.",
    
    // Workflow
    workSectionTag: "HOW IT WORKS",
    workSectionTitle: "Fast 4-Step Field Workflow",
    step1Title: "1. Select Treatment",
    step1Desc: "Pick medicines or procedures with autocomplete search and multi-item basket additions.",
    step2Title: "2. Add Travel KM",
    step2Desc: "Tap mileage chips to instantly include your clinic's travel and transport overhead.",
    step3Title: "3. Review Live Slip",
    step3Desc: "Examine the dynamic on-screen breakdown with automatic tax and currency calculation.",
    step4Title: "4. Send via WhatsApp",
    step4Desc: "Produce a crisp image slip and dispatch it directly to the customer's phone.",
    
    // Offline Banner
    offlineTitle: "Tested in high-glare sunlight & muddy barns.",
    offlineDesc: "Designed with oversized touch buttons, high-contrast daylight mode, and dark-night emergency palette for real veterinary field conditions.",
    
    // CTA
    ctaTitle: "Upgrade your veterinary field practice today.",
    ctaDesc: "Join veterinary practitioners who save hours of accounting every week with VetAssist.",
    btnDownloadApk: "Download Release APK (.apk)",
    btnPlayStore: "Google Play Bundle (.aab)",
    
    // Privacy Policy
    privacyTitle: "Privacy Policy",
    privacyClose: "Close",
    privacyDocTitle: "VetAssist Application Privacy Policy",
    privacyDocUpdated: "Last Updated: August 2026",
    privacyP1: "At VetAssist ('we', 'our', or 'the App'), we prioritize the absolute privacy and data sovereignty of veterinary practitioners, clinics, and their clients.",
    privacyH1: "1. Zero Cloud Tracking & 100% Local Storage",
    privacyP2: "VetAssist operates on an Offline-First architecture. All medication databases, price lists, stock inventories, customer logs, and clinical calculation parameters are stored strictly locally on your device (via LocalStorage/SQLite/Internal Storage). We do NOT collect, transmit, or store your clinical billing data on external cloud servers.",
    privacyH2: "2. Permissions Used by the Application",
    privacyP3: "VetAssist requests only minimal, necessary system permissions to execute core offline functions:",
    privacyLi1: "<strong>Storage / Media Access:</strong> Required solely to save and export generated JPG adisyon/receipt image slips to your device so they can be shared via WhatsApp or printer.",
    privacyLi2: "<strong>Internet / Network (Optional):</strong> Used only when the user explicitly triggers a manual Google Sheets CSV inventory synchronization. No personal data is sent.",
    privacyH3: "3. Third-Party Sharing & Advertising",
    privacyP4: "We do not sell, rent, monetize, or transfer any user data, veterinary records, or client phone numbers to any third parties or advertising networks.",
    privacyH4: "4. Contact and Support",
    privacyP5: "For privacy questions, feature requests, or clinic onboarding, please contact us at: <strong>support@vetassist.app</strong>.",
    
    // Footer
    footerDesc: "The specialized field calculation and inventory suite built for modern veterinarians.",
    footerNavHead: "Navigation",
    footerLegalHead: "Legal & Security",
    footerCopy: "© 2026 VetAssist. All rights reserved. Designed with precision."
  },
  tr: {
    brandName: "VetAssist",
    brandTag: "V1.0 SÜRÜM",
    navFeatures: "Özellikler",
    navWorkflow: "Nasıl Çalışır?",
    navDemo: "Canlı Demo",
    navPrivacy: "Gizlilik Politikası",
    navDownload: "Uygulamayı İndir",
    
    // Hero
    heroBadge: "Saha ve Klinik Veteriner Hekimleri İçin 1 Numaralı Asistan",
    heroTitlePrefix: "Hassas Veteriner Adisyon & Stok.",
    heroTitleGradient: "İnternet Gerekmez.",
    heroSubtitle: "Saha hekimliğinizi anında ilaç hesaplama, otomatik KM yol ücreti, kritik stok uyarıları ve tek tıkla WhatsApp görsel fiş (adisyon) üretimiyle güçlendirin.",
    btnGetStarted: "Canlı Demoyu Dene",
    btnLearnMore: "Özellikleri İncele",
    statOffline: "%100 Çevrimdışı",
    statOfflineLabel: "Köylerde & Sahada Tam Fonksiyonel",
    statSlip: "< 0.5 sn",
    statSlipLabel: "JPG Adisyon Üretim Hızı",
    statActiveVets: "50+ Klinik",
    statActiveVetsLabel: "Sahada Test Edildi & Onaylandı",
    
    // Live Simulator Card
    simTopTitle: "CANLI HESAPLAMA SİMÜLATÖRÜ",
    simSelectLabel: "Klinik Hizmet / Uygulama",
    simItem1: "Antibiyotik Enjeksiyonu + Genel Muayene (1.250 ₺)",
    simItem2: "Aşı Protokolü (3 Baş Sığır) (1.800 ₺)",
    simItem3: "Büyükbaş Doğum & Obstetrik Müdahale (3.500 ₺)",
    simItem4: "Cerrahi Yara Tedavisi & Pansuman (2.200 ₺)",
    simKmLabel: "Gidilen Mesafe (KM)",
    simKmRateNote: "(25 ₺ / KM)",
    simSubtotal: "İlaç & Hizmet Tutarı",
    simKmFee: "Mesafe (Yol) Ücreti",
    simVat: "KDV (%20)",
    simTotal: "Toplam Ödenecek",
    simNotice: "MALİ BELGE DEĞİLDİR (ÖNİZLEME)",
    btnSimShare: "WhatsApp ile Paylaş (Simülasyon)",
    
    // Features / Bento Grid
    featSectionTag: "SAHA ŞARTLARI İÇİN GELİŞTİRİLDİ",
    featSectionTitle: "Bir saha hekiminin ihtiyaç duyduğu her şey cebinde.",
    featSectionDesc: "Karmaşık hesap defterlerini geride bırakın. Çiftlik ziyaretlerinde doğru fiyatı anında çıkarın ve hayvan sahibine saniyeler içinde şık bir görsel adisyon iletin.",
    
    bento1Title: "Çevrimdışı (Offline-First) Mimari",
    bento1Desc: "Şebekenin çekmediği ücra köylerde ve ahırlarda tam kapasite çalışır. Maliyetleri hesaplayın, stokları kontrol edin ve fiş üretin.",
    
    bento2Title: "Görsel JPG Adisyon Üreticisi",
    bento2Desc: "Klinik logosu, banka IBAN bilgileri ve kalem detaylarını içeren ~35 KB boyutunda net adisyon görsellerini tek dokunuşla WhatsApp'tan paylaşın.",
    
    bento3Title: "Akıllı KM & Yol Ücret Motoru",
    bento3Desc: "Tek tıkla eklenen hızlı KM çipleri (+5, +10, +15, +25 KM) ve otomatik gidiş-dönüş mesafe katsayısı ile yol maliyetinizi güvenceye alın.",
    
    bento4Title: "Kritik Stok Takibi & Uyarılar",
    bento4Desc: "Minimum stok seviyesine düşen hayati ilaçlar için anında kırmızı uyarı verir. Google E-Tablolar CSV senkronizasyonu ile listenizi güncel tutar.",
    
    bento5Title: "Gizli Maliyet Maskelemesi",
    bento5Desc: "Kâr marjınızı ve klinik genel giderlerinizi fişte müşteriye açık etmeden 'Hizmet Bedeli' altında profesyonelce birleştirin.",
    
    // Workflow
    workSectionTag: "İŞ AKIŞI",
    workSectionTitle: "4 Basit Adımda Saha Çözümü",
    step1Title: "1. İlaç / İşlem Seçin",
    step1Desc: "Arama kutusundan ürünleri bulun, tek tıkla sepete ekleyin ve dozajı belirleyin.",
    step2Title: "2. Yol Mesafesini Ekleyin",
    step2Desc: "Hızlı KM çiplerine dokunarak klinik yol masrafını otomatik fiyata yansıtın.",
    step3Title: "3. Canlı Fişi İnceleyin",
    step3Desc: "KDV ve kalem dökümünü içeren dijital adisyonu onaylamadan önce ekranda görün.",
    step4Title: "4. WhatsApp'tan Gönderin",
    step4Desc: "Yüksek çözünürlüklü JPG slip görselini doğrudan hasta sahibine ulaştırın.",
    
    // Offline Banner
    offlineTitle: "Güneş parlamasında ve saha çamurunda test edildi.",
    offlineDesc: "Geniş dokunmatik butonlar, yüksek kontrastlı açık tema ve gece nöbetleri için koyu mod ile gerçek saha hekimliği ergonomisi.",
    
    // CTA
    ctaTitle: "Saha hekimliğinizi bugün modernleştirin.",
    ctaDesc: "VetAssist ile her hafta saatlerce süren hesaplama ve adisyon karmaşasından kurtulan veteriner hekimlerin arasına katılın.",
    btnDownloadApk: "İmzalı Release APK (.apk)",
    btnPlayStore: "Google Play Paketi (.aab)",
    
    // Privacy Policy
    privacyTitle: "Gizlilik Politikası",
    privacyClose: "Kapat",
    privacyDocTitle: "VetAssist Uygulaması Gizlilik Politikası",
    privacyDocUpdated: "Son Güncelleme: Ağustos 2026",
    privacyP1: "VetAssist ('biz', 'bizim' veya 'Uygulama') olarak veteriner hekimlerin, kliniklerin ve hasta sahiplerinin veri gizliliğine en üst düzeyde önem veriyoruz.",
    privacyH1: "1. Sıfır Bulut Takibi & %100 Yerel Veri Saklama",
    privacyP2: "VetAssist tamamen Çevrimdışı (Offline-First) prensibiyle çalışır. İlaç listeleriniz, fiyatlarınız, stok verileriniz, müşteri kayıtlarınız ve maliyet parametreleriniz yalnızca sizin cihazınızda (LocalStorage/SQLite/Yerel Hafıza) tutulur. Verileriniz hiçbir harici sunucuya aktarılmaz veya kaydedilmez.",
    privacyH2: "2. Uygulama İzinleri",
    privacyP3: "VetAssist yalnızca temel çevrimdışı işlevleri yerine getirmek için gereken minimum izinleri talep eder:",
    privacyLi1: "<strong>Depolama / Medya Erişimi:</strong> Yalnızca üretilen JPG adisyon slip görselini cihazınıza kaydetmek ve WhatsApp ile paylaşabilmeniz için kullanılır.",
    privacyLi2: "<strong>İnternet Erişimi (Opsiyonel):</strong> Yalnızca kullanıcının isteğiyle Google E-Tablolar'dan CSV stok senkronizasyonu yapıldığı anda kullanılır. Hiçbir kişisel veri gönderilmez.",
    privacyH3: "3. Üçüncü Taraflarla Veri Paylaşımı",
    privacyP4: "Hiçbir kullanıcı veya müşteri bilgisi, telefon numarası veya klinik verisi üçüncü taraflara satılmaz, kiralanmaz veya reklam amacıyla paylaşılamaz.",
    privacyH4: "4. İletişim ve Destek",
    privacyP5: "Gizlilik politikasıyla ilgili tüm soru ve destek talepleriniz için bize <strong>support@vetassist.app</strong> adresinden ulaşabilirsiniz.",
    
    // Footer
    footerDesc: "Modern veteriner hekimler için geliştirilmiş saha hesaplama ve stok yönetim asistanı.",
    footerNavHead: "Menü",
    footerLegalHead: "Yasal & Güvenlik",
    footerCopy: "© 2026 VetAssist. Tüm hakları saklıdır."
  }
};

let currentLang = 'en';

// Set language function
function setLanguage(lang) {
  currentLang = lang;
  document.documentElement.lang = lang;
  
  // Update Buttons
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
  
  const dict = i18nData[lang];
  
  // Update text nodes with data-i18n
  document.querySelectorAll('[data-i18n]').forEach(elem => {
    const key = elem.dataset.i18n;
    if (dict[key]) {
      elem.innerHTML = dict[key];
    }
  });
  
  // Update select options inside simulator
  updateSimulatorCalculations();
}

// --- 2. Interactive Live Price Calculator Simulation ---
const samplePrices = {
  en: [
    { name: "Antibiotic Injection + Exam", price: 45.0, currency: "$" },
    { name: "Vaccination Protocol (3 Head)", price: 60.0, currency: "$" },
    { name: "Bovine Calving & Obstetric Care", price: 120.0, currency: "$" },
    { name: "Surgical Wound Treatment", price: 85.0, currency: "$" }
  ],
  tr: [
    { name: "Antibiyotik Enjeksiyonu + Muayene", price: 1250.0, currency: "₺" },
    { name: "Aşı Protokolü (3 Baş)", price: 1800.0, currency: "₺" },
    { name: "Büyükbaş Doğum Müdahalesi", price: 3500.0, currency: "₺" },
    { name: "Cerrahi Yara Tedavisi", price: 2200.0, currency: "₺" }
  ]
};

let selectedItemIndex = 0;
let currentKm = 15;

function updateSimulatorCalculations() {
  const items = samplePrices[currentLang];
  const item = items[selectedItemIndex] || items[0];
  const kmRate = currentLang === 'en' ? 0.75 : 25.0;
  const vatRate = 0.18; // 18%
  
  const baseServicePrice = item.price;
  const kmPrice = currentKm * kmRate;
  const subtotal = baseServicePrice + kmPrice;
  const vatAmount = subtotal * vatRate;
  const grandTotal = subtotal + vatAmount;
  
  const curr = item.currency;
  
  // Update simulator UI values
  const elBasePrice = document.getElementById('sim-base-price');
  const elKmPrice = document.getElementById('sim-km-price');
  const elVatPrice = document.getElementById('sim-vat-price');
  const elTotalPrice = document.getElementById('sim-total-price');
  const elReceiptItemName = document.getElementById('sim-receipt-item-name');
  const elReceiptKmText = document.getElementById('sim-receipt-km-text');
  
  if (elBasePrice) elBasePrice.textContent = `${curr}${baseServicePrice.toLocaleString()}`;
  if (elKmPrice) elKmPrice.textContent = `${curr}${kmPrice.toLocaleString()}`;
  if (elVatPrice) elVatPrice.textContent = `${curr}${vatAmount.toFixed(1).toLocaleString()}`;
  if (elTotalPrice) elTotalPrice.textContent = `${curr}${grandTotal.toFixed(1).toLocaleString()}`;
  
  if (elReceiptItemName) elReceiptItemName.textContent = item.name;
  if (elReceiptKmText) elReceiptKmText.textContent = `${currentKm} KM (${curr}${kmRate}/KM)`;
}

// --- 3. Modal Handling (Privacy Policy) ---
function openPrivacyModal() {
  const modal = document.getElementById('privacy-modal');
  if (modal) {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function closePrivacyModal() {
  const modal = document.getElementById('privacy-modal');
  if (modal) {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }
}

// --- 4. Event Listeners & Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  // Init language
  setLanguage('en');
  
  // Language button clicks
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setLanguage(btn.dataset.lang);
    });
  });
  
  // Service Select in Simulator
  const serviceSelect = document.getElementById('sim-service-select');
  if (serviceSelect) {
    serviceSelect.addEventListener('change', (e) => {
      selectedItemIndex = parseInt(e.target.value, 10);
      updateSimulatorCalculations();
    });
  }
  
  // KM input & chips
  const kmInput = document.getElementById('sim-km-input');
  if (kmInput) {
    kmInput.value = currentKm;
    kmInput.addEventListener('input', (e) => {
      currentKm = Math.max(0, parseInt(e.target.value, 10) || 0);
      updateSimulatorCalculations();
    });
  }
  
  document.querySelectorAll('.km-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.km-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentKm = parseInt(chip.dataset.km, 10);
      if (kmInput) kmInput.value = currentKm;
      updateSimulatorCalculations();
    });
  });
  
  // Privacy Policy Trigger
  document.querySelectorAll('.trigger-privacy').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      openPrivacyModal();
    });
  });
  
  const modalCloseBtn = document.getElementById('privacy-modal-close');
  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closePrivacyModal);
  }
  
  const modalFooterCloseBtn = document.getElementById('privacy-modal-footer-close');
  if (modalFooterCloseBtn) {
    modalFooterCloseBtn.addEventListener('click', closePrivacyModal);
  }
  
  const modalOverlay = document.getElementById('privacy-modal');
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closePrivacyModal();
    });
  }
  
  // WhatsApp Share Simulation Feedback
  const shareBtn = document.getElementById('sim-share-btn');
  if (shareBtn) {
    shareBtn.addEventListener('click', () => {
      const items = samplePrices[currentLang];
      const item = items[selectedItemIndex] || items[0];
      const curr = item.currency;
      const alertMsg = currentLang === 'en'
        ? `📲 [WhatsApp Preview]\n🐾 VetAssist Slip Generated!\nService: ${item.name}\nDistance: ${currentKm} KM\nTotal: ${document.getElementById('sim-total-price').textContent}\n\n*Official Field Receipt Attached (35 KB JPG)*`
        : `📲 [WhatsApp Önizleme]\n🐾 VetAssist Adisyonu Hazırlandı!\nHizmet: ${item.name}\nMesafe: ${currentKm} KM\nÖdenecek: ${document.getElementById('sim-total-price').textContent}\n\n*Klinik Görsel Fişi Ektedir (35 KB JPG)*`;
      alert(alertMsg);
    });
  }
  
  // Check URL hash for direct privacy link
  if (window.location.hash === '#privacy') {
    openPrivacyModal();
  }
});
