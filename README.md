# 🐾 SahaVeteriner - Fiyat Hesaplama & Adisyon Uygulaması

Saha veteriner hekimlerinin internet bağlantısı olan veya olmayan (offline) ortamlarda ilaç/malzeme maliyetleri, mesafe (KM) ücreti ve klinik hizmet bedellerini kullanarak hızlıca fiyat hesaplamasını ve sonucunu **WhatsApp üzerinden görsel adisyon (JPG slip)** olarak paylaşmasını sağlayan açık kaynaklı saha uygulaması.

---

## 🌟 Temel Özellikler

- **☀️ Güneş Işığı & Saha Ergonomisi:** Açık alanda parlamayı önleyen yüksek kontrastlı açık tema, gece nöbeti için koyu tema, büyük dokunmatik butonlar.
- **⚡ Canlı Fiyat Hesaplama:**
  - Hızlı ilaç/ürün arama (autocomplete) + **"+ Çoklu Kalem Ekle"** seçeneği.
  - Mesafe (KM) girişi ve tek tıkla hızlı KM çipleri (+5, +10, +15, +25 km).
  - Canlı ara toplam, KDV (%18 / %20) anahtarı ve büyük ödenecek tutar göstergesi.
- **📦 Stok Takip & Envanter Yönetimi (Ayrı Ekran):**
  - Minimum stok sınırına düşen ürünler için `🚨 KRİTİK STOK` uyarısı.
  - Tablo üzerinden anında `+` / `-` stok güncelleme.
  - Google Sheets CSV bağlantısından veya yerel CSV dosyasından senkronizasyon.
- **⚙️ Dinamik Maliyet Parametreleri & Görünürlük Maskelemesi:**
  - Kâr marjı, KM ücreti, klinik gideri ve ek maliyet kalemlerini özelleştirme/silme.
  - Fişte tek başına görünmesini istemediğiniz kalemler için `🔒 "Diğer Giderler" Olarak Birleştir` seçeneği.
- **📄 Görsel Fiş (Adisyon / JPG) & WhatsApp Paylaşımı:**
  - Onay öncesi hekime tam ekran interaktif önizleme.
  - HTML5 Canvas ile piksel hassasiyetinde optimize (~35 KB) JPG slip üretimi.
  - WhatsApp metin formatı ve görsel paylaşımı.
  - IBAN, Banka, Klinik Adresi, İletişim Telefonu ve kırmızı **MALİ BELGE DEĞİLDİR** ibaresi.
- **📱 Android & Offline-First:**
  - Cihazın yerel hafızasında (LocalStorage / Service Worker / PWA) çalışır; internetsiz köylerde bile tam fonksiyoneldir.
  - İleride APK olarak derlemek isteyenler için hazır `flutter_code/` kaynak dosyaları.

---

## 🚀 Kurulum ve Çalıştırma

### 1. Yerel Olarak Çalıştırma (Web / Mobil Tarayıcı)
Node.js yüklü herhangi bir sistemde tek komutla çalıştırabilirsiniz:

```bash
# Sunucuyu başlat
node server.js
```

Tarayıcınızda açın:
👉 `http://localhost:3000`

### 2. Android Telefona Uygulama Olarak Yükleme (PWA)
1. Telefonunuzun tarayıcısından (Chrome / Samsung Internet) uygulamanın adresine gidin.
2. Tarayıcı menüsünden **"Ana Ekrana Ekle" (Add to Home Screen)** veya **"Uygulamayı Yükle"** seçeneğine dokunun.
3. Uygulama telefonunuza yerel bir uygulama gibi kurulur ve internetsiz ortamda bile çalışır.

---

## 📂 Proje Yapısı

```
sahaveteriner/
├── index.html              # Ana arayüz ve modallar
├── styles.css              # Yüksek kontrastlı saha teması
├── app.js                  # Canlı hesaplama motoru ve sepet yönetimi
├── stock.js                # Ayrı stok & envanter yönetimi, Sheets senkronizasyonu
├── parameters.js           # Dinamik maliyet ve görünürlük maskelemesi
├── receipt.js              # Canvas JPG adisyon üreticisi ve WhatsApp servisi
├── manifest.json           # Android PWA tanımlayıcısı
├── service-worker.js       # Offline-first önbellek servisi
├── server.js               # Hafif yerel sunucu scripti
├── sample_data.csv         # Örnek veteriner ilaç ve maliyet tablosu
└── flutter_code/           # Native Flutter APK kaynak kodları
    ├── pubspec.yaml
    └── lib/
        ├── models/urun_model.dart
        ├── services/sheets_service.dart
        ├── widgets/receipt_widget.dart
        └── main.dart
```

---

## 📄 Lisans
MIT License - Dilediğiniz gibi kullanabilir ve geliştirebilirsiniz.
