# 🐾 VetAssist v0.8 - Saha Veteriner Hekim Asistanı

VetAssist, saha veteriner hekimlerinin maliyet hesaplama, stok takibi, adisyon (makbuz) oluşturma ve WhatsApp üzerinden görsel paylaşım yapmasını sağlayan modern bir Android uygulamasıdır.

---

## 📁 Proje Dizin Yapısı

```text
C:\Projeler\VetAssist_v0.8\
├── web\                      # Orijinal Web Kaynak Kodları (HTML / JS / CSS)
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
├── dist\                     # Üretilen İmzalı Yayın Paketleri
│   ├── VetAssist_v0.8_PlayStore.aab
│   ├── VetAssist_v0.8_Release.apk
│   └── VetAssist_v0.8_Test_Yuklenebilir.apk
│
└── README.md                 # Bu döküman
```

---

## ⚡ Tek Tıkla Derleme (Build Pipeline)

Yeni bir güncelleme yaptığınızda doğrudan PowerShell üzerinden şu komutu çalıştırmanız yeterlidir:

```powershell
powershell -ExecutionPolicy Bypass -File "C:\Projeler\VetAssist_v0.8\android\build_all.ps1"
```

Bu betik otomatik olarak:
1. `web\` klasöründeki kodları sıkıştırıp karartır (`Minification & Obfuscation`).
2. Android kaynaklarını ve Java sınıflarını derler.
3. Android 15 uyumlu **Release APK** ve **Google Play Store AAB** dosyalarını üretip imzalar.
4. Paketleri hem `dist\` klasörüne hem de **Masaüstünüzdeki `VetAssist_PlayStore_v0.8`** klasörüne aktarır.

---

## 🔑 Dijital Anahtar (Keystore) Bilgileri

* **Keystore Konumu:** `C:\Projeler\VetAssist_v0.8\android\sahaveteriner_release.keystore`
* **Key Alias:** `sahaveteriner`
* **Keystore Şifresi:** `sahaveteriner2026`
* **İmza Algoritması:** RSA 2048-bit (v1, v2, v3 Signature Schemes)

---

## 📢 Google AdMob Yapılandırması

* **AdMob Uygulama Kimliği (App ID):** `ca-app-pub-5230008726928578~8135974410`
* **1. Sabit Alt Banner:** `ca-app-pub-5230008726928578/5973729983`
* **3. Geçmiş Sekmesi Bannerı:** `ca-app-pub-5230008726928578/1083677026`
* **🎬 Ödüllü Video Reklam (Google Sheets Sync):** `ca-app-pub-5230008726928578/6663306766`
