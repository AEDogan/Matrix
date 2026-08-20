/**
 * VetAssist - Ana Uygulama Kontrolcüsü (app.js)
 * Sepet yönetimi, canlı hesaplama (kârsız yalın sabit gider dağıtımı),
 * İşlem modu seçimi (Uygulanan Tedavi vs. Fiyat Teklifi), stoktan düşme & loglama,
 * Çoklu Dil Desteği (Türkçe & İngilizce).
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
    // 1. Dil başlatma
    if (window.i18n) {
      window.i18n.translateDOM();
      const langSelect = document.getElementById('settingLanguage');
      if (langSelect) {
        langSelect.value = window.i18n.getLanguage();
      }
    }

    // 2. Kayıtlı KDV ayarını yükle
    const savedVat = localStorage.getItem('vetassist_vat_rate') || localStorage.getItem('sahavet_vat_rate');
    if (savedVat) this.vatRate = parseFloat(savedVat) || 18;
    const vatLabel = document.getElementById('vatRateLabel');
    if (vatLabel) {
      vatLabel.textContent = window.i18n ? window.i18n.t('vat_rate_label', { rate: this.vatRate }) : `KDV Oranı: %${this.vatRate}`;
    }

    // 3. Modülleri başlat
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
        .then(() => console.log('VetAssist Service Worker Aktif (Offline Desteği Hazır)'))
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

    const isEn = window.i18n && window.i18n.getLanguage() === 'en';
    const updateStatus = () => {
      if (navigator.onLine) {
        badge.innerHTML = isEn ? '🟢 Online (Sheets Sync Ready)' : '🟢 Çevrimiçi (Sheets Senkronizasyonu Hazır)';
        badge.style.color = 'var(--success)';
      } else {
        badge.innerHTML = isEn ? '🟡 Offline Field Mode (Local Storage Active)' : '🟡 Çevrimdışı Saha Modu (Yerel Hafıza Aktif)';
        badge.style.color = 'var(--accent-amber)';
      }
    };

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    updateStatus();
  }

  onLanguageChanged() {
    const langSelect = document.getElementById('settingLanguage');
    if (langSelect && window.i18n) {
      langSelect.value = window.i18n.getLanguage();
    }
    this.checkNetworkStatus();
    this.setMode(this.mode);
    this.renderCart();
    this.recalculate();
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
          : '📄 <strong>Fiyat Teklifi / Bilgilendirme:</strong> İlaç stoklarına dokunulmaz, sadece müşteriye bilgilendirme amaçlı teklif dökümü sunulur.';
      }
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
    
    if (window.i18n) {
      this.showToast(window.i18n.t('toast_added_to_cart', { name: product.name, qty: qty }));
    } else {
      this.showToast(`"${product.name}" (${qty} adet) eklendi`);
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
    const isEn = window.i18n && window.i18n.getLanguage() === 'en';

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

      const isCritical = (parseInt(ci.item.currentStock) || 0) <= (parseInt(item_min(ci.item))) || 0;

      const card = document.createElement('div');
      card.className = 'cart-item-card';
      card.innerHTML = `
        <div class="cart-item-top">
          <div>
            <div class="cart-item-name">${ci.item.name}</div>
            <div class="cart-item-cost-info">
              ${isEn ? 'Cost:' : 'Maliyet:'} ${ci.item.unitCost.toFixed(2)} TL | ${isEn ? 'Markup:' : 'Kâr:'} %${profitMargin}
              ${isDistributing && addedExpense > 0 ? `<span class="badge-masked" title="${isEn ? `+${addedExpense.toFixed(2)} TL overhead absorbed` : `Sabit giderden ${addedExpense.toFixed(2)} TL giydirildi`}">${isEn ? `+${addedExpense.toFixed(2)} TL Overhead` : `+${addedExpense.toFixed(2)} TL Gider`}</span>` : ''}
              ${isCritical ? `<span class="badge-alert" style="margin-left:4px;">🚨 ${isEn ? 'Low Stock:' : 'Kritik Stok:'} ${ci.item.currentStock}</span>` : ''}
            </div>
          </div>
          <button class="btn-remove-item" data-id="${ci.item.id}" title="${isEn ? 'Remove item' : 'Listeden çıkar'}">✕</button>
        </div>

        <div class="cart-item-bottom">
          <div class="qty-stepper">
            <button class="btn-step step-minus" data-id="${ci.item.id}">−</button>
            <span class="qty-input">${ci.qty}</span>
            <button class="btn-step step-plus" data-id="${ci.item.id}">+</button>
          </div>

          <div class="cart-item-price-box">
            <span class="cart-unit-price">${isEn ? 'Unit:' : 'Birim:'} ${displayUnitPrice.toFixed(2)} TL</span>
            <strong class="cart-line-total text-mono">${displayLineTotal.toFixed(2)} TL</strong>
          </div>
        </div>
      `;

      cartList.appendChild(card);
    });

    // Stepper & Remove Events
    cartList.querySelectorAll('.step-minus').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.getAttribute('data-id');
        this.updateCartQty(id, -1);
      });
    });

    cartList.querySelectorAll('.step-plus').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.getAttribute('data-id');
        this.updateCartQty(id, 1);
      });
    });

    cartList.querySelectorAll('.btn-remove-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.getAttribute('data-id');
        this.removeFromCart(id);
      });
    });
  }

  // Canlı Hesaplama Motoru
  recalculate() {
    const isEn = window.i18n && window.i18n.getLanguage() === 'en';
    const profitMargin = window.paramManager ? window.paramManager.getProfitMargin() : 25;
    const isDistributing = window.paramManager ? window.paramManager.distributeFixedExpense : false;
    const fixedClinicFee = window.paramManager ? window.paramManager.getFixedClinicFee() : 0;
    const kmRate = window.paramManager ? window.paramManager.getKmRate() : 25;

    // 1. İlaç Kalemleri Toplamı
    let rawItemsCost = 0;
    let baseItemsWithProfitTotal = 0;
    const finalCartItems = [];

    this.cart.forEach(ci => {
      const baseLineCost = ci.item.unitCost * ci.qty;
      const baseLinePrice = baseLineCost * (1 + (profitMargin / 100));
      rawItemsCost += baseLineCost;
      baseItemsWithProfitTotal += baseLinePrice;
    });

    // 2. Eğer sabit gider dağıtılıyorsa ve sepette ürün varsa:
    this.cart.forEach(ci => {
      const basePrice = ci.item.unitCost * (1 + (profitMargin / 100));
      const lineBase = basePrice * ci.qty;
      let finalLineTotal = lineBase;
      let finalUnitPrice = basePrice;
      let addedShare = 0;

      if (isDistributing && baseItemsWithProfitTotal > 0 && fixedClinicFee > 0) {
        const share = lineBase / baseItemsWithProfitTotal;
        addedShare = fixedClinicFee * share;
        finalLineTotal = lineBase + addedShare;
        finalUnitPrice = finalLineTotal / ci.qty;
      }

      finalCartItems.push({
        id: ci.item.id,
        name: ci.item.name,
        qty: ci.qty,
        unitCost: ci.item.unitCost,
        baseUnitPrice: basePrice,
        unitPrice: finalUnitPrice,
        total: finalLineTotal,
        addedExpense: addedShare
      });
    });

    // Sepet Kalemleri Toplamı (Dağıtılmış tutar dahil veya hariç)
    const itemsTotal = finalCartItems.reduce((s, ci) => s + ci.total, 0);

    // 3. Mesafe Hesabı
    const effectiveKm = this.isDistanceEnabled ? this.distanceKm : 0;
    const distanceTotal = effectiveKm * kmRate;

    // 4. Parametre Dökümü (Görünür olanlar + 'Diğer Giderler')
    const hasCartItems = this.cart.length > 0;
    const breakdown = window.paramManager 
      ? window.paramManager.calculateBreakdown(itemsTotal, effectiveKm, hasCartItems)
      : { visibleItems: [], maskedTotal: 0, totalAdditionalCost: 0, isDistributing: false };

    // 5. Ara Toplam (Net)
    const subTotal = itemsTotal + (this.isDistanceEnabled ? 0 : 0) + (breakdown.totalAdditionalCost - (this.isDistanceEnabled ? effectiveKm * kmRate : 0) + (this.isDistanceEnabled ? distanceTotal : 0));

    // 6. KDV Hesabı
    const vatAmount = this.isVatEnabled ? subTotal * (this.vatRate / 100) : 0;
    const grandTotal = subTotal + vatAmount;

    // UI Güncelleme
    const distNotice = document.getElementById('distributedExpenseNotice');
    const distContent = document.getElementById('distNoticeContent');
    const distAmount = document.getElementById('distNoticeAmount');
    if (distNotice) {
      if (isDistributing && hasCartItems && fixedClinicFee > 0) {
        distNotice.style.display = 'flex';
        if (distAmount) distAmount.textContent = `${fixedClinicFee.toFixed(2)} TL`;
        if (distContent && window.i18n) {
          distContent.innerHTML = window.i18n.t('distribute_notice_text', { amount: `<strong>${fixedClinicFee.toFixed(2)} TL</strong>` });
        }
      } else {
        distNotice.style.display = 'none';
      }
    }

    const distDisplay = document.getElementById('distanceTotalDisplay');
    if (distDisplay) distDisplay.textContent = `${distanceTotal.toFixed(2)} TL`;

    const summaryItems = document.getElementById('summaryItemsTotal');
    if (summaryItems) summaryItems.textContent = `${itemsTotal.toFixed(2)} TL`;

    const summaryDistRow = document.getElementById('summaryDistanceRow');
    const summaryDistTotal = document.getElementById('summaryDistanceTotal');
    if (summaryDistRow && summaryDistTotal) {
      if (this.isDistanceEnabled && effectiveKm > 0) {
        summaryDistRow.style.display = 'flex';
        summaryDistTotal.textContent = `${distanceTotal.toFixed(2)} TL`;
      } else {
        summaryDistRow.style.display = 'none';
      }
    }

    // Diğer Parametreler Satırı
    const otherParamsRow = document.getElementById('summaryOtherParamsRow');
    const otherParamsTotal = document.getElementById('summaryOtherParamsTotal');
    const otherParamsLabel = document.getElementById('summaryOtherParamsLabel');
    const otherCost = breakdown.totalAdditionalCost - distanceTotal;

    if (otherParamsRow && otherParamsTotal) {
      if (otherCost > 0) {
        otherParamsRow.style.display = 'flex';
        otherParamsTotal.textContent = `${otherCost.toFixed(2)} TL`;
        if (otherParamsLabel) {
          otherParamsLabel.textContent = isEn ? 'Other Services & Supplies:' : 'Diğer Hizmet ve Sarf Bedelleri:';
        }
      } else {
        otherParamsRow.style.display = 'none';
      }
    }

    const summarySub = document.getElementById('summarySubTotal');
    if (summarySub) summarySub.textContent = `${subTotal.toFixed(2)} TL`;

    const summaryVatRow = document.getElementById('summaryVatRow');
    const summaryVat = document.getElementById('summaryVatTotal');
    if (summaryVatRow && summaryVat) {
      if (this.isVatEnabled) {
        summaryVatRow.style.display = 'flex';
        summaryVat.textContent = `${vatAmount.toFixed(2)} TL`;
      } else {
        summaryVatRow.style.display = 'none';
      }
    }

    const summaryGrand = document.getElementById('summaryGrandTotal');
    if (summaryGrand) summaryGrand.textContent = `${grandTotal.toFixed(2)} TL`;

    const vatLabel = document.getElementById('vatRateLabel');
    if (vatLabel) {
      vatLabel.textContent = isEn ? `VAT Rate: %${this.vatRate}` : `KDV Oranı: %${this.vatRate}`;
    }

    return {
      finalCartItems,
      itemsTotal,
      effectiveKm,
      distanceTotal,
      breakdown,
      subTotal,
      isVatEnabled: this.isVatEnabled,
      vatRate: this.vatRate,
      vatAmount,
      grandTotal,
      isDistributing: isDistributing && hasCartItems
    };
  }

  // Event Bağlantıları
  bindEvents() {
    const isEn = () => window.i18n && window.i18n.getLanguage() === 'en';

    // Sekmeler Arası Geçiş
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        
        tab.classList.add('active');
        const target = tab.getAttribute('data-target');
        const targetPane = document.getElementById(target);
        if (targetPane) targetPane.classList.add('active');

        // Sekme açıldığında UI yenile
        if (target === 'tab-stock' && window.stockManager) window.stockManager.renderUI();
        if (target === 'tab-logs' && window.logManager) window.logManager.renderUI();
        if (target === 'tab-params' && window.paramManager) window.paramManager.renderUI();
      });
    });

    // İşlem Modu Butonları (Tedavi vs Teklif)
    document.getElementById('modeBtnTreatment').addEventListener('click', () => this.setMode('treatment'));
    document.getElementById('modeBtnQuote').addEventListener('click', () => this.setMode('quote'));

    // Müşteri / Çiftlik İsmi
    const custInput = document.getElementById('calcCustomerInput');
    if (custInput) {
      custInput.addEventListener('input', (e) => {
        this.customerName = e.target.value.trim();
      });
    }

    // Tema Değiştirici (Güneş Işığı / Koyu Saha)
    document.getElementById('themeToggleBtn').addEventListener('click', () => {
      document.body.classList.toggle('theme-dark');
      const isDark = document.body.classList.contains('theme-dark');
      document.getElementById('themeIcon').textContent = isDark ? '🌙' : '☀️';
      if (window.i18n) {
        this.showToast(isDark ? window.i18n.t('theme_dark_active') : window.i18n.t('theme_light_active'));
      } else {
        this.showToast(isDark ? 'Koyu Saha Teması Aktif 🌙' : 'Güneş Işığı (Yüksek Kontrast) Teması Aktif ☀️');
      }
    });

    // Dil Seçimi Dropdown (Ayarlar Sekmesi)
    const langSelect = document.getElementById('settingLanguage');
    if (langSelect) {
      langSelect.addEventListener('change', (e) => {
        const selectedLang = e.target.value;
        if (window.i18n) {
          window.i18n.setLanguage(selectedLang);
          this.showToast(selectedLang === 'en' ? 'Language switched to English! 🇬🇧' : 'Uygulama dili Türkçe olarak güncellendi! 🇹🇷');
        }
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
                  <div class="autocomplete-name">${item.name}</div>
                  <div class="autocomplete-meta">
                    ${isEn() ? 'Cost:' : 'Maliyet:'} ${item.unitCost.toFixed(2)} TL | ${isEn() ? 'Stock:' : 'Stok:'} ${item.currentStock}
                    ${isCritical ? `<span class="badge-alert" style="margin-left:4px;">🚨 ${isEn() ? 'Low Stock' : 'Kritik'}</span>` : ''}
                  </div>
                </div>
                <div class="autocomplete-price">${salePrice.toFixed(2)} TL</div>
              </div>
            `;
          }).join('');
          autoDropdown.style.display = 'block';

          autoDropdown.querySelectorAll('.autocomplete-item').forEach(itemEl => {
            itemEl.addEventListener('click', () => {
              const id = itemEl.getAttribute('data-id');
              const prod = window.stockManager.get(id);
              if (prod) {
                this.addToCart(prod, 1);
                searchInput.value = '';
                clearSearchBtn.style.display = 'none';
                autoDropdown.style.display = 'none';
              }
            });
          });
        } else {
          autoDropdown.innerHTML = `<div class="autocomplete-empty">${isEn() ? 'No products found' : 'Eşleşen ilaç bulunamadı'}</div>`;
          autoDropdown.style.display = 'block';
        }
      } else {
        clearSearchBtn.style.display = 'none';
        autoDropdown.style.display = 'none';
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

    // Hızlı Gider Dağıtımı Toggle (Hesaplama Sekmesi)
    const quickDist = document.getElementById('quickDistributeToggle');
    if (quickDist) {
      quickDist.addEventListener('change', (e) => {
        if (window.paramManager) {
          window.paramManager.setDistributeFixedExpense(e.target.checked);
          this.renderCart();
          this.recalculate();
        }
      });
    }

    // KDV / Fatura Toggle
    document.getElementById('vatToggle').addEventListener('change', (e) => {
      this.isVatEnabled = e.target.checked;
      this.recalculate();
    });

    // Sepeti Temizle
    document.getElementById('clearCartBtn').addEventListener('click', () => {
      const confirmMsg = isEn() ? 'Are you sure you want to clear all items from the cart?' : 'Tüm seçili kalemleri listeden temizlemek istediğinize emin misiniz?';
      if (confirm(confirmMsg)) {
        this.clearCart();
        this.showToast(isEn() ? 'Cart cleared' : 'Tüm seçili kalemler temizlendi');
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
      this.showToast(isEn() ? 'Visual receipt (JPG) downloaded to your device! 📥' : 'Görsel adisyon (JPG) cihazınıza indirildi! 📥');
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
        this.showToast(isEn() ? 'Receipt text copied to clipboard! 📋' : 'Adisyon metni panoya kopyalandı! 📋');
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
          this.showToast(isEn() ? 'Sales & Quote logs exported to CSV! 📥' : 'Satış ve Teklif Logları CSV olarak indirildi! 📥');
        }
      });
    }

    const clearLogsBtn = document.getElementById('clearAllLogsBtn');
    if (clearLogsBtn) {
      clearLogsBtn.addEventListener('click', () => {
        if (confirm(isEn() ? 'Are you sure you want to delete all transaction and quote logs?' : 'Tüm geçmiş satış ve teklif loglarını silmek istediğinize emin misiniz?')) {
          if (window.logManager) {
            window.logManager.clearAll();
            this.showToast(isEn() ? 'All log history cleared.' : 'Tüm log geçmişi temizlendi.');
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
        category: document.getElementById('editProdCategory').value || (isEn() ? 'General' : 'Genel'),
        currentStock: parseInt(document.getElementById('editProdStock').value) || 0,
        minStock: parseInt(document.getElementById('editProdMinStock').value) || 0
      };

      if (id && id !== '-1') {
        window.stockManager.updateItem(id, data);
        this.showToast(isEn() ? 'Product updated successfully' : 'Ürün başarıyla güncellendi');
      } else {
        window.stockManager.addItem(data);
        this.showToast(isEn() ? 'New product added' : 'Yeni ürün eklendi');
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
      this.showToast(isEn() ? 'New cost parameter added' : 'Yeni maliyet kalemi eklendi');
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

    // Google Sheets Senkronizasyon Butonları
    const handleSheetsSync = async (customUrl = null) => {
      const url = customUrl || localStorage.getItem('vetassist_sheets_url') || localStorage.getItem('sahavet_sheets_url');
      if (!url || !url.trim()) {
        alert(isEn() ? 'Please configure your Google Sheets published CSV URL first.' : 'Lütfen önce Google Sheets CSV bağlantı linkinizi girip kaydedin.');
        return;
      }
      try {
        this.showToast(isEn() ? 'Syncing with Google Sheets... 🔄' : 'Google Sheets ile senkronize ediliyor... 🔄');
        const count = await window.stockManager.syncGoogleSheets(url.trim());
        this.showToast(isEn() ? `Stock successfully updated from Google Sheets! (${count} items) ✅` : `Stoklar Google Sheets ile başarıyla güncellendi! (${count} ürün) ✅`);
      } catch (err) {
        alert((isEn() ? 'Sheets Sync Error: ' : 'Sheets Senkronizasyon Hatası: ') + err.message);
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
    const initialSheetsUrl = localStorage.getItem('vetassist_sheets_url') || localStorage.getItem('sahavet_sheets_url') || '';
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
          lockText.textContent = isEn() ? 'Lock & Save' : 'Kilitle & Kaydet';
          if (lockHint) lockHint.innerHTML = isEn ? '✏️ <strong>Edit mode active.</strong> Paste link and click "Lock & Save".' : '✏️ <strong>Düzenleme modu açık.</strong> Linki girip "Kilitle & Kaydet"e basın.';
          if (saveStockUrlBtn) saveStockUrlBtn.style.display = 'inline-flex';
        } else {
          // Kilitle ve Kaydet
          const newUrl = stockUrlInput.value.trim();
          localStorage.setItem('vetassist_sheets_url', newUrl);
          localStorage.setItem('sahavet_sheets_url', newUrl);
          const settingInput = document.getElementById('settingSheetsUrl');
          if (settingInput) settingInput.value = newUrl;

          stockUrlInput.setAttribute('readonly', 'true');
          toggleLockBtn.classList.remove('is-unlocked');
          lockIcon.textContent = '🔒';
          lockText.textContent = isEn() ? 'Unlock' : 'Kilidi Aç';
          if (lockHint) lockHint.textContent = isEn ? '🔒 URL is locked to prevent accidental modifications.' : '🔒 Link kilitlidir. Yanlışlıkla düzenlenmemesi için korunmaktadır.';
          if (saveStockUrlBtn) saveStockUrlBtn.style.display = 'none';
          this.showToast(isEn() ? 'Google Sheets URL saved and locked! 🔒' : 'Google Sheets linki kaydedildi ve kilitlendi! 🔒');
        }
      });
    }

    if (saveStockUrlBtn && stockUrlInput) {
      saveStockUrlBtn.addEventListener('click', () => {
        const newUrl = stockUrlInput.value.trim();
        localStorage.setItem('vetassist_sheets_url', newUrl);
        localStorage.setItem('sahavet_sheets_url', newUrl);
        const settingInput = document.getElementById('settingSheetsUrl');
        if (settingInput) settingInput.value = newUrl;

        stockUrlInput.setAttribute('readonly', 'true');
        if (toggleLockBtn) {
          toggleLockBtn.classList.remove('is-unlocked');
          lockIcon.textContent = '🔒';
          lockText.textContent = isEn() ? 'Unlock' : 'Kilidi Aç';
        }
        if (lockHint) lockHint.textContent = isEn ? '🔒 URL is locked to prevent accidental modifications.' : '🔒 Link kilitlidir. Yanlışlıkla düzenlenmemesi için korunmaktadır.';
        saveStockUrlBtn.style.display = 'none';
        this.showToast(isEn() ? 'Google Sheets URL saved! 💾' : 'Google Sheets linki kaydedildi! 💾');
      });
    }

    if (syncStockTabBtn) {
      syncStockTabBtn.addEventListener('click', () => {
        const url = (stockUrlInput ? stockUrlInput.value : null) || localStorage.getItem('vetassist_sheets_url') || localStorage.getItem('sahavet_sheets_url');
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
              this.showToast(isEn() ? `${count} products imported from CSV!` : `${count} adet ürün CSV dosyasından yüklendi!`);
            } catch (err) {
              alert((isEn() ? 'CSV Reading Error: ' : 'CSV Okuma Hatası: ') + err.message);
            }
          };
          reader.readAsText(file);
        }
      });
    }

    // CSV Dışa Aktar
    document.getElementById('exportCsvBtn').addEventListener('click', () => {
      window.stockManager.exportCsv();
      this.showToast(isEn() ? 'CSV file downloaded' : 'CSV dosyası indirildi');
    });

    // Örnek Veri Yükle
    document.getElementById('loadSampleDataBtn').addEventListener('click', () => {
      if (confirm(isEn() ? 'Reset inventory to sample veterinary products?' : 'Mevcut liste örnek veteriner ürünleriyle güncellensin mi?')) {
        window.stockManager.resetToInitial();
        this.showToast(isEn() ? 'Sample products loaded' : 'Örnek ürünler yüklendi');
      }
    });

    // -------------------------------------------------------------
    // Ayarlar Formu
    // -------------------------------------------------------------
    const clinicForm = document.getElementById('clinicSettingsForm');
    if (clinicForm) {
      const info = window.receiptGenerator ? window.receiptGenerator.getClinicInfo() : {};
      document.getElementById('settingClinicName').value = info.title || (isEn() ? 'VETERINARY SERVICE DETAILS' : 'VETERİNER HİZMET DETAYI');
      document.getElementById('settingBankName').value = info.bank || 'Ziraat Bankası';
      document.getElementById('settingIban').value = info.iban || 'TR12 0001 0002 0003 0004 0005 06';
      document.getElementById('settingAddress').value = info.address || 'Kamçıllı, Mandıra Sokak No 12, 10085 Karesi/Balıkesir';
      document.getElementById('settingPhone').value = info.phone || '0552 185 03 08';
      document.getElementById('settingVatRate').value = info.vatRate || 18;
      document.getElementById('settingSheetsUrl').value = localStorage.getItem('vetassist_sheets_url') || localStorage.getItem('sahavet_sheets_url') || '';

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
        
        const newUrl = document.getElementById('settingSheetsUrl').value;
        localStorage.setItem('vetassist_sheets_url', newUrl);
        localStorage.setItem('sahavet_sheets_url', newUrl);
        
        if (stockUrlInput) stockUrlInput.value = newUrl;

        this.vatRate = updated.vatRate;
        const vatLabel = document.getElementById('vatRateLabel');
        if (vatLabel) {
          vatLabel.textContent = isEn() ? `VAT Rate: %${this.vatRate}` : `KDV Oranı: %${this.vatRate}`;
        }
        this.recalculate();
        this.showToast(isEn() ? 'Settings saved successfully! 💾' : 'Ayarlar başarıyla kaydedildi! 💾');
      });

      document.getElementById('resetDefaultsBtn').addEventListener('click', () => {
        if (confirm(isEn() ? 'Reset all parameters and settings to factory defaults?' : 'Tüm parametreler ve ayarlar fabrika ayarlarına döndürülsün mü?')) {
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
    const isEn = window.i18n && window.i18n.getLanguage() === 'en';
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
            ${isCritical ? `<span class="badge-alert" style="margin-left:4px;">🚨 ${isEn ? 'Stock:' : 'Stok:'} ${item.currentStock}</span>` : ''}
          </div>
          <div class="batch-item-meta">${isEn ? 'Unit Price:' : 'Birim:'} ${salePrice.toFixed(2)} TL (${item.category || (isEn ? 'General' : 'Genel')})</div>
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
    const isEn = window.i18n && window.i18n.getLanguage() === 'en';
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
      this.showToast(isEn ? `${count} different items added to cart! 🛒` : `${count} farklı kalem sepete eklendi! 🛒`);
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
    const isEn = window.i18n && window.i18n.getLanguage() === 'en';
    if (this.cart.length === 0 && this.distanceKm === 0) {
      alert(isEn ? 'To create a receipt, please select at least one item or enter distance (KM).' : 'Adisyon oluşturmak için lütfen en az bir ilaç/malzeme seçin veya mesafe (KM) girin.');
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
    const isEn = window.i18n && window.i18n.getLanguage() === 'en';

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
      this.showToast(isEn ? '✅ Treatment finalized, stock updated and record logged!' : '✅ Tedavi tamamlandı, stoklar güncellendi ve log kaydedildi!');
    } else {
      this.showToast(isEn ? '📄 Price quote archived (stock remained unchanged).' : '📄 Fiyat teklifi arşive kaydedildi (stoklar korundu).');
    }
  }

  // Ürün Düzenleme / Ekleme Modal
  openProductEditModal(item = null) {
    const isEn = window.i18n && window.i18n.getLanguage() === 'en';
    const modal = document.getElementById('productEditModal');
    const title = document.getElementById('productModalTitle');
    const indexInput = document.getElementById('editProductIndex');

    if (item) {
      title.textContent = isEn ? '✏️ Edit Product / Medication' : '✏️ Ürün / Malzeme Düzenle';
      indexInput.value = item.id;
      document.getElementById('editProdName').value = item.name;
      document.getElementById('editProdCost').value = item.unitCost;
      document.getElementById('editProdCategory').value = item.category || '';
      document.getElementById('editProdStock').value = item.currentStock;
      document.getElementById('editProdMinStock').value = item.minStock;
    } else {
      title.textContent = isEn ? '➕ Add New Medication / Supply' : '➕ Yeni İlaç / Malzeme Ekle';
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

function item_min(item) {
  return item && item.minStock !== undefined ? item.minStock : 0;
}

window.addEventListener('DOMContentLoaded', () => {
  window.app = new AppController();
});
