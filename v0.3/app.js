/**
 * SahaVeteriner - Ana Uygulama Kontrolcüsü (app.js)
 * Sepet yönetimi, canlı hesaplama (kârsız yalın sabit gider dağıtımı),
 * İşlem modu seçimi (Uygulanan Tedavi vs. Fiyat Teklifi), stoktan düşme & loglama
 */

class AppController {
  constructor() {
    this.mode = 'treatment'; // 'treatment' (Tedavi - Stok Düşer) | 'quote' (Fiyat Teklifi - Stok Sabit)
    this.customerName = '';
    this.cart = []; // [{ item: Product, qty: 1 }]
    this.distanceKm = 0;
    this.isDistanceEnabled = true;
    this.isVatEnabled = false;
    this.vatRate = 18;
    this.batchSelections = new Map(); // id -> qty

    this.init();
  }

  init() {
    // Kayıtlı KDV ayarını yükle
    const savedVat = localStorage.getItem('sahavet_vat_rate');
    if (savedVat) this.vatRate = parseFloat(savedVat) || 18;
    const vatLabel = document.getElementById('vatRateLabel');
    if (vatLabel) vatLabel.textContent = `KDV Oranı: %${this.vatRate}`;

    // Modülleri başlat
    if (window.stockManager) window.stockManager.renderUI();
    if (window.paramManager) window.paramManager.renderUI();
    if (window.logManager) window.logManager.renderUI();

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
        badge.innerHTML = '🟢 Çevrimiçi (Sheets Senkronizasyonu Hazır)';
        badge.style.color = 'var(--success)';
      } else {
        badge.innerHTML = '🟡 Çevrimdışı Saha Modu (Yerel Hafıza Aktif)';
        badge.style.color = 'var(--accent-amber)';
      }
    };

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    updateStatus();
  }

  // İşlem Modu Değiştir (Tedavi vs Teklif)
  setMode(newMode) {
    this.mode = newMode;
    const btnTreatment = document.getElementById('modeBtnTreatment');
    const btnQuote = document.getElementById('modeBtnQuote');
    const hintEl = document.getElementById('modeHintText');

    if (newMode === 'treatment') {
      if (btnTreatment) btnTreatment.classList.add('active');
      if (btnQuote) btnQuote.classList.remove('active');
      if (hintEl) hintEl.innerHTML = '💉 <strong>Uygulanan Tedavi:</strong> İşlem tamamlandığında kullanılan ilaçlar otomatik olarak stoktan düşülür ve satış kaydı işlenir.';
    } else {
      if (btnQuote) btnQuote.classList.add('active');
      if (btnTreatment) btnTreatment.classList.remove('active');
      if (hintEl) hintEl.innerHTML = '📄 <strong>Fiyat Teklifi / Bilgilendirme:</strong> İlaç stoklarına dokunulmaz, sadece müşteriye bilgilendirme amaçlı teklif dökümü sunulur.';
    }

    this.recalculate();
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
    const isDistributing = window.paramManager ? window.paramManager.distributeFixedExpense : false;
    const fixedFee = window.paramManager ? window.paramManager.getFixedClinicFee() : 0;

    // Kârlı tutarlar ve orantılı pay hesaplama
    let totalKarliTutar = 0;
    this.cart.forEach(ci => {
      const karliFiyat = ci.item.unitCost * (1 + (profitMargin / 100));
      totalKarliTutar += karliFiyat * ci.qty;
    });

    cartList.innerHTML = '';
    this.cart.forEach(ci => {
      const baseKarliFiyat = ci.item.unitCost * (1 + (profitMargin / 100));
      const lineKarliTotal = baseKarliFiyat * ci.qty;

      let displayUnitPrice = baseKarliFiyat;
      let displayLineTotal = lineKarliTotal;
      let addedExpense = 0;

      if (isDistributing && totalKarliTutar > 0 && fixedFee > 0) {
        const shareRatio = lineKarliTotal / totalKarliTutar;
        addedExpense = fixedFee * shareRatio; // Kârsız yalın pay
        displayLineTotal = lineKarliTotal + addedExpense;
        displayUnitPrice = displayLineTotal / ci.qty;
      }

      const isCritical = (parseInt(ci.item.currentStock) || 0) <= (parseInt(ci.item.minStock) || 0);

      const card = document.createElement('div');
      card.className = 'cart-item-card';
      card.innerHTML = `
        <div class="cart-item-top">
          <div>
            <div class="cart-item-name">${ci.item.name}</div>
            <div class="cart-item-cost-info">
              Maliyet: ${ci.item.unitCost.toFixed(2)} TL | Kâr: %${profitMargin}
              ${isDistributing && addedExpense > 0 ? `<span class="badge-masked" title="Sabit giderden ${addedExpense.toFixed(2)} TL giydirildi">+${addedExpense.toFixed(2)} TL Gider</span>` : ''}
              ${isCritical ? '<span class="badge-alert" style="margin-left:4px;">🚨 Kritik Stok: ' + ci.item.currentStock + '</span>' : ''}
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
            <span class="cart-item-total-val">${displayLineTotal.toFixed(2)} TL</span>
            <span class="cart-item-unit-val">${displayUnitPrice.toFixed(2)} TL / adet</span>
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

  // =========================================================================
  // CANLI HESAPLAMA MOTORU (PDF Şartnamesindeki Exact Formül ile)
  // =========================================================================
  recalculate() {
    const profitMargin = window.paramManager ? window.paramManager.getProfitMargin() : 25;
    const kmRate = window.paramManager ? window.paramManager.getKmRate() : 25;
    const isDistributing = window.paramManager ? window.paramManager.distributeFixedExpense : false;
    const fixedFee = window.paramManager ? window.paramManager.getFixedClinicFee() : 0;
    const hasCart = this.cart.length > 0;

    // 1. İlaçların Ham ve Kârlı Maliyetlerini Hesapla
    // Formül kuralı: Kâr SADECE ürünün ham maliyetine uygulanır:
    // karliFiyat = hamMaliyet * (1 + karOrani / 100)
    let totalKarliTutar = 0;
    const computedCartItems = this.cart.map(ci => {
      const hamMaliyet = ci.item.unitCost;
      const karliBirim = hamMaliyet * (1 + (profitMargin / 100));
      const lineKarli = karliBirim * ci.qty;
      totalKarliTutar += lineKarli;
      return {
        id: ci.item.id,
        name: ci.item.name,
        qty: ci.qty,
        hamMaliyet: hamMaliyet,
        karliBirim: karliBirim,
        lineKarli: lineKarli
      };
    });

    // 2. Eğer Sabit Gider Dağıtımı AÇIKSA ve sepette ürün varsa:
    // Sabit klinik gideri kârsız (yalın tutarıyla) ilaçlara oranlanır
    let itemsTotal = 0;
    const finalCartItems = computedCartItems.map(ci => {
      let finalLineTotal = ci.lineKarli;
      let finalUnitPrice = ci.karliBirim;
      let addedExpense = 0;

      if (isDistributing && hasCart && totalKarliTutar > 0 && fixedFee > 0) {
        const oran = ci.lineKarli / totalKarliTutar;
        addedExpense = fixedFee * oran; // Kârsız yalın pay
        finalLineTotal = ci.lineKarli + addedExpense;
        finalUnitPrice = finalLineTotal / ci.qty;
      }

      itemsTotal += finalLineTotal;

      return {
        ...ci,
        unitPrice: finalUnitPrice,
        total: finalLineTotal,
        addedExpense: addedExpense
      };
    });

    // 3. Ulaşım Tutarı
    const effectiveKm = this.isDistanceEnabled ? this.distanceKm : 0;
    const distanceTotal = effectiveKm * kmRate;

    const distanceTotalDisplay = document.getElementById('distanceTotalDisplay');
    if (distanceTotalDisplay) distanceTotalDisplay.textContent = `${distanceTotal.toFixed(2)} TL`;

    const summaryDistanceRow = document.getElementById('summaryDistanceRow');
    if (summaryDistanceRow) {
      summaryDistanceRow.style.display = this.isDistanceEnabled && distanceTotal > 0 ? 'flex' : 'none';
      document.getElementById('summaryDistanceTotal').textContent = `${distanceTotal.toFixed(2)} TL`;
    }

    // 4. Diğer Parametreler (Dinamik)
    const breakdown = window.paramManager 
      ? window.paramManager.calculateBreakdown(totalKarliTutar, effectiveKm, hasCart) 
      : { visibleItems: [], maskedTotal: 0, totalAdditionalCost: distanceTotal };

    // Dağıtılmayan veya mesafe harici ek parametreler
    const otherParamsTotal = Math.max(0, breakdown.totalAdditionalCost - distanceTotal - (isDistributing && hasCart ? fixedFee : 0));
    const summaryOtherRow = document.getElementById('summaryOtherParamsRow');
    if (summaryOtherRow) {
      if (otherParamsTotal > 0) {
        summaryOtherRow.style.display = 'flex';
        document.getElementById('summaryOtherParamsTotal').textContent = `${otherParamsTotal.toFixed(2)} TL`;
      } else {
        summaryOtherRow.style.display = 'none';
      }
    }

    // Dağıtım Bilgi Uyarısı
    const distNotice = document.getElementById('distributedExpenseNotice');
    if (distNotice) {
      if (isDistributing && hasCart && fixedFee > 0) {
        distNotice.style.display = 'flex';
        document.getElementById('distNoticeAmount').textContent = `${fixedFee.toFixed(2)} TL`;
      } else {
        distNotice.style.display = 'none';
      }
    }

    // 5. Ara Toplam
    // Eğer sabit gider dağıtıldıysa itemsTotal zaten fixedFee'yi içerir
    let subTotal = 0;
    if (isDistributing && hasCart) {
      subTotal = itemsTotal + distanceTotal + otherParamsTotal;
    } else {
      subTotal = itemsTotal + breakdown.totalAdditionalCost;
    }

    // 6. KDV
    let vatAmount = 0;
    if (this.isVatEnabled) {
      vatAmount = subTotal * (this.vatRate / 100);
      document.getElementById('summaryVatRow').style.display = 'flex';
      document.getElementById('summaryVatTotal').textContent = `${vatAmount.toFixed(2)} TL`;
    } else {
      document.getElementById('summaryVatRow').style.display = 'none';
    }

    // 7. Genel Toplam
    const grandTotal = subTotal + vatAmount;

    // Arayüz Değerlerini Güncelle
    document.getElementById('summaryItemsTotal').textContent = `${itemsTotal.toFixed(2)} TL`;
    document.getElementById('summarySubTotal').textContent = `${subTotal.toFixed(2)} TL`;
    document.getElementById('summaryGrandTotal').textContent = `${grandTotal.toFixed(2)} TL`;

    return {
      mode: this.mode,
      customer: this.customerName,
      itemsTotal,
      finalCartItems,
      distanceTotal,
      effectiveKm,
      subTotal,
      isVatEnabled: this.isVatEnabled,
      vatRate: this.vatRate,
      vatAmount,
      grandTotal,
      isDistributing: isDistributing && hasCart && fixedFee > 0,
      breakdown
    };
  }

  // Event Listeners
  bindEvents() {
    // Sekme Navigasyonu (5 Sekme: Hesaplama, Stok, Loglar, Parametreler, Ayarlar)
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
        if (targetId === 'tab-logs' && window.logManager) window.logManager.renderUI();
        if (targetId === 'tab-params' && window.paramManager) window.paramManager.renderUI();
      });
    });

    // İşlem Modu Butonları (Uygulanan Tedavi vs Fiyat Teklifi)
    const btnTreatment = document.getElementById('modeBtnTreatment');
    const btnQuote = document.getElementById('modeBtnQuote');

    if (btnTreatment) {
      btnTreatment.addEventListener('click', () => this.setMode('treatment'));
    }
    if (btnQuote) {
      btnQuote.addEventListener('click', () => this.setMode('quote'));
    }

    // Müşteri / Hasta Sahibi Girişi
    const custInput = document.getElementById('calcCustomerInput');
    if (custInput) {
      custInput.addEventListener('input', (e) => {
        this.customerName = e.target.value;
      });
    }

    // Sabit Gider Dağıtım Hızlı Toggle (Hesaplama Ekranında)
    const quickDistToggle = document.getElementById('quickDistributeToggle');
    if (quickDistToggle) {
      quickDistToggle.checked = window.paramManager ? window.paramManager.distributeFixedExpense : false;
      quickDistToggle.addEventListener('change', (e) => {
        if (window.paramManager) {
          window.paramManager.setDistributeFixedExpense(e.target.checked);
          this.renderCart();
          this.recalculate();
          this.showToast(e.target.checked 
            ? 'Sabit klinik gideri ilaç fiyatlarına giydirildi ✨' 
            : 'Sabit gider ayrı kalem olarak gösterilecek 📋');
        }
      });
    }

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
                    ${isCritical ? '<span class="badge-alert">🚨 Stok: ' + item.currentStock + '</span>' : ''}
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

    // WhatsApp Paylaşımı (Metin + JPG ve Otomatik Stok Düşme & Loglama)
    document.getElementById('whatsappShareBtn').addEventListener('click', async () => {
      const calcData = this.prepareReceiptData();
      const res = await window.receiptGenerator.shareToWhatsApp(calcData, true);
      if (res && res.aborted) {
        return; // Kullanıcı paylaşım penceresini kapattı
      }
      this.finalizeTransaction(calcData);
    });

    // WhatsApp'a JPG Görsel Fiş Gönder Butonu
    const whatsappJpgBtn = document.getElementById('whatsappJpgOnlyBtn');
    if (whatsappJpgBtn) {
      whatsappJpgBtn.addEventListener('click', async () => {
        const calcData = this.prepareReceiptData();
        const res = await window.receiptGenerator.shareToWhatsApp(calcData, true);
        if (res && res.aborted) {
          return;
        }
        this.finalizeTransaction(calcData);
      });
    }

    // JPG İndir (ve Otomatik Stok Düşme & Loglama)
    document.getElementById('downloadJpgBtn').addEventListener('click', async () => {
      const calcData = this.prepareReceiptData();
      await window.receiptGenerator.downloadJpg(calcData);
      this.showToast('Görsel adisyon (JPG) cihazınıza indirildi! 📥');
      this.finalizeTransaction(calcData);
    });

    // Sadece İşlemi Onayla ve Arşivle Butonu
    const finalizeBtn = document.getElementById('finalizeOnlyBtn');
    if (finalizeBtn) {
      finalizeBtn.addEventListener('click', () => {
        const calcData = this.prepareReceiptData();
        this.finalizeTransaction(calcData);
        this.closeReceiptPreviewModal();
      });
    }

    // Metni Kopyala
    document.getElementById('copyTextBtn').addEventListener('click', () => {
      const text = document.getElementById('whatsappTextOutput').value;
      navigator.clipboard.writeText(text).then(() => {
        this.showToast('Adisyon metni panoya kopyalandı! 📋');
      });
    });

    // -------------------------------------------------------------
    // LOG SEKME BUTONLARI (CSV İndir & Temizle)
    // -------------------------------------------------------------
    const exportLogsBtn = document.getElementById('exportLogsCsvBtn');
    if (exportLogsBtn) {
      exportLogsBtn.addEventListener('click', () => {
        if (window.logManager) {
          window.logManager.exportCsv();
          this.showToast('Satış ve Teklif Logları CSV olarak indirildi! 📥');
        }
      });
    }

    const clearLogsBtn = document.getElementById('clearAllLogsBtn');
    if (clearLogsBtn) {
      clearLogsBtn.addEventListener('click', () => {
        if (confirm('Tüm geçmiş satış ve teklif loglarını silmek istediğinize emin misiniz?')) {
          if (window.logManager) {
            window.logManager.clearAll();
            this.showToast('Tüm log geçmişi temizlendi.');
          }
        }
      });
    }

    // Log Filtreleme Butonları
    document.querySelectorAll('.log-filter-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.log-filter-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        if (window.logManager) {
          window.logManager.activeFilter = tab.getAttribute('data-filter');
          window.logManager.renderUI();
        }
      });
    });

    const logSearchInput = document.getElementById('logSearchInput');
    if (logSearchInput) {
      logSearchInput.addEventListener('input', (e) => {
        if (window.logManager) {
          window.logManager.searchTerm = e.target.value;
          window.logManager.renderUI();
        }
      });
    }

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

    // Google Sheets Senkronizasyon Butonları (Üst buton ve Stok Sekmesi alt kartı)
    const handleSheetsSync = async (customUrl = null) => {
      const url = customUrl || localStorage.getItem('sahavet_sheets_url');
      if (!url || !url.trim()) {
        alert('Lütfen önce Google Sheets CSV bağlantı linkinizi girip kaydedin.');
        return;
      }
      try {
        this.showToast('Google Sheets ile senkronize ediliyor... 🔄');
        await window.stockManager.syncGoogleSheets(url.trim());
        this.showToast('Stoklar Google Sheets ile başarıyla güncellendi! ✅');
      } catch (err) {
        alert('Sheets Senkronizasyon Hatası: ' + err.message);
      }
    };

    const syncTopBtn = document.getElementById('syncSheetsBtn');
    if (syncTopBtn) {
      syncTopBtn.addEventListener('click', () => handleSheetsSync());
    }

    // -------------------------------------------------------------
    // Stok Sekmesi Altında Kilitli Sheets Linki Yönetimi
    // -------------------------------------------------------------
    const stockUrlInput = document.getElementById('stockTabSheetsUrlInput');
    const toggleLockBtn = document.getElementById('toggleStockUrlLockBtn');
    const lockIcon = document.getElementById('stockUrlLockIcon');
    const lockText = document.getElementById('stockUrlLockText');
    const lockHint = document.getElementById('stockUrlLockHint');
    const saveStockUrlBtn = document.getElementById('saveStockUrlBtn');
    const syncStockTabBtn = document.getElementById('syncStockTabSheetsBtn');

    // Başlangıç linkini yükle
    const initialSheetsUrl = localStorage.getItem('sahavet_sheets_url') || '';
    if (stockUrlInput) stockUrlInput.value = initialSheetsUrl;

    if (toggleLockBtn && stockUrlInput) {
      toggleLockBtn.addEventListener('click', () => {
        const isCurrentlyLocked = stockUrlInput.hasAttribute('readonly');
        if (isCurrentlyLocked) {
          // Kilidi Aç
          stockUrlInput.removeAttribute('readonly');
          stockUrlInput.focus();
          toggleLockBtn.classList.add('is-unlocked');
          lockIcon.textContent = '🔓';
          lockText.textContent = 'Kilitle & Kaydet';
          if (lockHint) lockHint.innerHTML = '✏️ <strong>Düzenleme modu açık.</strong> Linki girip "Kilitle & Kaydet"e basın.';
          if (saveStockUrlBtn) saveStockUrlBtn.style.display = 'inline-flex';
        } else {
          // Kilitle ve Kaydet
          const newUrl = stockUrlInput.value.trim();
          localStorage.setItem('sahavet_sheets_url', newUrl);
          const settingInput = document.getElementById('settingSheetsUrl');
          if (settingInput) settingInput.value = newUrl;

          stockUrlInput.setAttribute('readonly', 'true');
          toggleLockBtn.classList.remove('is-unlocked');
          lockIcon.textContent = '🔒';
          lockText.textContent = 'Kilidi Aç';
          if (lockHint) lockHint.textContent = '🔒 Link kilitlidir. Yanlışlıkla düzenlenmemesi için korunmaktadır.';
          if (saveStockUrlBtn) saveStockUrlBtn.style.display = 'none';
          this.showToast('Google Sheets linki kaydedildi ve kilitlendi! 🔒');
        }
      });
    }

    if (saveStockUrlBtn && stockUrlInput) {
      saveStockUrlBtn.addEventListener('click', () => {
        const newUrl = stockUrlInput.value.trim();
        localStorage.setItem('sahavet_sheets_url', newUrl);
        const settingInput = document.getElementById('settingSheetsUrl');
        if (settingInput) settingInput.value = newUrl;

        stockUrlInput.setAttribute('readonly', 'true');
        if (toggleLockBtn) {
          toggleLockBtn.classList.remove('is-unlocked');
          lockIcon.textContent = '🔒';
          lockText.textContent = 'Kilidi Aç';
        }
        if (lockHint) lockHint.textContent = '🔒 Link kilitlidir. Yanlışlıkla düzenlenmemesi için korunmaktadır.';
        saveStockUrlBtn.style.display = 'none';
        this.showToast('Google Sheets linki kaydedildi ve kilitlendi! 💾');
      });
    }

    if (syncStockTabBtn) {
      syncStockTabBtn.addEventListener('click', () => {
        const url = (stockUrlInput ? stockUrlInput.value : null) || localStorage.getItem('sahavet_sheets_url');
        handleSheetsSync(url);
      });
    }

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
        const vatLabel = document.getElementById('vatRateLabel');
        if (vatLabel) vatLabel.textContent = `KDV Oranı: %${this.vatRate}`;
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
    const allItems = [];
    const summaryParts = [];

    // İlaçlar
    calc.finalCartItems.forEach(ci => {
      allItems.push({
        name: ci.name,
        qty: ci.qty,
        unitPrice: ci.unitPrice,
        total: ci.total
      });
      summaryParts.push(`${ci.qty}x ${ci.name}`);
    });

    // Parametreler (Görünür olanlar + 'Diğer Giderler')
    calc.breakdown.visibleItems.forEach(vi => {
      allItems.push({
        name: vi.name,
        qty: vi.qty,
        unitPrice: vi.unitPrice,
        total: vi.total
      });
      summaryParts.push(vi.name);
    });

    return {
      mode: this.mode,
      customer: this.customerName,
      itemsSummary: summaryParts.join(', '),
      allItems,
      distanceKm: calc.effectiveKm,
      distanceTotal: calc.distanceTotal,
      subTotal: calc.subTotal,
      isVatEnabled: calc.isVatEnabled,
      vatRate: calc.vatRate,
      vatAmount: calc.vatAmount,
      grandTotal: calc.grandTotal,
      distributedExpense: calc.isDistributing
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

  /**
   * İşlemi Onayla / Tamamla (Stok Düşme ve Log Kaydetme)
   */
  finalizeTransaction(receiptData) {
    // 1. Eğer Uygulanan Tedavi ise stoktan düş
    if (this.mode === 'treatment') {
      let deductedCount = 0;
      this.cart.forEach(ci => {
        const prod = window.stockManager.get(ci.item.id);
        if (prod) {
          prod.currentStock = Math.max(0, (parseInt(prod.currentStock) || 0) - ci.qty);
          deductedCount++;
        }
      });

      if (deductedCount > 0 && window.stockManager) {
        window.stockManager.saveInventory();
        window.stockManager.renderUI();
      }
    }

    // 2. Log Modülüne Kaydet
    if (window.logManager) {
      window.logManager.addLog(receiptData);
    }

    // 3. Kullanıcıya bildirim
    if (this.mode === 'treatment') {
      this.showToast('✅ Tedavi tamamlandı, stoklar güncellendi ve log kaydedildi!');
    } else {
      this.showToast('📄 Fiyat teklifi arşive kaydedildi (stoklar korundu).');
    }
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
    const quickDist = document.getElementById('quickDistributeToggle');
    if (quickDist && window.paramManager) {
      quickDist.checked = window.paramManager.distributeFixedExpense;
    }
    this.renderCart();
    this.recalculate();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.app = new AppController();
});
