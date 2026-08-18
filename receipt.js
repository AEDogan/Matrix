/**
 * SahaVeteriner - Görsel Adisyon & Fiş Oluşturucu ve WhatsApp Paylaşım Servisi (receipt.js)
 * HTML5 Canvas ile piksel hassasiyetinde .JPG formatında Adisyon/Teklif Slip üretir.
 */

class ReceiptGenerator {
  constructor() {
    this.canvas = document.getElementById('hiddenReceiptCanvas');
  }

  getClinicInfo() {
    return {
      title: localStorage.getItem('sahavet_clinic_title') || 'VETERİNER HİZMET DETAYI',
      bank: localStorage.getItem('sahavet_bank_name') || 'Ziraat Bankası',
      iban: localStorage.getItem('sahavet_iban') || 'TR12 0001 0002 0003 0004 0005 06',
      address: localStorage.getItem('sahavet_address') || 'Kamçıllı, Mandıra Sokak No 12, 10085 Karesi/Balıkesir',
      phone: localStorage.getItem('sahavet_phone') || '0552 185 03 08',
      vatRate: parseFloat(localStorage.getItem('sahavet_vat_rate')) || 18
    };
  }

  saveClinicInfo(info) {
    if (info.title) localStorage.setItem('sahavet_clinic_title', info.title);
    if (info.bank) localStorage.setItem('sahavet_bank_name', info.bank);
    if (info.iban) localStorage.setItem('sahavet_iban', info.iban);
    if (info.address) localStorage.setItem('sahavet_address', info.address);
    if (info.phone) localStorage.setItem('sahavet_phone', info.phone);
    if (info.vatRate !== undefined) localStorage.setItem('sahavet_vat_rate', info.vatRate);
  }

  /**
   * Adisyonu Modal İçinde HTML Olarak Render Eder
   */
  renderHtmlPreview(receiptData) {
    const info = this.getClinicInfo();
    const now = new Date();
    const dateStr = now.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' +
                    now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    // Mod Başlığı Belirleme (Uygulanan Tedavi vs Fiyat Teklifi)
    const isQuote = receiptData.mode === 'quote';
    const activeTitle = isQuote ? 'FİYAT TEKLİFİ / BİLGİLENDİRME' : (info.title || 'VETERİNER HİZMET DETAYI');

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
      document.getElementById('receiptKdvTitle').textContent = `KDV (%${receiptData.vatRate}):`;
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
        modeBadge.textContent = '📄 FİYAT TEKLİFİ (Stoktan Düşülmez)';
      } else {
        modeBadge.className = 'badge-treatment';
        modeBadge.textContent = '💉 UYGULANAN TEDAVİ (Stoktan Düşülecek)';
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
    const isQuote = receiptData.mode === 'quote';
    const headerTitle = activeTitle || (isQuote ? 'FİYAT TEKLİFİ / BİLGİLENDİRME' : 'VETERİNER HİZMET DETAYI');

    let text = `🐾 *${headerTitle.toUpperCase()}*\n`;
    text += `📅 Tarih: ${dateStr}\n`;
    if (receiptData.customer && receiptData.customer.trim() !== '') {
      text += `👤 *Müşteri / Hasta Sahibi:* ${receiptData.customer}\n`;
    }
    text += `━━━━━━━━━━━━━━━━━━━━━━\n`;

    receiptData.allItems.forEach(item => {
      text += `• ${item.name} (${item.qty}): *${parseFloat(item.total).toFixed(2)} TL*\n`;
    });

    text += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `*Ara Toplam:* ${receiptData.subTotal.toFixed(2)} TL\n`;

    if (receiptData.isVatEnabled) {
      text += `*KDV (%${receiptData.vatRate}):* ${receiptData.vatAmount.toFixed(2)} TL\n`;
    }

    text += `*Ödenecek Tutar:* *${receiptData.grandTotal.toFixed(2)} TL*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `🏦 *Banka:* ${info.bank}\n`;
    text += `💳 *IBAN:* ${info.iban}\n`;
    text += `📍 *Adres:* ${info.address}\n`;
    text += `📞 *İletişim:* ${info.phone}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `⚠️ _(MALİ BELGE DEĞİLDİR)_\n\n`;
    text += `Bizi tercih ettiğiniz için teşekkür ederiz.`;

    return text;
  }

  /**
   * HTML5 Canvas Üzerinde Yüksek Kaliteli JPG Adisyonu Çizer
   */
  async generateJpgBlob(receiptData) {
    const info = this.getClinicInfo();
    const now = new Date();
    const dateStr = now.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' +
                    now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    const isQuote = receiptData.mode === 'quote';
    const activeTitle = isQuote ? 'FİYAT TEKLİFİ / BİLGİLENDİRME' : (info.title || 'VETERİNER HİZMET DETAYI');

    const width = 500;
    const padding = 28;

    // Dinamik yükseklik hesaplama
    let estimatedHeight = 360;
    if (receiptData.customer && receiptData.customer.trim() !== '') estimatedHeight += 20;
    estimatedHeight += receiptData.allItems.length * 28;
    if (receiptData.isVatEnabled) estimatedHeight += 24;

    const canvas = this.canvas || document.createElement('canvas');
    const scale = 2; // Retina netliği
    canvas.width = width * scale;
    canvas.height = estimatedHeight * scale;

    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);

    // Arkaplan (Beyaz fiş kağıdı)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, estimatedHeight);

    let y = padding;

    // Başlık
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 20px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(activeTitle.toUpperCase(), width / 2, y);
    y += 20;

    // Tarih & Müşteri
    ctx.fillStyle = '#555555';
    ctx.font = '12px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(dateStr, width / 2, y);
    y += 16;

    if (receiptData.customer && receiptData.customer.trim() !== '') {
      ctx.fillStyle = '#111111';
      ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`Hasta Sahibi / Müşteri: ${receiptData.customer}`, width / 2, y);
      y += 16;
    }

    // Kalın Ayraç Çizgisi
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
    y += 20;

    // Tablo Başlığı
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 13px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Ürün / Hizmet Adı', padding, y);
    ctx.textAlign = 'center';
    ctx.fillText('Adet/KM', width - padding - 150, y);
    ctx.textAlign = 'right';
    ctx.fillText('Tutar', width - padding, y);
    y += 10;

    // İnce Ayraç Çizgisi
    ctx.strokeStyle = '#888888';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
    y += 18;

    // Kalem Satırları
    ctx.font = '13px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#111111';

    receiptData.allItems.forEach(item => {
      ctx.textAlign = 'left';
      let displayName = item.name;
      if (displayName.length > 24) displayName = displayName.slice(0, 23) + '…';
      ctx.fillText(displayName, padding, y);

      ctx.textAlign = 'center';
      ctx.fillText(item.qty.toString(), width - padding - 150, y);

      ctx.textAlign = 'right';
      ctx.font = 'bold 13px "JetBrains Mono", monospace';
      ctx.fillText(`${parseFloat(item.total).toFixed(2)} TL`, width - padding, y);
      ctx.font = '13px "Plus Jakarta Sans", sans-serif';

      y += 24;
    });

    y += 4;

    // Kalın Çizgi
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
    y += 20;

    // Ara Toplam
    ctx.textAlign = 'left';
    ctx.font = '13px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#222222';
    ctx.fillText('Ara Toplam:', padding, y);
    ctx.textAlign = 'right';
    ctx.font = 'bold 13px "JetBrains Mono", monospace';
    ctx.fillText(`${receiptData.subTotal.toFixed(2)} TL`, width - padding, y);
    y += 22;

    // KDV Satırı (Varsa)
    if (receiptData.isVatEnabled) {
      ctx.textAlign = 'left';
      ctx.font = '13px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`KDV (%${receiptData.vatRate}):`, padding, y);
      ctx.textAlign = 'right';
      ctx.font = 'bold 13px "JetBrains Mono", monospace';
      ctx.fillText(`${receiptData.vatAmount.toFixed(2)} TL`, width - padding, y);
      y += 22;
    }

    // Ödenecek Tutar (Büyük & Kalın)
    ctx.textAlign = 'left';
    ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#000000';
    ctx.fillText('Ödenecek Tutar:', padding, y);
    ctx.textAlign = 'right';
    ctx.font = 'bold 18px "JetBrains Mono", monospace';
    ctx.fillText(`${receiptData.grandTotal.toFixed(2)} TL`, width - padding, y);
    y += 14;

    // Kalın Çizgi
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
    y += 20;

    // Banka & Adres Detayları
    ctx.textAlign = 'left';
    ctx.fillStyle = '#111111';
    ctx.font = '12px "Plus Jakarta Sans", sans-serif';

    ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`Banka: ${info.bank}`, padding, y);
    y += 18;

    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.fillText(`IBAN: ${info.iban}`, padding, y);
    y += 18;

    ctx.font = '11px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`Adres: ${info.address}`, padding, y);
    y += 16;

    ctx.fillText(`Tel: ${info.phone}`, padding, y);
    y += 12;

    // İnce Çizgi
    ctx.strokeStyle = '#aaaaaa';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
    y += 22;

    // Kırmızı Mali Uyarı
    ctx.fillStyle = '#dc2626';
    ctx.font = 'bold 14px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('MALİ BELGE DEĞİLDİR', width / 2, y);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.88);
    });
  }

  /**
   * WhatsApp ile Paylaşım Eylemi
   */
  async shareToWhatsApp(receiptData) {
    const info = this.getClinicInfo();
    const now = new Date();
    const dateStr = now.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' +
                    now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    const isQuote = receiptData.mode === 'quote';
    const activeTitle = isQuote ? 'FİYAT TEKLİFİ / BİLGİLENDİRME' : (info.title || 'VETERİNER HİZMET DETAYI');
    const messageText = this.generateWhatsAppText(receiptData, info, dateStr, activeTitle);

    try {
      const jpgBlob = await this.generateJpgBlob(receiptData);
      const filename = `${isQuote ? 'Teklif' : 'Adisyon'}_${Date.now()}.jpg`;
      const file = new File([jpgBlob], filename, { type: 'image/jpeg' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: activeTitle,
          text: messageText
        });
        return { success: true, method: 'web_share' };
      }
    } catch (e) {
      console.log('Web Share API fallback devrede:', e);
    }

    // Fallback: WhatsApp link
    const encodedText = encodeURIComponent(messageText);
    const waUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
    window.open(waUrl, '_blank');
    
    return { success: true, method: 'whatsapp_url' };
  }

  /**
   * Görseli Cihaza İndir (.JPG)
   */
  async downloadJpg(receiptData) {
    const isQuote = receiptData.mode === 'quote';
    const jpgBlob = await this.generateJpgBlob(receiptData);
    const url = URL.createObjectURL(jpgBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Veteriner_${isQuote ? 'Teklif' : 'Adisyon'}_${new Date().toISOString().slice(0,10)}_${Date.now().toString().slice(-4)}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

window.receiptGenerator = new ReceiptGenerator();
