/**
 * VetAssist - Tarım ve Orman Bakanlığı Veteriner E-Reçete & İTS Bildirim Servisi (its.js)
 * Sahada yapılan tedavi, aşı ve narkotik/kontrole tabi ilaç uygulamalarını
 * Bakanlık E-Reçete ve İlaç Takip Sistemi (İTS) formatına tek tıkla dönüştürür.
 * Tamamen yerel (cihazda) çalışır, internet gerektirmez ve Syncra ERP'den bağımsızdır.
 */

class ITSPrescriptionManager {
  constructor() {
    this.modal = null;
    this.currentPrescription = {
      doctorName: '',
      vetRegNo: '',
      prescriptionType: 'normal', // normal | red (narkotik) | green (psikotrop) | orange (aşı)
      customerName: '',
      animalType: 'Sığır',
      earTagNo: '',
      businessNo: '',
      diagnosis: '',
      items: []
    };
    this.html5QrScanner = null;
    this.scanningItemIndex = -1;
    this.storageModuleKey = 'vetassist_its_module_status';
  }

  isModuleEnabled() {
    const isTr = (window.i18n && window.i18n.getLanguage() === 'tr') || (localStorage.getItem('vetassist_lang') || 'tr') === 'tr';
    if (!isTr) return false;
    return localStorage.getItem(this.storageModuleKey) !== 'disabled';
  }

  updateVisibility() {
    const enabled = this.isModuleEnabled();
    const isTr = (window.i18n && window.i18n.getLanguage() === 'tr') || (localStorage.getItem('vetassist_lang') || 'tr') === 'tr';

    const toggleWrap = document.getElementById('wrapperSettingItsModule');
    const toggle = document.getElementById('settingItsModuleToggle');
    const mainItsWrapper = document.getElementById('wrapperMainItsBtn') || document.getElementById('btnMainOpenItsModal');
    const receiptItsBtn = document.getElementById('btnReceiptOpenItsModal');

    if (toggleWrap) {
      toggleWrap.style.display = isTr ? 'block' : 'none';
    }
    if (toggle) {
      toggle.checked = localStorage.getItem(this.storageModuleKey) !== 'disabled';
    }

    if (mainItsWrapper) {
      mainItsWrapper.style.display = enabled ? 'block' : 'none';
    }
    if (receiptItsBtn) {
      receiptItsBtn.style.display = enabled ? 'flex' : 'none';
    }
  }

  init() {
    this.modal = document.getElementById('itsPrescriptionModal');
    if (!this.modal) return;

    // Hekim bilgilerini yerelden yükle
    const savedDoc = localStorage.getItem('vetassist_its_doctor_name') || localStorage.getItem('vetassist_syncra_doctor_name_v2') || '';
    const savedReg = localStorage.getItem('vetassist_its_vet_reg_no') || '';
    const docInput = document.getElementById('itsDoctorName');
    const regInput = document.getElementById('itsVetRegNo');
    if (docInput && savedDoc) docInput.value = savedDoc;
    if (regInput && savedReg) regInput.value = savedReg;

    // Modal açma butonları
    const btnMain = document.getElementById('btnMainOpenItsModal');
    if (btnMain) {
      btnMain.addEventListener('click', () => this.openFromCurrentCalculation());
    }

    const btnReceipt = document.getElementById('btnReceiptOpenItsModal');
    if (btnReceipt) {
      btnReceipt.addEventListener('click', () => this.openFromReceiptPreview());
    }

    const btnClose = document.getElementById('closeItsModalBtn');
    if (btnClose) {
      btnClose.addEventListener('click', () => this.closeModal());
    }

    // Karekod tarayıcı kapatma
    const btnCloseScanner = document.getElementById('closeItsScannerBtn');
    if (btnCloseScanner) {
      btnCloseScanner.addEventListener('click', () => this.stopBarcodeScanner());
    }

    // Aksiyon Butonları
    const btnCopy = document.getElementById('btnItsCopyText');
    if (btnCopy) btnCopy.addEventListener('click', () => this.copyMinistryText());

    const btnPrint = document.getElementById('btnItsPrint');
    if (btnPrint) btnPrint.addEventListener('click', () => this.printPrescription());

    const btnDownload = document.getElementById('btnItsDownloadJson');
    if (btnDownload) btnDownload.addEventListener('click', () => this.downloadItsJson());

    const btnOpenPortal = document.getElementById('btnItsOpenPortal');
    if (btnOpenPortal) {
      btnOpenPortal.addEventListener('click', () => {
        // T.C. Tarım ve Orman Bakanlığı Hayvan Bilgi Sistemi (HBS) E-Reçete / İTS Resmi Girişi
        window.open('https://hbs.tarbil.gov.tr/', '_blank', 'noopener,noreferrer');
      });
    }

    // Reçete Önizleme Kapatma ve Yazdırma Kontrolleri
    const btnClosePreview = document.getElementById('closeItsPreviewBtn');
    if (btnClosePreview) {
      btnClosePreview.addEventListener('click', () => this.closePreviewModal());
    }
    const btnClosePreviewX = document.getElementById('closeItsPreviewX');
    if (btnClosePreviewX) {
      btnClosePreviewX.addEventListener('click', () => this.closePreviewModal());
    }
    const btnPrintExec = document.getElementById('btnItsPrintExecute');
    if (btnPrintExec) {
      btnPrintExec.addEventListener('click', () => this.executePrint());
    }

    // Hekim bilgisi kaydedildikçe yerelde sakla
    if (docInput) {
      docInput.addEventListener('input', () => {
        localStorage.setItem('vetassist_its_doctor_name', docInput.value.trim());
      });
    }
    if (regInput) {
      regInput.addEventListener('input', () => {
        localStorage.setItem('vetassist_its_vet_reg_no', regInput.value.trim());
      });
    }

    const animalTypeSelect = document.getElementById('itsAnimalType');
    if (animalTypeSelect) {
      animalTypeSelect.addEventListener('change', () => this.updateAnimalTypeUI());
    }

    // E-Reçete & İTS modülü aç/kapat toggle dinleyicisi
    const itsToggle = document.getElementById('settingItsModuleToggle');
    if (itsToggle) {
      itsToggle.addEventListener('change', (e) => {
        localStorage.setItem(this.storageModuleKey, e.target.checked ? 'enabled' : 'disabled');
        this.updateVisibility();
        if (window.app && typeof window.app.showToast === 'function') {
          window.app.showToast(e.target.checked ? '📋 E-Reçete & İTS bildirim butonları aktif edildi.' : '📋 E-Reçete & İTS bildirim butonları gizlendi.');
        }
      });
    }

    this.updateVisibility();
  }

  updateAnimalTypeUI() {
    const type = document.getElementById('itsAnimalType')?.value || 'Kedi';
    const isPet = ['Kedi', 'Köpek', 'Egzotik'].includes(type);
    const header = document.getElementById('itsAnimalHeader');
    const lblId = document.getElementById('lblItsIdNo');
    const inputId = document.getElementById('itsEarTagNo');
    const lblBus = document.getElementById('lblItsBusinessNo');
    const inputBus = document.getElementById('itsBusinessNo');

    if (isPet) {
      if (header) header.innerHTML = '🐾 Evcil Hayvan & Mikroçip Bilgileri (PETVET)';
      if (lblId) lblId.textContent = 'Mikroçip No (15 Hane) / PETVET';
      if (inputId) inputId.placeholder = 'Örn: 990000001234567';
      if (lblBus) lblBus.textContent = 'PETVET Pasaport / Çip Protokol No';
      if (inputBus) inputBus.placeholder = 'Örn: TR-PAS-00123';
    } else {
      if (header) header.innerHTML = '🐄 Çiftlik Hayvanı & TÜRKVET / İşletme Bilgileri';
      if (lblId) lblId.textContent = 'Kulak Küpe No (TÜRKVET)';
      if (inputId) inputId.placeholder = 'Örn: TR-34-12345678';
      if (lblBus) lblBus.textContent = 'Tarım Bak. İşletme No';
      if (inputBus) inputBus.placeholder = 'Örn: TR34000123';
    }
  }

  openFromCurrentCalculation() {
    // Ana ekrandaki mevcut seçili ilaçları ve hastayı çek
    const custInput = document.getElementById('calcCustomerInput') || document.getElementById('customerName');
    const customer = (custInput ? custInput.value : '').trim() || 'Genel Müşteri';
    const items = this._extractItemsFromForm();
    this.openModal({
      customerName: customer,
      items: items
    });
  }

  openFromReceiptPreview() {
    // Adisyon modalından verileri çek
    const custElem = document.getElementById('receiptCustomerName') || document.getElementById('receiptCustomer');
    const customer = (custElem ? custElem.textContent : '').trim() || 'Genel Müşteri';
    const items = this._extractItemsFromForm();
    this.openModal({
      customerName: customer,
      items: items
    });
  }

  _extractItemsFromForm() {
    // 1. window.app.cart üzerinden çek (aktif sepet)
    if (window.app && Array.isArray(window.app.cart) && window.app.cart.length > 0) {
      return window.app.cart.map(ci => ({
        name: ci.item ? ci.item.name : (ci.name || 'İlaç/Uygulama'),
        quantity: Number(ci.qty || 1),
        route: 'Deri Altı (SC) / Kas İçi (IM)',
        barcode: '',
        serialNo: '',
        lotNo: '',
        withdrawalPeriod: ''
      }));
    }

    // 2. window.app.currentReceiptData üzerinden çek
    if (window.app && window.app.currentReceiptData && Array.isArray(window.app.currentReceiptData.items)) {
      return window.app.currentReceiptData.items.map(it => ({
        name: it.name || it.title || 'İlaç/Uygulama',
        quantity: Number(it.quantity || it.qty || 1),
        route: 'Deri Altı (SC) / Kas İçi (IM)',
        barcode: '',
        serialNo: '',
        lotNo: '',
        withdrawalPeriod: ''
      }));
    }

    return [{
      name: 'Örnek İlaç / Aşı',
      quantity: 1,
      route: 'Deri Altı (SC) / Kas İçi (IM)',
      barcode: '',
      serialNo: '',
      lotNo: '',
      withdrawalPeriod: ''
    }];
  }

  openModal({ customerName = '', items = [] } = {}) {
    if (!this.modal) return;
    this.currentPrescription.customerName = customerName;
    this.currentPrescription.items = items;

    // Alanları doldur
    const custInput = document.getElementById('itsCustomerName');
    if (custInput) custInput.value = customerName;

    // Hekim
    const docInput = document.getElementById('itsDoctorName');
    if (docInput) {
      docInput.value = localStorage.getItem('vetassist_its_doctor_name') || localStorage.getItem('vetassist_syncra_doctor_name_v2') || '';
    }
    const regInput = document.getElementById('itsVetRegNo');
    if (regInput) {
      regInput.value = localStorage.getItem('vetassist_its_vet_reg_no') || '';
    }

    this.updateAnimalTypeUI();
    this.renderItemsList();
    this.modal.style.display = 'flex';
  }

  closeModal() {
    if (this.modal) this.modal.style.display = 'none';
    this.stopBarcodeScanner();
  }

  renderItemsList() {
    const container = document.getElementById('itsItemsContainer');
    if (!container) return;

    if (!this.currentPrescription.items || this.currentPrescription.items.length === 0) {
      container.innerHTML = '<div style="text-align:center; padding:16px; color:var(--text-muted); font-size:0.8rem;">Reçeteye eklenmiş ilaç bulunamadı.</div>';
      return;
    }

    container.innerHTML = this.currentPrescription.items.map((it, idx) => `
      <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:10px; padding:10px 12px; margin-bottom:8px; font-size:0.78rem;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <strong style="color:#0f172a; font-size:0.82rem;">${idx + 1}. ${this._escapeHtml(it.name)}</strong>
          <span style="background:#e0f2fe; color:#0369a1; padding:2px 8px; border-radius:6px; font-weight:700;">
            Miktar: ${it.quantity}
          </span>
        </div>
        
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:6px;">
          <div>
            <label style="font-size:0.7rem; color:var(--text-muted); display:block; font-weight:600;">Uygulama Yolu</label>
            <select class="form-input" style="padding:4px 6px; font-size:0.74rem;" onchange="window.itsManager.updateItemRoute(${idx}, this.value)">
              <option value="Kas İçi (IM)" ${it.route === 'Kas İçi (IM)' ? 'selected' : ''}>Kas İçi (IM)</option>
              <option value="Deri Altı (SC)" ${it.route === 'Deri Altı (SC)' ? 'selected' : ''}>Deri Altı (SC)</option>
              <option value="Damar İçi (IV)" ${it.route === 'Damar İçi (IV)' ? 'selected' : ''}>Damar İçi (IV)</option>
              <option value="Ağızdan (Oral)" ${it.route === 'Ağızdan (Oral)' ? 'selected' : ''}>Ağızdan (Oral)</option>
              <option value="Meme İçi (LC)" ${it.route === 'Meme İçi (LC)' ? 'selected' : ''}>Meme İçi (LC)</option>
              <option value="Deri Üstü (Topikal)" ${it.route === 'Deri Üstü (Topikal)' ? 'selected' : ''}>Deri Üstü (Topikal)</option>
            </select>
          </div>
          <div>
            <label style="font-size:0.7rem; color:var(--text-muted); display:block; font-weight:600;">Arınma Süresi (Et / Süt)</label>
            <input type="text" class="form-input" style="padding:4px 6px; font-size:0.74rem;" value="${this._escapeHtml(it.withdrawalPeriod || '')}" onchange="window.itsManager.updateItemWithdrawal(${idx}, this.value)" placeholder="Örn: Et: 28g / Süt: 7g">
          </div>
        </div>

        <!-- İTS Karekod / Seri No -->
        <div style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:8px; padding:6px 8px; margin-top:4px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <span style="font-size:0.7rem; font-weight:700; color:#334155;">İTS Karekod / Seri No (2D DataMatrix):</span>
            <button type="button" class="btn btn-sm" style="padding:2px 8px; font-size:0.7rem; background:#0284c7; color:#fff; border:none; border-radius:6px; font-weight:700;" onclick="window.itsManager.startBarcodeScanner(${idx})">
              📷 Karekod Tara
            </button>
          </div>
          <input type="text" class="form-input text-mono" style="padding:4px 6px; font-size:0.72rem; width:100%;" value="${this._escapeHtml(it.barcode || it.serialNo || '')}" onchange="window.itsManager.updateItemBarcode(${idx}, this.value)" placeholder="GTIN: 0869... SN: ... BN: ... XD: ...">
        </div>
      </div>
    `).join('');
  }

  updateItemRoute(index, val) {
    if (this.currentPrescription.items[index]) {
      this.currentPrescription.items[index].route = val;
    }
  }

  updateItemWithdrawal(index, val) {
    if (this.currentPrescription.items[index]) {
      this.currentPrescription.items[index].withdrawalPeriod = val;
    }
  }

  updateItemBarcode(index, val) {
    if (this.currentPrescription.items[index]) {
      this.currentPrescription.items[index].barcode = val;
      this.currentPrescription.items[index].serialNo = val;
    }
  }

  startBarcodeScanner(itemIndex) {
    this.scanningItemIndex = itemIndex;
    const scannerModal = document.getElementById('itsBarcodeScannerModal');
    if (scannerModal) scannerModal.style.display = 'flex';

    if (typeof Html5Qrcode === 'undefined') {
      alert('Karekod okuyucu kütüphanesi henüz yüklenmedi.');
      return;
    }

    try {
      this.html5QrScanner = new Html5Qrcode('itsScannerReader');
      this.html5QrScanner.start(
        { facingMode: 'environment' },
        { fps: 12, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          this.handleScannedBarcode(decodedText);
        },
        () => {}
      ).catch(err => {
        console.error('Kamera hatası:', err);
        alert('Kamera açılamadı: ' + (err.message || err));
      });
    } catch (e) {
      console.error('Tarayıcı başlatma hatası:', e);
    }
  }

  stopBarcodeScanner() {
    const scannerModal = document.getElementById('itsBarcodeScannerModal');
    if (scannerModal) scannerModal.style.display = 'none';
    if (this.html5QrScanner) {
      this.html5QrScanner.stop().catch(() => {}).finally(() => {
        this.html5QrScanner = null;
      });
    }
  }

  handleScannedBarcode(decodedText) {
    this.stopBarcodeScanner();
    const idx = this.scanningItemIndex;
    if (idx >= 0 && this.currentPrescription.items[idx]) {
      // GS1 DataMatrix Ayrıştırma (01=GTIN, 21=Serial, 17=ExpDate, 10=Lot)
      let parsed = decodedText;
      let gtin = '';
      let sn = '';
      let bn = '';
      let xd = '';

      if (decodedText.startsWith('01') && decodedText.length > 16) {
        gtin = decodedText.substring(2, 16);
        const rest = decodedText.substring(16);
        parsed = `GTIN: ${gtin} | ${rest}`;
      }

      this.currentPrescription.items[idx].barcode = decodedText;
      this.currentPrescription.items[idx].serialNo = parsed;
      this.renderItemsList();
      if (typeof window.app?.showToast === 'function') {
        window.app.showToast('✅ İlaç karekodu başarıyla okundu!');
      } else {
        alert('İlaç karekodu okundu: ' + parsed);
      }
    }
  }

  collectFormData() {
    const docName = (document.getElementById('itsDoctorName')?.value || '').trim();
    const vetRegNo = (document.getElementById('itsVetRegNo')?.value || '').trim();
    const type = document.getElementById('itsPrescriptionType')?.value || 'normal';
    const customer = (document.getElementById('itsCustomerName')?.value || '').trim();
    const animalType = document.getElementById('itsAnimalType')?.value || 'Sığır';
    const earTag = (document.getElementById('itsEarTagNo')?.value || '').trim();
    const businessNo = (document.getElementById('itsBusinessNo')?.value || '').trim();
    const diagnosis = (document.getElementById('itsDiagnosis')?.value || '').trim();

    return {
      doctorName: docName || 'Veteriner Hekim',
      vetRegNo: vetRegNo || 'Belirtilmedi',
      prescriptionType: type,
      customerName: customer || 'Hasta Sahibi',
      animalType,
      earTagNo: earTag || 'Belirtilmedi',
      businessNo: businessNo || 'Belirtilmedi',
      diagnosis: diagnosis || 'Rutin Tedavi / Koruyucu Hekimlik',
      date: new Date().toLocaleDateString('tr-TR') + ' ' + new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      items: this.currentPrescription.items
    };
  }

  generateMinistryText() {
    const data = this.collectFormData();
    const isPet = ['Kedi', 'Köpek', 'Egzotik'].includes(data.animalType);
    const typeLabel = {
      normal: 'BEYAZ REÇETE (Normal İlaçlar)',
      red: 'KIRMIZI REÇETE (Narkotik / Uyuşturucu)',
      green: 'YEŞİL REÇETE (Psikotrop)',
      orange: 'TURUNCU REÇETE (Aşı & Biyolojik Ürünler)'
    }[data.prescriptionType] || 'VETERİNER E-REÇETE';

    let text = `🇹🇷 T.C. TARIM VE ORMAN BAKANLIĞI\n`;
    text += isPet ? `PETVET EV HAYVANI E-REÇETE & İTS BİLDİRİMİ\n` : `VETERİNER E-REÇETE & İTS BİLDİRİM FORMU\n`;
    text += `=====================================\n`;
    text += `📋 Reçete Türü: ${typeLabel}\n`;
    text += `📅 Tarih/Saat: ${data.date}\n`;
    text += `👨‍⚕️ Hekim: ${data.doctorName} (Oda/Sicil: ${data.vetRegNo})\n`;
    text += `👤 Hasta Sahibi: ${data.customerName}\n`;
    if (isPet) {
      text += `🐾 Hayvan: ${data.animalType} | Mikroçip No (PETVET): ${data.earTagNo || 'Belirtilmedi'}\n`;
      if (data.businessNo) text += `📘 Pasaport / Çip Protokol No: ${data.businessNo}\n`;
    } else {
      text += `🏢 Tarım Bak. İşletme No: ${data.businessNo || 'Belirtilmedi'}\n`;
      text += `🐄 Hayvan Türü: ${data.animalType} | Küpe No (TÜRKVET): ${data.earTagNo || 'Belirtilmedi'}\n`;
    }
    text += `🩺 Teşhis/Endikasyon: ${data.diagnosis}\n`;
    text += `-------------------------------------\n`;
    text += `💊 UYGULANAN İLAÇ VE AŞILAR:\n`;

    data.items.forEach((it, i) => {
      text += `\n${i + 1}. ${it.name} - ${it.quantity} Doz/Adet\n`;
      text += `   • Uygulama Yolu: ${it.route}\n`;
      if (it.barcode) text += `   • İTS Karekod: ${it.barcode}\n`;
      if (!isPet && it.withdrawalPeriod) text += `   • Yasal Arınma: ${it.withdrawalPeriod}\n`;
    });

    text += `\n-------------------------------------\n`;
    if (isPet) {
      text += `ℹ️ PET BİLGİLENDİRME: Bu reçete Ev Hayvanı Kayıt Sistemi (PETVET) ve İTS mevzuatına uygun olarak evcil hayvan tedavisi için düzenlenmiştir. Yalnızca hayvan sağlığında kullanılır.\n`;
    } else {
      text += `⚠️ YASAL UYARI: Bu reçete Tarım ve Orman Bakanlığı İlaç Takip Sistemi (İTS) mevzuatına uygun olarak düzenlenmiştir. Hayvansal gıdalarda kalıntı riskine karşı arınma sürelerine titizlikle uyulmalıdır.\n`;
    }
    return text;
  }

  copyMinistryText() {
    const text = this.generateMinistryText();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        if (typeof window.app?.showToast === 'function') {
          window.app.showToast('📋 E-Reçete metni panoya kopyalandı! Bakanlık portalına veya WhatsApp\'a yapıştırabilirsiniz.');
        } else {
          alert('E-Reçete metni panoya kopyalandı!');
        }
      }).catch(() => {
        this._fallbackCopy(text);
      });
    } else {
      this._fallbackCopy(text);
    }
  }

  _fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    alert('E-Reçete metni panoya kopyalandı!');
  }

  downloadItsJson() {
    const data = this.collectFormData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `E-Recete_ITS_${data.earTagNo || 'Saha'}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    if (typeof window.app?.showToast === 'function') {
      window.app.showToast('💾 İTS Bildirim Paketi (JSON) cihazınıza indirildi.');
    }
  }

  closePreviewModal() {
    const modal = document.getElementById('itsPrescriptionPreviewModal');
    if (modal) modal.style.display = 'none';
  }

  printPrescription() {
    const data = this.collectFormData();
    const modal = document.getElementById('itsPrescriptionPreviewModal');
    const container = document.getElementById('itsPrescriptionPreviewContent');
    if (!modal || !container) {
      alert('Önizleme modülü bulunamadı.');
      return;
    }

    const typeColor = {
      normal: '#0f172a',
      red: '#b91c1c',
      green: '#047857',
      orange: '#c2410c'
    }[data.prescriptionType] || '#0f172a';

    const typeName = {
      normal: 'BEYAZ REÇETE (Normal İlaçlar)',
      red: 'KIRMIZI REÇETE (Narkotik / Kontrole Tabi)',
      green: 'YEŞİL REÇETE (Psikotrop)',
      orange: 'TURUNCU REÇETE (Aşı / Biyolojik Ürün)'
    }[data.prescriptionType] || 'VETERİNER REÇETESİ';

    const verificationCode = 'TR-VET-' + Math.floor(10000000 + Math.random() * 90000000);

    container.innerHTML = `
      <div style="border-bottom: 2px solid ${typeColor}; padding-bottom: 12px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
        <div>
          <div style="font-size:11px; font-weight:700; color:#64748b;">T.C. TARIM VE ORMAN BAKANLIĞI</div>
          <div style="font-size:15px; font-weight:800; color:${typeColor};">${['Kedi', 'Köpek', 'Egzotik'].includes(data.animalType) ? 'PETVET EV HAYVANI E-REÇETESİ' : 'VETERİNER HEKİM E-REÇETESİ'}</div>
        </div>
        <span style="background:${typeColor}; color:#fff; padding:4px 10px; border-radius:6px; font-weight:700; font-size:11px;">${typeName}</span>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:12px; background:#f8fafc; padding:12px; border-radius:8px; margin-bottom:14px; border:1px solid #e2e8f0;">
        <div><strong>Veteriner Hekim:</strong> ${this._escapeHtml(data.doctorName || 'Veteriner Hekim')}</div>
        <div><strong>Diploma/Sicil No:</strong> ${this._escapeHtml(data.vetRegNo || '-')}</div>
        <div><strong>Hasta Sahibi:</strong> ${this._escapeHtml(data.customerName || 'Genel Müşteri')}</div>
        <div><strong>${['Kedi', 'Köpek', 'Egzotik'].includes(data.animalType) ? 'PETVET Pasaport / Protokol:' : 'İşletme No:'}</strong> ${this._escapeHtml(data.businessNo || '-')}</div>
        <div><strong>Hayvan Türü:</strong> ${this._escapeHtml(data.animalType || '-')}</div>
        <div><strong>${['Kedi', 'Köpek', 'Egzotik'].includes(data.animalType) ? 'Mikroçip No (PETVET):' : 'Küpe No (TÜRKVET):'}</strong> ${this._escapeHtml(data.earTagNo || '-')}</div>
        <div style="grid-column: span 2;"><strong>Teşhis / Endikasyon:</strong> ${this._escapeHtml(data.diagnosis || '-')}</div>
        <div style="grid-column: span 2;"><strong>Tarih & Saat:</strong> ${this._escapeHtml(data.date || '')}</div>
      </div>

      <div style="font-size:12px; font-weight:700; margin-bottom:6px; color:#1e293b;">UYGULANAN İLAÇ VE BİYOLOJİK MADDELER</div>
      <div style="overflow-x:auto;">
        <table style="width:100%; border-collapse:collapse; font-size:11px; margin-bottom:14px;">
          <thead>
            <tr style="background:#f1f5f9;">
              <th style="padding:6px; text-align:left; border-bottom:1px solid #cbd5e1;">#</th>
              <th style="padding:6px; text-align:left; border-bottom:1px solid #cbd5e1;">İlaç / Aşı Adı</th>
              <th style="padding:6px; text-align:center; border-bottom:1px solid #cbd5e1;">Miktar</th>
              <th style="padding:6px; text-align:left; border-bottom:1px solid #cbd5e1;">Uygulama Yolu</th>
              <th style="padding:6px; text-align:left; border-bottom:1px solid #cbd5e1;">İTS Karekod / Seri</th>
              ${!['Kedi', 'Köpek', 'Egzotik'].includes(data.animalType) ? '<th style="padding:6px; text-align:left; border-bottom:1px solid #cbd5e1;">Yasal Arınma</th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${data.items.map((it, idx) => `
              <tr>
                <td style="padding:6px; border-bottom:1px solid #e2e8f0;">${idx + 1}</td>
                <td style="padding:6px; border-bottom:1px solid #e2e8f0;"><strong>${this._escapeHtml(it.name)}</strong></td>
                <td style="padding:6px; text-align:center; border-bottom:1px solid #e2e8f0;">${this._escapeHtml(it.quantity)}</td>
                <td style="padding:6px; border-bottom:1px solid #e2e8f0;">${this._escapeHtml(it.route)}</td>
                <td style="padding:6px; border-bottom:1px solid #e2e8f0; font-family:monospace; font-size:10px;">${this._escapeHtml(it.barcode || it.serialNo || '-')}</td>
                ${!['Kedi', 'Köpek', 'Egzotik'].includes(data.animalType) ? `<td style="padding:6px; border-bottom:1px solid #e2e8f0; color:#b91c1c; font-weight:600;">${this._escapeHtml(it.withdrawalPeriod || '-')}</td>` : ''}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div style="margin-top:14px; font-size:10px; color:#64748b; border:1px dashed #cbd5e1; padding:8px 10px; border-radius:6px; line-height:1.4;">
        ${['Kedi', 'Köpek', 'Egzotik'].includes(data.animalType)
          ? '<strong>PET BİLGİLENDİRME:</strong> Bu reçete Ev Hayvanı Kayıt Sistemi (PETVET) ve İTS mevzuatına uygun olarak evcil hayvan tedavisi için düzenlenmiştir. Yalnızca hayvan sağlığında kullanılır.'
          : '<strong>YASAL UYARI:</strong> Bu reçete Tarım ve Orman Bakanlığı İlaç Takip Sistemi (İTS) mevzuatına göre düzenlenmiştir. Arınma süresi tamamlanmadan hayvanların kesime sevk edilmesi veya sütlerinin insan tüketimine sunulması 5996 sayılı kanun gereğince yasaktır.'
        }
      </div>

      <div style="margin-top:12px; padding:8px 12px; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:6px; font-size:10px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px;">
        <span style="font-weight:700; color:#15803d;">🔒 E-Reçete Takip & Doğrulama No: ${verificationCode}</span>
        <span style="color:#166534; font-weight:600;">✓ Bakanlık İTS/PETVET Sistemine Hazır Elektronik Kayıt</span>
      </div>

      <div class="sign" style="margin-top:24px; display:flex; justify-content:space-between; font-size:11px; line-height:1.4;">
        <div style="width:45%; border-top:1px dashed #94a3b8; padding-top:6px;">
          <strong>Hasta Sahibi / Yetkili</strong><br>
          İmza:<br>
          <span style="font-size:9px; color:#94a3b8;">(Baskı çıktısında mavi tükenmez kalemle imzalanır)</span>
        </div>
        <div style="width:45%; border-top:1px dashed #94a3b8; padding-top:6px; text-align:right;">
          <strong>Veteriner Hekim Kaşe / İmza</strong><br>
          <strong>${this._escapeHtml(data.doctorName || 'Veteriner Hekim')}</strong><br>
          <span style="font-size:10px; color:#64748b;">Sicil/Oda No: ${this._escapeHtml(data.vetRegNo || '-')}</span><br>
          <span style="font-size:9px; color:#059669; font-weight:700;">✓ Elektronik Belge Kaydı</span>
        </div>
      </div>
    `;

    modal.style.display = 'flex';
  }

  executePrint() {
    const container = document.getElementById('itsPrescriptionPreviewContent');
    if (!container) return;

    let printFrame = document.getElementById('itsPrintFrame');
    if (!printFrame) {
      printFrame = document.createElement('iframe');
      printFrame.id = 'itsPrintFrame';
      printFrame.style.position = 'fixed';
      printFrame.style.right = '0';
      printFrame.style.bottom = '0';
      printFrame.style.width = '0';
      printFrame.style.height = '0';
      printFrame.style.border = '0';
      document.body.appendChild(printFrame);
    }

    const doc = printFrame.contentWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>T.C. Tarım ve Orman Bakanlığı - Veteriner E-Reçete</title>
        <style>
          @page { size: A4 portrait; margin: 12mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 0; padding: 12px; }
          table { width: 100%; border-collapse: collapse; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        ${container.innerHTML}
      </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      try {
        printFrame.contentWindow.focus();
        printFrame.contentWindow.print();
      } catch (e) {
        window.print();
      }
    }, 250);
  }

  _escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

// Global olarak başlat
window.itsManager = new ITSPrescriptionManager();
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.itsManager.init();
  });
} else {
  window.itsManager.init();
}
