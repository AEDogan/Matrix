# 🐾 VetAssist v8.1 - Saha Veteriner Hekim Asistanı / Field Veterinary Assistant

<div align="center">

[![Android 15 Ready](https://img.shields.io/badge/Android%2015-Target%20SDK%2035-brightgreen.svg)](https://developer.android.com)
[![Google AdMob](https://img.shields.io/badge/AdMob-Integrated-blue.svg)](https://admob.google.com)
[![License: Proprietary](https://img.shields.io/badge/License-Proprietary-orange.svg)]()
[![Language: TR / EN](https://img.shields.io/badge/Language-TR%20%7C%20EN-blueviolet.svg)]()

[🇹🇷 Türkçe](#-türkçe) &nbsp;|&nbsp; [🇬🇧 English](#-english)

</div>

---

# 🇹🇷 Türkçe

**VetAssist**, saha veteriner hekimlerinin reçete/maliyet hesaplamalarını anında yapmasını, dinamik kâr marjı ve kilometre ücreti uygulamasını, stok takibi yapmasını ve WhatsApp üzerinden profesyonel görsel adisyon (JPG makbuz) paylaşmasını sağlayan modern bir Android ve Web uygulamasıdır.

### 🌟 Temel Özellikler
1. **Dinamik Maliyet & Fiyat Motoru:**
   * Tedavi (maliyet gizli, net fiyatlı) ve Teklif (kalem kalem detaylı) modları.
   * Dinamik kâr marjı (%), KM başı yol ücreti ve sabit klinik gider giydirme.
2. **📸 Görsel Adisyon (JPG Makbuz) Motoru:**
   * Tek tıkla veteriner klinik başlıklı, şık ve yüksek çözünürlüklü JPG adisyon görseli üretir.
   * WhatsApp üzerinden yetiştiriciye/çiftçiye tek tuşla görsel veya metin olarak gönderilir.
3. **🔄 Google Sheets Stok Senkronizasyonu & 🎬 Ödüllü Video Reklam:**
   * Google Sheets CSV bağlantısıyla tek tıkla tüm klinik ilac ve malzeme stoklarını eşitler.
   * Senkronizasyon işlemi Google AdMob Ödüllü Video Reklam (Rewarded Ad) izleme koşuluna bağlıdır.
4. **📢 Google AdMob Entegrasyonu:**
   * Sabit alt banner (Banner #1).
   * Stok listesi içi zarif sponsor alanı (Banner #2).
   * Geçmiş kayıtları sekmesi içi sponsor alanı (Banner #3).
   * Google Sheets senkronizasyonu ve gönüllü destek için Ödüllü Video Reklam (Rewarded Ad).
5. **🛡️ Otomatik Kod Karartma (Obfuscation & Minification):**
   * APK/AAB derlenirken tüm web varlıkları ve iş mantığı kodları otomatik karartılır ve sıkıştırılır.
6. **🌐 Çift Dil Desteği:**
   * Türkçe ve İngilizce tam dil desteği.
7. **⚡ Çevrimdışı (Offline) Çalışabilme:**
   * Köy ve ahır gibi internetin çekmediği sahalarda tüm hesaplama ve adisyon işlevleri kesintisiz çalışır.

---

### 📁 Dizin Yapısı
```text
C:\Projeler\VetAssist_v0.8\
├── web\                      # Orijinal Web Kaynak Kodları (HTML, JS, CSS, İkonlar)
│   ├── index.html            # Ana arayüz ve sekme mimarisi
│   ├── styles.css            # Glassmorphism & Sunlight temaları
│   ├── app.js                # Ana kontrolcü ve reaktif hesaplama
│   ├── stock.js              # İlaç/stok yönetimi ve Google Sheets CSV entegrasyonu
│   ├── parameters.js         # Maliyet, KM ve kâr marjı parametreleri
│   ├── receipt.js            # JPG adisyon ve görsel makbuz motoru
│   ├── logs.js               # Satış ve teklif geçmişi
│   ├── i18n.js               # Türkçe / İngilizce dil paketi
│   ├── manifest.json         # PWA yapılandırması
│   └── assets                # Logo, ikonlar ve Play Store grafikleri
│
├── android\                  # Android Native Wrapper & Derleme Katmanı
│   ├── AndroidManifest.xml   # Target SDK 35 (Android 15), İzinler & Reklam ID'si
│   ├── src\                  # MainActivity.java, AppFileProvider.java
│   ├── res\                  # XML kaynakları, stiller, strings.xml
│   ├── admob_libs\           # Google Play Services Ads SDK kütüphaneleri
│   ├── sahaveteriner_release.keystore # Dijital İmzalama Anahtarı
│   ├── minify_assets.js      # Otomatik kod karartma ve sıkıştırma betiği
│   └── build_all.ps1         # ⚡ Tek Tıkla Release APK & Play Store AAB Derleme Betiği
│
├── dist\                     # Derlenmiş İmzalı Üretim Paketleri (v0.8)
│   ├── VetAssist_v0.8_PlayStore.aab
│   ├── VetAssist_v0.8_Release.apk
│   └── VetAssist_v0.8_Test_Yuklenebilir.apk
│
└── README.md                 # Bu döküman
```

---

### ⚡ Tek Tıkla Derleme (Build Pipeline)
```powershell
powershell -ExecutionPolicy Bypass -File "C:\Projeler\VetAssist_v0.8\android\build_all.ps1"
```

### 🔑 Dijital İmza (Keystore) Bilgileri
* **Alias:** `sahaveteriner` | **Şifre:** `sahaveteriner2026` | **Hedef SDK:** `35 (Android 15)`

---

# 🇬🇧 English

**VetAssist** is a modern Android and Web application designed for field veterinarians to calculate treatment and medication costs in real-time, apply custom profit margins and travel distance fees, manage clinic inventory, and share branded visual JPG receipts with clients via WhatsApp.

### 🌟 Key Features
1. **Dynamic Pricing & Cost Engine:**
   * Two operational modes: **Treatment** (hidden cost breakdown, clean total) and **Quote** (itemized breakdown).
   * Dynamic profit margin (%), mileage/distance travel fees, and clinic fixed expense distribution.
2. **📸 Visual Receipt Generator (JPG Engine):**
   * Generates high-resolution, branded JPG receipt slips with a single tap.
   * Shares directly to WhatsApp as an image or clean text slip.
3. **🔄 Google Sheets Stock Sync & 🎬 Rewarded Video Ad:**
   * Synchronizes medication and supply inventory from a published Google Sheets CSV.
   * Sync action is gated by a Google AdMob Rewarded Video Ad.
4. **📢 Google AdMob Integration:**
   * Bottom sticky banner (Banner #1).
   * In-feed sponsored glassmorphism card in Stock list (Banner #2).
   * In-feed sponsored card in Logs / History list (Banner #3).
   * Rewarded Video Ads for inventory sync and developer support.
5. **🛡️ Automated Code Obfuscation & Minification:**
   * All JavaScript, CSS, and HTML assets are automatically minified, stripped of comments, and protected during APK/AAB build.
6. **🌐 Full Bilingual Support:**
   * Seamless English and Turkish localization with dynamic language switching.
7. **⚡ 100% Offline Capability:**
   * Fully functional in rural barns and remote areas without cellular connection.

---

### ⚡ 1-Click Build Command
Run the PowerShell build pipeline to produce signed production APK and Google Play Store AAB:
```powershell
powershell -ExecutionPolicy Bypass -File "C:\Projeler\VetAssist_v0.8\android\build_all.ps1"
```
