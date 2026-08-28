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

    this.renderPresets();
    this.bindEvents();
    this.recalculate();
    this.checkNetworkStatus();
    this.registerServiceWorker();
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
      const saved = localStorage.getItem(this.presetsKey);
      if (saved) return JSON.parse(saved);
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
          <span class="preset-item-sub">${item.category || ''} • ${parseFloat(item.unitCost !== undefined ? item.unitCost : (item.cost || 0)).toFixed(2)} TL</span>
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
      card.innerHTML = `
        <div class="cart-item-header">
          <div>
            <div class="cart-item-title">${ci.item.name}</div>
            <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">
              ${isEn ? 'Unit:' : 'Birim:'} <span class="text-mono text-bold">${unitSellingPrice.toFixed(2)} TL</span>
              <span style="font-size:0.7rem; opacity:0.8;">(${isEn ? 'Cost:' : 'Mal:'} ${itemCost.toFixed(2)} TL)</span>
            </div>
          </div>
          <div class="cart-item-total">${totalItemPrice.toFixed(2)} TL</div>
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
        if (distContent) {
          distContent.innerHTML = isEn 
            ? `💡 <strong>Fixed Clinic Overhead (${fixedFee.toFixed(2)} TL)</strong> is distributed into items without extra markup.`
            : `💡 <strong>Sabit Klinik Bedeli (${fixedFee.toFixed(2)} TL)</strong> ilaç kalemlerine kârsız olarak orantılı dağıtıldı.`;
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

    if (sumItemsEl) sumItemsEl.textContent = `${itemsSellingTotal.toFixed(2)} TL`;
    if (distDisplay) distDisplay.textContent = `${distanceTotal.toFixed(2)} TL`;

    if (this.distanceKm > 0 && sumDistRow && sumDistEl) {
      sumDistRow.style.display = 'flex';
      sumDistEl.textContent = `${distanceTotal.toFixed(2)} TL`;
    } else if (sumDistRow) {
      sumDistRow.style.display = 'none';
    }

    if (sumSubEl) sumSubEl.textContent = `${subTotal.toFixed(2)} TL`;
    if (sumGrandEl) sumGrandEl.textContent = `${grandTotal.toFixed(2)} TL`;

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

    if (nameInput) nameInput.value = info.title;
    if (bankInput) bankInput.value = info.bank;
    if (ibanInput) ibanInput.value = info.iban;
    if (addrInput) addrInput.value = info.address;
    if (phoneInput) phoneInput.value = info.phone;
    if (vatInput) vatInput.value = info.vatRate;

    const savedUrl = localStorage.getItem('vetassist_sheets_url_v2') || '';
    if (sheetsUrlInput) sheetsUrlInput.value = savedUrl;
    if (stockSheetsInput) stockSheetsInput.value = savedUrl;

    if (distToggle && window.paramManager) {
      distToggle.checked = window.paramManager.distributeFixedExpense;
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
    localStorage.setItem('vetassist_sheets_url_v2', sheetsUrl);
    const stockSheetsInput = document.getElementById('stockTabSheetsUrlInput');
    if (stockSheetsInput) stockSheetsInput.value = sheetsUrl;

    this.showToast(window.i18n ? window.i18n.t('toast_settings_saved') : 'Ayarlar kaydedildi.');
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
      custInput.addEventListener('input', () => this.recalculate());
    }

    // 6. Quick Autocomplete Search
    const searchInput = document.getElementById('quickSearchInput');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const dropdown = document.getElementById('autocompleteDropdown');

    if (searchInput && dropdown) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim().toLowerCase();
        if (clearSearchBtn) clearSearchBtn.style.display = query ? 'block' : 'none';

        if (query.length === 0 || !window.stockManager) {
          dropdown.style.display = 'none';
          return;
        }

        const matches = window.stockManager.getAll().filter(item => 
          item.name.toLowerCase().includes(query) || (item.category && item.category.toLowerCase().includes(query))
        );

        if (matches.length === 0) {
          dropdown.style.display = 'none';
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
              <div class="autocomplete-item-sub">Stok: ${prod.currentStock} • Kat: ${prod.category}</div>
            </div>
            <div class="autocomplete-item-price">${sellPrice.toFixed(2)} TL</div>
          `;
          div.addEventListener('click', () => {
            this.addToCart(prod, 1);
            searchInput.value = '';
            dropdown.style.display = 'none';
            if (clearSearchBtn) clearSearchBtn.style.display = 'none';
          });
          dropdown.appendChild(div);
        });

        dropdown.style.display = 'block';
      });

      if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
          searchInput.value = '';
          dropdown.style.display = 'none';
          clearSearchBtn.style.display = 'none';
          searchInput.focus();
        });
      }

      document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
          dropdown.style.display = 'none';
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

    // 17. Clinic Settings Form Submit
    const clinicForm = document.getElementById('clinicSettingsForm');
    if (clinicForm) {
      clinicForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveClinicSettingsFromInputs();
      });
    }

    const langSelect = document.getElementById('settingLanguage');
    if (langSelect && window.i18n) {
      langSelect.addEventListener('change', (e) => {
        window.i18n.setLanguage(e.target.value);
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

    // Rewarded Ad - Developer Support Button
    const watchAdBtn = document.getElementById('btnWatchRewardedAd');
    if (watchAdBtn) {
      watchAdBtn.addEventListener('click', () => {
        if (window.AndroidBridge && typeof window.AndroidBridge.showRewardedAd === 'function') {
          window.AndroidBridge.showRewardedAd('support_developer');
        } else {
          this.showToast('🌟 VetAssist\'e desteğiniz için teşekkürler! Reklam mobil uygulamada aktiftir.');
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

    const loadSampleBtn = document.getElementById('loadSampleDataBtn');
    if (loadSampleBtn && window.stockManager) {
      loadSampleBtn.addEventListener('click', () => {
        const isEn = window.i18n && window.i18n.getLanguage() === 'en';
        if (confirm(isEn ? 'Load sample dataset?' : 'Örnek stok verisi yüklensin mi?')) {
          window.stockManager.resetToInitial();
          this.showToast(isEn ? 'Sample data loaded.' : 'Örnek veriler yüklendi.');
        }
      });
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

    // Sync Sheets btn in stock header
    const syncSheetsBtn = document.getElementById('syncSheetsBtn');
    if (syncSheetsBtn) {
      syncSheetsBtn.addEventListener('click', () => {
        this.triggerSheetsSyncWithRewardedAd();
      });
    }

    // Logs search & filter
    const logSearch = document.getElementById('logSearchInput');
    if (logSearch && window.logManager) {
      logSearch.addEventListener('input', (e) => {
        window.logManager.searchTerm = e.target.value.trim();
        window.logManager.renderUI();
      });
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

    const exportLogsBtn = document.getElementById('exportLogsCsvBtn');
    if (exportLogsBtn && window.logManager) {
      exportLogsBtn.addEventListener('click', () => {
        let csv = 'Tarih,Islem_Tipi,Musteri,Kalemler,Mesafe_KM,Net_Ara_Toplam,Genel_Toplam\n';
        window.logManager.getAll().forEach(l => {
          csv += `"${l.dateStr}","${l.modeLabel}","${l.customer}","${l.itemsSummary}",${l.distanceKm},${l.subTotal},${l.grandTotal}\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `VetAssist_Satis_Loglari_${new Date().toISOString().slice(0,10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
    }

    const clearLogsBtn = document.getElementById('clearAllLogsBtn');
    if (clearLogsBtn && window.logManager) {
      clearLogsBtn.addEventListener('click', () => {
        const isEn = window.i18n && window.i18n.getLanguage() === 'en';
        if (confirm(isEn ? 'Clear all history logs?' : 'Tüm satış ve teklif geçmişini temizlemek istediğinize emin misiniz?')) {
          window.logManager.clearAll();
          this.showToast(window.i18n ? window.i18n.t('toast_logs_cleared') : 'Tüm geçmiş temizlendi.');
        }
      });
    }
  }

  finalizeTransaction() {
    if (!this.currentReceiptData) return;

    // Tedavi Modundaysa Stoktan Düş
    if (this.mode === 'treatment' && window.stockManager) {
      this.cart.forEach(ci => {
        window.stockManager.adjustStock(ci.item.id, -ci.qty);
      });
    }

    // Loglara Kaydet
    if (window.logManager) {
      const itemsSummary = this.cart.map(ci => `${ci.qty}x ${ci.item.name}`).join(', ');
      window.logManager.addLog({
        mode: this.mode,
        customer: this.currentReceiptData.customer,
        items: this.currentReceiptData.allItems,
        itemsSummary: itemsSummary,
        distanceKm: this.distanceKm,
        distanceTotal: this.currentReceiptData.distanceTotal,
        subTotal: this.currentReceiptData.subTotal,
        isVatEnabled: this.currentReceiptData.isVatEnabled,
        vatRate: this.currentReceiptData.vatRate,
        vatAmount: this.currentReceiptData.vatAmount,
        grandTotal: this.currentReceiptData.grandTotal,
        distributedExpense: this.currentReceiptData.distributedExpense
      });
    }

    this.clearCart();
    this.distanceKm = 0;
    const distanceInput = document.getElementById('distanceKmInput');
    if (distanceInput) distanceInput.value = '0';
    const custInput = document.getElementById('calcCustomerInput');
    if (custInput) custInput.value = '';
    this.recalculate();

    this.showToast(window.i18n ? window.i18n.t('toast_whatsapp_opened') : 'İşlem tamamlandı ve kaydedildi.');
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
              <div style="font-size:0.72rem; color:var(--text-muted);">Maliyet: ${item.unitCost.toFixed(2)} TL • Stok: ${item.currentStock}</div>
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
    const lockBtn = document.getElementById('toggleStockUrlLockBtn');
    const input = document.getElementById('stockTabSheetsUrlInput');
    const hint = document.getElementById('stockUrlLockHint');
    const saveBtn = document.getElementById('saveStockUrlBtn');
    const syncBtn = document.getElementById('syncStockTabSheetsBtn');

    let isLocked = true;

    if (lockBtn && input) {
      lockBtn.addEventListener('click', () => {
        isLocked = !isLocked;
        input.readOnly = isLocked;
        if (isLocked) {
          document.getElementById('stockUrlLockIcon').textContent = '🔒';
          document.getElementById('stockUrlLockText').textContent = window.i18n ? window.i18n.t('lock_unlock_btn') : 'Kilidi Aç';
          if (hint) hint.textContent = window.i18n ? window.i18n.t('lock_hint_locked') : '🔒 Link kilitlidir.';
          if (saveBtn) saveBtn.style.display = 'none';
        } else {
          document.getElementById('stockUrlLockIcon').textContent = '🔓';
          document.getElementById('stockUrlLockText').textContent = window.i18n ? window.i18n.t('lock_locked_btn') : 'Kilitle';
          if (hint) hint.textContent = window.i18n ? window.i18n.t('lock_hint_unlocked') : '🔓 Link düzenlenebilir.';
          if (saveBtn) saveBtn.style.display = 'inline-block';
          input.focus();
        }
      });
    }

    if (saveBtn && input) {
      saveBtn.addEventListener('click', () => {
        const url = input.value.trim();
        localStorage.setItem('vetassist_sheets_url_v2', url);
        const settingsInput = document.getElementById('settingSheetsUrl');
        if (settingsInput) settingsInput.value = url;
        this.showToast(window.i18n ? window.i18n.t('toast_url_saved') : 'Link kaydedildi.');
        
        isLocked = true;
        input.readOnly = true;
        document.getElementById('stockUrlLockIcon').textContent = '🔒';
        document.getElementById('stockUrlLockText').textContent = window.i18n ? window.i18n.t('lock_unlock_btn') : 'Kilidi Aç';
        saveBtn.style.display = 'none';
      });
    }

    if (syncBtn) {
      syncBtn.addEventListener('click', () => {
        this.triggerSheetsSyncWithRewardedAd();
      });
    }
  }

  triggerSheetsSyncWithRewardedAd() {
    const input = document.getElementById('stockTabSheetsUrlInput');
    const url = (input ? input.value.trim() : '') || localStorage.getItem('vetassist_sheets_url_v2');
    if (!url) {
      alert(window.i18n ? window.i18n.t('sheets_sync_desc') : 'Lütfen önce geçerli bir Google Sheets CSV linki girin.');
      return;
    }

    if (window.AndroidBridge && typeof window.AndroidBridge.showRewardedAd === 'function') {
      const isEn = window.i18n && window.i18n.getLanguage() === 'en';
      const msg = isEn 
        ? '🎬 To synchronize your inventory with Google Sheets, please watch a short video ad. Would you like to proceed?'
        : '🎬 Google Sheets ile stok senkronizasyonu yapmak için kısa bir video reklam izlemeniz gerekmektedir. İzlemek istiyor musunuz?';
      
      if (confirm(msg)) {
        window.AndroidBridge.showRewardedAd('sync_google_sheets');
      }
    } else {
      // Browser or testing fallback
      if (window.stockManager) {
        window.stockManager.syncGoogleSheets(url)
          .then(count => this.showToast(`${count} ürün güncellendi.`))
          .catch(err => alert('Senkronizasyon Hatası: ' + err.message));
      }
    }
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
    const input = document.getElementById('stockTabSheetsUrlInput');
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
