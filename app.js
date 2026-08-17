/**
 * SahaVeteriner - Ana Uygulama Kontrolcüsü (app.js)
 * Sepet yönetimi, canlı hesaplama, modal akışları ve sekme navigasyonu
 */

class AppController {
  constructor() {
    this.cart = []; // [{ item: Product, qty: 1 }]
    this.distanceKm = 0;
    this.isDistanceEnabled = true;
    this.isVatEnabled = false;
    this.vatRate = 18;
    this.batchSelections = new Map(); // id -> qty

    this.init();
  }

  init() {
    // Kayıtlı ayarları yükle
    const savedVat = localStorage.getItem('sahavet_vat_rate');
    if (savedVat) this.vatRate = parseFloat(savedVat) || 18;
    document.getElementById('vatRateLabel').textContent = `KDV Oranı: %${this.vatRate}`;

    // Modülleri başlat
    if (window.stockManager) window.stockManager.renderUI();
    if (window.paramManager) window.paramManager.renderUI();

    this.bindEvents();
    this.recalculate();
    this.checkNetworkStatus();
    this.registerServiceWorker();
  }

  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./service-worker.js')
        .then(() => console.log('SahaVeteriner Service Worker Aktif (Offline Desteği Hazır)'))
        .catch(err => console.log('SW Kayıt Hatası:', err));
    }
  }

  showToast(message, duration = 3000) {
    const toast = document.getElementById('toastNotification');
    if (!toast) return;
    toast.textContent = message;
    toast.style.display = 'block';
    setTimeout(() => {
      toast.style.display = 'none';
    }, duration);
  }

  checkNetworkStatus() {
    const badge = document.getElementById('onlineStatusBadge');
    if (!badge) return;

    const updateStatus = () => {
      if (navigator.onLine) {
        badge.innerHTML = '🟢 Çevrimiçi (Sheets Bağlantısı Aktif)';
        badge.style.color = 'var(--success)';
      } else {
        badge.innerHTML = '🟡 Çevrimdışı Mod (Yerel Hafıza Aktif)';
        badge.style.color = 'var(--accent-amber)';
      }
    };

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    updateStatus();
  }

  // Sepete ürün ekle
  addToCart(product, qty = 1) {
    const existing = this.cart.find(ci => ci.item.id === product.id);
    if (existing) {
      existing.qty += qty;
    } else {
      this.cart.push({
        item: product,
        qty: qty
      });
    }
    this.renderCart();
    this.recalculate();
    this.showToast(`"${product.name}" (${qty} adet) eklendi`);
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

  removeFromCart(productId) {
    this.cart = this.cart.filter(ci => ci.item.id !== productId);
    this.renderCart();
    this.recalculate();
  }

  clearCart() {
    this.cart = [];
    this.renderCart();
    this.recalculate();
  }

  // Sepet Render
  renderCart() {
    const cartCountEl = document.getElementById('cartItemCount');
    const emptyState = document.getElementById('cartEmptyState');
    const cartList = document.getElementById('cartList');
    const clearCartBtn = document.getElementById('clearCartBtn');

    const totalCount = this.cart.reduce((sum, ci) => sum + ci.qty, 0);
    if (cartCountEl) cartCountEl.textContent = totalCount;

    if (this.cart.length === 0) {
      if (emptyState) emptyState.style.display = 'block';
      if (cartList) cartList.style.display = 'none';
      if (clearCartBtn) clearCartBtn.style.display = 'none';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (cartList) cartList.style.display = 'flex';
    if (clearCartBtn) clearCartBtn.style.display = 'inline-block';

    const profitMargin = window.paramManager ? window.paramManager.getProfitMargin() : 25;

    cartList.innerHTML = '';
    this.cart.forEach(ci => {
      const unitSalePrice = ci.item.unitCost * (1 + (profitMargin / 100));
      const lineTotal = unitSalePrice * ci.qty;
      const isCritical = (parseInt(ci.item.currentStock) || 0) <= (parseInt(ci.item.minStock) || 0);

      const card = document.createElement('div');
      card.className = 'cart-item-card';
      card.innerHTML = `
        <div class="cart-item-top">
          <div>
            <div class="cart-item-name">${ci.item.name}</div>
            <div class="cart-item-cost-info">
              Maliyet: ${ci.item.unitCost.toFixed(2)} TL | Kâr: %${profitMargin}
              ${isCritical ? '<span class="badge-alert" style="margin-left:4px;">🚨 Kritik Stok</span>' : ''}
            </div>
          </div>
          <button class="btn-remove-item" data-id="${ci.item.id}" title="Listeden çıkar">✕</button>
        </div>

        <div class="cart-item-bottom">
          <div class="qty-stepper">
            <button class="btn-step cart-step-minus" data-id="${ci.item.id}">−</button>
            <span class="qty-input">${ci.qty}</span>
            <button class="btn-step cart-step-plus" data-id="${ci.item.id}">+</button>
          </div>
          <div class="cart-item-total">
            <span class="cart-item-total-val">${lineTotal.toFixed(2)} TL</span>
            <span class="cart-item-unit-val">${unitSalePrice.toFixed(2)} TL / adet</span>
          </div>
        </div>
      `;
      cartList.appendChild(card);
    });

    // Cart Events
    cartList.querySelectorAll('.cart-step-minus').forEach(btn => {
      btn.addEventListener('click', () => this.updateCartQty(btn.getAttribute('data-id'), -1));
    });
    cartList.querySelectorAll('.cart-step-plus').forEach(btn => {
      btn.addEventListener('click', () => this.updateCartQty(btn.getAttribute('data-id'), 1));
    });
    cartList.querySelectorAll('.btn-remove-item').forEach(btn => {
      btn.addEventListener('click', () => this.removeFromCart(btn.getAttribute('data-id')));
    });
  }

  // Canlı Hesaplama Motoru
  recalculate() {
    const profitMargin = window.paramManager ? window.paramManager.getProfitMargin() : 25;
    const kmRate = window.paramManager ? window.paramManager.getKmRate() : 25;

    // KM Göstergesi Güncelle
    const kmRateDisplay = document.getElementById('kmRateDisplay');
    if (kmRateDisplay) kmRateDisplay.textContent = `${kmRate.toFixed(2)} TL/km`;

    // 1. Kalemler Toplamı
    let itemsTotal = 0;
    this.cart.forEach(ci => {
      const unitSalePrice = ci.item.unitCost * (1 + (profitMargin / 100));
      itemsTotal += unitSalePrice * ci.qty;
    });

    // 2. Ulaşım Tutarı
    const effectiveKm = this.isDistanceEnabled ? this.distanceKm : 0;
    const distanceTotal = effectiveKm * kmRate;

    const distanceTotalDisplay = document.getElementById('distanceTotalDisplay');
    if (distanceTotalDisplay) distanceTotalDisplay.textContent = `${distanceTotal.toFixed(2)} TL`;

    const summaryDistanceRow = document.getElementById('summaryDistanceRow');
    if (summaryDistanceRow) {
      summaryDistanceRow.style.display = this.isDistanceEnabled && distanceTotal > 0 ? 'flex' : 'none';
      document.getElementById('summaryDistanceTotal').textContent = `${distanceTotal.toFixed(2)} TL`;
    }

    // 3. Diğer Parametreler (Dinamik)
    const breakdown = window.paramManager ? window.paramManager.calculateBreakdown(itemsTotal, effectiveKm) : {
      visibleItems: [],
      maskedTotal: 0,
      totalAdditionalCost: distanceTotal
    };

    // Mesafe haricindeki ek parametre toplamları
    const otherParamsTotal = Math.max(0, breakdown.totalAdditionalCost - distanceTotal);
    const summaryOtherRow = document.getElementById('summaryOtherParamsRow');
    if (summaryOtherRow) {
      if (otherParamsTotal > 0) {
        summaryOtherRow.style.display = 'flex';
        document.getElementById('summaryOtherParamsTotal').textContent = `${otherParamsTotal.toFixed(2)} TL`;
      } else {
        summaryOtherRow.style.display = 'none';
      }
    }

    // 4. Ara Toplam
    const subTotal = itemsTotal + breakdown.totalAdditionalCost;

    // 5. KDV
    let vatAmount = 0;
    if (this.isVatEnabled) {
      vatAmount = subTotal * (this.vatRate / 100);
      document.getElementById('summaryVatRow').style.display = 'flex';
      document.getElementById('summaryVatTotal').textContent = `${vatAmount.toFixed(2)} TL`;
    } else {
      document.getElementById('summaryVatRow').style.display = 'none';
    }

    // 6. Genel Toplam
    const grandTotal = subTotal + vatAmount;

    // Arayüz Değerlerini Güncelle
    document.getElementById('summaryItemsTotal').textContent = `${itemsTotal.toFixed(2)} TL`;
    document.getElementById('summarySubTotal').textContent = `${subTotal.toFixed(2)} TL`;
    document.getElementById('summaryGrandTotal').textContent = `${grandTotal.toFixed(2)} TL`;

    // Aktif Parametreler Özetini Güncelle
    this.renderActiveParamsSummary();

    return {
      itemsTotal,
      distanceTotal,
      effectiveKm,
      subTotal,
      isVatEnabled: this.isVatEnabled,
      vatRate: this.vatRate,
      vatAmount,
      grandTotal,
      breakdown
    };
  }

  renderActiveParamsSummary() {
    const container = document.getElementById('activeParamsSummary');
    if (!container || !window.paramManager) return;

    const params = window.paramManager.getAll().filter(p => p.enabled);
    container.innerHTML = '';

    params.forEach(p => {
      const badge = document.createElement('div');
      badge.className = 'param-summary-chip';
      badge.style.display = 'inline-flex';
      badge.style.alignItems = 'center';
      badge.style.gap = '6px';
      badge.style.padding = '4px 10px';
      badge.style.margin = '2px 4px 2px 0';
      badge.style.borderRadius = 'var(--radius-full)';
      badge.style.backgroundColor = 'var(--bg-card-alt)';
      badge.style.border = '1px solid var(--border-color)';
      badge.style.fontSize = '0.75rem';
      badge.style.fontWeight = '700';

      let valText = `${p.value} TL`;
      if (p.type === 'percent') valText = `%${p.value}`;
      if (p.type === 'multiplier') valText = `${p.value} TL/km`;

      badge.innerHTML = `
        <span>${p.name}:</span>
        <strong style="color:var(--primary); font-family:var(--font-mono);">${valText}</strong>
        ${p.visibility === 'masked' ? '<span class="badge-masked">🔒 Diğer Giderler</span>' : ''}
      `;
      container.appendChild(badge);
    });
  }

  // Event Listeners
  bindEvents() {
    // Sekme Navigasyonu
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

        tab.classList.add('active');
        const targetId = tab.getAttribute('data-target');
        const targetPane = document.getElementById(targetId);
        if (targetPane) targetPane.classList.add('active');

        // Sekme özel yenilemeler
        if (targetId === 'tab-stock' && window.stockManager) window.stockManager.renderUI();
        if (targetId === 'tab-params' && window.paramManager) window.paramManager.renderUI();
      });
    });

    // Link Navigasyonları (örn: Düzenle ➔)
    document.querySelectorAll('.link-nav').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = link.getAttribute('data-target');
        const tabBtn = document.querySelector(`.nav-tab[data-target="${target}"]`);
        if (tabBtn) tabBtn.click();
      });
    });

    // Tema Değiştirici (Güneş Işığı / Koyu Saha)
    document.getElementById('themeToggleBtn').addEventListener('click', () => {
      document.body.classList.toggle('theme-dark');
      const isDark = document.body.classList.contains('theme-dark');
      document.getElementById('themeIcon').textContent = isDark ? '🌙' : '☀️';
      this.showToast(isDark ? 'Koyu Saha Teması Aktif' : 'Güneş Işığı (Yüksek Kontrast) Teması Aktif');
    });

    // Telefon / Masaüstü Görünüm Toggle
    const screenModeBtn = document.getElementById('screenModeToggleBtn');
    if (screenModeBtn) {
      screenModeBtn.addEventListener('click', () => {
        const layout = document.getElementById('appLayout');
        layout.classList.toggle('desktop-mode');
        const isDesktop = layout.classList.contains('desktop-mode');
        document.getElementById('screenModeIcon').textContent = isDesktop ? '🖥️' : '📱';
        this.showToast(isDesktop ? 'Masaüstü Geniş Görünüm' : 'Mobil Telefon Görünümü');
      });
    }

    // Hızlı İlaç Arama (Autocomplete)
    const searchInput = document.getElementById('quickSearchInput');
    const autoDropdown = document.getElementById('autocompleteDropdown');
    const clearSearchBtn = document.getElementById('clearSearchBtn');

    searchInput.addEventListener('input', (e) => {
      const term = e.target.value.trim().toLowerCase();
      if (term.length > 0) {
        clearSearchBtn.style.display = 'block';
        const items = window.stockManager ? window.stockManager.getAll() : [];
        const matches = items.filter(it => it.name.toLowerCase().includes(term) || (it.category || '').toLowerCase().includes(term));
        
        if (matches.length > 0) {
          const profitMargin = window.paramManager ? window.paramManager.getProfitMargin() : 25;
          autoDropdown.innerHTML = matches.map(item => {
            const salePrice = item.unitCost * (1 + (profitMargin / 100));
            const isCritical = (parseInt(item.currentStock) || 0) <= (parseInt(item.minStock) || 0);
            return `
              <div class="autocomplete-item" data-id="${item.id}">
                <div>
                  <div class="auto-item-title">
                    ${item.name}
                    ${isCritical ? '<span class="badge-alert">🚨 Stok Az</span>' : ''}
                  </div>
                  <div class="auto-item-meta">Stok: ${item.currentStock} ${item.category ? `• ${item.category}` : ''}</div>
                </div>
                <div class="auto-item-price">${salePrice.toFixed(2)} TL</div>
              </div>
            `;
          }).join('');
          autoDropdown.style.display = 'block';
        } else {
          autoDropdown.innerHTML = '<div class="autocomplete-item" style="color:var(--text-muted);">Eşleşen ilaç bulunamadı</div>';
          autoDropdown.style.display = 'block';
        }
      } else {
        clearSearchBtn.style.display = 'none';
        autoDropdown.style.display = 'none';
      }
    });

    autoDropdown.addEventListener('click', (e) => {
      const itemEl = e.target.closest('.autocomplete-item');
      if (itemEl) {
        const id = itemEl.getAttribute('data-id');
        const prod = window.stockManager.get(id);
        if (prod) {
          this.addToCart(prod, 1);
          searchInput.value = '';
          clearSearchBtn.style.display = 'none';
          autoDropdown.style.display = 'none';
        }
      }
    });

    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      clearSearchBtn.style.display = 'none';
      autoDropdown.style.display = 'none';
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.autocomplete-wrapper')) {
        autoDropdown.style.display = 'none';
      }
    });

    // Mesafe (KM) Girişi
    const kmInput = document.getElementById('distanceKmInput');
    kmInput.addEventListener('input', (e) => {
      this.distanceKm = Math.max(0, parseFloat(e.target.value) || 0);
      this.recalculate();
    });

    // Hızlı KM Çipleri
    document.querySelectorAll('.chip-btn[data-km]').forEach(chip => {
      chip.addEventListener('click', () => {
        const addKm = parseInt(chip.getAttribute('data-km')) || 0;
        this.distanceKm += addKm;
        kmInput.value = this.distanceKm;
        this.recalculate();
      });
    });

    document.getElementById('resetKmBtn').addEventListener('click', () => {
      this.distanceKm = 0;
      kmInput.value = 0;
      this.recalculate();
    });

    // Mesafe Toggle
    document.getElementById('distanceEnableToggle').addEventListener('change', (e) => {
      this.isDistanceEnabled = e.target.checked;
      document.getElementById('distanceInputsArea').style.opacity = this.isDistanceEnabled ? '1' : '0.4';
      document.getElementById('distanceInputsArea').style.pointerEvents = this.isDistanceEnabled ? 'auto' : 'none';
      this.recalculate();
    });

    // KDV / Fatura Toggle
    document.getElementById('vatToggle').addEventListener('change', (e) => {
      this.isVatEnabled = e.target.checked;
      this.recalculate();
    });

    // Sepeti Temizle
    document.getElementById('clearCartBtn').addEventListener('click', () => {
      if (confirm('Tüm seçili kalemleri listeden temizlemek istediğinize emin misiniz?')) {
        this.clearCart();
      }
    });

    // -------------------------------------------------------------
    // MODAL 1: Çoklu Kalem Ekleme Modalı
    // -------------------------------------------------------------
    document.getElementById('openBatchModalBtn').addEventListener('click', () => this.openBatchAddModal());
    document.getElementById('closeBatchModalBtn').addEventListener('click', () => this.closeBatchAddModal());
    document.getElementById('batchCancelBtn').addEventListener('click', () => this.closeBatchAddModal());
    document.getElementById('batchConfirmBtn').addEventListener('click', () => this.confirmBatchAdd());

    // -------------------------------------------------------------
    // MODAL 2: Görsel Adisyon & WhatsApp Paylaşım Önizlemesi
    // -------------------------------------------------------------
    document.getElementById('generateReceiptBtn').addEventListener('click', () => this.openReceiptPreviewModal());
    document.getElementById('closeReceiptModalBtn').addEventListener('click', () => this.closeReceiptPreviewModal());

    // Önizleme Tabları: Görsel Fiş vs Metin
    document.getElementById('tabViewVisual').addEventListener('click', () => {
      document.getElementById('tabViewVisual').classList.add('active');
      document.getElementById('tabViewText').classList.remove('active');
      document.getElementById('visualReceiptWrapper').style.display = 'flex';
      document.getElementById('textReceiptWrapper').style.display = 'none';
    });

    document.getElementById('tabViewText').addEventListener('click', () => {
      document.getElementById('tabViewText').classList.add('active');
      document.getElementById('tabViewVisual').classList.remove('active');
      document.getElementById('visualReceiptWrapper').style.display = 'none';
      document.getElementById('textReceiptWrapper').style.display = 'block';
    });

    // WhatsApp Paylaşımı
    document.getElementById('whatsappShareBtn').addEventListener('click', async () => {
      const calcData = this.prepareReceiptData();
      await window.receiptGenerator.shareToWhatsApp(calcData);
      this.showToast('WhatsApp paylaşımı başlatıldı');
    });

    // JPG İndir
    document.getElementById('downloadJpgBtn').addEventListener('click', async () => {
      const calcData = this.prepareReceiptData();
      await window.receiptGenerator.downloadJpg(calcData);
      this.showToast('Adisyon JPG olarak indirildi');
    });

    // Metni Kopyala
    document.getElementById('copyTextBtn').addEventListener('click', () => {
      const text = document.getElementById('whatsappTextOutput').value;
      navigator.clipboard.writeText(text).then(() => {
        this.showToast('Adisyon metni panoya kopyalandı! 📋');
      });
    });

    // -------------------------------------------------------------
    // MODAL 3: Yeni Ürün / Düzenleme Modalı
    // -------------------------------------------------------------
    document.getElementById('openNewItemModalBtn').addEventListener('click', () => this.openProductEditModal());
    document.getElementById('closeProductModalBtn').addEventListener('click', () => this.closeProductEditModal());
    document.getElementById('cancelProductBtn').addEventListener('click', () => this.closeProductEditModal());

    document.getElementById('productEditForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('editProductIndex').value;
      const data = {
        name: document.getElementById('editProdName').value,
        unitCost: parseFloat(document.getElementById('editProdCost').value) || 0,
        category: document.getElementById('editProdCategory').value || 'Genel',
        currentStock: parseInt(document.getElementById('editProdStock').value) || 0,
        minStock: parseInt(document.getElementById('editProdMinStock').value) || 0
      };

      if (id && id !== '-1') {
        window.stockManager.updateItem(id, data);
        this.showToast('Ürün başarıyla güncellendi');
      } else {
        window.stockManager.addItem(data);
        this.showToast('Yeni ürün eklendi');
      }
      this.closeProductEditModal();
    });

    // -------------------------------------------------------------
    // MODAL 4: Yeni Parametre Ekleme Modalı
    // -------------------------------------------------------------
    document.getElementById('openNewParamModalBtn').addEventListener('click', () => this.openParamEditModal());
    document.getElementById('closeParamModalBtn').addEventListener('click', () => this.closeParamEditModal());
    document.getElementById('cancelParamBtn').addEventListener('click', () => this.closeParamEditModal());

    document.getElementById('paramEditForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const visRadio = document.querySelector('input[name="paramVisibility"]:checked');
      const data = {
        name: document.getElementById('editParamName').value,
        type: document.getElementById('editParamType').value,
        value: parseFloat(document.getElementById('editParamValue').value) || 0,
        visibility: visRadio ? visRadio.value : 'separate'
      };

      window.paramManager.addParameter(data);
      window.paramManager.renderUI();
      this.recalculate();
      this.showToast('Yeni maliyet kalemi eklendi');
      this.closeParamEditModal();
    });

    // -------------------------------------------------------------
    // Stok Sekmesi Arama & Filtreler
    // -------------------------------------------------------------
    const stockSearch = document.getElementById('stockSearchInput');
    if (stockSearch) {
      stockSearch.addEventListener('input', (e) => {
        if (window.stockManager) {
          window.stockManager.searchTerm = e.target.value;
          window.stockManager.renderUI();
        }
      });
    }

    document.querySelectorAll('.filter-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        if (window.stockManager) {
          window.stockManager.activeFilter = tab.getAttribute('data-filter');
          window.stockManager.renderUI();
        }
      });
    });

    // Google Sheets Senkronizasyon Butonu
    document.getElementById('syncSheetsBtn').addEventListener('click', async () => {
      const url = localStorage.getItem('sahavet_sheets_url');
      if (!url) {
        alert('Lütfen önce "Fiş & İletişim" sekmesinden Google Sheets CSV linkinizi kaydedin.');
        return;
      }
      try {
        this.showToast('Google Sheets ile senkronize ediliyor...');
        await window.stockManager.syncGoogleSheets(url);
        this.showToast('Senkronizasyon tamamlandı! ✅');
      } catch (err) {
        alert('Sheets Hatası: ' + err.message);
      }
    });

    // CSV Dosya Yükleme
    const csvFileInput = document.getElementById('csvFileInput');
    if (csvFileInput) {
      csvFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            try {
              const count = window.stockManager.parseAndImportCsv(event.target.result);
              this.showToast(`${count} adet ürün CSV dosyasından yüklendi!`);
            } catch (err) {
              alert('CSV Okuma Hatası: ' + err.message);
            }
          };
          reader.readAsText(file);
        }
      });
    }

    // CSV Dışa Aktar
    document.getElementById('exportCsvBtn').addEventListener('click', () => {
      window.stockManager.exportCsv();
      this.showToast('CSV dosyası indirildi');
    });

    // Örnek Veri Yükle
    document.getElementById('loadSampleDataBtn').addEventListener('click', () => {
      if (confirm('Mevcut liste örnek veteriner ürünleriyle güncellensin mi?')) {
        window.stockManager.resetToInitial();
        this.showToast('Örnek ürünler yüklendi');
      }
    });

    // -------------------------------------------------------------
    // Ayarlar Formu
    // -------------------------------------------------------------
    const clinicForm = document.getElementById('clinicSettingsForm');
    if (clinicForm) {
      // Değerleri doldur
      const info = window.receiptGenerator ? window.receiptGenerator.getClinicInfo() : {};
      document.getElementById('settingClinicName').value = info.title || 'VETERİNER HİZMET DETAYI';
      document.getElementById('settingBankName').value = info.bank || 'Ziraat Bankası';
      document.getElementById('settingIban').value = info.iban || 'TR12 0001 0002 0003 0004 0005 06';
      document.getElementById('settingAddress').value = info.address || 'Kamçıllı, Mandıra Sokak No 12, 10085 Karesi/Balıkesir';
      document.getElementById('settingPhone').value = info.phone || '0552 185 03 08';
      document.getElementById('settingVatRate').value = info.vatRate || 18;
      document.getElementById('settingSheetsUrl').value = localStorage.getItem('sahavet_sheets_url') || '';

      clinicForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const updated = {
          title: document.getElementById('settingClinicName').value,
          bank: document.getElementById('settingBankName').value,
          iban: document.getElementById('settingIban').value,
          address: document.getElementById('settingAddress').value,
          phone: document.getElementById('settingPhone').value,
          vatRate: parseFloat(document.getElementById('settingVatRate').value) || 18
        };
        window.receiptGenerator.saveClinicInfo(updated);
        localStorage.setItem('sahavet_sheets_url', document.getElementById('settingSheetsUrl').value);
        
        this.vatRate = updated.vatRate;
        document.getElementById('vatRateLabel').textContent = `KDV Oranı: %${this.vatRate}`;
        this.recalculate();
        this.showToast('Ayarlar başarıyla kaydedildi! 💾');
      });

      document.getElementById('resetDefaultsBtn').addEventListener('click', () => {
        if (confirm('Tüm parametreler ve ayarlar fabrika ayarlarına döndürülsün mü?')) {
          localStorage.clear();
          window.location.reload();
        }
      });
    }
  }

  // -------------------------------------------------------------
  // Çoklu Kalem Ekleme Modalı Mantığı
  // -------------------------------------------------------------
  openBatchAddModal() {
    this.batchSelections.clear();
    const modal = document.getElementById('batchAddModal');
    modal.style.display = 'flex';
    this.renderBatchItems();
  }

  closeBatchAddModal() {
    document.getElementById('batchAddModal').style.display = 'none';
  }

  renderBatchItems() {
    const container = document.getElementById('batchItemList');
    const searchVal = (document.getElementById('batchSearchInput').value || '').toLowerCase();
    const items = window.stockManager ? window.stockManager.getAll() : [];
    const profitMargin = window.paramManager ? window.paramManager.getProfitMargin() : 25;

    const filtered = items.filter(it => it.name.toLowerCase().includes(searchVal) || (it.category || '').toLowerCase().includes(searchVal));

    container.innerHTML = '';
    filtered.forEach(item => {
      const currentQty = this.batchSelections.get(item.id) || 0;
      const salePrice = item.unitCost * (1 + (profitMargin / 100));
      const isCritical = (parseInt(item.currentStock) || 0) <= (parseInt(item.minStock) || 0);

      const row = document.createElement('div');
      row.className = `batch-item-row ${currentQty > 0 ? 'selected-row' : ''}`;
      row.innerHTML = `
        <div class="batch-item-info">
          <div class="batch-item-name">
            ${item.name}
            ${isCritical ? '<span class="badge-alert" style="margin-left:4px;">🚨 Stok: ' + item.currentStock + '</span>' : ''}
          </div>
          <div class="batch-item-meta">Birim: ${salePrice.toFixed(2)} TL (${item.category || 'Genel'})</div>
        </div>
        <div class="qty-stepper">
          <button class="btn-step batch-step-minus" data-id="${item.id}">−</button>
          <span class="qty-input" id="batch-qty-${item.id}">${currentQty}</span>
          <button class="btn-step batch-step-plus" data-id="${item.id}">+</button>
        </div>
      `;
      container.appendChild(row);
    });

    container.querySelectorAll('.batch-step-minus').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        let current = this.batchSelections.get(id) || 0;
        if (current > 0) {
          current--;
          if (current === 0) this.batchSelections.delete(id);
          else this.batchSelections.set(id, current);
          document.getElementById(`batch-qty-${id}`).textContent = current;
          this.updateBatchSummary();
        }
      });
    });

    container.querySelectorAll('.batch-step-plus').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        let current = this.batchSelections.get(id) || 0;
        current++;
        this.batchSelections.set(id, current);
        document.getElementById(`batch-qty-${id}`).textContent = current;
        this.updateBatchSummary();
      });
    });

    // Arama dinleyicisi
    document.getElementById('batchSearchInput').oninput = () => this.renderBatchItems();
  }

  updateBatchSummary() {
    let totalItems = 0;
    this.batchSelections.forEach((qty) => { totalItems += qty; });
    document.getElementById('batchSelectedCount').textContent = totalItems;
  }

  confirmBatchAdd() {
    let count = 0;
    this.batchSelections.forEach((qty, id) => {
      if (qty > 0) {
        const prod = window.stockManager.get(id);
        if (prod) {
          this.addToCart(prod, qty);
          count++;
        }
      }
    });

    this.closeBatchAddModal();
    if (count > 0) {
      this.showToast(`${count} farklı kalem sepete eklendi! 🛒`);
    }
  }

  // -------------------------------------------------------------
  // Adisyon Verisi Hazırlama & Önizleme Modalı
  // -------------------------------------------------------------
  prepareReceiptData() {
    const calc = this.recalculate();
    const profitMargin = window.paramManager ? window.paramManager.getProfitMargin() : 25;

    // Tüm kalemleri birleştir
    const allItems = [];

    // İlaçlar
    this.cart.forEach(ci => {
      const unitSalePrice = ci.item.unitCost * (1 + (profitMargin / 100));
      allItems.push({
        name: ci.item.name,
        qty: ci.qty,
        unitPrice: unitSalePrice,
        total: unitSalePrice * ci.qty
      });
    });

    // Parametreler (Görünür olanlar + 'Diğer Giderler')
    calc.breakdown.visibleItems.forEach(vi => {
      allItems.push({
        name: vi.name,
        qty: vi.qty,
        unitPrice: vi.unitPrice,
        total: vi.total
      });
    });

    return {
      allItems,
      subTotal: calc.subTotal,
      isVatEnabled: calc.isVatEnabled,
      vatRate: calc.vatRate,
      vatAmount: calc.vatAmount,
      grandTotal: calc.grandTotal
    };
  }

  openReceiptPreviewModal() {
    if (this.cart.length === 0 && this.distanceKm === 0) {
      alert('Adisyon oluşturmak için lütfen en az bir ilaç/malzeme seçin veya mesafe (KM) girin.');
      return;
    }

    const receiptData = this.prepareReceiptData();
    window.receiptGenerator.renderHtmlPreview(receiptData);

    const modal = document.getElementById('receiptPreviewModal');
    modal.style.display = 'flex';
  }

  closeReceiptPreviewModal() {
    document.getElementById('receiptPreviewModal').style.display = 'none';
  }

  // Ürün Düzenleme / Ekleme Modal
  openProductEditModal(item = null) {
    const modal = document.getElementById('productEditModal');
    const title = document.getElementById('productModalTitle');
    const indexInput = document.getElementById('editProductIndex');

    if (item) {
      title.textContent = '✏️ Ürün / Malzeme Düzenle';
      indexInput.value = item.id;
      document.getElementById('editProdName').value = item.name;
      document.getElementById('editProdCost').value = item.unitCost;
      document.getElementById('editProdCategory').value = item.category || '';
      document.getElementById('editProdStock').value = item.currentStock;
      document.getElementById('editProdMinStock').value = item.minStock;
    } else {
      title.textContent = '➕ Yeni İlaç / Malzeme Ekle';
      indexInput.value = '-1';
      document.getElementById('productEditForm').reset();
    }
    modal.style.display = 'flex';
  }

  closeProductEditModal() {
    document.getElementById('productEditModal').style.display = 'none';
  }

  // Parametre Ekleme Modal
  openParamEditModal() {
    document.getElementById('paramEditForm').reset();
    document.getElementById('paramEditModal').style.display = 'flex';
  }

  closeParamEditModal() {
    document.getElementById('paramEditModal').style.display = 'none';
  }

  onInventoryChanged() {
    this.recalculate();
  }

  onParametersChanged() {
    this.recalculate();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.app = new AppController();
});
