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
    if (container) {
      container.innerHTML = '';
      const items = (receiptData.allItems && Array.isArray(receiptData.allItems)) ? receiptData.allItems : [];
      items.forEach(item => {
        const row = document.createElement('div');
        row.className = 'receipt-item-row';
        const itemTotal = parseFloat(item.total) || 0;
        const itemQty = (item.qty !== undefined && item.qty !== null) ? item.qty : 1;
        const itemName = item.name || '';
        row.innerHTML = `
          <div class="col-item">${itemName}</div>
          <div class="col-qty">${itemQty}</div>
          <div class="col-price text-mono">${itemTotal.toFixed(2)} TL</div>
        `;
        container.appendChild(row);
      });
    }

    // Toplamlar
    const subTotal = parseFloat(receiptData.subTotal) || 0;
    const grandTotal = parseFloat(receiptData.grandTotal) || 0;
    const vatAmount = parseFloat(receiptData.vatAmount) || 0;
    const vatRate = parseFloat(receiptData.vatRate) || 18;

    const subTotalEl = document.getElementById('receiptAraToplam');
    if (subTotalEl) subTotalEl.textContent = `${subTotal.toFixed(2)} TL`;
    
    const kdvLine = document.getElementById('receiptKdvLine');
    if (kdvLine) {
      if (receiptData.isVatEnabled && vatAmount > 0) {
        kdvLine.style.display = 'flex';
        const kdvTitle = document.getElementById('receiptKdvTitle');
        if (kdvTitle) kdvTitle.textContent = isEn ? `VAT (%${vatRate}):` : `KDV (%${vatRate}):`;
        const kdvVal = document.getElementById('receiptKdv');
        if (kdvVal) kdvVal.textContent = `${vatAmount.toFixed(2)} TL`;
      } else {
        kdvLine.style.display = 'none';
      }
    }

    const grandTotalEl = document.getElementById('receiptGenelToplam');
    if (grandTotalEl) grandTotalEl.textContent = `${grandTotal.toFixed(2)} TL`;

    // Alt Bilgiler
    const bankEl = document.getElementById('receiptBank');
    if (bankEl) bankEl.textContent = info.bank || '';
    const ibanEl = document.getElementById('receiptIban');
    if (ibanEl) ibanEl.textContent = info.iban || '';
    const addrEl = document.getElementById('receiptAddress');
    if (addrEl) addrEl.textContent = info.address || '';
    const phoneEl = document.getElementById('receiptPhone');
    if (phoneEl) phoneEl.textContent = info.phone || '';

    // WhatsApp Metin Şablonunu Oluştur (varsa)
    const textOutputEl = document.getElementById('whatsappTextOutput');
    if (textOutputEl) {
      const textOutput = this.generateWhatsAppText(receiptData, info, dateStr, activeTitle);
      textOutputEl.value = textOutput;
    }
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
  async renderJpgCanvas(receiptData) {
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
    estimatedHeight += (receiptData.allItems ? receiptData.allItems.length : 0) * 30;
    if (receiptData.isVatEnabled) estimatedHeight += 26;

    const canvas = document.createElement('canvas');
    const scale = 2; // Retina HD
    canvas.width = width * scale;
    canvas.height = estimatedHeight * scale;

    const ctx = canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(scale, scale);

    // Arkaplan
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

    // Kalın Çizgi
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

    // İnce Çizgi
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
    y += 20;

    // Kalem Satırları
    ctx.fillStyle = '#0f172a';

    const items = (receiptData.allItems && Array.isArray(receiptData.allItems)) ? receiptData.allItems : [];
    items.forEach(item => {
      ctx.textAlign = 'left';
      ctx.font = '600 13px "Plus Jakarta Sans", -apple-system, sans-serif';
      let displayName = String(item.name || '');
      if (displayName.length > 27) displayName = displayName.slice(0, 26) + '…';
      ctx.fillText(displayName, padding, y);

      ctx.textAlign = 'center';
      ctx.font = '500 13px "Plus Jakarta Sans", -apple-system, sans-serif';
      const itemQty = (item.qty !== undefined && item.qty !== null) ? String(item.qty) : '1';
      ctx.fillText(itemQty, width - padding - 130, y);

      ctx.textAlign = 'right';
      ctx.font = 'bold 13px "JetBrains Mono", monospace';
      const itemTotal = parseFloat(item.total) || 0;
      ctx.fillText(`${itemTotal.toFixed(2)} TL`, width - padding, y);

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

    const subTotal = parseFloat(receiptData.subTotal) || 0;
    const grandTotal = parseFloat(receiptData.grandTotal) || 0;
    const vatAmount = parseFloat(receiptData.vatAmount) || 0;
    const vatRate = parseFloat(receiptData.vatRate) || 18;

    // Ara Toplam
    ctx.textAlign = 'left';
    ctx.font = '600 13px "Plus Jakarta Sans", -apple-system, sans-serif';
    ctx.fillStyle = '#334155';
    ctx.fillText(isEn ? 'Subtotal:' : 'Ara Toplam:', padding, y);
    ctx.textAlign = 'right';
    ctx.font = 'bold 13px "JetBrains Mono", monospace';
    ctx.fillText(`${subTotal.toFixed(2)} TL`, width - padding, y);
    y += 24;

    // KDV Satırı
    if (receiptData.isVatEnabled && vatAmount > 0) {
      ctx.textAlign = 'left';
      ctx.font = '600 13px "Plus Jakarta Sans", -apple-system, sans-serif';
      ctx.fillStyle = '#334155';
      ctx.fillText(`${isEn ? 'VAT' : 'KDV'} (%${vatRate}):`, padding, y);
      ctx.textAlign = 'right';
      ctx.font = 'bold 13px "JetBrains Mono", monospace';
      ctx.fillText(`${vatAmount.toFixed(2)} TL`, width - padding, y);
      y += 24;
    }

    // Ödenecek Tutar
    ctx.textAlign = 'left';
    ctx.font = 'bold 16px "Plus Jakarta Sans", -apple-system, sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText(isEn ? 'Total Due:' : 'Ödenecek Tutar:', padding, y);
    ctx.textAlign = 'right';
    ctx.font = 'bold 18px "JetBrains Mono", monospace';
    ctx.fillText(`${grandTotal.toFixed(2)} TL`, width - padding, y);
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
    ctx.fillText(`${isEn ? 'Bank:' : 'Banka:'} ${info.bank || ''}`, padding, y);
    y += 18;

    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.fillText(`IBAN: ${info.iban || ''}`, padding, y);
    y += 18;

    ctx.font = '500 11px "Plus Jakarta Sans", -apple-system, sans-serif';
    ctx.fillText(`${isEn ? 'Address:' : 'Adres:'} ${info.address || ''}`, padding, y);
    y += 16;

    ctx.fillText(`${isEn ? 'Phone:' : 'Tel:'} ${info.phone || ''}`, padding, y);
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

    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    const blob = this.dataURLtoBlob(dataUrl);
    return { dataUrl, blob };
  }

  async generateJpgBlob(receiptData) {
    const res = await this.renderJpgCanvas(receiptData);
    return res.blob;
  }

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
   * WhatsApp ile Görsel (JPG Slip) Paylaş
   */
  async shareJpgToWhatsApp(receiptData) {
    const isEn = window.i18n && window.i18n.getLanguage() === 'en';
    const isQuote = receiptData.mode === 'quote';
    const info = this.getClinicInfo();
    const activeTitle = isQuote ? (isEn ? 'PRICE QUOTE / ESTIMATE' : 'FİYAT TEKLİFİ / BİLGİLENDİRME') : (info.title || (isEn ? 'VETERINARY SERVICE DETAILS' : 'VETERİNER HİZMET DETAYI'));
    const now = new Date();
    const dateStr = isEn 
      ? now.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) + ' ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      : now.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    let dataUrl = null;
    let jpgBlob = null;
    try {
      const renderRes = await this.renderJpgCanvas(receiptData);
      dataUrl = renderRes.dataUrl;
      jpgBlob = renderRes.blob;
    } catch (e) {
      console.error('JPG canvas üretme hatası:', e);
    }

    const caption = this.generateWhatsAppText(receiptData, info, dateStr, activeTitle);

    // 1. Android Native Bridge (Doğrudan WhatsApp'a JPG Görseli Ekler)
    if (window.AndroidBridge && typeof window.AndroidBridge.shareImageToWhatsApp === 'function' && dataUrl) {
      window.AndroidBridge.shareImageToWhatsApp(dataUrl, caption);
      return { success: true };
    }

    // 2. Web Share API Level 2 (Mobil tarayıcılar / Web)
    if (jpgBlob) {
      const filename = `VetAssist_${isQuote ? 'Teklif' : 'Adisyon'}_${Date.now()}.jpg`;
      const file = new File([jpgBlob], filename, { type: 'image/jpeg' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: activeTitle,
            text: caption
          });
          return { success: true };
        } catch (shareErr) {
          if (shareErr.name === 'AbortError') return { success: false, aborted: true };
        }
      }

      // 3. Masaüstü / Tarayıcı Fallback: Görseli İndir ve WhatsApp Web Aç
      this.downloadBlob(jpgBlob, filename);
      const waUrl = 'https://api.whatsapp.com/send?text=' + encodeURIComponent(caption);
      window.open(waUrl, '_blank');
    }

    return { success: true };
  }

  async downloadJpg(receiptData) {
    const isEn = window.i18n && window.i18n.getLanguage() === 'en';
    const isQuote = receiptData.mode === 'quote';
    const jpgBlob = await this.generateJpgBlob(receiptData);
    const filename = `VetAssist_${isQuote ? (isEn ? 'Quote' : 'Teklif') : (isEn ? 'Receipt' : 'Adisyon')}_${new Date().toISOString().slice(0,10)}_${Date.now().toString().slice(-4)}.jpg`;
    this.downloadBlob(jpgBlob, filename);
  }

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

