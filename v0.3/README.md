# SahaVeteriner - v0.3 Release

Bu klasör, SahaVeteriner projesinin **v0.3** sürümünün tüm kaynak kodlarını ve imzalanmış Android APK paketini içerir.

## 📦 Sürüm İçeriği
- **`SahaVeteriner_v0.3.apk`**: Android 5.0+ (API 21+) uyumlu, V1, V2, V3 imza şemaları ile imzalanmış bağımsız mobil uygulama paketi.
- **Web / PWA Kaynak Kodları**:
  - `index.html`: Saha ve mobil odaklı ana arayüz.
  - `styles.css`: Güneş ışığı ve koyu saha temalı, mobil korumalı CSS tasarım sistemi.
  - `app.js`: Canlı hesaplama motoru, sepet yönetimi ve modül koordinasyonu.
  - `receipt.js`: Retina kalitesinde JPG adisyon üretici ve WhatsApp dosya paylaşım servisi.
  - `stock.js`: Stok & envanter yönetimi, offline cache ve Google Sheets senkronizasyonu.
  - `parameters.js`: Dinamik maliyet parametreleri ve kârsız yalın gider giydirme motoru.
  - `logs.js`: Satış & teklif geçmişi kayıt ve CSV dışa aktarım modülü.
  - `service-worker.js` & `manifest.json`: Offline / PWA desteği.

## ✨ v0.3 ile Gelen Yenilikler & Düzeltmeler
1. **Masaüstü Görünüm Butonunun Kaldırılması:** Sağ üstteki masaüstü butonu kaldırılarak arayüz sadeleştirildi.
2. **Toggle Switch Taşma Düzeltmesi:** Mobil ekranlarda butonların kayma alanının dışına çıkması (büzüşme) engellendi.
3. **JPG Adisyon Motoru Yenilendi:** Her fiş oluşturmada taze Canvas örneği kullanılarak çizim ve çıktı kalitesi garanti altına alındı.
4. **WhatsApp JPG Paylaşımı:** Web Share API ve doğrudan görsel aktarım seçenekleri eklendi (`WhatsApp'a JPG Gönder`).
5. **Fiş Başlığı Güncellemesi:** *"Diğer Hizmet & Klinik Giderleri"* ibaresi *"Diğer Hizmet ve Sarf Bedelleri"* olarak güncellendi.
6. **Kilit Korumalı Google Sheets Link Alanı:** Stok sekmesinin en altına kilit açma/kapama korumalı URL yönetim ve güncelleme kartı eklendi.
