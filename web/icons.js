/**
 * VetAssist v8.1 - Pet & Veteriner İkon Kütüphanesi (icons.js)
 * Yüksek Çözünürlüklü, Yüksek Kontrastlı, Zengin Renkli Vektör İkonlar
 * 1. Adisyon Sekmesi: Stetoskoplu Yavru Köpek (Seçenek 1)
 * 2. Stok Sekmesi: Kemik Kulplu Ecza Çantası (Seçenek 2)
 * 3. Geçmiş Sekmesi: Pati Damgalı Defter Tutan Kedi (Seçenek 1)
 * 4. Uygulanan Tedavi: Canlı Kırmızı Kalp & Mavi Şırınga (Seçenek A)
 * 5. Fiyat Teklifi: Altın Pano & Pati Fiyat Rozeti (Seçenek B)
 * 6. Arama Çubukları: Büyüteçli Yavru Köpek (Seçenek 1)
 * 7. Ulaşım & KM: Veteriner Saha Ambulansı (Seçenek 1)
 * 8. Kritik Stok: Kemikli Uyarı Üçgeni (Seçenek 2)
 * 9. Adisyon Paylaş (Hero): Altın Parşömen & Yeşil/Altın Pati Mührü (Seçenek A)
 * 10. Sepete Ekle (Batch Modal): İlaçlı Nane Yeşili Pet Sepeti (Seçenek A)
 */

(function () {
  const PET_SVGS = {
    // 1. Adisyon Sekmesi: Stetoskoplu Yavru Köpek
    'dog-stethoscope': `
      <svg class="pet-svg" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7 19C7 25 11 28 16 28C21 28 25 25 25 19" stroke="#0284c7" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M16 28V30" stroke="#0284c7" stroke-width="2.4" stroke-linecap="round"/>
        <circle cx="16" cy="30" r="1.8" fill="#38bdf8" stroke="#0f172a" stroke-width="1.2"/>
        <path d="M7 11C4.5 11 3.5 13.5 3.5 16C3.5 18.5 5 20 7.5 19.5" fill="#f59e0b" stroke="#0f172a" stroke-width="2" stroke-linecap="round"/>
        <path d="M25 11C27.5 11 28.5 13.5 28.5 16C28.5 18.5 27 20 24.5 19.5" fill="#f59e0b" stroke="#0f172a" stroke-width="2" stroke-linecap="round"/>
        <rect x="6.5" y="7" width="19" height="15" rx="7.5" fill="#fef08a" stroke="#0f172a" stroke-width="2"/>
        <path d="M13 7H19V11C19 12.5 17.5 13.5 16 13.5C14.5 13.5 13 12.5 13 11V7Z" fill="#f59e0b"/>
        <circle cx="11.5" cy="13" r="1.5" fill="#0f172a"/>
        <circle cx="12" cy="12.5" r="0.5" fill="#ffffff"/>
        <circle cx="20.5" cy="13" r="1.5" fill="#0f172a"/>
        <circle cx="21" cy="12.5" r="0.5" fill="#ffffff"/>
        <ellipse cx="16" cy="15.8" rx="2.2" ry="1.5" fill="#0f172a"/>
        <path d="M14.5 17.5C15.2 18.5 16.8 18.5 17.5 17.5" stroke="#0f172a" stroke-width="1.6" stroke-linecap="round"/>
      </svg>
    `,

    // 2. Stok Sekmesi: Kemik Kulplu Ecza Çantası
    'kit-bone': `
      <svg class="pet-svg" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M11 6.5C10.2 6.5 9.5 5.8 9.5 5C9.5 4.2 10.2 3.5 11 3.5C11.5 3.5 12 3.8 12.3 4.2H19.7C20 3.8 20.5 3.5 21 3.5C21.8 3.5 22.5 4.2 22.5 5C22.5 5.8 21.8 6.5 21 6.5" fill="#fde047" stroke="#0f172a" stroke-width="2" stroke-linejoin="round"/>
        <path d="M12.5 6.5V8.5M19.5 6.5V8.5" stroke="#0f172a" stroke-width="2" stroke-linecap="round"/>
        <rect x="4.5" y="8.5" width="23" height="19" rx="4" fill="#a7f3d0" stroke="#0f172a" stroke-width="2"/>
        <rect x="7.5" y="11" width="3.2" height="3.2" rx="0.8" fill="#fde047" stroke="#0f172a" stroke-width="1.2"/>
        <rect x="21.5" y="11" width="3.2" height="3.2" rx="0.8" fill="#fde047" stroke="#0f172a" stroke-width="1.2"/>
        <rect x="14" y="13.5" width="4" height="9" rx="1" fill="#10b981" stroke="#0f172a" stroke-width="1"/>
        <rect x="11.5" y="16" width="9" height="4" rx="1" fill="#10b981" stroke="#0f172a" stroke-width="1"/>
        <circle cx="16" cy="18" r="1.3" fill="#ffffff"/>
      </svg>
    `,

    // 3. Geçmiş Sekmesi: Pati Damgalı Defter Tutan Kedi
    'cat-logbook': `
      <svg class="pet-svg" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <polygon points="7,12 10,4 14,9" fill="#f59e0b" stroke="#0f172a" stroke-width="2" stroke-linejoin="round"/>
        <polygon points="8.5,10.5 10.5,6 12.5,9" fill="#fbcfe8"/>
        <polygon points="25,12 22,4 18,9" fill="#f59e0b" stroke="#0f172a" stroke-width="2" stroke-linejoin="round"/>
        <polygon points="23.5,10.5 21.5,6 19.5,9" fill="#fbcfe8"/>
        <circle cx="16" cy="11.5" r="7.5" fill="#fef08a" stroke="#0f172a" stroke-width="2"/>
        <circle cx="13" cy="10.5" r="1.4" fill="#0f172a"/>
        <circle cx="13.4" cy="10.1" r="0.5" fill="#ffffff"/>
        <circle cx="19" cy="10.5" r="1.4" fill="#0f172a"/>
        <circle cx="19.4" cy="10.1" r="0.5" fill="#ffffff"/>
        <polygon points="16,12 15,13.5 17,13.5" fill="#ef4444"/>
        <path d="M10 12.5H8M10 14H7.5M22 12.5H24M22 14H24.5" stroke="#0f172a" stroke-width="1.4" stroke-linecap="round"/>
        <rect x="8" y="15" width="16" height="14" rx="2.5" fill="#ffffff" stroke="#0f172a" stroke-width="2"/>
        <line x1="11" y1="18.5" x2="16" y2="18.5" stroke="#0284c7" stroke-width="1.8" stroke-linecap="round"/>
        <line x1="11" y1="21.5" x2="15" y2="21.5" stroke="#94a3b8" stroke-width="1.6" stroke-linecap="round"/>
        <line x1="11" y1="24.5" x2="14" y2="24.5" stroke="#94a3b8" stroke-width="1.6" stroke-linecap="round"/>
        <ellipse cx="20.5" cy="23.5" rx="2" ry="1.5" fill="#0284c7"/>
        <circle cx="19" cy="20.5" r="0.75" fill="#0284c7"/>
        <circle cx="20.8" cy="20" r="0.75" fill="#0284c7"/>
        <circle cx="22.5" cy="21.2" r="0.75" fill="#0284c7"/>
      </svg>
    `,

    // 4. Uygulanan Tedavi: Canlı Kırmızı Kalp & Mavi Şırınga (Seçenek A - YENİ & GÖZE ÇARPAN)
    'treatment-mode': `
      <svg class="pet-svg" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 28C16 28 4 20.5 4 11C4 6.5 7.5 3.5 12 3.5C14.5 3.5 16.8 5 18 7C19.2 5 21.5 3.5 24 3.5C28.5 3.5 32 6.5 32 11C32 20.5 20 28 20 28H16Z" fill="#ef4444" stroke="#0f172a" stroke-width="2.2" stroke-linejoin="round"/>
        <path d="M8 8C9.5 6 12 5.5 13.5 6.5" stroke="#fca5a5" stroke-width="2" stroke-linecap="round"/>
        <path d="M7 25L11 21" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round"/>
        <path d="M7 25L11 21" stroke="#0f172a" stroke-width="1.4" stroke-linecap="round"/>
        <rect x="11" y="9.5" width="7" height="15" rx="2" transform="rotate(-45 11 9.5)" fill="#ffffff" stroke="#0f172a" stroke-width="2"/>
        <path d="M14 17.5L16.5 15L21.5 20L19 22.5Z" fill="#0284c7"/>
        <line x1="16" y1="13" x2="18" y2="15" stroke="#0f172a" stroke-width="1.6"/>
        <path d="M21 7.5L26.5 13" stroke="#0f172a" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M24 4.5L29.5 10" stroke="#0f172a" stroke-width="2.6" stroke-linecap="round"/>
      </svg>
    `,

    // 5. Fiyat Teklifi: Altın Pano & Pati Fiyat Rozeti (Seçenek B - YENİ & GÖZE ÇARPAN)
    'quote-mode': `
      <svg class="pet-svg" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="5" y="5" width="20" height="25" rx="3.5" fill="#fde047" stroke="#0f172a" stroke-width="2.2"/>
        <rect x="10.5" y="2.5" width="9" height="5" rx="1.5" fill="#f59e0b" stroke="#0f172a" stroke-width="1.8"/>
        <circle cx="15" cy="4.8" r="1.2" fill="#ffffff"/>
        <rect x="7.5" y="8" width="15" height="19" rx="2" fill="#ffffff" stroke="#0f172a" stroke-width="1.6"/>
        <line x1="10.5" y1="12" x2="18" y2="12" stroke="#0284c7" stroke-width="2" stroke-linecap="round"/>
        <line x1="10.5" y1="16" x2="17" y2="16" stroke="#94a3b8" stroke-width="1.8" stroke-linecap="round"/>
        <line x1="10.5" y1="20" x2="15" y2="20" stroke="#94a3b8" stroke-width="1.8" stroke-linecap="round"/>
        <circle cx="23.5" cy="22.5" r="6.5" fill="#f59e0b" stroke="#0f172a" stroke-width="2.2"/>
        <circle cx="23.5" cy="22.5" r="5" fill="#fde047"/>
        <ellipse cx="23.5" cy="23.5" rx="2" ry="1.5" fill="#d97706"/>
        <circle cx="21.5" cy="21" r="0.8" fill="#d97706"/>
        <circle cx="23.5" cy="20.2" r="0.8" fill="#d97706"/>
        <circle cx="25.5" cy="21" r="0.8" fill="#d97706"/>
      </svg>
    `,

    // 6. Arama Çubuğu: Büyüteçli Yavru Köpek
    'dog-search': `
      <svg class="pet-svg" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 12C3.5 12 2.5 13.5 2.5 15.5C2.5 17.5 4 18.5 5.5 18" fill="#f59e0b" stroke="#0f172a" stroke-width="2" stroke-linecap="round"/>
        <circle cx="11.5" cy="15" r="7.5" fill="#fef08a" stroke="#0f172a" stroke-width="2"/>
        <circle cx="8" cy="13.5" r="1.4" fill="#0f172a"/>
        <ellipse cx="11.5" cy="16.5" rx="2" ry="1.4" fill="#0f172a"/>
        <circle cx="20" cy="15" r="6.5" fill="#e0f2fe" stroke="#0284c7" stroke-width="2.4"/>
        <circle cx="20" cy="15" r="4.5" fill="#38bdf8" fill-opacity="0.35"/>
        <circle cx="20" cy="15.5" r="1.2" fill="#0284c7"/>
        <circle cx="18.6" cy="14" r="0.6" fill="#0284c7"/>
        <circle cx="21.4" cy="14" r="0.6" fill="#0284c7"/>
        <path d="M25 20L29.5 24.5" stroke="#0284c7" stroke-width="2.8" stroke-linecap="round"/>
      </svg>
    `,

    // 7. Ulaşım & KM: Veteriner Saha Ambulansı
    'vet-van': `
      <svg class="pet-svg" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 11C4 9.5 5.5 8 7 8H18L24.5 13V23C24.5 24 23.5 25 22.5 25H5.5C4.5 25 4 24 4 23V11Z" fill="#e0f2fe" stroke="#0f172a" stroke-width="2" stroke-linejoin="round"/>
        <path d="M18 10L23 14H18V10Z" fill="#38bdf8" fill-opacity="0.6" stroke="#0f172a" stroke-width="1.6"/>
        <rect x="7" y="10.5" width="7" height="5.5" rx="1" fill="#38bdf8" fill-opacity="0.6" stroke="#0f172a" stroke-width="1.6"/>
        <rect x="10.5" y="5.5" width="4" height="2.5" rx="1" fill="#ef4444" stroke="#0f172a" stroke-width="1.4"/>
        <rect x="9.5" y="18.5" width="6" height="2.2" rx="0.5" fill="#10b981"/>
        <rect x="11.4" y="16.5" width="2.2" height="6.2" rx="0.5" fill="#10b981"/>
        <circle cx="9" cy="25" r="3.4" fill="#0f172a" stroke="#ffffff" stroke-width="1"/>
        <circle cx="9" cy="25" r="1.3" fill="#cbd5e1"/>
        <circle cx="20" cy="25" r="3.4" fill="#0f172a" stroke="#ffffff" stroke-width="1"/>
        <circle cx="20" cy="25" r="1.3" fill="#cbd5e1"/>
      </svg>
    `,

    // 8. Kritik Stok: Kemikli Uyarı Üçgeni
    'warning-bone': `
      <svg class="pet-svg" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 4.5L28.5 25.5C29.2 26.8 28.2 28.5 26.6 28.5H5.4C3.8 28.5 2.8 26.8 3.5 25.5L16 4.5Z" fill="#fef08a" stroke="#f59e0b" stroke-width="2.4" stroke-linejoin="round"/>
        <path d="M14 12C13.2 12 12.5 11.5 12.5 10.8C12.5 10 13.2 9.5 14 9.5C14.5 9.5 15 9.8 15.2 10.2L16.8 10.2C17 9.8 17.5 9.5 18 9.5C18.8 9.5 19.5 10 19.5 10.8C19.5 11.5 18.8 12 18 12L17.5 19C18.2 19 19 19.5 19 20.2C19 21 18.2 21.5 17.5 21.5C17 21.5 16.6 21.2 16.4 20.8L15.6 20.8C15.4 21.2 15 21.5 14.5 21.5C13.8 21.5 13 21 13 20.2C13 19.5 13.8 19 14.5 19L14 12Z" fill="#d97706"/>
        <circle cx="16" cy="24.5" r="1.4" fill="#d97706"/>
      </svg>
    `,

    // 9. Adisyon Paylaş (Hero Buton): Altın Parşömen & Yeşil/Altın Pati Mührü (Seçenek A - YENİ & GÖZE ÇARPAN)
    'receipt-seal': `
      <svg class="pet-svg pet-svg-hero" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7 6C7 4.3 8.3 3 10 3H26C27.7 3 29 4.3 29 6V29C29 29 27.5 28 26 28C24.5 28 23 29 21.5 29C20 29 18.5 28 17 28C15.5 28 14 29 12.5 29C11 29 9.5 28 8 28C7.4 28 7 28.3 7 28.8V6Z" fill="#fef08a" stroke="#0f172a" stroke-width="2.2" stroke-linejoin="round"/>
        <path d="M7 6C7 4.3 8.3 3 10 3H26C27.7 3 29 4.3 29 6C29 7.7 27.7 9 26 9H10C8.3 9 7 7.7 7 6Z" fill="#fde047" stroke="#0f172a" stroke-width="2.2" stroke-linejoin="round"/>
        <line x1="12" y1="13" x2="24" y2="13" stroke="#0284c7" stroke-width="2.4" stroke-linecap="round"/>
        <line x1="12" y1="17.5" x2="20" y2="17.5" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
        <line x1="12" y1="21.5" x2="18" y2="21.5" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
        <path d="M20 26L21.5 33L24 30.5L26.5 33L28 26" fill="#059669" stroke="#0f172a" stroke-width="1.8" stroke-linejoin="round"/>
        <circle cx="24" cy="24" r="6.5" fill="#10b981" stroke="#0f172a" stroke-width="2.2"/>
        <circle cx="24" cy="24" r="5" fill="#059669"/>
        <ellipse cx="24" cy="25" rx="2.2" ry="1.6" fill="#fde047"/>
        <circle cx="21.8" cy="22.2" r="0.9" fill="#fde047"/>
        <circle cx="24" cy="21.3" r="0.9" fill="#fde047"/>
        <circle cx="26.2" cy="22.2" r="0.9" fill="#fde047"/>
      </svg>
    `,

    // 10. Seçilenleri Sepete Ekle: İlaçlı Nane Yeşili Pet Sepeti (Seçenek A - YENİ & GÖZE ÇARPAN)
    'cart-basket': `
      <svg class="pet-svg" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 13C10 8 12.5 5 16 5C19.5 5 22 8 22 13" stroke="#0f172a" stroke-width="2.2" stroke-linecap="round"/>
        <rect x="11" y="8" width="4" height="7" rx="1" fill="#38bdf8" stroke="#0f172a" stroke-width="1.8"/>
        <rect x="17" y="7" width="5" height="8" rx="1.5" fill="#f59e0b" stroke="#0f172a" stroke-width="1.8"/>
        <rect x="18" y="5.5" width="3" height="2" rx="0.5" fill="#ef4444" stroke="#0f172a" stroke-width="1.2"/>
        <path d="M5 13H27L24.5 26C24.3 27 23.5 27.8 22.5 27.8H9.5C8.5 27.8 7.7 27 7.5 26L5 13Z" fill="#a7f3d0" stroke="#0f172a" stroke-width="2.2" stroke-linejoin="round"/>
        <path d="M10 17H22M11 22H21" stroke="#059669" stroke-width="1.8" stroke-linecap="round"/>
        <circle cx="16" cy="20" r="3.2" fill="#ffffff" stroke="#0f172a" stroke-width="1.4"/>
        <ellipse cx="16" cy="20.7" rx="1.2" ry="0.9" fill="#10b981"/>
        <circle cx="14.8" cy="19.3" r="0.5" fill="#10b981"/>
        <circle cx="16" cy="18.8" r="0.5" fill="#10b981"/>
        <circle cx="17.2" cy="19.3" r="0.5" fill="#10b981"/>
      </svg>
    `,

    // Ayarlar / Menü: Pati Göbekli Dişli Çark
    'gear-paw': `
      <svg class="pet-svg" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 3H18V6.2C18.8 6.5 19.5 7 20.2 7.5L22.8 5.5L25.8 8.5L23.8 11.2C24.3 11.8 24.7 12.6 25 13.4H28.2V17.4H25C24.7 18.2 24.3 19 23.8 19.6L25.8 22.3L22.8 25.3L20.2 23.3C19.5 23.8 18.8 24.3 18 24.6V27.8H14V24.6C13.2 24.3 12.5 23.8 11.8 23.3L9.2 25.3L6.2 22.3L8.2 19.6C7.7 19 7.3 18.2 7 17.4H3.8V13.4H7C7.3 12.6 7.7 11.8 8.2 11.2L6.2 8.5L9.2 5.5L11.8 7.5C12.5 7 13.2 6.5 14 6.2V3Z" fill="#f1f5f9" stroke="#0f172a" stroke-width="2" stroke-linejoin="round"/>
        <ellipse cx="16" cy="16" rx="2.5" ry="2" fill="#0284c7"/>
        <circle cx="13.5" cy="12.5" r="0.9" fill="#0284c7"/>
        <circle cx="16" cy="11.5" r="0.9" fill="#0284c7"/>
        <circle cx="18.5" cy="12.5" r="0.9" fill="#0284c7"/>
      </svg>
    `
  };

  /**
   * Helper function to get an SVG string
   * @param {string} iconName 
   * @param {string} customClass 
   * @returns {string} HTML string of the SVG
   */
  window.getPetIcon = function (iconName, customClass = '') {
    const svg = PET_SVGS[iconName];
    if (!svg) return '';
    if (customClass) {
      return svg.replace('<svg class="pet-svg"', `<svg class="pet-svg ${customClass}"`);
    }
    return svg;
  };

  window.PET_SVGS = PET_SVGS;
})();
