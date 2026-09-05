/**
 * VetAssist - Stok & Envanter Yönetimi Modülü (stock.js)
 * Google Sheets CSV Senkronizasyonu, Offline Cache, Kritik Stok Alarmları, Çoklu Dil Desteği
 */

const INITIAL_INVENTORY = [
  { id: '1', name: 'Serum 500 ml (SF)', unitCost: 45.00, currentStock: 15, minStock: 5, category: 'Serum & Sıvılar' },
  { id: '2', name: 'Serum 500 ml (Dekstroz %5)', unitCost: 55.00, currentStock: 12, minStock: 4, category: 'Serum & Sıvılar' },
  { id: '3', name: 'Vitamin A-D3-E (100 ml)', unitCost: 120.00, currentStock: 2, minStock: 3, category: 'Vitamin & Mineral' },
  { id: '4', name: 'Enjektör 10cc (Adet)', unitCost: 2.50, currentStock: 50, minStock: 20, category: 'Sarf Malzeme' },
  { id: '5', name: 'Enjektör 20cc (Adet)', unitCost: 3.50, currentStock: 40, minStock: 15, category: 'Sarf Malzeme' },
  { id: '6', name: 'Kelebek Set 21G', unitCost: 4.00, currentStock: 30, minStock: 10, category: 'Sarf Malzeme' },
  { id: '7', name: 'Antibiyotik Enjeksiyon (100 ml)', unitCost: 250.00, currentStock: 6, minStock: 2, category: 'Antibiyotikler' },
  { id: '8', name: 'Ağrı Kesici & Antienflamatuar (50 ml)', unitCost: 180.00, currentStock: 8, minStock: 3, category: 'Antienflamatuar' },
  { id: '9', name: 'Doğum Takviye Jeli (Tüp)', unitCost: 90.00, currentStock: 1, minStock: 2, category: 'Doğum & Jinekoloji' },
  { id: '10', name: 'Antiparaziter Aşı (Doz)', unitCost: 75.00, currentStock: 25, minStock: 10, category: 'Aşı & Parazit' },
  { id: '11', name: 'Kuduz Aşısı (Doz)', unitCost: 110.00, currentStock: 18, minStock: 5, category: 'Aşı & Parazit' },
  { id: '12', name: 'Yara Bakım Spreyi (200 ml)', unitCost: 135.00, currentStock: 4, minStock: 2, category: 'Dermatoloji & Bakım' },
  { id: '13', name: 'Suni Tohumlama Kateteri', unitCost: 15.00, currentStock: 35, minStock: 10, category: 'Sarf Malzeme' },
  { id: '14', name: 'Meme İçi Tüp (Antibakteriyel)', unitCost: 65.00, currentStock: 3, minStock: 4, category: 'Meme Sağlığı' },
  { id: '15', name: 'Oral Rehidratasyon Tozu', unitCost: 30.00, currentStock: 20, minStock: 8, category: 'Sindirim Sistemi' }
];

class StockManager {
  constructor() {
    this.storageKey = 'vetassist_inventory_v2';
    this.inventory = this.loadInventory();
    this.activeFilter = 'all'; // 'all' | 'critical'
    this.activeCategory = 'all';
    this.searchTerm = '';
  }

  loadInventory() {
    try {
      const saved = localStorage.getItem(this.storageKey) || localStorage.getItem('sahavet_inventory_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(item => ({
            id: item.id || ('prod_' + Math.random().toString(36).substr(2, 9)),
            name: item.name || '',
            unitCost: parseFloat(item.unitCost !== undefined ? item.unitCost : (item.cost !== undefined ? item.cost : (item.price !== undefined ? item.price : 0))) || 0,
            currentStock: parseInt(item.currentStock) || 0,
            minStock: parseInt(item.minStock) || 0,
            category: item.category || 'Genel'
          }));
        }
      }
    } catch (e) {
      console.error('Envanter yüklenirken hata:', e);
    }
    return JSON.parse(JSON.stringify(INITIAL_INVENTORY));
  }

  saveInventory() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.inventory));
      this.updateKPIs();
      if (window.app && typeof window.app.onInventoryChanged === 'function') {
        window.app.onInventoryChanged();
      }
    } catch (e) {
      console.error('Envanter kaydedilirken hata:', e);
    }
  }

  getAll() {
    return this.inventory;
  }

  get(id) {
    return this.inventory.find(item => item.id === id);
  }

  getCategories() {
    const cats = new Set();
    this.inventory.forEach(item => {
      if (item.category) cats.add(item.category);
    });
    return Array.from(cats);
  }

  getCriticalCount() {
    return this.inventory.filter(item => (parseInt(item.currentStock) || 0) <= (parseInt(item.minStock) || 0)).length;
  }

  addItem(itemData) {
    const newItem = {
      id: 'prod_' + Date.now(),
      name: (itemData.name || '').trim(),
      unitCost: parseFloat(itemData.unitCost !== undefined ? itemData.unitCost : (itemData.cost !== undefined ? itemData.cost : 0)) || 0,
      currentStock: parseInt(itemData.currentStock) || 0,
      minStock: parseInt(itemData.minStock) || 0,
      category: itemData.category ? itemData.category.trim() : (window.i18n && window.i18n.getLanguage() === 'en' ? 'General' : 'Genel')
    };
    this.inventory.push(newItem);
    this.saveInventory();
    this.renderUI();
    return newItem;
  }

  updateItem(id, updates) {
    const index = this.inventory.findIndex(item => item.id === id);
    if (index !== -1) {
      const resolvedCost = updates.unitCost !== undefined ? parseFloat(updates.unitCost) : (updates.cost !== undefined ? parseFloat(updates.cost) : this.inventory[index].unitCost);
      this.inventory[index] = {
        ...this.inventory[index],
        ...updates,
        unitCost: isNaN(resolvedCost) ? 0 : resolvedCost,
        currentStock: updates.currentStock !== undefined ? parseInt(updates.currentStock) : this.inventory[index].currentStock,
        minStock: updates.minStock !== undefined ? parseInt(updates.minStock) : this.inventory[index].minStock
      };
      this.saveInventory();
      this.renderUI();
      return true;
    }
    return false;
  }

  deleteItem(id) {
    this.inventory = this.inventory.filter(item => item.id !== id);
    this.saveInventory();
    this.renderUI();
  }

  adjustStock(id, delta) {
    const item = this.get(id);
    if (item) {
      item.currentStock = Math.max(0, (parseInt(item.currentStock) || 0) + delta);
      this.saveInventory();
      this.renderUI();
    }
  }

  resetToInitial() {
    this.inventory = JSON.parse(JSON.stringify(INITIAL_INVENTORY));
    this.saveInventory();
    this.renderUI();
  }

  updateKPIs() {
    const totalCount = this.inventory.length;
    const criticalCount = this.getCriticalCount();

    const kpiTotalEl = document.getElementById('kpiTotalItems');
    const kpiCritEl = document.getElementById('kpiCriticalItems');
    const countAllEl = document.getElementById('countAll');
    const countCritEl = document.getElementById('countCritical');
    const navBadge = document.getElementById('criticalStockCountBadge');

    if (kpiTotalEl) kpiTotalEl.textContent = totalCount;
    if (kpiCritEl) kpiCritEl.textContent = criticalCount;
    if (countAllEl) countAllEl.textContent = totalCount;
    if (countCritEl) countCritEl.textContent = criticalCount;

    if (navBadge) {
      if (criticalCount > 0) {
        navBadge.textContent = criticalCount;
        navBadge.style.display = 'inline-block';
      } else {
        navBadge.style.display = 'none';
      }
    }
  }

  getFilteredList() {
    return this.inventory.filter(item => {
      // Filter by stock level
      const isCritical = (parseInt(item.currentStock) || 0) <= (parseInt(item.minStock) || 0);
      if (this.activeFilter === 'critical' && !isCritical) {
        return false;
      }

      // Filter by category
      if (this.activeCategory !== 'all' && item.category !== this.activeCategory) {
        return false;
      }

      // Search query
      if (this.searchTerm) {
        const term = this.searchTerm.toLowerCase();
        const matchName = item.name.toLowerCase().includes(term);
        const matchCat = (item.category || '').toLowerCase().includes(term);
        if (!matchName && !matchCat) return false;
      }

      return true;
    });
  }

  renderUI() {
    this.updateKPIs();
    this.renderCategoryPills();

    const isEn = window.i18n && window.i18n.getLanguage() === 'en';
    const container = document.getElementById('stockItemsList');
    if (!container) return;

    const filtered = this.getFilteredList();

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">🔍</span>
          <p>${window.i18n ? window.i18n.t('stock_empty_title') : 'Arama kriterine uygun ürün bulunamadı.'}</p>
          <small>${window.i18n ? window.i18n.t('stock_empty_sub') : 'Filtreleri temizleyebilir veya yeni ürün ekleyebilirsiniz.'}</small>
        </div>
      `;
      return;
    }

    const profitMargin = window.paramManager ? window.paramManager.getProfitMargin() : 25;

    container.innerHTML = '';
    filtered.forEach((item, index) => {
      const isCritical = (parseInt(item.currentStock) || 0) <= (parseInt(item.minStock) || 0);
      const salePrice = item.unitCost * (1 + (profitMargin / 100));

      const card = document.createElement('div');
      card.className = `stock-card ${isCritical ? 'critical-border' : ''}`;
      card.innerHTML = `
        <div class="stock-card-header">
          <div>
            <div class="stock-card-title">${item.name}</div>
            <div class="stock-card-category">📁 ${item.category || (isEn ? 'General' : 'Genel')}</div>
          </div>
          <div>
            ${isCritical 
              ? `<span class="badge-alert">🚨 ${isEn ? 'LOW STOCK' : 'KRİTİK STOK'} (${item.currentStock}/${item.minStock})</span>` 
              : `<span class="badge-normal">✅ ${isEn ? 'Sufficient' : 'Yeterli'} (${item.currentStock})</span>`}
          </div>
        </div>

        <div class="stock-card-details">
          <div>
            <span style="font-size:0.72rem; color:var(--text-muted);">${window.i18n ? window.i18n.t('stock_card_cost') : 'Birim Maliyet:'}</span>
            <strong class="text-mono" style="display:block;">${window.i18n ? window.i18n.formatMoney(item.unitCost) : parseFloat(item.unitCost).toFixed(2) + ' TL'}</strong>
          </div>
          <div>
            <span style="font-size:0.72rem; color:var(--text-muted);">${window.i18n ? `${window.i18n.t('stock_card_price')} (+%${profitMargin}):` : `Satış (+%${profitMargin}):`}</span>
            <strong class="text-mono" style="display:block; color:var(--primary);">${window.i18n ? window.i18n.formatMoney(salePrice) : salePrice.toFixed(2) + ' TL'}</strong>
          </div>
        </div>

        <div class="stock-card-actions">
          <div style="display:flex; align-items:center; gap:6px;">
            <span style="font-size:0.78rem; font-weight:700;">${isEn ? 'Stock:' : 'Stok:'}</span>
            <button class="btn btn-outline-secondary btn-xs adjust-stock-btn" data-id="${item.id}" data-delta="-1">➖</button>
            <span class="text-mono text-bold" style="font-size:0.95rem; min-width:24px; text-align:center;">${item.currentStock}</span>
            <button class="btn btn-outline-secondary btn-xs adjust-stock-btn" data-id="${item.id}" data-delta="1">➕</button>
          </div>
          <div style="display:flex; gap:6px;">
            <button class="btn btn-outline-primary btn-xs edit-item-btn" data-id="${item.id}">✏️ ${isEn ? 'Edit' : 'Düzenle'}</button>
            <button class="btn btn-outline-danger btn-xs delete-item-btn" data-id="${item.id}">🗑️</button>
          </div>
        </div>
      `;
      container.appendChild(card);

      // Organic Glass Inline Ad Banner (Banner #2) after 5th item or at bottom
      if (index === 4 || (filtered.length < 5 && index === filtered.length - 1)) {
        const adCard = document.createElement('div');
        adCard.className = 'inline-ad-card';
        adCard.innerHTML = `
          <div class="inline-ad-header">
            <span class="ad-pill-badge">${isEn ? 'SPONSORED / TIP' : 'SPONSOR / SAHA İPUCU'}</span>
            <small style="color:var(--text-muted); font-size:0.7rem;">VetAssist Partner</small>
          </div>
          <div class="inline-ad-body">
            <div class="inline-ad-icon">🩺</div>
            <div class="inline-ad-content">
              <div class="inline-ad-title">${isEn ? 'Veterinary Field Supplies & Cold Chain Bags' : 'Veteriner Klinik & Soğuk Zincir Ekipmanları'}</div>
              <div class="inline-ad-subtitle">${isEn ? 'High quality drug storage boxes, digital refractometers and field diagnostic sets.' : 'Aşı ve soğuk zincir taşıma çantaları, dijital refraktometreler ve modern saha tedavi setleri.'}</div>
            </div>
          </div>
        `;
        container.appendChild(adCard);
      }
    });

    this.attachCardEvents();
  }

  renderCategoryPills() {
    const container = document.getElementById('categoryPills');
    if (!container) return;

    const isEn = window.i18n && window.i18n.getLanguage() === 'en';
    const categories = this.getCategories();
    let html = `<button class="cat-pill ${this.activeCategory === 'all' ? 'active' : ''}" data-cat="all">${isEn ? 'All Categories' : 'Tüm Kategoriler'}</button>`;

    categories.forEach(cat => {
      html += `<button class="cat-pill ${this.activeCategory === cat ? 'active' : ''}" data-cat="${cat}">${cat}</button>`;
    });

    container.innerHTML = html;

    container.querySelectorAll('.cat-pill').forEach(pill => {
      pill.addEventListener('click', (e) => {
        this.activeCategory = e.target.getAttribute('data-cat');
        this.renderUI();
      });
    });
  }

  attachCardEvents() {
    // Quick stock stepper
    document.querySelectorAll('.adjust-stock-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.getAttribute('data-id');
        const delta = parseInt(btn.getAttribute('data-delta')) || 0;
        this.adjustStock(id, delta);
      });
    });

    // Edit item
    document.querySelectorAll('.edit-item-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.getAttribute('data-id');
        const item = this.get(id);
        if (item && window.app) {
          window.app.openProductEditModal(item);
        }
      });
    });

    // Delete item
    document.querySelectorAll('.delete-item-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.getAttribute('data-id');
        const item = this.get(id);
        const isEn = window.i18n && window.i18n.getLanguage() === 'en';
        if (item && confirm(isEn ? `Are you sure you want to delete "${item.name}"?` : `"${item.name}" ürününü silmek istediğinize emin misiniz?`)) {
          this.deleteItem(id);
        }
      });
    });
  }

  /**
   * Google Sheets CSV Senkronizasyonu
   */
  async syncGoogleSheets(csvUrl) {
    const isEn = window.i18n && window.i18n.getLanguage() === 'en';
    if (!csvUrl) {
      throw new Error(isEn ? 'Google Sheets CSV link is not configured. Please enter a published URL in Settings or Stock tab.' : 'Google Sheets CSV bağlantı adresi girilmedi. Lütfen Stok sekmesindeki link alanından veya Ayarlar sekmesinden URL tanımlayın.');
    }

    const response = await fetch(csvUrl);
    if (!response.ok) {
      throw new Error(isEn ? `Could not access Google Sheets table: Status Code ${response.status}` : `Google Sheets tablosuna erişilemedi: Durum Kodu ${response.status}`);
    }

    const csvText = await response.text();
    return this.parseAndImportCsv(csvText);
  }

  /**
   * CSV Metnini Ayrıştırıp Envantere Ekler (Noktalı virgül, virgül, tab ve Türkçe sayı formatı desteği)
   */
  parseAndImportCsv(csvText) {
    const isEn = window.i18n && window.i18n.getLanguage() === 'en';
    const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length <= 1) {
      throw new Error(isEn ? 'No data rows found in CSV file.' : 'CSV dosyasında veri satırı bulunamadı.');
    }

    // Delimiter tespiti
    const header = lines[0];
    let delimiter = ',';
    if ((header.match(/;/g) || []).length > (header.match(/,/g) || []).length) {
      delimiter = ';';
    } else if ((header.match(/\t/g) || []).length > (header.match(/,/g) || []).length) {
      delimiter = '\t';
    }

    const parseLine = (line, delim) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === delim && !inQuotes) {
          result.push(current.trim().replace(/^["']|["']$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim().replace(/^["']|["']$/g, ''));
      return result;
    };

    const parseNumber = (val) => {
      if (val === undefined || val === null || val === '') return 0;
      let str = String(val).trim().replace(/[^\d.,\-]/g, '');
      if (!str) return 0;
      if (str.includes(',') && str.includes('.')) {
        if (str.lastIndexOf(',') > str.lastIndexOf('.')) {
          str = str.replace(/\./g, '').replace(',', '.');
        } else {
          str = str.replace(/,/g, '');
        }
      } else if (str.includes(',')) {
        str = str.replace(',', '.');
      }
      return parseFloat(str) || 0;
    };

    const newInventory = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = parseLine(lines[i], delimiter);
      if (parts.length >= 2 && parts[0]) {
        newInventory.push({
          id: 'item_' + i + '_' + Date.now(),
          name: parts[0],
          unitCost: parseNumber(parts[1]),
          currentStock: Math.max(0, parseInt(parseNumber(parts[2])) || 0),
          minStock: Math.max(0, parseInt(parseNumber(parts[3])) || 0),
          category: parts[4] || (isEn ? 'General' : 'Genel')
        });
      }
    }

    if (newInventory.length > 0) {
      this.inventory = newInventory;
      this.saveInventory();
      this.renderUI();
      return newInventory.length;
    } else {
      throw new Error(isEn ? 'Valid product rows could not be parsed.' : 'Geçerli ürün satırları okunamadı.');
    }
  }

  /**
   * Mevcut envanteri CSV formatında dışa aktarır
   */
  exportCsv() {
    let csv = 'Urun_Adi,Birim_Maliyet,Mevcut_Stok,Min_Stok,Kategori\n';
    this.inventory.forEach(item => {
      csv += `"${item.name}",${item.unitCost},${item.currentStock},${item.minStock},"${item.category}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `VetAssist_Stok_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

window.stockManager = new StockManager();
