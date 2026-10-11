/**
 * VetAssist - Suni Tohumlama, E-Islah & Doğum Takvimi Modülü (insemination.js)
 * T.C. Tarım ve Orman Bakanlığı standartlarında resmi Suni Tohumlama Belgesi ve üreme takvimi.
 * Yalnızca Türkçe dilinde ve modül aktifken çalışır.
 */

class InseminationManager {
  constructor() {
    this.storageVetNameKey = 'vetassist_ins_vet_name';
    this.storageVetRegKey = 'vetassist_ins_vet_reg';
    this.storageModuleKey = 'vetassist_module_insemination';
    this.currentData = null;
  }

  init() {
    this.bindEvents();
    this.loadSavedVetInfo();
    this.setTodayDate();
    this.updateCalculatedDates();
    this.updateVisibility();
  }

  isModuleEnabled() {
    const isTr = (window.i18n && window.i18n.getLanguage() === 'tr') || (localStorage.getItem('vetassist_lang') || 'tr') === 'tr';
    if (!isTr) return false;
    return localStorage.getItem(this.storageModuleKey) !== 'disabled';
  }

  updateVisibility() {
    const enabled = this.isModuleEnabled();
    const navTab = document.getElementById('navTabInsemination');
    const pane = document.getElementById('tab-insemination');
    const toggleWrap = document.getElementById('wrapperSettingInseminationModule');
    const toggle = document.getElementById('settingInseminationModuleToggle');

    const isTr = (window.i18n && window.i18n.getLanguage() === 'tr') || (localStorage.getItem('vetassist_lang') || 'tr') === 'tr';

    if (toggleWrap) {
      toggleWrap.style.display = isTr ? 'block' : 'none';
    }
    if (toggle) {
      toggle.checked = localStorage.getItem(this.storageModuleKey) !== 'disabled';
    }

    if (navTab) {
      navTab.style.display = enabled ? 'inline-flex' : 'none';
    }
    if (pane && !enabled && pane.classList.contains('active')) {
      pane.classList.remove('active');
      const calcTab = document.querySelector('.nav-pill-tab[data-target="tab-calc"]');
      const calcPane = document.getElementById('tab-calc');
      if (calcTab) calcTab.classList.add('active');
      if (calcPane) calcPane.classList.add('active');
    }
  }

  setTodayDate() {
    const dateInput = document.getElementById('insDate');
    if (dateInput && !dateInput.value) {
      const today = new Date().toISOString().slice(0, 10);
      dateInput.value = today;
    }
  }

  loadSavedVetInfo() {
    const vetNameInput = document.getElementById('insVetName');
    const vetRegInput = document.getElementById('insVetRegNo');
    const savedName = localStorage.getItem(this.storageVetNameKey) || localStorage.getItem('vetassist_its_doctor_name') || '';
    const savedReg = localStorage.getItem(this.storageVetRegKey) || localStorage.getItem('vetassist_its_vet_reg_no') || '';

    if (vetNameInput && !vetNameInput.value) vetNameInput.value = savedName;
    if (vetRegInput && !vetRegInput.value) vetRegInput.value = savedReg;
  }

  bindEvents() {
    const dateInput = document.getElementById('insDate');
    if (dateInput) {
      dateInput.addEventListener('change', () => this.updateCalculatedDates());
    }

    const earTagInput = document.getElementById('insMotherEarTag');
    if (earTagInput) {
      earTagInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.toUpperCase().replace(/\s+/g, '');
      });
    }

    const custInput = document.getElementById('insCustomerName');
    if (custInput) {
      custInput.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        if (window.stockManager && typeof window.stockManager.findPartnerByName === 'function') {
          const pt = window.stockManager.findPartnerByName(val);
          if (pt && (pt.taxNumber || pt.notes)) {
            const busInput = document.getElementById('insBusinessNo');
            if (busInput && (!busInput.value || busInput.value.startsWith('TR-'))) {
              busInput.value = pt.taxNumber || pt.notes;
            }
          }
        }
      });
    }

    const vetNameInput = document.getElementById('insVetName');
    if (vetNameInput) {
      vetNameInput.addEventListener('input', (e) => {
        localStorage.setItem(this.storageVetNameKey, e.target.value.trim());
      });
    }

    const vetRegInput = document.getElementById('insVetRegNo');
    if (vetRegInput) {
      vetRegInput.addEventListener('input', (e) => {
        localStorage.setItem(this.storageVetRegKey, e.target.value.trim());
      });
    }

    const btnSave = document.getElementById('btnSaveInsemination');
    if (btnSave) {
      btnSave.addEventListener('click', () => this.handleSave());
    }

    const btnPreview = document.getElementById('btnPreviewInsemination');
    if (btnPreview) {
      btnPreview.addEventListener('click', () => {
        const data = this.collectFormData();
        this.showPreviewModal(data);
      });
    }

    const btnWhatsApp = document.getElementById('btnWhatsappInsemination');
    if (btnWhatsApp) {
      btnWhatsApp.addEventListener('click', () => {
        const data = this.collectFormData();
        this.shareWhatsApp(data);
      });
    }

    const btnCloneLast = document.getElementById('btnInsCloneLast');
    if (btnCloneLast) {
      btnCloneLast.addEventListener('click', () => this.cloneLastTemplate());
    }

    const closeBtn = document.getElementById('closeInsPreviewBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closePreviewModal());
    }

    const closeBtnX = document.getElementById('closeInsPreviewX');
    if (closeBtnX) {
      closeBtnX.addEventListener('click', () => this.closePreviewModal());
    }

    const printBtn = document.getElementById('btnInsPrintExecute');
    if (printBtn) {
      printBtn.addEventListener('click', () => this.executePrint());
    }

    const toggle = document.getElementById('settingInseminationModuleToggle');
    if (toggle) {
      toggle.addEventListener('change', (e) => {
        localStorage.setItem(this.storageModuleKey, e.target.checked ? 'enabled' : 'disabled');
        this.updateVisibility();
        if (window.app && typeof window.app.showToast === 'function') {
          window.app.showToast(e.target.checked ? '🌾 Tohumlama modülü aktif edildi.' : 'Tohumlama modülü kapatıldı.');
        }
      });
    }
  }

  updateCalculatedDates() {
    const dateInput = document.getElementById('insDate');
    const baseDate = (dateInput && dateInput.value) ? new Date(dateInput.value) : new Date();
    if (isNaN(baseDate.getTime())) return;

    const estrusDate = new Date(baseDate);
    estrusDate.setDate(estrusDate.getDate() + 21);

    const pregDate = new Date(baseDate);
    pregDate.setDate(pregDate.getDate() + 60);

    const dryDate = new Date(baseDate);
    dryDate.setDate(dryDate.getDate() + 210);

    const birthDate = new Date(baseDate);
    birthDate.setDate(birthDate.getDate() + 280);

    const fmt = (d) => d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });

    const elEst = document.getElementById('insCalcEstruDay');
    const elPreg = document.getElementById('insCalcPregDay');
    const elDry = document.getElementById('insCalcDryDay');
    const elBirth = document.getElementById('insCalcBirthDay');

    if (elEst) elEst.textContent = fmt(estrusDate);
    if (elPreg) elPreg.textContent = fmt(pregDate);
    if (elDry) elDry.textContent = fmt(dryDate);
    if (elBirth) elBirth.textContent = fmt(birthDate);
  }

  collectFormData() {
    const dateInput = document.getElementById('insDate');
    const baseDate = (dateInput && dateInput.value) ? new Date(dateInput.value) : new Date();

    const addDays = (d, n) => {
      const res = new Date(d);
      res.setDate(res.getDate() + n);
      return res.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    return {
      motherEarTag: (document.getElementById('insMotherEarTag')?.value || '').trim() || 'TR-BELİRTİLMEDİ',
      animalBreed: document.getElementById('insAnimalBreed')?.value || 'Simental',
      customerName: (document.getElementById('insCustomerName')?.value || '').trim() || 'Genel Yetiştirici',
      businessNo: (document.getElementById('insBusinessNo')?.value || '').trim() || 'TR-BELİRTİLMEDİ',
      date: (dateInput?.value) ? new Date(dateInput.value).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : new Date().toLocaleDateString('tr-TR'),
      order: document.getElementById('insOrder')?.value || '1. Tohumlama',
      bullName: (document.getElementById('insBullName')?.value || '').trim() || 'GS DER BESTE',
      spermBatch: (document.getElementById('insSpermBatch')?.value || '').trim() || 'PAYET-BELİRTİLMEDİ',
      price: parseFloat(document.getElementById('insPrice')?.value) || 0,
      vetName: (document.getElementById('insVetName')?.value || '').trim() || 'Veteriner Hekim',
      vetRegNo: (document.getElementById('insVetRegNo')?.value || '').trim() || '-',
      estrusDate: addDays(baseDate, 21),
      pregDate: addDays(baseDate, 60),
      dryDate: addDays(baseDate, 210),
      birthDate: addDays(baseDate, 280),
      docNo: 'ST-' + new Date().getFullYear() + '-' + Math.floor(100000 + Math.random() * 900000)
    };
  }

  handleSave() {
    const data = this.collectFormData();
    if (!data.motherEarTag || data.motherEarTag === 'TR-BELİRTİLMEDİ') {
      alert('Lütfen tohumlanan hayvanın kulak küpe numarasını girin.');
      document.getElementById('insMotherEarTag')?.focus();
      return;
    }

    // Syncra ERP Uyumlu Hizmet Kalemi (Service Line Item)
    const inseminationServiceItem = {
      id: `service_ins_${Date.now()}`,
      name: `Suni Tohumlama - ${data.motherEarTag} (${data.bullName} - Payet: ${data.spermBatch})`,
      qty: 1,
      unitPrice: data.price,
      total: data.price,
      isService: true,
      isFee: true
    };

    let partnerId = null;
    if (window.stockManager && typeof window.stockManager.findPartnerByName === 'function') {
      const pt = window.stockManager.findPartnerByName(data.customerName);
      if (pt) partnerId = pt.id;
    }

    if (window.logManager) {
      window.logManager.addLog({
        mode: 'insemination',
        customer: data.customerName,
        partnerId: partnerId,
        itemsSummary: `🌾 ${data.motherEarTag} İnek Tohumlama (${data.bullName} - Payet: ${data.spermBatch})`,
        grandTotal: data.price,
        subTotal: data.price,
        items: [inseminationServiceItem],
        allItems: [inseminationServiceItem],
        inseminationData: data
      });
    }

    // Son şablonu hatırla (Seri Tohumlama / Sürü Takibi için)
    try {
      localStorage.setItem('vetassist_last_ins_template', JSON.stringify({
        animalBreed: data.animalBreed,
        customerName: data.customerName,
        businessNo: data.businessNo,
        bullName: data.bullName,
        spermBatch: data.spermBatch,
        price: data.price
      }));
    } catch (e) {}

    if (window.app && typeof window.app.triggerSecureAutoBackup === 'function') {
      window.app.triggerSecureAutoBackup();
    }

    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast('✅ Suni Tohumlama kaydı yapıldı ve Geçmiş Tedaviler sekmesine eklendi!');
    }

    this.showPreviewModal(data);
  }

  cloneLastTemplate() {
    const raw = localStorage.getItem('vetassist_last_ins_template');
    if (!raw) {
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('ℹ️ Henüz kayıtlı şablon yok. Önce bir tohumlama kaydedin.');
      }
      return;
    }
    try {
      const t = JSON.parse(raw);
      if (t.animalBreed && document.getElementById('insAnimalBreed')) document.getElementById('insAnimalBreed').value = t.animalBreed;
      if (t.customerName && document.getElementById('insCustomerName')) document.getElementById('insCustomerName').value = t.customerName;
      if (t.businessNo && document.getElementById('insBusinessNo')) document.getElementById('insBusinessNo').value = t.businessNo;
      if (t.bullName && document.getElementById('insBullName')) document.getElementById('insBullName').value = t.bullName;
      if (t.spermBatch && document.getElementById('insSpermBatch')) document.getElementById('insSpermBatch').value = t.spermBatch;
      if (t.price && document.getElementById('insPrice')) document.getElementById('insPrice').value = t.price;
      const earInput = document.getElementById('insMotherEarTag');
      if (earInput) {
        earInput.value = '';
        earInput.focus();
      }
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('📋 Son tohumlama şablonu yüklendi! Yeni küpe no girin.');
      }
    } catch (e) {}
  }

  renderDocumentHtml(data) {
    return `
      <div style="border-bottom: 2.5px solid #059669; padding-bottom: 12px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
        <div>
          <div style="font-size:11px; font-weight:700; color:#64748b; letter-spacing:0.5px;">T.C. TARIM VE ORMAN BAKANLIĞI</div>
          <div style="font-size:15px; font-weight:800; color:#059669;">SUNİ TOHUMLAMA VE ISLAH KAYIT BELGESİ</div>
          <div style="font-size:10px; color:#475569;">E-Islah & TÜRKVET Suni Tohumlama Kayıt Sistemi (STKS) Uyumlu</div>
        </div>
        <div style="text-align:right;">
          <span style="background:#059669; color:#fff; padding:4px 10px; border-radius:6px; font-weight:700; font-size:11px; display:inline-block;">${this._escapeHtml(data.order)}</span>
          <div style="font-size:10px; font-family:monospace; margin-top:3px; color:#64748b;">${this._escapeHtml(data.docNo)}</div>
        </div>
      </div>

      <!-- Bilgi Tablosu -->
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:12px; background:#f8fafc; padding:12px; border-radius:8px; margin-bottom:14px; border:1px solid #e2e8f0;">
        <div><strong>Tohumlanan Küpe No:</strong> <span style="font-family:monospace; font-weight:700; color:#0f172a;">${this._escapeHtml(data.motherEarTag)}</span></div>
        <div><strong>Hayvan Irkı:</strong> ${this._escapeHtml(data.animalBreed)}</div>
        <div><strong>Yetiştirici / Müşteri:</strong> ${this._escapeHtml(data.customerName)}</div>
        <div><strong>İşletme Numarası:</strong> <span style="font-family:monospace;">${this._escapeHtml(data.businessNo)}</span></div>
        <div><strong>Tohumlama Tarihi:</strong> ${this._escapeHtml(data.date)}</div>
        <div><strong>Tohumlama Sırası:</strong> ${this._escapeHtml(data.order)}</div>
        <div style="grid-column: span 2; border-top:1px dashed #cbd5e1; padding-top:6px; margin-top:4px;">
          <strong>Kullanılan Boğa Adı:</strong> <span style="color:#0284c7; font-weight:700;">${this._escapeHtml(data.bullName)}</span>
        </div>
        <div style="grid-column: span 2;">
          <strong>Sperma Payet / Barkod / Parti No:</strong> <span style="font-family:monospace; font-weight:700;">${this._escapeHtml(data.spermBatch)}</span>
        </div>
      </div>

      <!-- Otomatik Üreme & Doğum Takvimi Tablosu -->
      <div style="margin-bottom:14px; background:#ecfdf5; border:1.5px solid #a7f3d0; border-radius:10px; padding:12px;">
        <div style="font-size:12px; font-weight:700; color:#065f46; margin-bottom:8px; display:flex; align-items:center; gap:6px;">
          <span>📅</span> <span>Hekim & Yetiştirici Üreme Takvimi</span>
        </div>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(130px, 1fr)); gap:8px; font-size:11px;">
          <div style="background:#ffffff; padding:8px; border-radius:6px; border:1px solid #d1fae5;">
            <div style="color:#64748b; font-size:10px;">21. Gün Dönüş / Kızgınlık</div>
            <strong style="color:#d97706; font-size:12px;">${this._escapeHtml(data.estrusDate)}</strong>
          </div>
          <div style="background:#ffffff; padding:8px; border-radius:6px; border:1px solid #d1fae5;">
            <div style="color:#64748b; font-size:10px;">60. Gün Gebelik Muayenesi</div>
            <strong style="color:#0284c7; font-size:12px;">${this._escapeHtml(data.pregDate)}</strong>
          </div>
          <div style="background:#ffffff; padding:8px; border-radius:6px; border:1px solid #d1fae5;">
            <div style="color:#64748b; font-size:10px;">210. Gün Kurudaki Dönem</div>
            <strong style="color:#64748b; font-size:12px;">${this._escapeHtml(data.dryDate)}</strong>
          </div>
          <div style="background:#ffffff; padding:8px; border-radius:6px; border:1px solid #d1fae5;">
            <div style="color:#64748b; font-size:10px;">280. Gün Muhtemel Doğum</div>
            <strong style="color:#16a34a; font-size:12px;">${this._escapeHtml(data.birthDate)}</strong>
          </div>
        </div>
      </div>

      <!-- Yasal Bilgilendirme -->
      <div style="margin-bottom:14px; font-size:10px; color:#64748b; border:1px dashed #cbd5e1; padding:8px 10px; border-radius:6px; line-height:1.4;">
        <strong>YASAL UYARI & DESTEKLEME BİLGİLENDİRMESİ:</strong> Bu belge 5996 sayılı Veteriner Hizmetleri Kanunu ve Suni Tohumlama Uygulama Talimatı kapsamında düzenlenmiştir. Doğacak buzağının Bakanlık buzağı desteklemesinden yararlanabilmesi için bu tohumlama kaydının yasal süresi içinde E-Islah sistemine girilmiş olması zorunludur.
      </div>

      <!-- İmza Alanı -->
      <div style="margin-top:24px; display:flex; justify-content:space-between; font-size:11px; line-height:1.5;">
        <div style="width:45%; border-top:1px dashed #94a3b8; padding-top:6px;">
          <strong>Yetiştirici / Hayvan Sahibi</strong><br>
          İmza:<br>
          <span style="font-size:9px; color:#94a3b8;">(Baskıda mavi tükenmez kalemle imzalanır)</span>
        </div>
        <div style="width:45%; border-top:1px dashed #94a3b8; padding-top:6px; text-align:right;">
          <strong>Uygulayıcı Veteriner Hekim Kaşe / İmza</strong><br>
          <strong>${this._escapeHtml(data.vetName)}</strong><br>
          <span style="font-size:10px; color:#64748b;">Belge/Sicil No: ${this._escapeHtml(data.vetRegNo)}</span><br>
          <span style="font-size:9px; color:#059669; font-weight:700;">✓ E-Islah Bildirimine Hazır Belge</span>
        </div>
      </div>
    `;
  }

  showPreviewModal(data) {
    this.currentData = data;
    const modal = document.getElementById('inseminationDocPreviewModal');
    const content = document.getElementById('inseminationDocPreviewContent');
    if (!modal || !content) return;

    content.innerHTML = this.renderDocumentHtml(data);
    modal.style.display = 'flex';
  }

  closePreviewModal() {
    const modal = document.getElementById('inseminationDocPreviewModal');
    if (modal) modal.style.display = 'none';
  }

  executePrint() {
    const content = document.getElementById('inseminationDocPreviewContent');
    if (!content) return;

    let printFrame = document.getElementById('inseminationPrintFrame');
    if (!printFrame) {
      printFrame = document.createElement('iframe');
      printFrame.id = 'inseminationPrintFrame';
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
        <title>T.C. Tarım ve Orman Bakanlığı - Suni Tohumlama Belgesi</title>
        <style>
          @page { size: A4 portrait; margin: 12mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 0; padding: 12px; }
          table { width: 100%; border-collapse: collapse; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        ${content.innerHTML}
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

  shareWhatsApp(data) {
    if (!data) data = this.currentData || this.collectFormData();
    const msg = 
      `🌾 *VETASSIST SUNİ TOHUMLAMA BİLGİLENDİRMESİ*\n\n` +
      `Sayın *${data.customerName}*,\n` +
      `İşletmenizde bulunan *${data.motherEarTag}* küpeli (${data.animalBreed}) hayvanınıza suni tohumlama başarıyla uygulanmıştır.\n\n` +
      `📋 *Tohumlama Detayları:*\n` +
      `• Tarih: ${data.date} (${data.order})\n` +
      `• Kullanılan Boğa: ${data.bullName}\n` +
      `• Payet/Seri No: ${data.spermBatch}\n` +
      `• Uygulayan Hekim: ${data.vetName}\n\n` +
      `📅 *Üreme & Doğum Takvimi:*\n` +
      `• *21. Gün Kızgınlık/Dönüş:* ${data.estrusDate}\n` +
      `• *60. Gün Gebelik Muayenesi:* ${data.pregDate}\n` +
      `• *210. Gün Kurudaki Dönem:* ${data.dryDate}\n` +
      `• *280. Gün Muhtemel Doğum:* ${data.birthDate}\n\n` +
      `Belge No: ${data.docNo}\n` +
      `_T.C. Tarım ve Orman Bakanlığı E-Islah / STKS kayıtlarına işlenmek üzere saklayınız._`;

    const url = 'https://api.whatsapp.com/send?text=' + encodeURIComponent(msg);
    window.open(url, '_blank');
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

// Global başlatıcı
window.inseminationManager = new InseminationManager();
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.inseminationManager.init();
  });
} else {
  window.inseminationManager.init();
}
