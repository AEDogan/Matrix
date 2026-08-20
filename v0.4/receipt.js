/**
 * VetAssist - Görsel Adisyon & Fiş Oluşturucu ve WhatsApp Paylaşım Servisi (receipt.js)
 * HTML5 Canvas ile piksel hassasiyetinde .JPG formatında Adisyon/Teklif Slip üretir.
 * Çoklu dil (Türkçe & İngilizce) tam desteklidir.
 */

class ReceiptGenerator {
  constructor() {
    this.canvas = document.getElementById('hiddenReceiptCanvas');
  }

  getClinicInfo() {
    const isEn = window.i18n && window.i18n.getLanguage() === 'en';
    const defaultTitle = isEn ? 'VETERINARY SERVICE DETAILS' : 'VETERİNER HİZMET DETAYI';
    return {
      title: localStorage.getItem('vetassist_clinic_title') || localStorage.getItem('sahavet_clinic_title') || defaultTitle,
      bank: localStorage.getItem('vetassist_bank_name') || localStorage.getItem('sahavet_bank_name') || 'Ziraat Bankası',
      iban: localStorage.getItem('vetassist_iban') || localStorage.getItem('sahavet_iban') || 'TR12 0001 0002 0003 0004 0005 06',
      address: localStorage.getItem('vetassist_address') || localStorage.getItem('sahavet_address') || 'Kamçıllı, Mandıra Sokak No 12, 10085 Karesi/Balıkesir',
      phone: localStorage.getItem('vetassist_phone') || localStorage.getItem('sahavet_phone') || '0552 185 03 08',
      vatRate: parseFloat(localStorage.getItem('vetassist_vat_rate') || localStorage.getItem('sahavet_vat_rate')) || 18
    };
  }

  saveClinicInfo(info) {
    if (info.title) {
      localStorage.setItem('vetassist_clinic_title', info.title);
      localStorage.setItem('sahavet_clinic_title', info.title);
    }
    if (info.bank) {
      localStorage.setItem('vetassist_bank_name', info.bank);
      localStorage.setItem('sahavet_bank_name', info.bank);
    }
    if (info.iban) {
      localStorage.setItem('vetassist_iban', info.iban);
      localStorage.setItem('sahavet_iban', info.iban);
    }
    if (info.address) {
      localStorage.setItem('vetassist_address', info.address);
      localStorage.setItem('sahavet_address', info.address);
    }
    if (info.phone) {
      localStorage.setItem('vetassist_phone', info.phone);
      localStorage.setItem('sahavet_phone', info.phone);
    }
    if (info.vatRate !== undefined) {
      localStorage.setItem('vetassist_vat_rate', info.vatRate);
      localStorage.setItem('sahavet_vat_rate', info.vatRate);
    }
  }

  /**
   * Adisyonu Modal İçinde HTML Olarak Render Eder
   */
  renderHtmlPreview(receiptData) {
    const isEn = window.i18n && window.i18n.getLanguage() === 'en';
    const info = this.getClinicInfo();
    const now = new Date();
    const dateStr = isEn 
      ? now.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) + ' ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      : now.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    // Mod Başlığı Belirleme (Uygulanan Tedavi vs Fiyat Teklifi)
    const isQuote = receiptData.mode === 'quote';
    const activeTitle = isQuote ? (isEn ? 'PRICE QUOTE / ESTIMATE' : 'FİYAT TEKLİFİ / BİLGİLENDİRME') : (info.title || (isEn ? 'VETERINARY SERVICE DETAILS' : 'VETERİNER HİZMET DETAYI'));

    // Başlık ve Tarih
    document.getElementById('receiptPreviewTitle').textContent = activeTitle;
    document.getElementById('receiptDateTime').textContent = dateStr;

    // Müşteri / Hasta Sahibi Bilgisi
    const custContainer = document.getElementById('receiptCustomerRow');
    if (custContainer) {
      if (receiptData.customer && receiptData.customer.trim() !== '') {
        custContainer.style.display = 'block';
        document.getElementById('receiptCustomerName').textContent = receiptData.customer;
      } else {
        custContainer.style.display = 'none';
      }
    }

    // Kalemler
    const container = document.getElementById('receiptItemsContainer');
    container.innerHTML = '';

    receiptData.allItems.forEach(item => {
      const row = document.createElement('div');
      row.className = 'receipt-line-item';
      row.innerHTML = `
        <div class="col-item">${item.name}</div>
        <div class="col-qty">${item.qty}</div>
        <div class="col-price text-mono">${parseFloat(item.total).toFixed(2)} TL</div>
      `;
      container.appendChild(row);
    });

    // Toplamlar
    document.getElementById('receiptAraToplam').textContent = `${receiptData.subTotal.toFixed(2)} TL`;
    
    const kdvLine = document.getElementById('receiptKdvLine');
    if (receiptData.isVatEnabled) {
      kdvLine.style.display = 'flex';
      document.getElementById('receiptKdvTitle').textContent = isEn ? `VAT (%${receiptData.vatRate}):` : `KDV (%${receiptData.vatRate}):`;
      document.getElementById('receiptKdv').textContent = `${receiptData.vatAmount.toFixed(2)} TL`;
    } else {
      kdvLine.style.display = 'none';
    }

    document.getElementById('receiptGenelToplam').textContent = `${receiptData.grandTotal.toFixed(2)} TL`;

    // Alt Bilgiler
    document.getElementById('receiptBank').textContent = info.bank;
    document.getElementById('receiptIban').textContent = info.iban;
    document.getElementById('receiptAddress').textContent = info.address;
    document.getElementById('receiptPhone').textContent = info.phone;

    // Mod Bilgisi Rozeti
    const modeBadge = document.getElementById('receiptModeBadge');
    if (modeBadge) {
      if (isQuote) {
        modeBadge.className = 'badge-quote';
        modeBadge.textContent = isEn ? '📄 PRICE QUOTE (Stock remains unchanged)' : '📄 FİYAT TEKLİFİ (Stoktan Düşülmez)';
      } else {
        modeBadge.className = 'badge-treatment';
        modeBadge.textContent = isEn ? '💉 APPLIED TREATMENT (Stock will be deducted)' : '💉 UYGULANAN TEDAVİ (Stoktan Düşülecek)';
      }
    }

    // WhatsApp Metin Şablonunu Oluştur
    const textOutput = this.generateWhatsAppText(receiptData, info, dateStr, activeTitle);
    document.getElementById('whatsappTextOutput').value = textOutput;
  }

  /**
   * WhatsApp İçin Şık Formatlı Metin Şablonu Üretir
   */
  generateWhatsAppText(receiptData, info, dateStr, activeTitle) {
    const isEn = window.i18n && window.i18n.getLanguage() === 'en';
    const isQuote = receiptData.mode === 'quote';
    const headerTitle = activeTitle || (isQuote ? (isEn ? 'PRICE QUOTE / ESTIMATE' : 'FİYAT TEKLİFİ / BİLGİLENDİRME') : (isEn ? 'VETERINARY SERVICE DETAILS' : 'VETERİNER HİZMET DETAYI'));

    let text = `🐾 *${headerTitle.toUpperCase()}*\n`;
    text += `📅 ${isEn ? 'Date:' : 'Tarih:'} ${dateStr}\n`;
    if (receiptData.customer && receiptData.customer.trim() !== '') {
      text += `👤 *${isEn ? 'Client / Patient Owner:' : 'Müşteri / Hasta Sahibi:'}* ${receiptData.customer}\n`;
    }
    text += `━━━━━━━━━━━━━━━━━━━━━━\n`;

    receiptData.allItems.forEach(item => {
      text += `• ${item.name} (${item.qty}): *${parseFloat(item.total).toFixed(2)} TL*\n`;
    });

    text += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `*${isEn ? 'Subtotal:' : 'Ara Toplam:'}* ${receiptData.subTotal.toFixed(2)} TL\n`;

    if (receiptData.isVatEnabled) {
      text += `*${isEn ? 'VAT' : 'KDV'} (%${receiptData.vatRate}):* ${receiptData.vatAmount.toFixed(2)} TL\n`;
    }

    text += `*${isEn ? 'Total Due:' : 'Ödenecek Tutar:'}* *${receiptData.grandTotal.toFixed(2)} TL*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `🏦 *${isEn ? 'Bank:' : 'Banka:'}* ${info.bank}\n`;
    text += `💳 *IBAN:* ${info.iban}\n`;
    text += `📍 *${isEn ? 'Address:' : 'Adres:'}* ${info.address}\n`;
    text += `📞 *${isEn ? 'Phone:' : 'İletişim:'}* ${info.phone}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `⚠️ _(${isEn ? 'NOT A FINANCIAL INVOICE' : 'MALİ BELGE DEĞİLDİR'})_\n\n`;
    text += isEn ? `Thank you for choosing our veterinary services.` : `Bizi tercih ettiğiniz için teşekkür ederiz.`;

    return text;
  }

  /**
   * HTML5 Canvas Üzerinde Yüksek Kaliteli JPG Adisyonu Çizer
   */
  async generateJpgBlob(receiptData) {
    const isEn = window.i18n && window.i18n.getLanguage() === 'en';
    const info = this.getClinicInfo();
    const now = new Date();
    const dateStr = isEn 
      ? now.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) + ' ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      : now.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    const isQuote = receiptData.mode === 'quote';
    const activeTitle = isQuote ? (isEn ? 'PRICE QUOTE / ESTIMATE' : 'FİYAT TEKLİFİ / BİLGİLENDİRME') : (info.title || (isEn ? 'VETERINARY SERVICE DETAILS' : 'VETERİNER HİZMET DETAYI'));

    const width = 520;
    const padding = 28;

    // Dinamik yükseklik hesaplama
    let estimatedHeight = 390;
    if (receiptData.customer && receiptData.customer.trim() !== '') estimatedHeight += 24;
    estimatedHeight += receiptData.allItems.length * 30;
    if (receiptData.isVatEnabled) estimatedHeight += 26;

    // Her seferinde temiz yeni bir canvas oluşturarak transform/scale birikme hatasını engelle
    const canvas = document.createElement('canvas');
    const scale = 2; // Yüksek çözünürlük (Retina HD)
    canvas.width = width * scale;
    canvas.height = estimatedHeight * scale;

    const ctx = canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(scale, scale);

    // Arkaplan (Beyaz fiş kağıdı)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, estimatedHeight);

    let y = padding + 6;

    // Başlık
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 20px "Plus Jakarta Sans", -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(activeTitle.toUpperCase(), width / 2, y);
    y += 22;

    // Tarih & Müşteri
    ctx.fillStyle = '#475569';
    ctx.font = '500 12px "Plus Jakarta Sans", -apple-system, sans-serif';
    ctx.fillText(dateStr, width / 2, y);
    y += 18;

    if (receiptData.customer && receiptData.customer.trim() !== '') {
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 13px "Plus Jakarta Sans", -apple-system, sans-serif';
      ctx.fillText(`${isEn ? 'Client / Patient Owner:' : 'Hasta Sahibi / Müşteri:'} ${receiptData.customer}`, width / 2, y);
      y += 18;
    }

    // Kalın Ayraç Çizgisi
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
    y += 20;

    // Tablo Başlığı
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 13px "Plus Jakarta Sans", -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(isEn ? 'Item / Service Name' : 'Ürün / Hizmet Adı', padding, y);
    ctx.textAlign = 'center';
    ctx.fillText(isEn ? 'Qty/KM' : 'Adet/KM', width - padding - 130, y);
    ctx.textAlign = 'right';
    ctx.fillText(isEn ? 'Amount' : 'Tutar', width - padding, y);
    y += 10;

    // İnce Ayraç Çizgisi
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
    y += 20;

    // Kalem Satırları
    ctx.fillStyle = '#0f172a';

    receiptData.allItems.forEach(item => {
      ctx.textAlign = 'left';
      ctx.font = '600 13px "Plus Jakarta Sans", -apple-system, sans-serif';
      let displayName = item.name;
      if (displayName.length > 27) displayName = displayName.slice(0, 26) + '…';
      ctx.fillText(displayName, padding, y);

      ctx.textAlign = 'center';
      ctx.font = '500 13px "Plus Jakarta Sans", -apple-system, sans-serif';
      ctx.fillText(item.qty.toString(), width - padding - 130, y);

      ctx.textAlign = 'right';
      ctx.font = 'bold 13px "JetBrains Mono", monospace';
      ctx.fillText(`${parseFloat(item.total).toFixed(2)} TL`, width - padding, y);

      y += 26;
    });

    y += 4;

    // Kalın Çizgi
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
    y += 20;

    // Ara Toplam
    ctx.textAlign = 'left';
    ctx.font = '600 13px "Plus Jakarta Sans", -apple-system, sans-serif';
    ctx.fillStyle = '#334155';
    ctx.fillText(isEn ? 'Subtotal:' : 'Ara Toplam:', padding, y);
    ctx.textAlign = 'right';
    ctx.font = 'bold 13px "JetBrains Mono", monospace';
    ctx.fillText(`${receiptData.subTotal.toFixed(2)} TL`, width - padding, y);
    y += 24;

    // KDV Satırı (Varsa)
    if (receiptData.isVatEnabled) {
      ctx.textAlign = 'left';
      ctx.font = '600 13px "Plus Jakarta Sans", -apple-system, sans-serif';
      ctx.fillStyle = '#334155';
      ctx.fillText(`${isEn ? 'VAT' : 'KDV'} (%${receiptData.vatRate}):`, padding, y);
      ctx.textAlign = 'right';
      ctx.font = 'bold 13px "JetBrains Mono", monospace';
      ctx.fillText(`${receiptData.vatAmount.toFixed(2)} TL`, width - padding, y);
      y += 24;
    }

    // Ödenecek Tutar (Büyük & Kalın)
    ctx.textAlign = 'left';
    ctx.font = 'bold 16px "Plus Jakarta Sans", -apple-system, sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText(isEn ? 'Total Due:' : 'Ödenecek Tutar:', padding, y);
    ctx.textAlign = 'right';
    ctx.font = 'bold 18px "JetBrains Mono", monospace';
    ctx.fillText(`${receiptData.grandTotal.toFixed(2)} TL`, width - padding, y);
    y += 16;

    // Kalın Çizgi
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
    y += 20;

    // Banka & Adres Detayları
    ctx.textAlign = 'left';
    ctx.fillStyle = '#1e293b';

    ctx.font = 'bold 12px "Plus Jakarta Sans", -apple-system, sans-serif';
    ctx.fillText(`${isEn ? 'Bank:' : 'Banka:'} ${info.bank}`, padding, y);
    y += 18;

    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.fillText(`IBAN: ${info.iban}`, padding, y);
    y += 18;

    ctx.font = '500 11px "Plus Jakarta Sans", -apple-system, sans-serif';
    ctx.fillText(`${isEn ? 'Address:' : 'Adres:'} ${info.address}`, padding, y);
    y += 16;

    ctx.fillText(`${isEn ? 'Phone:' : 'Tel:'} ${info.phone}`, padding, y);
    y += 14;

    // İnce Çizgi
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
    y += 22;

    // Kırmızı Mali Uyarı
    ctx.fillStyle = '#dc2626';
    ctx.font = 'bold 14px "Plus Jakarta Sans", -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(isEn ? 'NOT A FINANCIAL INVOICE' : 'MALİ BELGE DEĞİLDİR', width / 2, y);

    return new Promise((resolve, reject) => {
      try {
        if (canvas.toBlob) {
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
              resolve(this.dataURLtoBlob(dataUrl));
            }
          }, 'image/jpeg', 0.95);
        } else {
          const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
          resolve(this.dataURLtoBlob(dataUrl));
        }
      } catch (err) {
        console.error('Canvas JPG oluşturma hatası:', err);
        reject(err);
      }
    });
  }

  /**
   * DataURL -> Blob dönüştürücü yardımcı fonksiyon
   */
  dataURLtoBlob(dataurl) {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }

  /**
   * WhatsApp ile Paylaşım Eylemi (JPG Görsel & Metin Formatında)
   */
  async shareToWhatsApp(receiptData, preferJpg = false) {
    const isEn = window.i18n && window.i18n.getLanguage() === 'en';
    const info = this.getClinicInfo();
    const now = new Date();
    const dateStr = isEn 
      ? now.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) + ' ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      : now.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    
    const isQuote = receiptData.mode === 'quote';
    const activeTitle = isQuote ? (isEn ? 'PRICE QUOTE / ESTIMATE' : 'FİYAT TEKLİFİ / BİLGİLENDİRME') : (info.title || (isEn ? 'VETERINARY SERVICE DETAILS' : 'VETERİNER HİZMET DETAYI'));
    const messageText = this.generateWhatsAppText(receiptData, info, dateStr, activeTitle);

    let jpgBlob = null;
    try {
      jpgBlob = await this.generateJpgBlob(receiptData);
    } catch (e) {
      console.warn('JPG blob üretilirken hata:', e);
    }

    // 1. Web Share API desteği varsa görsel dosyasını direkt WhatsApp paylaşımına ver
    if (jpgBlob) {
      const filename = `VetAssist_${isQuote ? (isEn ? 'Quote' : 'Teklif') : (isEn ? 'Receipt' : 'Adisyon')}_${Date.now()}.jpg`;
      const file = new File([jpgBlob], filename, { type: 'image/jpeg' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: activeTitle,
            text: messageText
          });
          return { success: true, method: 'web_share_file' };
        } catch (shareErr) {
          if (shareErr.name !== 'AbortError') {
            console.log('Web share dosya paylaşım hatası, fallback devrede:', shareErr);
          } else {
            return { success: false, aborted: true };
          }
        }
      }
    }

    // 2. Eğer Web Share dosya paylaşımını desteklemiyorsa:
    // JPG görselini cihaza indir ve WhatsApp linkini metinle aç
    if (jpgBlob) {
      this.downloadBlob(jpgBlob, `VetAssist_${isQuote ? (isEn ? 'Quote' : 'Teklif') : (isEn ? 'Receipt' : 'Adisyon')}_${Date.now()}.jpg`);
    }

    const encodedText = encodeURIComponent(messageText);
    const waUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
    window.open(waUrl, '_blank');
    
    return { success: true, method: 'whatsapp_url_download' };
  }

  /**
   * Görseli Cihaza İndir (.JPG)
   */
  async downloadJpg(receiptData) {
    const isEn = window.i18n && window.i18n.getLanguage() === 'en';
    const isQuote = receiptData.mode === 'quote';
    const jpgBlob = await this.generateJpgBlob(receiptData);
    const filename = `VetAssist_${isQuote ? (isEn ? 'Quote' : 'Teklif') : (isEn ? 'Receipt' : 'Adisyon')}_${new Date().toISOString().slice(0,10)}_${Date.now().toString().slice(-4)}.jpg`;
    this.downloadBlob(jpgBlob, filename);
  }

  /**
   * Blob İndirme Yardımcısı
   */
  downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 200);
  }
}

window.receiptGenerator = new ReceiptGenerator();
