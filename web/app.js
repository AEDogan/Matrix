/**
 * VetAssist v0.5 - Ana Uygulama Kontrolcüsü (app.js)
 * Glassmorphism Tasarım, 3 Sekmeli Bilgi Mimarisi, Ayarlar Çekmecesi,
 * Hazır Tedavi Setleri (Protokoller), Canlı Hesaplama,
 * Sadeleştirilmiş WhatsApp (JPG veya Metin) Paylaşımı.
 */

const DEFAULT_PRESETS = [
  {
    id: 'preset_1',
    name: '🩺 Mastitis Standart Seti',
    name_en: '🩺 Standard Mastitis Set',
    items: [
      { name: 'Antibiyotik Enjeksiyon (100 ml)', qty: 1 },
      { name: 'Ağrı Kesici & Antienflamatuar (50 ml)', qty: 1 },
      { name: 'Meme İçi Tüp (Antibakteriyel)', qty: 2 }
    ]
  },
  {
    id: 'preset_2',
    name: '🧪 Buzağı İshal Protokolü',
    name_en: '🧪 Calf Scours Protocol',
    items: [
      { name: 'Serum 500 ml (SF)', qty: 2 },
      { name: 'Oral Rehidratasyon Tozu', qty: 1 },
      { name: 'Vitamin A-D3-E (100 ml)', qty: 1 }
    ]
  },
  {
    id: 'preset_3',
    name: '💉 Rutin Aşılama & Parazit',
    name_en: '💉 Routine Vaccine & Parasite',
    items: [
      { name: 'Antiparaziter Aşı (Doz)', qty: 1 },
      { name: 'Kuduz Aşısı (Doz)', qty: 1 },
      { name: 'Enjektör 10cc (Adet)', qty: 2 }
    ]
  }
];

class AppController {
  constructor() {
    this.mode = 'treatment'; // 'treatment' | 'quote'
    this.customerName = '';
    this.cart = []; // [{ item: Product, qty: 1 }]
    this.distanceKm = 0;
    this.isDistanceCollapsibleOpen = false;
    this.batchSelections = new Map(); // id -> qty
    this.presetsKey = 'vetassist_presets_v05';
    this.presets = this.loadPresets();
    this.currentReceiptData = null;

    this.init();
  }

  init() {
    // 0. Güvenlik Kalkanı: Sıfırlanma durumunda yerel dosya yedeğinden otomatik kurtar
    this.checkAndRestoreAutoBackup();

    // 1. Dil başlatma
    if (window.i18n) {
      window.i18n.translateDOM();
      const langSelect = document.getElementById('settingLanguage');
      if (langSelect) {
        langSelect.value = window.i18n.getLanguage();
      }
    }

    // 2. Klinik ayarlarını inputlara doldur
    this.loadClinicSettingsToInputs();

    // 3. Modülleri başlat
    if (window.stockManager) window.stockManager.renderUI();
    if (window.paramManager) window.paramManager.renderUI();
    if (window.logManager) window.logManager.renderUI();
    if (window.inseminationManager) window.inseminationManager.updateVisibility();
    if (window.itsManager) window.itsManager.updateVisibility();

    this.renderPresets();
    this.bindEvents();
    this.recalculate();
    this.checkNetworkStatus();
    this.registerServiceWorker();
    this.initSyncraBridge();

    // İlk açılışta güncel durumu yedekle
    setTimeout(() => this.triggerSecureAutoBackup(), 3000);
  }

  // ================= SECURE LOCAL BACKUP SHIELD =================
  checkAndRestoreAutoBackup() {
    if (!window.AndroidBridge || typeof window.AndroidBridge.loadSecureBackup !== 'function') return;
    try {
      const hasLogs = localStorage.getItem('vetassist_sales_logs_v2');
      const hasStock = localStorage.getItem('vetassist_stock_items_v2');
      if (!hasLogs && !hasStock) {
        const raw = window.AndroidBridge.loadSecureBackup();
        if (raw && raw.trim().startsWith('{')) {
          const data = JSON.parse(raw);
          let restored = 0;
          for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key) && data[key]) {
              localStorage.setItem(key, data[key]);
              restored++;
            }
          }
          if (restored > 0) {
            console.log('🛡️ Güvenli dosya yedeğinden kurtarıldı:', restored, 'anahtar.');
            setTimeout(() => {
              this.showToast('🛡️ Yerel güvenlik kalkanından verileriniz başarıyla kurtarıldı!');
            }, 500);
          }
        }
      }
    } catch (e) {
      console.warn('Backup restore failed:', e);
    }
  }

  triggerSecureAutoBackup() {
    if (!window.AndroidBridge || typeof window.AndroidBridge.saveSecureBackup !== 'function') return;
    if (this._backupTimeout) clearTimeout(this._backupTimeout);
    this._backupTimeout = setTimeout(() => {
      try {
        const keys = [
          'vetassist_sales_logs_v2',
          'vetassist_stock_items_v2',
          'vetassist_presets_v05',
          'vetassist_clinic_info_v2',
          'vetassist_its_doctor_name',
          'vetassist_its_vet_reg_no',
          'vetassist_ins_vet_name',
          'vetassist_ins_vet_reg',
          'vetassist_module_insemination',
          'vetassist_lang',
          'vetassist_currency'
        ];
        const payload = {};
        keys.forEach(k => {
          const val = localStorage.getItem(k);
          if (val !== null) payload[k] = val;
        });
        window.AndroidBridge.saveSecureBackup(JSON.stringify(payload));
      } catch (err) {
        console.warn('Auto-backup dispatch error:', err);
      }
    }, 1500);
  }

  // ================= SYNCRA ERP SAHA KÖPRÜSÜ =================
  getSyncMode() {
    return localStorage.getItem('vetassist_sync_mode_v2') === 'syncra' ? 'syncra' : 'sheets';
  }

  setSyncMode(mode) {
    localStorage.setItem('vetassist_sync_mode_v2', mode === 'syncra' ? 'syncra' : 'sheets');
    this.renderSyncModeUI();
  }

  renderSyncModeUI() {
    const isSyncra = this.getSyncMode() === 'syncra';
    const btnSheets = document.getElementById('btnSelectModeSheets');
    const btnSyncra = document.getElementById('btnSelectModeSyncra');
    if (btnSheets) btnSheets.className = 'btn btn-sm ' + (isSyncra ? 'btn-outline-primary' : 'btn-primary');
    if (btnSyncra) btnSyncra.className = 'btn btn-sm ' + (isSyncra ? 'btn-primary' : 'btn-outline-primary');
    const sheetsCard = document.getElementById('sheetsConfigCard');
    const syncraCard = document.getElementById('syncraConfigCard');
    if (sheetsCard) sheetsCard.style.opacity = isSyncra ? '0.75' : '1';
    if (syncraCard) syncraCard.style.opacity = isSyncra ? '1' : '0.75';
    const sheetsBadge = document.getElementById('sheetsActiveBadge');
    const syncraBadge = document.getElementById('syncraActiveBadge');
    if (sheetsBadge) {
      sheetsBadge.textContent = isSyncra ? 'E-Tablo (Pasif)' : 'Aktif Kaynak';
      sheetsBadge.style.background = isSyncra ? 'rgba(100,116,139,0.15)' : 'rgba(2,132,199,0.2)';
      sheetsBadge.style.color = isSyncra ? 'var(--text-muted)' : 'var(--primary)';
    }
    if (syncraBadge) {
      syncraBadge.textContent = isSyncra ? 'Aktif Köprü' : 'Beklemede';
      syncraBadge.style.background = isSyncra ? 'rgba(16,185,129,0.22)' : 'rgba(100,116,139,0.15)';
      syncraBadge.style.color = isSyncra ? '#059669' : 'var(--text-muted)';
    }
    const headerBtnLabel = document.querySelector('#syncSheetsBtn [data-i18n="btn_sync_sheets"]');
    if (headerBtnLabel) headerBtnLabel.textContent = isSyncra ? 'Syncra' : 'Sheets';
    this.updateSyncraQueueInfo();
    if (window.carilerManager && typeof window.carilerManager.updateVisibility === 'function') {
      window.carilerManager.updateVisibility();
    }
  }

  updateSyncraQueueInfo(extraText) {
    const el = document.getElementById('syncraPendingQueueInfo');
    if (!el) return;
    const pending = window.logManager ? window.logManager.getUnsyncedLogs().length : 0;
    const last = localStorage.getItem('vetassist_syncra_last_sync_v2');
    const parts = [];
    if (this.getSyncMode() === 'syncra') {
      parts.push(pending > 0 ? `⏳ Syncra'ya gönderilmeyi bekleyen ${pending} kayıt var (internet gelince otomatik gider).` : '✅ Bekleyen kayıt yok.');
    }
    if (last) parts.push(`Son eşitleme: ${new Date(parseInt(last, 10)).toLocaleString('tr-TR')}`);
    if (extraText) parts.push(extraText);
    el.textContent = parts.join(' • ');
  }

  updateCustomerPortfolioBadge() {
    const input = document.getElementById('calcCustomerInput');
    const badge = document.getElementById('customerPortfolioBadge');
    if (!input || !badge || !window.stockManager) return;
    const match = window.stockManager.findPartnerByName(input.value || '');
    badge.style.display = match ? 'inline-block' : 'none';
  }

  initSyncraBridge() {
    const urlInput = document.getElementById('settingSyncraServerUrl');
    const keyInput = document.getElementById('settingSyncraApiKey');
    if (urlInput) urlInput.value = localStorage.getItem('vetassist_syncra_url_v2') || urlInput.value || 'http://localhost:3000';
    if (keyInput) keyInput.value = localStorage.getItem('vetassist_syncra_key_v2') || '';

    const btnSheets = document.getElementById('btnSelectModeSheets');
    const btnSyncra = document.getElementById('btnSelectModeSyncra');
    if (btnSheets) btnSheets.addEventListener('click', () => {
      this.setSyncMode('sheets');
      const acc = document.getElementById('accordionSheets');
      if (acc) acc.open = true;
      this.showToast('📊 Google Sheets modu aktif. Syncra ayarlarınız saklı kalır.');
    });
    if (btnSyncra) btnSyncra.addEventListener('click', () => {
      const acc = document.getElementById('accordionSyncra');
      if (acc) acc.open = true;
      if (!localStorage.getItem('vetassist_syncra_key_v2')) {
        this.showToast('🔑 Önce Syncra QR kodunu tarayın veya API anahtarını girin.');
        if (keyInput) keyInput.focus();
        return;
      }
      this.setSyncMode('syncra');
      this.runSyncraSync({ manual: true });
    });

    const saveBtn = document.getElementById('saveSyncraConfigBtn');
    if (saveBtn) saveBtn.addEventListener('click', async () => {
      const url = (urlInput ? urlInput.value : '').trim() || 'http://localhost:3000';
      const key = (keyInput ? keyInput.value : '').trim();
      if (!key) {
        this.showToast('⚠️ Syncra API anahtarı boş olamaz.');
        return;
      }
      const isFirstConnect = !localStorage.getItem('vetassist_syncra_since_v2');
      if (isFirstConnect) {
        const ok = window.confirm(
          'Syncra\'ya ilk bağlantı:\n\n' +
          '• Telefondaki mevcut ürünleriniz SİLİNMEZ; Syncra\'da olmayanlar Syncra\'ya yeni ürün olarak eklenir.\n' +
          '• Google Sheets linkiniz saklı kalır, istediğiniz zaman geri dönebilirsiniz.\n' +
          '• Bu andan ÖNCEKİ eski adisyonlar Syncra\'ya gönderilmez (mükerrer stok düşümünü önlemek için). Bundan sonraki tüm kayıtlar otomatik gider.\n\nDevam edilsin mi?'
        );
        if (!ok) return;
      }
      localStorage.setItem('vetassist_syncra_url_v2', url);
      localStorage.setItem('vetassist_syncra_key_v2', key);
      if (isFirstConnect) localStorage.setItem('vetassist_syncra_since_v2', String(Date.now()));
      this.setSyncMode('syncra');
      await this.runSyncraSync({ manual: true, mergeLocal: true });
    });

    const manualBtn = document.getElementById('btnManualSyncraPushPull');
    if (manualBtn) manualBtn.addEventListener('click', () => this.runSyncraSync({ manual: true }));

    // QR Kod ile Eşleşme Butonları
    const btnScanQr = document.getElementById('btnScanSyncraQr');
    if (btnScanQr) {
      btnScanQr.addEventListener('click', () => this.startSyncraQrScanner());
    }
    const btnCloseQrModal = document.getElementById('btnCloseSyncraQrModal');
    if (btnCloseQrModal) {
      btnCloseQrModal.addEventListener('click', () => this.stopSyncraQrScanner());
    }
    const btnForget = document.getElementById('btnForgetSyncraDevice');
    if (btnForget) {
      btnForget.addEventListener('click', () => {
        if (window.confirm('Bu cihazın Syncra klinik bağlantısını silmek istediğinize emin misiniz?')) {
          localStorage.removeItem('vetassist_syncra_device_token_v2');
          localStorage.removeItem('vetassist_syncra_doctor_name_v2');
          localStorage.removeItem('vetassist_syncra_clinic_name_v2');
          localStorage.removeItem('vetassist_syncra_key_v2');
          if (keyInput) keyInput.value = '';
          this.renderActiveDeviceInfo();
          this.showToast('ℹ️ Klinik bağlantısı bu cihazdan silindi.');
        }
      });
    }

    // İnternet geri gelince otomatik gönder
    window.addEventListener('online', () => this.triggerSyncraAutoSync());
    // Uygulama öne gelince ve her 2 dakikada bir bekleyen kuyruğu dene
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') this.triggerSyncraAutoSync();
    });
    setInterval(() => this.triggerSyncraAutoSync(), 120000);

    this.renderActiveDeviceInfo();
    this.renderSyncModeUI();
    this.updateCustomerPortfolioBadge();
    setTimeout(() => this.triggerSyncraAutoSync(), 1500);
  }

  renderActiveDeviceInfo() {
    const card = document.getElementById('syncraActiveDeviceInfo');
    const doctorDisplay = document.getElementById('syncraDoctorNameDisplay');
    const clinicDisplay = document.getElementById('syncraClinicNameDisplay');
    const docName = localStorage.getItem('vetassist_syncra_doctor_name_v2');
    const clinicName = localStorage.getItem('vetassist_syncra_clinic_name_v2') || 'Syncra ERP';

    if (card && doctorDisplay && clinicDisplay) {
      if (docName) {
        doctorDisplay.textContent = docName;
        clinicDisplay.textContent = clinicName;
        card.style.display = 'block';
      } else {
        card.style.display = 'none';
      }
    }
  }

  startSyncraQrScanner() {
    const modal = document.getElementById('syncraQrScanModal');
    if (modal) modal.style.display = 'flex';

    if (typeof Html5Qrcode === 'undefined') {
      this.showToast('⚠️ QR tarayıcı kütüphanesi hazır değil. Lütfen sayfayı yenileyin.');
      return;
    }

    try {
      if (this._html5QrScanner) {
        this._html5QrScanner.stop().catch(() => {}).finally(() => {
          this._html5QrScanner = null;
          this._initAndStartQrScanner();
        });
      } else {
        this._initAndStartQrScanner();
      }
    } catch (e) {
      console.error('QR scanner başlatma hatası:', e);
      this.showToast('⚠️ Kamera başlatılamadı: ' + (e.message || e));
    }
  }

  _initAndStartQrScanner() {
    this._html5QrScanner = new Html5Qrcode('syncraQrReader');
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };
    this._html5QrScanner.start(
      { facingMode: 'environment' },
      config,
      (decodedText) => {
        this.handlePairQrData(decodedText);
      },
      (errorMessage) => {
        // Okuma anındaki ara hatalar yutulur
      }
    ).catch(err => {
      console.error('Kamera açma hatası:', err);
      this.showToast('⚠️ Kamera açılamadı: ' + (err.message || 'Lütfen kamera iznini kontrol edin.'));
    });
  }

  stopSyncraQrScanner() {
    const modal = document.getElementById('syncraQrScanModal');
    if (modal) modal.style.display = 'none';
    if (this._html5QrScanner) {
      this._html5QrScanner.stop().catch(() => {}).finally(() => {
        this._html5QrScanner = null;
      });
    }
  }

  async handlePairQrData(decodedText) {
    this.stopSyncraQrScanner();
    try {
      const payload = JSON.parse(decodedText);
      if (!payload || payload.type !== 'syncra_vetassist_pair' || !payload.apiKey) {
        this.showToast('⚠️ Geçersiz QR kod! Lütfen Syncra ERP ekranındaki VetAssist QR kodunu tarayın.');
        return;
      }

      const serverUrl = (payload.serverUrl || 'http://localhost:3000').replace(/\/+$/, '');
      const apiKey = payload.apiKey;
      const clinicName = payload.clinicName || 'Klinik';

      // Hekim adını al
      const existingDoc = localStorage.getItem('vetassist_syncra_doctor_name_v2') || '';
      const doctorName = (window.prompt(
        `"${clinicName}" kliniğine bağlanılıyor.\n\nLütfen adınızı veya unvanınızı girin:`,
        existingDoc || 'Veteriner Hekim'
      ) || '').trim();

      if (!doctorName) {
        this.showToast('⚠️ Hekim adı girilmediği için eşleşme iptal edildi.');
        return;
      }

      this.showToast('⏳ Syncra ile güvenli eşleşme kuruluyor...');

      // Syncra backend pair ucuna istek at
      const resp = await fetch(`${serverUrl}/api/vetassist-bridge/pair`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          doctorName,
          clinicName
        })
      });

      const resData = await resp.json();
      if (!resp.ok || !resData.success) {
        throw new Error(resData.error || resData.message || 'Eşleşme başarısız oldu.');
      }

      const deviceToken = resData.deviceToken;
      localStorage.setItem('vetassist_syncra_url_v2', serverUrl);
      localStorage.setItem('vetassist_syncra_key_v2', apiKey);
      localStorage.setItem('vetassist_syncra_device_token_v2', deviceToken);
      localStorage.setItem('vetassist_syncra_doctor_name_v2', doctorName);
      localStorage.setItem('vetassist_syncra_clinic_name_v2', resData.clinicName || clinicName);
      if (!localStorage.getItem('vetassist_syncra_since_v2')) {
        localStorage.setItem('vetassist_syncra_since_v2', String(Date.now()));
      }

      const urlInput = document.getElementById('settingSyncraServerUrl');
      const keyInput = document.getElementById('settingSyncraApiKey');
      if (urlInput) urlInput.value = serverUrl;
      if (keyInput) keyInput.value = apiKey;

      this.setSyncMode('syncra');
      this.renderActiveDeviceInfo();
      this.showToast(`✅ Başarılı! ${doctorName} olarak "${clinicName}" kliniğine bağlandınız.`);

      // İlk eşitlemeyi otomatik başlat
      await this.runSyncraSync({ manual: true, mergeLocal: true });

    } catch (err) {
      console.error('QR Eşleşme Hatası:', err);
      this.showToast('❌ Bağlantı başarısız: ' + (err.message || 'Hata oluştu'));
    }
  }

  triggerSyncraAutoSync() {
    if (this.getSyncMode() !== 'syncra') return;
    if (!localStorage.getItem('vetassist_syncra_key_v2')) return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      this.updateSyncraQueueInfo('📴 Çevrimdışı');
      return;
    }
    clearTimeout(this._syncraDebounce);
    this._syncraDebounce = setTimeout(() => this.runSyncraSync({ manual: false }), 800);
  }

  async runSyncraSync({ manual = false, mergeLocal = false } = {}) {
    if (this._syncraSyncing) return;
    if (!window.stockManager) return;
    this._syncraSyncing = true;

    // Loading State
    const manualBtn = document.getElementById('btnManualSyncraPushPull');
    const originalText = manualBtn ? manualBtn.innerHTML : '';
    if (manualBtn && manual) {
      manualBtn.disabled = true;
      manualBtn.innerHTML = '⏳ <span>Eşitleniyor...</span>';
    }

    try {
      const res = await window.stockManager.syncWithSyncra({ mergeLocal });
      localStorage.setItem('vetassist_syncra_last_sync_v2', String(Date.now()));
      this.updateCustomerPortfolioBadge();
      const sent = (res.processedLogsCount || 0) + (res.reviewLogsCount || 0);
      if (manual || sent > 0) {
        const parts = [];
        if (res.processedLogsCount) parts.push(`${res.processedLogsCount} kayıt işlendi`);
        if (res.reviewLogsCount) parts.push(`${res.reviewLogsCount} kayıt Syncra'da eşleştirme bekliyor`);
        if (res.mergedProductsCount) parts.push(`${res.mergedProductsCount} yerel ürün Syncra'ya eklendi`);
        this.showToast('🔗 Syncra eşitlendi' + (parts.length ? ': ' + parts.join(', ') : '.'));
      }
      this.updateSyncraQueueInfo();
    } catch (err) {
      console.warn('Syncra senkronizasyon hatası:', err);
      this.updateSyncraQueueInfo('⚠️ Bağlantı yok, kayıtlar telefonda güvende bekliyor.');
      if (manual) this.showToast('⚠️ ' + (err.message || 'Syncra\'ya ulaşılamadı. Kayıtlar kuyrukta bekliyor.'));
    } finally {
      this._syncraSyncing = false;
      if (manualBtn && manual) {
        manualBtn.disabled = false;
        manualBtn.innerHTML = originalText;
      }
    }
  }

  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (let registration of registrations) {
          registration.unregister();
        }
      }).catch(() => {});
      if ('caches' in window) {
        caches.keys().then((keys) => {
          keys.forEach((key) => caches.delete(key));
        }).catch(() => {});
      }
    }
  }

  showToast(message, duration = 2800) {
    const toast = document.getElementById('toastNotification');
    if (!toast) return;
    toast.textContent = message;
    toast.style.display = 'block';
    setTimeout(() => {
      toast.style.display = 'none';
    }, duration);
  }

  checkNetworkStatus() {
    const isEn = window.i18n && window.i18n.getLanguage() === 'en';
    window.addEventListener('online', () => {
      this.showToast(isEn ? '🟢 Back Online' : '🟢 Çevrimiçi');
    });
    window.addEventListener('offline', () => {
      this.showToast(isEn ? '🟡 Offline Mode Active' : '🟡 Çevrimdışı Saha Modu Aktif');
    });
  }

  loadPresets() {
    try {
      const saved = localStorage.getItem(this.presetsKey) ||
                    localStorage.getItem('vetassist_presets_v04') ||
                    localStorage.getItem('vetassist_presets_v03') ||
                    localStorage.getItem('vetassist_presets_v02') ||
                    localStorage.getItem('vetassist_presets') ||
                    localStorage.getItem('sahavet_presets');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (!localStorage.getItem(this.presetsKey)) {
            localStorage.setItem(this.presetsKey, JSON.stringify(parsed));
          }
          return parsed;
        }
      }
    } catch (e) {
      console.error('Preset yüklenirken hata:', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_PRESETS));
  }

  savePresets() {
    try {
      localStorage.setItem(this.presetsKey, JSON.stringify(this.presets));
      this.renderPresets();
      this.renderDrawerPresetsList();
    } catch (e) {
      console.error('Preset kaydedilirken hata:', e);
    }
  }

  renderPresets() {
    const container = document.getElementById('presetsScrollRow');
    if (!container) return;

    container.innerHTML = '';
    const isEn = window.i18n && window.i18n.getLanguage() === 'en';

    this.presets.forEach(preset => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'preset-chip-btn';
      const title = (isEn && preset.name_en) ? preset.name_en : preset.name;
      btn.innerHTML = `${title}`;
      btn.title = preset.items.map(i => `${i.qty}x ${i.name}`).join(', ');

      btn.addEventListener('click', () => {
        this.applyPreset(preset);
      });

      container.appendChild(btn);
    });

    // Add + New Preset chip at the end of quick bar
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'preset-chip-btn';
    addBtn.style.borderStyle = 'dashed';
    addBtn.style.opacity = '0.85';
    addBtn.innerHTML = `➕ ${isEn ? 'New Preset' : 'Yeni Set'}`;
    addBtn.addEventListener('click', () => {
      this.openPresetModal();
    });
    container.appendChild(addBtn);
  }

  applyPreset(preset) {
    if (!window.stockManager) return;
    const allStock = window.stockManager.getAll();
    let addedCount = 0;

    preset.items.forEach(pItem => {
      const matched = allStock.find(s => 
        (s.id && pItem.id && s.id === pItem.id) || 
        (s.name && pItem.name && s.name.trim().toLowerCase() === pItem.name.trim().toLowerCase())
      );
      if (matched) {
        this.addToCart(matched, pItem.qty || 1, false);
        addedCount++;
      } else {
        const fallbackItem = {
          id: pItem.id || ('preset_item_' + Math.random().toString(36).substr(2, 7)),
          name: pItem.name,
          unitCost: parseFloat(pItem.unitCost || 50),
          category: 'Genel',
          currentStock: 99,
          minStock: 5
        };
        this.addToCart(fallbackItem, pItem.qty || 1, false);
        addedCount++;
      }
    });

    this.renderCart();
    this.recalculate();

    const isEn = window.i18n && window.i18n.getLanguage() === 'en';
    const title = (isEn && preset.name_en) ? preset.name_en : preset.name;
    this.showToast(window.i18n ? window.i18n.t('preset_loaded_toast', { name: title }) : `"${title}" sepete eklendi.`);
  }

  openPresetModal(presetToEdit = null, prefillFromCart = false) {
    const modal = document.getElementById('presetCreateModal');
    if (!modal) return;

    const isEn = window.i18n && window.i18n.getLanguage() === 'en';
    const idInput = document.getElementById('editPresetId');
    const nameInput = document.getElementById('presetNameInput');
    const iconSelect = document.getElementById('presetIconSelect');
    const searchInput = document.getElementById('presetItemSearch');
    const titleEl = document.getElementById('presetModalTitle');

    if (searchInput) searchInput.value = '';

    this.presetItemQuantities = {};

    if (presetToEdit) {
      if (idInput) idInput.value = presetToEdit.id;
      if (titleEl) titleEl.innerHTML = `✏️ ${isEn ? 'Edit Preset' : 'Tedavi Setini Düzenle'}`;
      
      let pName = presetToEdit.name || '';
      const emojis = ['🩺', '💉', '🧪', '💊', '🛡️', '🐂', '🐄', '🐑', '🐕', '🐈'];
      let foundEmoji = '🩺';
      for (const em of emojis) {
        if (pName.startsWith(em)) {
          foundEmoji = em;
          pName = pName.replace(em, '').trim();
          break;
        }
      }
      if (iconSelect) iconSelect.value = foundEmoji;
      if (nameInput) nameInput.value = pName;

      presetToEdit.items.forEach(it => {
        this.presetItemQuantities[it.id] = it.qty || 1;
      });
    } else if (prefillFromCart && this.cart.length > 0) {
      if (idInput) idInput.value = '';
      if (titleEl) titleEl.innerHTML = `✨ ${isEn ? 'Create Preset from Cart' : 'Sepetten Tedavi Seti Oluştur'}`;
      if (nameInput) nameInput.value = '';
      if (iconSelect) iconSelect.value = '🩺';

      this.cart.forEach(c => {
        this.presetItemQuantities[c.item.id] = c.qty;
      });
    } else {
      if (idInput) idInput.value = '';
      if (titleEl) titleEl.innerHTML = `✨ ${isEn ? 'Create Treatment Preset' : 'Yeni Tedavi Seti Oluştur'}`;
      if (nameInput) nameInput.value = '';
      if (iconSelect) iconSelect.value = '🩺';
    }

    this.renderPresetPickerList();
    modal.style.display = 'flex';
    if (nameInput) nameInput.focus();
  }

  renderPresetPickerList(searchTerm = '') {
    const container = document.getElementById('presetItemsPickerList');
    const counterEl = document.getElementById('presetSelectedItemCount');
    if (!container || !window.stockManager) return;

    container.innerHTML = '';
    const isEn = window.i18n && window.i18n.getLanguage() === 'en';
    const allStock = window.stockManager.getAll();

    const filtered = allStock.filter(item => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (item.name && item.name.toLowerCase().includes(term)) ||
             (item.category && item.category.toLowerCase().includes(term));
    });

    let totalSelected = 0;

    filtered.forEach(item => {
      const qty = this.presetItemQuantities[item.id] || 0;
      if (qty > 0) totalSelected++;

      const row = document.createElement('div');
      row.className = `preset-item-picker-row ${qty > 0 ? 'selected' : ''}`;

      row.innerHTML = `
        <div class="preset-item-info">
          <span class="preset-item-name">${item.name}</span>
          <span class="preset-item-sub">${item.category || ''} • ${window.i18n ? window.i18n.formatMoney(item.unitCost !== undefined ? item.unitCost : (item.cost || 0)) : parseFloat(item.unitCost !== undefined ? item.unitCost : (item.cost || 0)).toFixed(2) + ' TL'}</span>
        </div>
        <div class="preset-stepper">
          <button type="button" class="preset-step-btn btn-minus" data-id="${item.id}">−</button>
          <span class="preset-qty-display">${qty}</span>
          <button type="button" class="preset-step-btn btn-plus" data-id="${item.id}">+</button>
        </div>
      `;

      const minusBtn = row.querySelector('.btn-minus');
      const plusBtn = row.querySelector('.btn-plus');
      const display = row.querySelector('.preset-qty-display');

      minusBtn.addEventListener('click', (e) => {
        e.preventDefault();
        let cur = this.presetItemQuantities[item.id] || 0;
        if (cur > 0) {
          cur--;
          if (cur === 0) {
            delete this.presetItemQuantities[item.id];
            row.classList.remove('selected');
          } else {
            this.presetItemQuantities[item.id] = cur;
          }
          display.textContent = cur;
          this.updatePresetPickerCount();
        }
      });

      plusBtn.addEventListener('click', (e) => {
        e.preventDefault();
        let cur = (this.presetItemQuantities[item.id] || 0) + 1;
        this.presetItemQuantities[item.id] = cur;
        display.textContent = cur;
        row.classList.add('selected');
        this.updatePresetPickerCount();
      });

      container.appendChild(row);
    });

    if (counterEl) {
      counterEl.textContent = `${totalSelected} ${isEn ? 'items selected' : 'kalem seçildi'}`;
    }
  }

  updatePresetPickerCount() {
    const counterEl = document.getElementById('presetSelectedItemCount');
    const isEn = window.i18n && window.i18n.getLanguage() === 'en';
    const total = Object.values(this.presetItemQuantities || {}).filter(q => q > 0).length;
    if (counterEl) {
      counterEl.textContent = `${total} ${isEn ? 'items selected' : 'kalem seçildi'}`;
    }
  }

  savePresetFromModal() {
    const isEn = window.i18n && window.i18n.getLanguage() === 'en';
    const idInput = document.getElementById('editPresetId');
    const nameInput = document.getElementById('presetNameInput');
    const iconSelect = document.getElementById('presetIconSelect');
    const modal = document.getElementById('presetCreateModal');

    const name = nameInput ? nameInput.value.trim() : '';
    const emoji = iconSelect ? iconSelect.value : '🩺';
    const editId = idInput ? idInput.value : '';

    if (!name) {
      this.showToast(isEn ? 'Please enter a preset name.' : 'Lütfen set için bir isim girin.');
      if (nameInput) nameInput.focus();
      return;
    }

    if (!window.stockManager) return;
    const allStock = window.stockManager.getAll();

    const selectedItems = [];
    for (const [id, qty] of Object.entries(this.presetItemQuantities || {})) {
      if (qty > 0) {
        const item = allStock.find(s => s.id === id);
        if (item) {
          selectedItems.push({
            id: item.id,
            name: item.name,
            qty: qty
          });
        }
      }
    }

    if (selectedItems.length === 0) {
      this.showToast(isEn ? 'Please select at least 1 medication.' : 'Lütfen en az 1 adet ilaç veya malzeme seçin.');
      return;
    }

    const fullName = `${emoji} ${name}`;

    if (editId) {
      const idx = this.presets.findIndex(p => p.id === editId);
      if (idx !== -1) {
        this.presets[idx].name = fullName;
        this.presets[idx].name_en = fullName;
        this.presets[idx].items = selectedItems;
      }
    } else {
      const newPreset = {
        id: 'preset_' + Date.now(),
        name: fullName,
        name_en: fullName,
        items: selectedItems
      };
      this.presets.push(newPreset);
    }

    this.savePresets();
    if (modal) modal.style.display = 'none';
    this.showToast(isEn ? `✨ Preset saved: ${fullName}` : `✨ Tedavi seti kaydedildi: ${fullName}`);
  }

  saveCurrentCartAsPreset() {
    if (this.cart.length === 0) {
      this.showToast(window.i18n ? window.i18n.t('cart_empty_title') : 'Sepetiniz boş.');
      return;
    }
    this.openPresetModal(null, true);
  }

  deletePreset(id) {
    this.presets = this.presets.filter(p => p.id !== id);
    this.savePresets();
    this.showToast(window.i18n ? window.i18n.t('preset_deleted_toast') : 'Set silindi.');
  }

  renderDrawerPresetsList() {
    const container = document.getElementById('drawerPresetsList');
    if (!container) return;

    container.innerHTML = '';
    const isEn = window.i18n && window.i18n.getLanguage() === 'en';

    if (this.presets.length === 0) {
      container.innerHTML = `<p class="section-desc">${isEn ? 'No custom presets created yet.' : 'Henüz kayıtlı tedavi seti yok.'}</p>`;
      return;
    }

    this.presets.forEach(p => {
      const card = document.createElement('div');
      card.className = 'glass-card';
      card.style.padding = '10px 14px';
      card.style.marginBottom = '8px';

      const itemsSummary = p.items.map(i => `${i.qty}x ${i.name}`).join(' + ');
      const title = (isEn && p.name_en) ? p.name_en : p.name;

      card.innerHTML = `
        <div style="display:flex; align-items:center; justify-content:space-between;">
          <div style="cursor:pointer; flex:1;" class="preset-edit-click" data-id="${p.id}">
            <strong style="font-size:0.9rem; color:var(--text-main);">${title}</strong>
            <p class="section-desc" style="font-size:0.75rem; margin-top:2px;">${itemsSummary}</p>
          </div>
          <div style="display:flex; gap:6px;">
            <button class="btn btn-outline-secondary btn-xs edit-preset-btn" data-id="${p.id}" title="${isEn ? 'Edit' : 'Düzenle'}">
              ✏️
            </button>
            <button class="btn btn-outline-danger btn-xs delete-preset-btn" data-id="${p.id}" title="${isEn ? 'Delete preset' : 'Seti Sil'}">
              🗑️
            </button>
          </div>
        </div>
      `;

      container.appendChild(card);
    });

    container.querySelectorAll('.edit-preset-btn, .preset-edit-click').forEach(el => {
      el.addEventListener('click', (e) => {
        const id = el.getAttribute('data-id');
        const p = this.presets.find(x => x.id === id);
        if (p) this.openPresetModal(p);
      });
    });

    container.querySelectorAll('.delete-preset-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        this.deletePreset(id);
      });
    });
  }

  // İşlem Modu Değiştir (Tedavi vs Teklif)
  setMode(newMode) {
    this.mode = newMode;
    const btnTreatment = document.getElementById('modeBtnTreatment');
    const btnQuote = document.getElementById('modeBtnQuote');
    const hintEl = document.getElementById('modeHintText');
    const isEn = window.i18n && window.i18n.getLanguage() === 'en';

    if (newMode === 'treatment') {
      if (btnTreatment) btnTreatment.classList.add('active');
      if (btnQuote) btnQuote.classList.remove('active');
      if (hintEl) {
        hintEl.innerHTML = isEn 
          ? '💉 <strong>Applied Treatment:</strong> When completed, medications used are automatically deducted from inventory and logged into sales history.' 
          : '💉 <strong>Uygulanan Tedavi:</strong> İşlem tamamlandığında kullanılan ilaçlar otomatik olarak stoktan düşülür ve satış kaydı işlenir.';
      }
    } else {
      if (btnQuote) btnQuote.classList.add('active');
      if (btnTreatment) btnTreatment.classList.remove('active');
      if (hintEl) {
        hintEl.innerHTML = isEn 
          ? '📄 <strong>Price Quote:</strong> Informational breakdown. Stock is untouched and recorded as a quote in history.' 
          : '📄 <strong>Fiyat Teklifi:</strong> Bilgilendirme amaçlıdır. Stoktan düşüm yapılmaz ve loglara teklif olarak kaydedilir.';
      }
    }

    this.recalculate();
  }

  // Sepete ürün ekle
  addToCart(product, qty = 1, showFeedback = true) {
    const existing = this.cart.find(ci => ci.item.id === product.id);
    if (existing) {
      existing.qty += qty;
    } else {
      this.cart.push({
        item: product,
        qty: qty
      });
    }

    if (showFeedback) {
      this.renderCart();
      this.recalculate();
      if (window.i18n) {
        this.showToast(window.i18n.t('toast_added_to_cart', { name: product.name, qty: qty }));
      } else {
        this.showToast(`"${product.name}" (${qty} adet) eklendi`);
      }
    }
  }

  updateCartQty(productId, delta) {
    const itemIndex = this.cart.findIndex(ci => ci.item.id === productId);
    if (itemIndex !== -1) {
      this.cart[itemIndex].qty += delta;
      if (this.cart[itemIndex].qty <= 0) {
        this.cart.splice(itemIndex, 1);
      }
      this.renderCart();
      this.recalculate();
    }
  }

  clearCart() {
    this.cart = [];
    this.renderCart();
    this.recalculate();
    this.showToast(window.i18n ? window.i18n.t('toast_cart_cleared') : 'Sepet temizlendi.');
  }

  renderCart() {
    const emptyState = document.getElementById('cartEmptyState');
    const cartList = document.getElementById('cartList');
    const cartCount = document.getElementById('cartItemCount');
    const clearBtn = document.getElementById('clearCartBtn');
    const presetBar = document.getElementById('cartPresetBar');

    if (!cartList || !emptyState) return;

    const totalCount = this.cart.reduce((sum, item) => sum + item.qty, 0);
    if (cartCount) cartCount.textContent = totalCount;

    if (this.cart.length === 0) {
      emptyState.style.display = 'block';
      cartList.style.display = 'none';
      if (clearBtn) clearBtn.style.display = 'none';
      if (presetBar) presetBar.style.display = 'none';
      return;
    }

    emptyState.style.display = 'none';
    cartList.style.display = 'flex';
    if (clearBtn) clearBtn.style.display = 'inline-block';
    if (presetBar) presetBar.style.display = 'flex';

    cartList.innerHTML = '';
    const profitMargin = window.paramManager ? window.paramManager.getProfitMargin() : 25;
    const isEn = window.i18n && window.i18n.getLanguage() === 'en';

    this.cart.forEach(ci => {
      const itemCost = parseFloat(ci.item.unitCost !== undefined ? ci.item.unitCost : (ci.item.cost !== undefined ? ci.item.cost : (ci.item.price || 0))) || 0;
      const unitSellingPrice = itemCost * (1 + profitMargin / 100);
      const totalItemPrice = unitSellingPrice * ci.qty;

      const card = document.createElement('div');
      card.className = 'cart-item-card';
      const formattedUnit = window.i18n ? window.i18n.formatMoney(unitSellingPrice) : `${unitSellingPrice.toFixed(2)} TL`;
      const formattedCost = window.i18n ? window.i18n.formatMoney(itemCost) : `${itemCost.toFixed(2)} TL`;
      const formattedTotal = window.i18n ? window.i18n.formatMoney(totalItemPrice) : `${totalItemPrice.toFixed(2)} TL`;
      const unitLabel = window.i18n ? (isEn ? 'Unit:' : 'Birim:') : 'Birim:';
      const costLabel = window.i18n ? (isEn ? 'Cost:' : 'Mal:') : 'Mal:';

      card.innerHTML = `
        <div class="cart-item-header">
          <div>
            <div class="cart-item-title">${ci.item.name}</div>
            <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">
              ${unitLabel} <span class="text-mono text-bold">${formattedUnit}</span>
              <span style="font-size:0.7rem; opacity:0.8;">(${costLabel} ${formattedCost})</span>
            </div>
          </div>
          <div class="cart-item-total">${formattedTotal}</div>
        </div>

        <div class="cart-item-controls">
          <div class="cart-stepper-group">
            <div class="qty-control-glass">
              <button type="button" class="btn-qty btn-cart-minus" data-id="${ci.item.id}" title="${isEn ? 'Decrease' : 'Azalt'}">−</button>
              <span class="qty-display">${ci.qty}</span>
              <button type="button" class="btn-qty btn-cart-plus" data-id="${ci.item.id}" title="${isEn ? 'Increase' : 'Artır'}">+</button>
            </div>
            <div class="quick-dosage-chips">
              <button type="button" class="btn-dosage-chip" data-id="${ci.item.id}" data-delta="1">+1</button>
              <button type="button" class="btn-dosage-chip" data-id="${ci.item.id}" data-delta="5">+5</button>
              <button type="button" class="btn-dosage-chip" data-id="${ci.item.id}" data-delta="10">+10</button>
            </div>
          </div>
          <button type="button" class="btn btn-outline-danger btn-xs btn-cart-remove" data-id="${ci.item.id}">
            🗑️ ${isEn ? 'Remove' : 'Kaldır'}
          </button>
        </div>
      `;

      cartList.appendChild(card);
    });

    cartList.querySelectorAll('.btn-cart-minus').forEach(btn => {
      btn.addEventListener('click', () => {
        this.updateCartQty(btn.getAttribute('data-id'), -1);
      });
    });

    cartList.querySelectorAll('.btn-cart-plus').forEach(btn => {
      btn.addEventListener('click', () => {
        this.updateCartQty(btn.getAttribute('data-id'), 1);
      });
    });

    cartList.querySelectorAll('.btn-dosage-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const delta = parseInt(btn.getAttribute('data-delta'), 10) || 1;
        this.updateCartQty(id, delta);
      });
    });

    cartList.querySelectorAll('.btn-cart-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const item = this.cart.find(c => c.item.id === id);
        if (item) this.updateCartQty(id, -item.qty);
      });
    });
  }

  // Canlı Hesaplama
  recalculate() {
    const profitMargin = window.paramManager ? window.paramManager.getProfitMargin() : 25;
    const isEn = window.i18n && window.i18n.getLanguage() === 'en';

    let rawMedCostTotal = 0;
    let itemsSellingTotal = 0;
    let cartItemsForReceipt = [];

    this.cart.forEach(ci => {
      const itemCost = parseFloat(ci.item.unitCost !== undefined ? ci.item.unitCost : (ci.item.cost !== undefined ? ci.item.cost : (ci.item.price || 0))) || 0;
      const itemRawCost = itemCost * ci.qty;
      rawMedCostTotal += itemRawCost;
      const unitSelling = itemCost * (1 + profitMargin / 100);
      const totalSelling = unitSelling * ci.qty;
      itemsSellingTotal += totalSelling;

      cartItemsForReceipt.push({
        id: ci.item.id,
        name: ci.item.name,
        qty: ci.qty,
        unitPrice: unitSelling,
        total: totalSelling,
        rawCost: itemCost
      });
    });

    const kmRate = window.paramManager ? window.paramManager.getKmRate() : 25;
    const distanceTotal = (parseFloat(this.distanceKm) || 0) * kmRate;

    const breakdown = window.paramManager 
      ? window.paramManager.calculateBreakdown(itemsSellingTotal, this.distanceKm, this.cart.length > 0)
      : { visibleItems: [], maskedTotal: 0, totalAdditionalCost: 0, isDistributing: false };

    const distNotice = document.getElementById('distributedExpenseNotice');
    if (breakdown.isDistributing && this.cart.length > 0) {
      const fixedFee = window.paramManager ? window.paramManager.getFixedClinicFee() : 0;
      if (distNotice) {
        distNotice.style.display = 'flex';
        const distContent = document.getElementById('distNoticeContent');
        const formattedFixedFee = window.i18n ? window.i18n.formatMoney(fixedFee) : `${fixedFee.toFixed(2)} TL`;
        if (distContent) {
          distContent.innerHTML = window.i18n 
            ? `💡 <strong>${window.i18n.t('distribute_notice_text', { amount: formattedFixedFee })}</strong>`
            : `💡 <strong>Sabit Klinik Bedeli (${formattedFixedFee})</strong> ilaç kalemlerine kârsız olarak orantılı dağıtıldı.`;
        }
      }

      if (rawMedCostTotal > 0 && fixedFee > 0) {
        cartItemsForReceipt = cartItemsForReceipt.map(item => {
          const itemRatio = (item.rawCost * item.qty) / rawMedCostTotal;
          const distributedShare = fixedFee * itemRatio;
          const newTotal = item.total + distributedShare;
          const newUnit = newTotal / item.qty;
          return {
            ...item,
            unitPrice: newUnit,
            total: newTotal
          };
        });
        itemsSellingTotal += fixedFee;
      }
    } else {
      if (distNotice) distNotice.style.display = 'none';
    }

    let allReceiptItems = [...cartItemsForReceipt];
    breakdown.visibleItems.forEach(vi => {
      allReceiptItems.push(vi);
    });

    const subTotal = itemsSellingTotal + (breakdown.isDistributing ? (distanceTotal + breakdown.maskedTotal) : breakdown.totalAdditionalCost);
    const vatRate = window.receiptGenerator ? window.receiptGenerator.getClinicInfo().vatRate : 18;
    const isVatEnabled = false;
    const vatAmount = isVatEnabled ? (subTotal * (vatRate / 100)) : 0;
    const grandTotal = subTotal + vatAmount;

    const sumItemsEl = document.getElementById('summaryItemsTotal');
    const sumDistRow = document.getElementById('summaryDistanceRow');
    const sumDistEl = document.getElementById('summaryDistanceTotal');
    const sumSubEl = document.getElementById('summarySubTotal');
    const sumGrandEl = document.getElementById('summaryGrandTotal');
    const distDisplay = document.getElementById('distanceTotalDisplay');

    if (sumItemsEl) sumItemsEl.textContent = window.i18n ? window.i18n.formatMoney(itemsSellingTotal) : `${itemsSellingTotal.toFixed(2)} TL`;
    if (distDisplay) distDisplay.textContent = window.i18n ? window.i18n.formatMoney(distanceTotal) : `${distanceTotal.toFixed(2)} TL`;

    if (this.distanceKm > 0 && sumDistRow && sumDistEl) {
      sumDistRow.style.display = 'flex';
      sumDistEl.textContent = window.i18n ? window.i18n.formatMoney(distanceTotal) : `${distanceTotal.toFixed(2)} TL`;
    } else if (sumDistRow) {
      sumDistRow.style.display = 'none';
    }

    if (sumSubEl) sumSubEl.textContent = window.i18n ? window.i18n.formatMoney(subTotal) : `${subTotal.toFixed(2)} TL`;
    if (sumGrandEl) sumGrandEl.textContent = window.i18n ? window.i18n.formatMoney(grandTotal) : `${grandTotal.toFixed(2)} TL`;

    this.currentReceiptData = {
      mode: this.mode,
      customer: (document.getElementById('calcCustomerInput') ? document.getElementById('calcCustomerInput').value : '').trim(),
      cartItems: cartItemsForReceipt,
      allItems: allReceiptItems,
      distanceKm: this.distanceKm,
      distanceTotal: distanceTotal,
      subTotal: subTotal,
      isVatEnabled: isVatEnabled,
      vatRate: vatRate,
      vatAmount: vatAmount,
      grandTotal: grandTotal,
      distributedExpense: breakdown.isDistributing
    };
  }

  loadClinicSettingsToInputs() {
    if (!window.receiptGenerator) return;
    const info = window.receiptGenerator.getClinicInfo();

    const nameInput = document.getElementById('settingClinicName');
    const bankInput = document.getElementById('settingBankName');
    const ibanInput = document.getElementById('settingIban');
    const addrInput = document.getElementById('settingAddress');
    const phoneInput = document.getElementById('settingPhone');
    const vatInput = document.getElementById('settingVatRate');
    const sheetsUrlInput = document.getElementById('settingSheetsUrl');
    const stockSheetsInput = document.getElementById('stockTabSheetsUrlInput');
    const distToggle = document.getElementById('globalDistributeExpenseToggle');
    const langSelect = document.getElementById('settingLanguage');
    const currSelect = document.getElementById('settingCurrency');

    if (nameInput) nameInput.value = info.title || '';
    if (bankInput) bankInput.value = info.bank || '';
    if (ibanInput) ibanInput.value = info.iban || '';
    if (addrInput) addrInput.value = info.address || '';
    if (phoneInput) phoneInput.value = info.phone || '';
    if (vatInput) vatInput.value = info.vatRate !== undefined ? info.vatRate : 18;

    const savedUrl = localStorage.getItem('vetassist_sheets_url_v2') || 
                     localStorage.getItem('vetassist_sheets_url') || 
                     localStorage.getItem('sahavet_sheets_url') || '';
    if (sheetsUrlInput) sheetsUrlInput.value = savedUrl;
    if (stockSheetsInput) stockSheetsInput.value = savedUrl;

    if (distToggle && window.paramManager) {
      distToggle.checked = window.paramManager.distributeFixedExpense;
    }

    if (langSelect && window.i18n) {
      langSelect.value = window.i18n.getLanguage();
    }
    if (currSelect && window.i18n) {
      currSelect.value = window.i18n.getCurrency();
    }

    this.updateClinicLockUI();
  }

  updateClinicLockUI() {
    const isLocked = localStorage.getItem('vetassist_clinic_locked') === 'true';
    const clinicInputs = [
      document.getElementById('settingClinicName'),
      document.getElementById('settingBankName'),
      document.getElementById('settingIban'),
      document.getElementById('settingAddress'),
      document.getElementById('settingPhone')
    ];

    clinicInputs.forEach(input => {
      if (input) {
        input.readOnly = isLocked;
        if (isLocked) {
          input.classList.add('is-locked');
        } else {
          input.classList.remove('is-locked');
        }
      }
    });

    const isEn = window.i18n && window.i18n.getLanguage() === 'en';
    const lockText = document.getElementById('clinicLockText');
    const toggleBtn = document.getElementById('toggleClinicLockBtn');
    const saveFormBtn = document.getElementById('saveClinicFormBtn');

    if (lockText) {
      if (window.i18n) {
        lockText.textContent = isLocked ? window.i18n.t('clinic_locked_badge') : window.i18n.t('clinic_unlocked_badge');
      } else {
        lockText.textContent = isLocked
          ? (isEn ? 'Clinic details are locked and protected.' : 'Bilgileriniz kilitli ve güvendedir.')
          : (isEn ? 'Fill in details and tap "Save & Lock".' : 'Bilgilerinizi girip kilitleyin.');
      }
    }

    if (toggleBtn) {
      toggleBtn.className = isLocked ? 'btn btn-outline-secondary btn-sm' : 'btn btn-primary btn-sm';
      const btnText = isLocked 
        ? (window.i18n ? window.i18n.t('clinic_unlock_btn') : (isEn ? 'Unlock & Edit' : 'Kilidi Aç & Düzenle')) 
        : (window.i18n ? window.i18n.t('clinic_lock_save_btn') : (isEn ? 'Save & Lock' : 'Bilgileri Kaydet ve Kilitle'));
      toggleBtn.innerHTML = `<span>${btnText}</span>`;
    }

    if (saveFormBtn) {
      saveFormBtn.style.display = isLocked ? 'none' : 'block';
      const btnText = window.i18n ? window.i18n.t('clinic_lock_save_btn') : (isEn ? 'Save & Lock' : 'Bilgileri Kaydet ve Kilitle');
      saveFormBtn.innerHTML = `<span>${btnText}</span>`;
    }
  }

  toggleClinicLock(shouldLock) {
    if (shouldLock) {
      this.saveClinicSettingsFromInputs();
      localStorage.setItem('vetassist_clinic_locked', 'true');
      this.updateClinicLockUI();
      this.showToast(window.i18n ? window.i18n.t('toast_clinic_locked') : 'Bilgiler kaydedildi ve kilitlendi.');
    } else {
      localStorage.setItem('vetassist_clinic_locked', 'false');
      this.updateClinicLockUI();
      this.showToast(window.i18n ? window.i18n.t('toast_clinic_unlocked') : 'Düzenleme moduna alındı.');
      document.getElementById('settingClinicName')?.focus();
    }
  }

  saveClinicSettingsFromInputs() {
    if (!window.receiptGenerator) return;

    const info = {
      title: (document.getElementById('settingClinicName')?.value || '').trim(),
      bank: (document.getElementById('settingBankName')?.value || '').trim(),
      iban: (document.getElementById('settingIban')?.value || '').trim(),
      address: (document.getElementById('settingAddress')?.value || '').trim(),
      phone: (document.getElementById('settingPhone')?.value || '').trim(),
      vatRate: parseFloat(document.getElementById('settingVatRate')?.value) || 18
    };

    window.receiptGenerator.saveClinicInfo(info);

    const sheetsUrl = (document.getElementById('settingSheetsUrl')?.value || '').trim();
    if (sheetsUrl) {
      localStorage.setItem('vetassist_sheets_url_v2', sheetsUrl);
      const stockSheetsInput = document.getElementById('stockTabSheetsUrlInput');
      if (stockSheetsInput) stockSheetsInput.value = sheetsUrl;
    }

    this.recalculate();
  }

  openProductEditModal(item = null) {
    const modal = document.getElementById('productEditModal');
    const titleEl = document.getElementById('productModalTitle');
    const isEn = window.i18n && window.i18n.getLanguage() === 'en';

    document.getElementById('editProductIndex').value = item ? item.id : '-1';
    document.getElementById('editProdName').value = item ? item.name : '';
    document.getElementById('editProdCost').value = item ? (item.unitCost !== undefined ? item.unitCost : (item.cost !== undefined ? item.cost : (item.price || ''))) : '';
    document.getElementById('editProdCategory').value = item ? item.category : '';
    document.getElementById('editProdStock').value = item ? item.currentStock : '';
    document.getElementById('editProdMinStock').value = item ? item.minStock : '';

    if (titleEl) {
      titleEl.textContent = item 
        ? (isEn ? '✏️ Edit Product / Supply' : '✏️ İlaç / Malzemeyi Düzenle')
        : (isEn ? '➕ Add New Product / Supply' : '➕ Yeni İlaç / Malzeme Ekle');
    }

    if (modal) modal.style.display = 'flex';
  }

  onParametersChanged() {
    this.recalculate();
    if (window.paramManager) window.paramManager.renderUI();
  }

  onInventoryChanged() {
    this.renderCart();
    this.recalculate();
  }

  onLanguageChanged() {
    this.setMode(this.mode);
    this.renderPresets();
    this.renderDrawerPresetsList();
    this.renderCart();
    this.recalculate();
    if (window.stockManager) window.stockManager.renderUI();
    if (window.paramManager) window.paramManager.renderUI();
    if (window.logManager) window.logManager.renderUI();
    if (window.inseminationManager) window.inseminationManager.updateVisibility();
    if (window.itsManager) window.itsManager.updateVisibility();
  }

  onCurrencyChanged() {
    this.renderPresets();
    this.renderDrawerPresetsList();
    this.renderCart();
    this.recalculate();
    if (window.stockManager) window.stockManager.renderUI();
    if (window.paramManager) window.paramManager.renderUI();
    if (window.logManager) window.logManager.renderUI();
  }

  bindEvents() {
    // 1. Navigation Tabs (Top 3 Tabs: Adisyon, Stok, Geçmiş)
    document.querySelectorAll('.nav-pill-tab').forEach(tabBtn => {
      tabBtn.addEventListener('click', () => {
        const wasActive = tabBtn.classList.contains('active');
        document.querySelectorAll('.nav-pill-tab').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

        tabBtn.classList.add('active');
        const targetId = tabBtn.getAttribute('data-target');
        const targetPane = document.getElementById(targetId);
        if (targetPane) targetPane.classList.add('active');

        if (targetId === 'tab-calc') {
          this.recalculate();
          if (wasActive && this.cart.length > 0) {
            const btn = document.getElementById('generateReceiptBtn');
            if (btn) btn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }

        if (targetId === 'tab-stock' && window.stockManager) window.stockManager.renderUI();
        if (targetId === 'tab-logs' && window.logManager) window.logManager.renderUI();
      });
    });

    // 2. Settings Drawer Open / Close & Sub-tabs
    const drawerEl = document.getElementById('settingsDrawer');
    const openDrawerBtn = document.getElementById('openSettingsDrawerBtn');
    const closeDrawerBtn = document.getElementById('closeSettingsDrawerBtn');
    const closeDrawerFooterBtn = document.getElementById('closeSettingsDrawerFooterBtn');

    if (openDrawerBtn && drawerEl) {
      openDrawerBtn.addEventListener('click', () => {
        this.loadClinicSettingsToInputs();
        this.renderDrawerPresetsList();
        if (window.paramManager) window.paramManager.renderUI();
        drawerEl.style.display = 'flex';
      });
    }

    const closeDrawer = () => {
      if (drawerEl) drawerEl.style.display = 'none';
    };
    if (closeDrawerBtn) closeDrawerBtn.addEventListener('click', closeDrawer);
    if (closeDrawerFooterBtn) closeDrawerFooterBtn.addEventListener('click', closeDrawer);

    document.querySelectorAll('.drawer-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.drawer-tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.drawer-pane').forEach(p => p.style.display = 'none');

        btn.classList.add('active');
        const targetPaneId = btn.getAttribute('data-target');
        const targetPane = document.getElementById(targetPaneId);
        if (targetPane) targetPane.style.display = 'block';

        if (targetPaneId === 'drawer-pane-presets') this.renderDrawerPresetsList();
        if (targetPaneId === 'drawer-pane-params' && window.paramManager) window.paramManager.renderUI();
      });
    });

    const globalDistToggle = document.getElementById('globalDistributeExpenseToggle');
    if (globalDistToggle && window.paramManager) {
      globalDistToggle.addEventListener('change', (e) => {
        window.paramManager.setDistributeFixedExpense(e.target.checked);
      });
    }

    // 3. Theme Toggle
    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        document.body.classList.toggle('theme-dark');
        const isDark = document.body.classList.contains('theme-dark');
        document.getElementById('themeIcon').textContent = isDark ? '🌙' : '☀️';
        localStorage.setItem('vetassist_theme', isDark ? 'dark' : 'light');
      });

      if (localStorage.getItem('vetassist_theme') === 'dark') {
        document.body.classList.add('theme-dark');
        document.getElementById('themeIcon').textContent = '🌙';
      }
    }

    // 4. Mode Switcher
    const btnTreatment = document.getElementById('modeBtnTreatment');
    const btnQuote = document.getElementById('modeBtnQuote');
    if (btnTreatment) btnTreatment.addEventListener('click', () => this.setMode('treatment'));
    if (btnQuote) btnQuote.addEventListener('click', () => this.setMode('quote'));

    // 5. Customer Input
    const custInput = document.getElementById('calcCustomerInput');
    if (custInput) {
      custInput.addEventListener('input', () => {
        this.updateCustomerPortfolioBadge();
        this.recalculate();
      });
    }

    // 6. Quick Autocomplete Search
    const searchInput = document.getElementById('quickSearchInput');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const dropdown = document.getElementById('autocompleteDropdown');
    const searchCard = searchInput ? (searchInput.closest('.search-card-container') || searchInput.closest('.glass-card')) : null;

    const setDropdownVisible = (visible) => {
      if (!dropdown) return;
      dropdown.style.display = visible ? 'block' : 'none';
      if (searchCard) {
        if (visible) {
          searchCard.classList.add('has-dropdown-open');
        } else {
          searchCard.classList.remove('has-dropdown-open');
        }
      }
    };

    if (searchInput && dropdown) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim().toLowerCase();
        if (clearSearchBtn) clearSearchBtn.style.display = query ? 'block' : 'none';

        if (query.length === 0 || !window.stockManager) {
          setDropdownVisible(false);
          return;
        }

        const matches = window.stockManager.getAll().filter(item => 
          item.name.toLowerCase().includes(query) || (item.category && item.category.toLowerCase().includes(query))
        );

        if (matches.length === 0) {
          setDropdownVisible(false);
          return;
        }

        dropdown.innerHTML = '';
        const profitMargin = window.paramManager ? window.paramManager.getProfitMargin() : 25;

        matches.slice(0, 7).forEach(prod => {
          const div = document.createElement('div');
          div.className = 'autocomplete-item';
          const sellPrice = prod.unitCost * (1 + profitMargin / 100);
          div.innerHTML = `
            <div>
              <div class="autocomplete-item-name">${prod.name}</div>
              <div class="autocomplete-item-sub">${window.i18n ? window.i18n.t('stock_card_stock') : 'Stok:'} ${prod.currentStock} • ${prod.category || ''}</div>
            </div>
            <div class="autocomplete-item-price">${window.i18n ? window.i18n.formatMoney(sellPrice) : sellPrice.toFixed(2) + ' TL'}</div>
          `;
          div.addEventListener('click', () => {
            this.addToCart(prod, 1);
            searchInput.value = '';
            setDropdownVisible(false);
            if (clearSearchBtn) clearSearchBtn.style.display = 'none';
          });
          dropdown.appendChild(div);
        });

        setDropdownVisible(true);
      });

      searchInput.addEventListener('focus', () => {
        if (searchInput.value.trim().length > 0) {
          searchInput.dispatchEvent(new Event('input'));
        }
      });

      if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
          searchInput.value = '';
          setDropdownVisible(false);
          clearSearchBtn.style.display = 'none';
          searchInput.focus();
        });
      }

      document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
          setDropdownVisible(false);
        }
      });
    }

    // 7. Save Cart as Preset button
    const btnSavePreset = document.getElementById('btnSaveCartAsPreset');
    if (btnSavePreset) {
      btnSavePreset.addEventListener('click', () => this.saveCurrentCartAsPreset());
    }

    // 8. Clear Cart Button
    const clearCartBtn = document.getElementById('clearCartBtn');
    if (clearCartBtn) {
      clearCartBtn.addEventListener('click', () => {
        const isEn = window.i18n && window.i18n.getLanguage() === 'en';
        if (confirm(isEn ? 'Clear all items from cart?' : 'Tüm sepeti temizlemek istediğinize emin misiniz?')) {
          this.clearCart();
        }
      });
    }

    // 9. Collapsible Travel & Mileage
    const distCollapsibleBtn = document.getElementById('distanceCollapsibleBtn');
    const distCollapsibleBody = document.getElementById('distanceCollapsibleBody');
    const distIcon = document.getElementById('distanceCollapsibleIcon');
    const distanceInput = document.getElementById('distanceKmInput');

    if (distCollapsibleBtn && distCollapsibleBody) {
      distCollapsibleBtn.addEventListener('click', () => {
        this.isDistanceCollapsibleOpen = !this.isDistanceCollapsibleOpen;
        if (this.isDistanceCollapsibleOpen) {
          distCollapsibleBody.classList.add('open');
          if (distIcon) distIcon.textContent = '▲';
        } else {
          distCollapsibleBody.classList.remove('open');
          if (distIcon) distIcon.textContent = '➕';
        }
      });
    }

    if (distanceInput) {
      distanceInput.addEventListener('input', (e) => {
        this.distanceKm = Math.max(0, parseFloat(e.target.value) || 0);
        this.recalculate();
      });
    }

    document.querySelectorAll('.quick-chips .chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.id === 'resetKmBtn') {
          this.distanceKm = 0;
        } else {
          const addKm = parseFloat(btn.getAttribute('data-km')) || 0;
          this.distanceKm += addKm;
        }
        if (distanceInput) distanceInput.value = this.distanceKm;
        this.recalculate();
      });
    });

    // 10. Generate Receipt Button (Open Modal)
    const genReceiptBtn = document.getElementById('generateReceiptBtn');
    const receiptModal = document.getElementById('receiptPreviewModal');
    const closeReceiptBtn = document.getElementById('closeReceiptModalBtn');

    if (genReceiptBtn && receiptModal) {
      genReceiptBtn.addEventListener('click', () => {
        if (this.cart.length === 0 && this.distanceKm === 0) {
          this.showToast(window.i18n ? window.i18n.t('cart_empty_title') : 'Lütfen önce ilaç veya mesafe ekleyin.');
          return;
        }

        this.recalculate();
        if (window.receiptGenerator) {
          window.receiptGenerator.renderHtmlPreview(this.currentReceiptData);
        }
        receiptModal.style.display = 'flex';
      });
    }

    if (closeReceiptBtn && receiptModal) {
      closeReceiptBtn.addEventListener('click', () => {
        receiptModal.style.display = 'none';
      });
    }

    // 11. SADELEŞTİRİLMİŞ WHATSAPP AKSİYONU (SADECE WHATSAPP İLE JPG GÖNDER)
    const waJpgBtn = document.getElementById('whatsappJpgOnlyBtn');
    if (waJpgBtn) {
      waJpgBtn.addEventListener('click', async () => {
        if (!this.currentReceiptData) {
          this.recalculate();
        }
        if (!window.receiptGenerator || !this.currentReceiptData) return;
        
        try {
          waJpgBtn.style.opacity = '0.7';
          waJpgBtn.style.pointerEvents = 'none';

          const shareRes = await window.receiptGenerator.shareJpgToWhatsApp(this.currentReceiptData);
          if (shareRes && shareRes.success) {
            this.finalizeTransaction();
            if (receiptModal) receiptModal.style.display = 'none';
          }
        } catch (err) {
          console.error('WhatsApp paylasim hatasi:', err);
          const isEn = window.i18n && window.i18n.getLanguage() === 'en';
          this.showToast(isEn ? 'Could not share to WhatsApp.' : 'WhatsApp paylaşımı başlatılamadı.');
        } finally {
          waJpgBtn.style.opacity = '1';
          waJpgBtn.style.pointerEvents = 'auto';
        }
      });
    }

    // 12. Batch Add Modal
    this.bindBatchModalEvents();

    // 13. Product Add / Edit Modal Events
    this.bindProductModalEvents();

    // 14. Parameter Add Modal Events
    this.bindParamModalEvents();

    // 15. Preset Modal Events
    this.bindPresetModalEvents();

    // 16. Stock & Logs Actions (CSV, Clear, etc.)
    this.bindStockAndLogEvents();

    // 17. Clinic Settings Form & Lock Actions
    const clinicForm = document.getElementById('clinicSettingsForm');
    if (clinicForm) {
      clinicForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.toggleClinicLock(true);
      });
    }

    const toggleLockBtn = document.getElementById('toggleClinicLockBtn');
    if (toggleLockBtn) {
      toggleLockBtn.addEventListener('click', () => {
        const isLocked = localStorage.getItem('vetassist_clinic_locked') === 'true';
        this.toggleClinicLock(!isLocked);
      });
    }

    // 18. VAT Rate & Sheets URL in Parameters / Other Tabs
    const vatRateInput = document.getElementById('settingVatRate');
    if (vatRateInput) {
      vatRateInput.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value) || 0;
        localStorage.setItem('vetassist_vat_rate', val);
        this.recalculate();
      });
    }

    const saveSheetsBtn = document.getElementById('saveSheetsUrlBtn');
    if (saveSheetsBtn) {
      saveSheetsBtn.addEventListener('click', () => {
        const url = (document.getElementById('settingSheetsUrl')?.value || '').trim();
        localStorage.setItem('vetassist_sheets_url_v2', url);
        const stockSheetsInput = document.getElementById('stockTabSheetsUrlInput');
        if (stockSheetsInput) stockSheetsInput.value = url;
        this.showToast('✅ Google Sheets linki başarıyla kaydedildi.');
      });
    }

    const langSelect = document.getElementById('settingLanguage');
    if (langSelect && window.i18n) {
      langSelect.addEventListener('change', (e) => {
        window.i18n.setLanguage(e.target.value, true);
        const currSelect = document.getElementById('settingCurrency');
        if (currSelect) currSelect.value = window.i18n.getCurrency();
      });
    }

    const currSelect = document.getElementById('settingCurrency');
    if (currSelect && window.i18n) {
      currSelect.addEventListener('change', (e) => {
        window.i18n.setCurrency(e.target.value);
      });
    }

    const resetDefaultsBtn = document.getElementById('resetDefaultsBtn');
    if (resetDefaultsBtn) {
      resetDefaultsBtn.addEventListener('click', () => {
        const isEn = window.i18n && window.i18n.getLanguage() === 'en';
        if (confirm(isEn ? 'Reset all data and settings to factory defaults?' : 'Tüm verileri ve ayarları fabrika ayarlarına döndürmek istediğinize emin misiniz?')) {
          localStorage.clear();
          location.reload();
        }
      });
    }

    // Guide Modal Events
    const openGuideBtn = document.getElementById('openGuideModalBtn');
    const closeGuideBtn = document.getElementById('closeGuideModalBtn');
    const guideModal = document.getElementById('userGuideModal');
    if (openGuideBtn && guideModal) {
      openGuideBtn.addEventListener('click', () => {
        guideModal.style.display = 'flex';
      });
    }
    if (closeGuideBtn && guideModal) {
      closeGuideBtn.addEventListener('click', () => {
        guideModal.style.display = 'none';
      });
    }

    const checkUpdateBtn = document.getElementById('manualCheckUpdateBtn');
    if (checkUpdateBtn) {
      checkUpdateBtn.addEventListener('click', () => {
        if (window.AndroidBridge && typeof window.AndroidBridge.checkForUpdates === 'function') {
          window.AndroidBridge.checkForUpdates();
        } else {
          const isEn = window.i18n && window.i18n.getLanguage() === 'en';
          const ver = (window.i18n && window.i18n.t('version_text')) || 'v1.0.15';
          this.showToast(isEn ? `🔍 Checking updates... VetAssist ${ver} is up to date.` : `🔍 Güncellemeler denetleniyor... VetAssist ${ver} en güncel sürümdür.`);
        }
      });
    }

    // Stock Sheets Lock & Sync
    this.bindStockSheetsLockEvents();
  }

  bindProductModalEvents() {
    const modal = document.getElementById('productEditModal');
    const openBtn = document.getElementById('openNewItemModalBtn');
    const closeBtn = document.getElementById('closeProductModalBtn');
    const cancelBtn = document.getElementById('cancelProductBtn');
    const form = document.getElementById('productEditForm');

    if (openBtn) {
      openBtn.addEventListener('click', () => {
        this.openProductEditModal(null);
      });
    }

    const closeModal = () => {
      if (modal) modal.style.display = 'none';
    };
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('editProductIndex').value;
        const name = document.getElementById('editProdName').value;
        const unitCost = parseFloat(document.getElementById('editProdCost').value) || 0;
        const category = document.getElementById('editProdCategory').value;
        const currentStock = parseInt(document.getElementById('editProdStock').value) || 0;
        const minStock = parseInt(document.getElementById('editProdMinStock').value) || 0;

        if (window.stockManager) {
          if (id === '-1') {
            window.stockManager.addItem({ name, unitCost, category, currentStock, minStock });
          } else {
            window.stockManager.updateItem(id, { name, unitCost, category, currentStock, minStock });
          }
        }

        closeModal();
        this.showToast(window.i18n ? window.i18n.t('toast_product_saved') : 'Ürün kaydedildi.');
      });
    }
  }

  bindParamModalEvents() {
    const modal = document.getElementById('paramEditModal');
    const openBtn = document.getElementById('openNewParamModalBtn');
    const closeBtn = document.getElementById('closeParamModalBtn');
    const cancelBtn = document.getElementById('cancelParamBtn');
    const form = document.getElementById('paramEditForm');

    if (openBtn && modal) {
      openBtn.addEventListener('click', () => {
        document.getElementById('editParamId').value = '';
        document.getElementById('editParamName').value = '';
        document.getElementById('editParamType').value = 'fixed';
        document.getElementById('editParamValue').value = '';
        modal.style.display = 'flex';
      });
    }

    const closeModal = () => {
      if (modal) modal.style.display = 'none';
    };
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('editParamName').value.trim();
        const type = document.getElementById('editParamType').value;
        const value = parseFloat(document.getElementById('editParamValue').value) || 0;
        const visibility = document.querySelector('input[name="paramVisibility"]:checked')?.value || 'separate';

        if (window.paramManager) {
          window.paramManager.addParameter({ name, type, value, visibility });
        }

        closeModal();
        this.showToast(window.i18n ? window.i18n.t('toast_param_saved') : 'Parametre eklendi.');
      });
    }
  }

  bindPresetModalEvents() {
    const modal = document.getElementById('presetCreateModal');
    const openHeaderBtn = document.getElementById('openPresetModalHeaderBtn');
    const openDrawerBtn = document.getElementById('openPresetModalDrawerBtn');
    const closeBtn = document.getElementById('closePresetModalBtn');
    const cancelBtn = document.getElementById('cancelPresetBtn');
    const form = document.getElementById('presetCreateForm');
    const searchInput = document.getElementById('presetItemSearch');

    if (openHeaderBtn) {
      openHeaderBtn.addEventListener('click', () => this.openPresetModal());
    }

    if (openDrawerBtn) {
      openDrawerBtn.addEventListener('click', () => this.openPresetModal());
    }

    if (closeBtn && modal) {
      closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
      });
    }

    if (cancelBtn && modal) {
      cancelBtn.addEventListener('click', () => {
        modal.style.display = 'none';
      });
    }

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.savePresetFromModal();
      });
    }

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.renderPresetPickerList(e.target.value.trim());
      });
    }
  }

  bindStockAndLogEvents() {
    // Stock search
    const stockSearch = document.getElementById('stockSearchInput');
    if (stockSearch && window.stockManager) {
      stockSearch.addEventListener('input', (e) => {
        window.stockManager.searchTerm = e.target.value.trim();
        window.stockManager.renderUI();
      });
    }

    // Stock tabs (All vs Critical)
    document.querySelectorAll('.stock-filter-tabs .filter-tab').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.stock-filter-tabs .filter-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (window.stockManager) {
          window.stockManager.activeFilter = btn.getAttribute('data-filter');
          window.stockManager.renderUI();
        }
      });
    });

    // CSV Buttons
    const exportCsvBtn = document.getElementById('exportCsvBtn');
    if (exportCsvBtn && window.stockManager) {
      exportCsvBtn.addEventListener('click', () => window.stockManager.exportCsv());
    }

    const csvFileInput = document.getElementById('csvFileInput');
    if (csvFileInput && window.stockManager) {
      csvFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
          try {
            const count = window.stockManager.parseAndImportCsv(evt.target.result);
            this.showToast(`${count} ürün içe aktarıldı.`);
          } catch (err) {
            alert('CSV Hatası: ' + err.message);
          }
        };
        reader.readAsText(file);
      });
    }

    // Sync btn in stock header (Aktif moda göre Google Sheets veya Syncra)
    const syncSheetsBtn = document.getElementById('syncSheetsBtn');
    if (syncSheetsBtn) {
      syncSheetsBtn.addEventListener('click', () => {
        if (this.getSyncMode() === 'syncra') {
          this.runSyncraSync({ manual: true });
        } else {
          this.triggerSheetsSync();
        }
      });
    }

    // Logs search & filter
    const logSearch = document.getElementById('logSearchInput');
    const clearLogSearchBtn = document.getElementById('clearLogSearchBtn');
    if (logSearch && window.logManager) {
      logSearch.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        window.logManager.searchTerm = val;
        if (clearLogSearchBtn) clearLogSearchBtn.style.display = val ? 'block' : 'none';
        window.logManager.renderUI();
      });
      if (clearLogSearchBtn) {
        clearLogSearchBtn.addEventListener('click', () => {
          logSearch.value = '';
          clearLogSearchBtn.style.display = 'none';
          window.logManager.searchTerm = '';
          window.logManager.renderUI();
          logSearch.focus();
        });
      }
    }

    document.querySelectorAll('.log-filter-tab').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.log-filter-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (window.logManager) {
          window.logManager.activeFilter = btn.getAttribute('data-filter');
          window.logManager.renderUI();
        }
      });
    });

    // Consumption Report Modal bindings
    const openReportBtn = document.getElementById('btnOpenConsumptionReport');
    const closeReportBtn = document.getElementById('closeConsumptionReportModalBtn');
    const cancelReportBtn = document.getElementById('cancelConsumptionReportBtn');
    const copySheetsBtn = document.getElementById('btnCopyReportToSheets');
    const downloadCsvBtn = document.getElementById('btnDownloadReportCsv');
    const confirmDeductBtn = document.getElementById('btnConfirmDeductAndArchive');
    const reportModal = document.getElementById('consumptionReportModal');

    if (openReportBtn) {
      openReportBtn.addEventListener('click', () => this.openConsumptionReportModal());
    }
    if (closeReportBtn && reportModal) {
      closeReportBtn.addEventListener('click', () => { reportModal.style.display = 'none'; });
    }
    if (cancelReportBtn && reportModal) {
      cancelReportBtn.addEventListener('click', () => { reportModal.style.display = 'none'; });
    }
    if (copySheetsBtn && window.logManager) {
      copySheetsBtn.addEventListener('click', async () => {
        const isEn = window.i18n && window.i18n.getLanguage() === 'en';
        const ok = await window.logManager.exportToClipboard(this.currentReportConsumptions);
        if (ok) {
          this.showToast(isEn ? 'Copied to clipboard in Google Sheets format!' : 'Google Sheets formatında panoya kopyalandı! E-tablonuza Ctrl+V ile yapıştırabilirsiniz.');
        } else {
          this.showToast(isEn ? 'Could not access clipboard.' : 'Panoya kopyalanamadı.');
        }
      });
    }
    if (downloadCsvBtn && window.logManager) {
      downloadCsvBtn.addEventListener('click', () => {
        const isEn = window.i18n && window.i18n.getLanguage() === 'en';
        this.promptExportFormat({
          title: isEn ? 'Export Current Period Report' : 'Dönem Tüketim Raporunu İndir',
          subtitle: isEn ? 'Choose file format to export current consumptions and sales' : 'Aktif tüketim ve adisyon raporunu hangi formatta indirmek istersiniz?',
          onSelect: (format) => {
            window.logManager.exportPendingLogs(format, this.currentReportConsumptions);
            this.showToast(isEn ? `✅ Exported as .${format.toUpperCase()}` : `✅ .${format.toUpperCase()} formatında indirildi.`);
          }
        });
      });
    }
    if (confirmDeductBtn && window.logManager) {
      confirmDeductBtn.addEventListener('click', () => {
        const isEn = window.i18n && window.i18n.getLanguage() === 'en';
        if (confirm(isEn ? 'Confirm deducting consumptions from stock and archiving current history?' : 'Tüketimlerin stoktan düşülmesini ve aktif geçmişin arşivlenmesini onaylıyor musunuz?')) {
          window.logManager.deductAndArchive(this.currentReportConsumptions);
          if (reportModal) reportModal.style.display = 'none';
          this.showToast(isEn ? 'Stock deducted, history archived, and counter reset to 0.' : 'Tüketimler stoktan düşüldü, geçmiş arşivlendi ve sayaç sıfırlandı.');
          if (window.stockManager) window.stockManager.renderUI();
        }
      });
    }

    // Archive Modal bindings
    const openArchiveBtn = document.getElementById('btnOpenArchiveLogs');
    const closeArchiveBtn = document.getElementById('closeArchiveLogsModalBtn');
    const closeArchiveFooterBtn = document.getElementById('closeArchiveLogsModalFooterBtn');
    const archiveModal = document.getElementById('archiveLogsModal');

    if (openArchiveBtn) {
      openArchiveBtn.addEventListener('click', () => this.openArchiveModal());
    }
    if (closeArchiveBtn && archiveModal) {
      closeArchiveBtn.addEventListener('click', () => { archiveModal.style.display = 'none'; });
    }
    if (closeArchiveFooterBtn && archiveModal) {
      closeArchiveFooterBtn.addEventListener('click', () => { archiveModal.style.display = 'none'; });
    }

    const exportLogsBtn = document.getElementById('exportLogsCsvBtn');
    if (exportLogsBtn && window.logManager) {
      exportLogsBtn.addEventListener('click', () => {
        const isEn = window.i18n && window.i18n.getLanguage() === 'en';
        this.promptExportFormat({
          title: isEn ? 'Export Current Period Logs' : 'Aktif Dönem Adisyonlarını İndir',
          subtitle: isEn ? 'Choose file format to export current transactions' : 'Aktif dönem adisyon kayıtlarını hangi formatta indirmek istersiniz?',
          onSelect: (format) => {
            window.logManager.exportPendingLogs(format);
            this.showToast(isEn ? `✅ Exported as .${format.toUpperCase()}` : `✅ .${format.toUpperCase()} formatında indirildi.`);
          }
        });
      });
    }

    const clearLogsBtn = document.getElementById('clearAllLogsBtn');
    if (clearLogsBtn && window.logManager) {
      clearLogsBtn.addEventListener('click', () => {
        const isEn = window.i18n && window.i18n.getLanguage() === 'en';
        if (confirm(isEn ? 'Clear all pending history logs?' : 'Bekleyen tüm adisyon geçmişini temizlemek istediğinize emin misiniz?')) {
          window.logManager.clearAll();
          this.showToast(window.i18n ? window.i18n.t('toast_logs_cleared') : 'Tüm geçmiş temizlendi.');
        }
      });
    }

    // Google Apps Script Modal bindings
    const openAppsScriptBtn = document.getElementById('btnOpenAppsScriptModal');
    const closeAppsScriptBtn = document.getElementById('closeAppsScriptModalBtn');
    const closeAppsScriptFooterBtn = document.getElementById('closeAppsScriptModalFooterBtn');
    const copyAppsScriptBtn = document.getElementById('btnCopyAppsScriptCode');
    const appsScriptModal = document.getElementById('appsScriptModal');
    const appsScriptArea = document.getElementById('appsScriptCodeArea');

    if (openAppsScriptBtn && appsScriptModal) {
      openAppsScriptBtn.addEventListener('click', () => { appsScriptModal.style.display = 'flex'; });
    }
    if (closeAppsScriptBtn && appsScriptModal) {
      closeAppsScriptBtn.addEventListener('click', () => { appsScriptModal.style.display = 'none'; });
    }
    if (closeAppsScriptFooterBtn && appsScriptModal) {
      closeAppsScriptFooterBtn.addEventListener('click', () => { appsScriptModal.style.display = 'none'; });
    }
    if (copyAppsScriptBtn && appsScriptArea) {
      copyAppsScriptBtn.addEventListener('click', async () => {
        const isEn = window.i18n && window.i18n.getLanguage() === 'en';
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(appsScriptArea.value);
          } else {
            appsScriptArea.select();
            document.execCommand('copy');
          }
          this.showToast(isEn ? 'Google Apps Script code copied to clipboard!' : '📋 Google Apps Script kodu panoya kopyalandı!');
        } catch (e) {
          appsScriptArea.select();
          this.showToast(isEn ? 'Please select and copy the code.' : 'Lütfen kutudaki kodu seçip kopyalayın.');
        }
      });
    }

    // Setup horizontal scroll indicators
    this.setupHorizontalScrollIndicators();
  }

  finalizeTransaction() {
    if (!this.currentReceiptData) return;

    // 1. Tedavi modunda yerel stok anında düşer (internetsiz çevrimdışı sahada kesin stok takibi)
    if (this.mode === 'treatment' && window.stockManager && Array.isArray(this.cart)) {
      this.cart.forEach(ci => {
        if (ci.item && ci.item.id) {
          window.stockManager.adjustStock(ci.item.id, -Number(ci.qty || 1));
        }
      });
    }

    // 2. Loglara Kaydet
    if (window.logManager) {
      const itemsSummary = this.cart.map(ci => `${ci.qty}x ${ci.item.name}`).join(', ');
      window.logManager.addLog({
        mode: this.mode,
        customer: this.currentReceiptData.customer,
        items: this.cart.map(ci => ({
          id: ci.item.id,
          name: ci.item.name,
          unitCost: ci.item.unitCost,
          category: ci.item.category,
          qty: ci.qty
        })),
        allItems: this.currentReceiptData.allItems,
        itemsSummary: itemsSummary,
        distanceKm: this.distanceKm,
        distanceTotal: this.currentReceiptData.distanceTotal,
        subTotal: this.currentReceiptData.subTotal,
        isVatEnabled: this.currentReceiptData.isVatEnabled,
        vatRate: this.currentReceiptData.vatRate,
        vatAmount: this.currentReceiptData.vatAmount,
        grandTotal: this.currentReceiptData.grandTotal,
        distributedExpense: this.currentReceiptData.distributedExpense,
        partnerId: (window.stockManager && window.stockManager.findPartnerByName(this.currentReceiptData.customer || '') || {}).id || null
      });
    }

    this.clearCart();
    this.distanceKm = 0;
    const distanceInput = document.getElementById('distanceKmInput');
    if (distanceInput) distanceInput.value = '0';
    const custInput = document.getElementById('calcCustomerInput');
    if (custInput) custInput.value = '';
    this.recalculate();

    const isEn = window.i18n && window.i18n.getLanguage() === 'en';
    const msg = this.mode === 'treatment'
      ? (isEn ? '✅ Treatment saved & products deducted from local stock.' : '✅ Tedavi kaydedildi ve satılan ürünler yerel stoktan anında düşüldü.')
      : (isEn ? '✅ Price quote saved to history.' : '✅ Fiyat teklifi geçmişe eklendi.');
    this.showToast(msg);
  }

  bindBatchModalEvents() {
    const modal = document.getElementById('batchAddModal');
    const openBtn = document.getElementById('openBatchModalBtn');
    const closeBtn = document.getElementById('closeBatchModalBtn');
    const cancelBtn = document.getElementById('batchCancelBtn');
    const confirmBtn = document.getElementById('batchConfirmBtn');
    const searchInput = document.getElementById('batchSearchInput');
    const listContainer = document.getElementById('batchItemList');
    const countBadge = document.getElementById('batchSelectedCount');

    if (!modal || !openBtn) return;

    const renderBatchItems = (filterText = '') => {
      if (!listContainer || !window.stockManager) return;
      listContainer.innerHTML = '';
      const items = window.stockManager.getAll().filter(item => 
        item.name.toLowerCase().includes(filterText.toLowerCase()) || 
        (item.category && item.category.toLowerCase().includes(filterText.toLowerCase()))
      );

      items.forEach(item => {
        const row = document.createElement('div');
        row.className = 'cart-item-card';
        row.style.padding = '8px 12px';

        const currentQty = this.batchSelections.get(item.id) || 0;

        row.innerHTML = `
          <div style="display:flex; align-items:center; justify-content:space-between;">
            <div>
              <strong style="font-size:0.88rem;">${item.name}</strong>
              <div style="font-size:0.72rem; color:var(--text-muted);">${window.i18n ? window.i18n.t('stock_card_cost') : 'Maliyet:'} ${window.i18n ? window.i18n.formatMoney(item.unitCost) : item.unitCost.toFixed(2) + ' TL'} • ${window.i18n ? window.i18n.t('stock_card_stock') : 'Stok:'} ${item.currentStock}</div>
            </div>
            <div class="qty-control-glass">
              <button type="button" class="btn-qty btn-batch-minus" data-id="${item.id}">−</button>
              <span class="qty-display batch-qty-val" data-id="${item.id}">${currentQty}</span>
              <button type="button" class="btn-qty btn-batch-plus" data-id="${item.id}">+</button>
            </div>
          </div>
        `;

        listContainer.appendChild(row);
      });

      listContainer.querySelectorAll('.btn-batch-plus').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          const qty = (this.batchSelections.get(id) || 0) + 1;
          this.batchSelections.set(id, qty);
          const valEl = listContainer.querySelector(`.batch-qty-val[data-id="${id}"]`);
          if (valEl) valEl.textContent = qty;
          updateSelectedCount();
        });
      });

      listContainer.querySelectorAll('.btn-batch-minus').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          const qty = Math.max(0, (this.batchSelections.get(id) || 0) - 1);
          if (qty === 0) this.batchSelections.delete(id);
          else this.batchSelections.set(id, qty);
          const valEl = listContainer.querySelector(`.batch-qty-val[data-id="${id}"]`);
          if (valEl) valEl.textContent = qty;
          updateSelectedCount();
        });
      });
    };

    const updateSelectedCount = () => {
      let total = 0;
      this.batchSelections.forEach(q => total += q);
      if (countBadge) countBadge.textContent = total;
    };

    openBtn.addEventListener('click', () => {
      this.batchSelections.clear();
      updateSelectedCount();
      if (searchInput) searchInput.value = '';
      renderBatchItems('');
      modal.style.display = 'flex';
    });

    const closeModal = () => {
      modal.style.display = 'none';
    };
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        renderBatchItems(e.target.value.trim());
      });
    }

    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        if (!window.stockManager) return;
        this.batchSelections.forEach((qty, id) => {
          if (qty > 0) {
            const product = window.stockManager.get(id);
            if (product) this.addToCart(product, qty, false);
          }
        });
        this.renderCart();
        this.recalculate();
        closeModal();
        this.showToast(window.i18n ? window.i18n.t('btn_confirm_batch') : 'Seçilenler sepete eklendi.');
      });
    }
  }

  bindStockSheetsLockEvents() {
    // Stok sekmesindeki "Stok & Bulut Entegrasyonu" butonu
    const openSyncSettingsBtn = document.getElementById('btnOpenStockSyncSettings');
    if (openSyncSettingsBtn) {
      openSyncSettingsBtn.addEventListener('click', () => {
        const drawerEl = document.getElementById('settingsDrawer');
        if (drawerEl) drawerEl.style.display = 'flex';
        const tabBtn = document.getElementById('drawerTabStockSyncBtn');
        if (tabBtn) tabBtn.click();
      });
    }

    // Drawer içindeki Manuel Senkronizasyon butonu
    const syncDrawerBtn = document.getElementById('btnManualSyncSheetsDrawer');
    if (syncDrawerBtn) {
      syncDrawerBtn.addEventListener('click', () => {
        this.triggerSheetsSync();
      });
    }

    // Drawer içindeki CSV İçe/Dışa Aktar
    const drawerCsvInput = document.getElementById('drawerCsvFileInput');
    if (drawerCsvInput && window.stockManager) {
      drawerCsvInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) window.stockManager.importCsv(file);
      });
    }

    const drawerExportCsvBtn = document.getElementById('drawerExportCsvBtn');
    if (drawerExportCsvBtn && window.stockManager) {
      drawerExportCsvBtn.addEventListener('click', () => {
        window.stockManager.exportCsv();
      });
    }

    // JSON Veri Yedekleme (Tüm Sistem)
    const exportJsonBtn = document.getElementById('btnExportFullBackupJson');
    if (exportJsonBtn) {
      exportJsonBtn.addEventListener('click', () => {
        const backup = {
          version: '1.0.18',
          exportedAt: new Date().toISOString(),
          stock: window.stockManager ? window.stockManager.getAll().map(i => ({
            id: i.id,
            syncraId: i.syncraId || null,
            sku: i.sku || null,
            name: i.name,
            unitCost: i.unitCost !== undefined ? i.unitCost : 0,
            currentStock: i.currentStock,
            minStock: i.minStock,
            category: i.category
          })) : [],
          presets: this.presets || [],
          parameters: window.paramManager ? window.paramManager.getAll() : [],
          logs: window.logManager ? window.logManager.getAll() : [],
          archivedLogs: window.logManager ? window.logManager.getArchivedLogs() : [],
          clinicInfo: window.receiptGenerator ? window.receiptGenerator.getClinicInfo() : {},
          sheetsUrl: localStorage.getItem('vetassist_sheets_url_v2') || ''
        };
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `VetAssist_Yedek_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        this.showToast('✅ Tüm veriler JSON yedeği olarak indirildi.');
      });
    }

    // JSON Veri Geri Yükleme
    const importJsonInput = document.getElementById('btnImportFullBackupJson');
    if (importJsonInput) {
      importJsonInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
          try {
            const data = JSON.parse(evt.target.result);
            if (data.stock && window.stockManager) {
              window.stockManager.mergeExternalInventory(data.stock);
            }
            if (data.presets && Array.isArray(data.presets)) {
              this.presets = data.presets;
              this.savePresets();
            }
            if (data.parameters && window.paramManager) {
              window.paramManager.parameters = data.parameters;
              window.paramManager.saveParams();
            }
            if (data.logs && window.logManager) {
              window.logManager.logs = data.logs;
              window.logManager.saveLogs();
            }
            if (data.archivedLogs && window.logManager) {
              window.logManager.archivedLogs = data.archivedLogs;
              window.logManager.saveArchivedLogs();
            }
            if (data.clinicInfo && window.receiptGenerator) {
              window.receiptGenerator.saveClinicInfo(data.clinicInfo);
            }
            if (data.sheetsUrl) {
              localStorage.setItem('vetassist_sheets_url_v2', data.sheetsUrl);
            }
            this.showToast('✅ Yedek başarıyla geri yüklendi!');
            setTimeout(() => location.reload(), 1000);
          } catch (err) {
            alert('Geçersiz yedek dosyası: ' + err.message);
          }
        };
        reader.readAsText(file);
      });
    }
  }

  triggerSheetsSync() {
    const url = (document.getElementById('settingSheetsUrl')?.value || '').trim() || localStorage.getItem('vetassist_sheets_url_v2');
    if (!url) {
      const isEn = window.i18n && window.i18n.getLanguage() === 'en';
      if (confirm(isEn ? 'Google Sheets link is not configured yet. Would you like to open Stock Settings to configure it?' : 'Henüz Google Sheets linki girilmedi. Ayarlamak için Stok Yönetimi sekmesini açmak ister misiniz?')) {
        const drawerEl = document.getElementById('settingsDrawer');
        if (drawerEl) drawerEl.style.display = 'flex';
        const tabBtn = document.getElementById('drawerTabStockSyncBtn');
        if (tabBtn) tabBtn.click();
      }
      return;
    }

    if (window.stockManager) {
      this.showToast('⏳ Google Sheets senkronizasyonu yapılıyor...');
      window.stockManager.syncGoogleSheets(url)
        .then(count => this.showToast(`✅ ${count} ürün başarıyla güncellendi.`))
        .catch(err => alert('Senkronizasyon Hatası: ' + err.message));
    }
  }

  setupHorizontalScrollIndicators() {
    const attachIndicator = (containerEl, arrowEl) => {
      if (!containerEl || !arrowEl) return;
      const updateVisibility = () => {
        const hasScroll = containerEl.scrollWidth > containerEl.clientWidth + 6;
        const isAtEnd = containerEl.scrollLeft >= (containerEl.scrollWidth - containerEl.clientWidth - 10);
        if (hasScroll && !isAtEnd) {
          arrowEl.style.opacity = '1';
          arrowEl.style.pointerEvents = 'auto';
        } else {
          arrowEl.style.opacity = '0';
          arrowEl.style.pointerEvents = 'none';
        }
      };

      containerEl.addEventListener('scroll', updateVisibility, { passive: true });
      window.addEventListener('resize', updateVisibility, { passive: true });
      arrowEl.addEventListener('click', (e) => {
        e.stopPropagation();
        containerEl.scrollBy({ left: 160, behavior: 'smooth' });
      });

      setTimeout(updateVisibility, 300);
    };

    attachIndicator(document.getElementById('presetsScrollRow'), document.getElementById('presetsScrollArrow'));
    attachIndicator(document.getElementById('drawerTabsRow'), document.getElementById('drawerTabsScrollArrow'));
    attachIndicator(document.getElementById('categoryPills'), document.getElementById('categoryPillsScrollArrow'));
  }

  openConsumptionReportModal() {
    if (!window.logManager) return;
    const modal = document.getElementById('consumptionReportModal');
    if (!modal) return;

    this.currentReportConsumptions = window.logManager.getPendingConsumptions();
    const pendingLogs = window.logManager.getAll().filter(l => l.mode === 'treatment');
    
    let totalRevenue = 0;
    pendingLogs.forEach(l => { totalRevenue += parseFloat(l.grandTotal) || 0; });

    const kpiPendingEl = document.getElementById('reportPendingTreatmentsCount');
    const kpiDistinctEl = document.getElementById('reportDistinctItemsCount');
    const kpiRevenueEl = document.getElementById('reportTotalRevenue');

    if (kpiPendingEl) kpiPendingEl.textContent = pendingLogs.length;
    if (kpiDistinctEl) kpiDistinctEl.textContent = this.currentReportConsumptions.length;
    if (kpiRevenueEl) kpiRevenueEl.textContent = window.i18n ? window.i18n.formatMoney(totalRevenue) : `${totalRevenue.toFixed(2)} TL`;

    this.renderConsumptionReportItems();
    modal.style.display = 'flex';
  }

  renderConsumptionReportItems() {
    const container = document.getElementById('reportConsumptionsContainer');
    if (!container) return;

    const isEn = window.i18n && window.i18n.getLanguage() === 'en';

    if (!this.currentReportConsumptions || this.currentReportConsumptions.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="padding:16px;">
          <span class="empty-icon">📦</span>
          <p style="font-size:0.85rem; font-weight:700;">${isEn ? 'No pending treatment consumptions to report.' : 'Stoktan düşülecek bekleyen tedavi adisyonu bulunmuyor.'}</p>
          <small style="font-size:0.75rem;">${isEn ? 'Create treatments from Adisyon tab to see consumptions here.' : 'Adisyon sekmesinden tedavi uygulandıkça tüketimler burada listelenir.'}</small>
        </div>
      `;
      return;
    }

    container.innerHTML = '';
    this.currentReportConsumptions.forEach((item, idx) => {
      const remaining = item.currentStock - item.totalQty;
      const isCritical = remaining < (item.minStock || 0);

      const row = document.createElement('div');
      row.className = `report-consumption-card ${isCritical ? 'is-critical-warning' : ''}`;
      row.innerHTML = `
        <div style="flex:1;">
          <div class="report-item-title">${item.name}</div>
          <div class="report-item-sub">
            <span>📁 ${item.category || 'Genel'}</span>
            <span>•</span>
            <span>${isEn ? 'Stock:' : 'Mevcut:'} <strong class="text-mono">${item.currentStock}</strong></span>
            <span>•</span>
            <span style="color:${isCritical ? 'var(--danger)' : 'var(--success)'}; font-weight:700;">
              ${isEn ? 'Remaining:' : 'Kalan:'} ${remaining} ${isCritical ? '🚨' : '✅'}
            </span>
          </div>
        </div>

        <div class="report-qty-stepper">
          <button type="button" class="report-qty-btn report-minus-btn" data-idx="${idx}">➖</button>
          <input type="number" class="report-qty-input report-qty-val" data-idx="${idx}" value="${item.totalQty}" min="0" step="1">
          <button type="button" class="report-qty-btn report-plus-btn" data-idx="${idx}">➕</button>
        </div>
      `;
      container.appendChild(row);
    });

    // Stepper event handlers
    container.querySelectorAll('.report-minus-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx'));
        if (this.currentReportConsumptions[idx]) {
          this.currentReportConsumptions[idx].totalQty = Math.max(0, this.currentReportConsumptions[idx].totalQty - 1);
          this.renderConsumptionReportItems();
        }
      });
    });

    container.querySelectorAll('.report-plus-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx'));
        if (this.currentReportConsumptions[idx]) {
          this.currentReportConsumptions[idx].totalQty += 1;
          this.renderConsumptionReportItems();
        }
      });
    });

    container.querySelectorAll('.report-qty-val').forEach(input => {
      input.addEventListener('change', () => {
        const idx = parseInt(input.getAttribute('data-idx'));
        const val = Math.max(0, parseFloat(input.value) || 0);
        if (this.currentReportConsumptions[idx]) {
          this.currentReportConsumptions[idx].totalQty = val;
          this.renderConsumptionReportItems();
        }
      });
    });
  }

  promptExportFormat({ title, subtitle, onSelect }) {
    const modal = document.getElementById('exportFormatModal');
    if (!modal) {
      if (typeof onSelect === 'function') onSelect('csv');
      return;
    }

    const titleEl = document.getElementById('exportModalTitle');
    const subEl = document.getElementById('exportModalSubtitle');
    const closeBtn = document.getElementById('closeExportFormatModalBtn');
    const closeFooterBtn = document.getElementById('closeExportFormatModalFooterBtn');
    const buttons = modal.querySelectorAll('.export-choice-btn');

    const isEn = window.i18n && window.i18n.getLanguage() === 'en';
    if (titleEl) titleEl.textContent = title || (isEn ? 'Choose Export Format' : 'Dışa Aktarma Formatı Seçin');
    if (subEl) subEl.textContent = subtitle || (isEn ? 'Select your desired file format to download.' : 'Verileri hangi dosya formatında indirmek istersiniz?');

    const closeModal = () => {
      modal.style.display = 'none';
      if (closeBtn) closeBtn.onclick = null;
      if (closeFooterBtn) closeFooterBtn.onclick = null;
      buttons.forEach(b => { b.onclick = null; });
    };

    if (closeBtn) closeBtn.onclick = closeModal;
    if (closeFooterBtn) closeFooterBtn.onclick = closeModal;

    buttons.forEach(btn => {
      btn.onclick = () => {
        const format = btn.getAttribute('data-format') || 'csv';
        closeModal();
        if (typeof onSelect === 'function') {
          onSelect(format);
        }
      };
    });

    modal.style.display = 'flex';
  }

  openArchiveModal() {
    if (!window.logManager) return;
    const modal = document.getElementById('archiveLogsModal');
    const container = document.getElementById('archiveBatchesContainer');
    const topActions = document.getElementById('archiveModalTopActions');
    const countSummary = document.getElementById('archiveCountSummary');
    const exportAllBtn = document.getElementById('btnExportAllArchivesModal');
    const exportAllFooterBtn = document.getElementById('btnExportAllArchivesFooterBtn');
    if (!modal || !container) return;

    const isEn = window.i18n && window.i18n.getLanguage() === 'en';
    const archived = window.logManager.getArchived();

    const handleExportAll = () => {
      this.promptExportFormat({
        title: isEn ? 'Export All Archives' : 'Tüm Arşivleri İndir',
        subtitle: isEn ? 'Choose file format to export all archived period reports' : 'Tüm geçmiş dönem arşivlerini hangi formatta indirmek istersiniz?',
        onSelect: (format) => {
          window.logManager.exportAllArchives(format);
          this.showToast(isEn ? `✅ All archives downloaded as .${format.toUpperCase()}` : `✅ Tüm arşivler .${format.toUpperCase()} formatında indirildi.`);
        }
      });
    };

    if (!archived || archived.length === 0) {
      if (topActions) topActions.style.display = 'none';
      if (exportAllFooterBtn) exportAllFooterBtn.style.display = 'none';
      container.innerHTML = `
        <div class="empty-state" style="padding:16px;">
          <span class="empty-icon">📦</span>
          <p style="font-weight:700;">${isEn ? 'No archived batches yet.' : 'Henüz arşivlenmiş dönem kaydı bulunmuyor.'}</p>
          <small>${isEn ? 'When you deduct stock and complete reports, archives are saved here.' : 'Tüketim raporunu onaylayıp stoktan düştüğünüzde dönemler burada saklanır.'}</small>
        </div>
      `;
    } else {
      if (topActions) {
        topActions.style.display = 'flex';
        if (countSummary) {
          countSummary.textContent = isEn ? `${archived.length} Archived Period(s)` : `${archived.length} Arşivlenmiş Dönem`;
        }
      }
      if (exportAllFooterBtn) exportAllFooterBtn.style.display = 'inline-flex';

      if (exportAllBtn) exportAllBtn.onclick = handleExportAll;
      if (exportAllFooterBtn) exportAllFooterBtn.onclick = handleExportAll;

      container.innerHTML = '';
      archived.forEach((batch, idx) => {
        const card = document.createElement('div');
        card.className = 'archive-batch-card';
        card.innerHTML = `
          <div class="archive-batch-header">
            <div>
              <div class="archive-batch-title">🗓️ ${batch.dateStr}</div>
              <small style="font-size:0.75rem; color:var(--text-muted);">${batch.logsCount || (batch.logs || []).length} ${isEn ? 'Receipts Processed' : 'Adisyon İşlendi'}</small>
            </div>
            <div>
              <strong class="text-mono" style="color:var(--primary); font-size:0.95rem;">${window.i18n ? window.i18n.formatMoney(batch.totalRevenue) : parseFloat(batch.totalRevenue || 0).toFixed(2) + ' TL'}</strong>
            </div>
          </div>
          <div style="font-size:0.75rem; color:var(--text-muted); margin-top:6px; line-height:1.4;">
            <strong>${isEn ? 'Deducted Medicines:' : 'Düşülen İlaçlar:'}</strong> 
            ${(batch.consumptions || []).map(c => `${c.totalQty}x ${c.name}`).join(', ') || (isEn ? 'No item details' : 'Kalem detayı yok')}
          </div>
          <div class="archive-batch-footer" style="display:flex; justify-content:space-between; align-items:center; margin-top:10px; padding-top:8px; border-top:1px dashed var(--glass-border-subtle);">
            <span style="font-size:0.72rem; color:var(--text-muted); font-family:var(--font-mono);">${batch.batchId || ''}</span>
            <div style="display:flex; gap:6px;">
              <button type="button" class="btn btn-outline-primary btn-xs download-batch-btn" data-batch-idx="${idx}" style="font-weight:700; padding:4px 10px;">
                <span>📥</span> <span>${isEn ? 'Export Period' : 'Dönemi İndir'}</span>
              </button>
            </div>
          </div>
        `;
        container.appendChild(card);
      });

      // Bind individual batch download buttons
      container.querySelectorAll('.download-batch-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const batchIdx = parseInt(btn.getAttribute('data-batch-idx'));
          const targetBatch = archived[batchIdx];
          if (!targetBatch) return;

          this.promptExportFormat({
            title: isEn ? `Export Period (${targetBatch.dateStr})` : `Dönem Raporunu İndir (${targetBatch.dateStr})`,
            subtitle: isEn ? 'Select file format to download this archived period' : 'Bu arşivlenmiş dönemi hangi formatta indirmek istersiniz?',
            onSelect: (format) => {
              window.logManager.exportBatch(targetBatch, format);
              this.showToast(isEn ? `✅ Period report downloaded as .${format.toUpperCase()}` : `✅ Dönem raporu .${format.toUpperCase()} formatında indirildi.`);
            }
          });
        });
      });
    }

    modal.style.display = 'flex';
  }
}

// Global instance başlatma
document.addEventListener('DOMContentLoaded', () => {
  window.app = new AppController();
});

// AdMob Rewarded Ad Global Bridge Callback
window.onRewardedAdSuccess = function(actionType) {
  console.log('AdMob Rewarded Ad completed for action:', actionType);
  if (actionType === 'sync_google_sheets') {
    const input = document.getElementById('stockTabSheetsUrlInput') || document.getElementById('settingSheetsUrl');
    const url = (input ? input.value.trim() : '') || localStorage.getItem('vetassist_sheets_url_v2');
    if (url && window.stockManager) {
      if (window.app) window.app.showToast('🔄 Reklam tamamlandı, Google Sheets senkronizasyonu yapılıyor...');
      window.stockManager.syncGoogleSheets(url)
        .then(count => {
          if (window.app) window.app.showToast(`✅ ${count} ürün başarıyla güncellendi!`);
        })
        .catch(err => {
          alert('Senkronizasyon Hatası: ' + err.message);
        });
    }
  } else if (actionType === 'support_developer') {
    if (window.app) {
      window.app.showToast('🎉 Harikasınız! Desteğiniz için yürekten teşekkür ederiz.');
    }
  } else if (actionType === 'export_stock_csv') {
    if (window.stockManager) {
      window.stockManager.exportCsv();
      if (window.app) window.app.showToast('✅ Stok listesi CSV olarak indirildi.');
    }
  } else if (actionType === 'export_logs_csv') {
    if (window.logManager) {
      window.logManager.exportCsv();
      if (window.app) window.app.showToast('✅ Satış kayıtları CSV olarak indirildi.');
    }
  }
};
