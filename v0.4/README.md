# 🐾 VetAssist - Fiyat Hesaplama & Adisyon Uygulaması (Veterinary Field Billing & Assistant)

Saha veteriner hekimlerinin internet bağlantısı olan veya olmayan (offline) ortamlarda ilaç/malzeme maliyetleri, mesafe (KM) ücreti ve klinik hizmet bedellerini kullanarak hızlıca fiyat hesaplamasını ve sonucunu **WhatsApp üzerinden görsel adisyon (JPG slip)** olarak paylaşmasını sağlayan, Türkçe ve İngilizce destekli saha uygulaması.

---

## 🌟 Temel Özellikler

- **🌐 Türkçe & İngilizce Çoklu Dil Desteği:** Ayarlar sekmesinden tek tıkla dil değiştirme (TR/EN). Fiş görseli, WhatsApp metni ve tüm arayüz anında seçilen dile uyarlanır.
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
  - Cihazın yerel hafızasında (LocalStorage / Service Worker / PWA / Native APK) çalışır; internetsiz köylerde bile tam fonksiyoneldir.
  - Google Play Store uyumlu imzalı **Release APK** ve **Android App Bundle (.aab)** çıktıları.

---

## 🚀 Kurulum ve Çalıştırma

### 1. Yerel Olarak Çalıştırma (Web / Mobil Tarayıcı)
Node.js yüklü herhangi bir sistemde tek komutla çalıştırabilirsiniz:

```bash
node server.js
```

Tarayıcınızda açın:
👉 `http://localhost:3000`

---

## 📂 Proje Yapısı

```
sahaveteriner/
├── index.html              # Ana arayüz, 5 sekme ve modallar
├── styles.css              # Yüksek kontrastlı saha teması
├── i18n.js                 # Türkçe & İngilizce sözlük ve dinamik dil motoru
├── app.js                  # Canlı hesaplama motoru, sepet ve kontrolcü
├── stock.js                # Ayrı stok & envanter yönetimi, Sheets senkronizasyonu
├── parameters.js           # Dinamik maliyet ve görünürlük maskelemesi
├── logs.js                 # Satış ve fiyat teklifi arşiv modülü
├── receipt.js              # Canvas JPG adisyon üreticisi ve WhatsApp servisi
├── manifest.json           # Android PWA tanımlayıcısı
├── service-worker.js       # Offline-first önbellek servisi
├── server.js               # Hafif yerel sunucu scripti
└── sample_data.csv         # Örnek veteriner ilaç ve maliyet tablosu
```

---

## 📄 Lisans
MIT License - Dilediğiniz gibi kullanabilir ve geliştirebilirsiniz.
