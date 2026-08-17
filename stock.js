/**
 * SahaVeteriner - Stok & Envanter Yönetimi Modülü (stock.js)
 * Google Sheets CSV Senkronizasyonu, Offline Cache, Kritik Stok Alarmları
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
    this.storageKey = 'sahavet_inventory_v2';
    this.inventory = this.loadInventory();
    this.activeFilter = 'all'; // 'all' | 'critical'
    this.activeCategory = 'all';
    this.searchTerm = '';
  }

  loadInventory() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        return JSON.parse(saved);
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
      name: itemData.name.trim(),
      unitCost: parseFloat(itemData.unitCost) || 0,
      currentStock: parseInt(itemData.currentStock) || 0,
      minStock: parseInt(itemData.minStock) || 0,
      category: itemData.category ? itemData.category.trim() : 'Genel'
    };
    this.inventory.push(newItem);
    this.saveInventory();
    this.renderUI();
    return newItem;
  }

  updateItem(id, updates) {
    const index = this.inventory.findIndex(item => item.id === id);
    if (index !== -1) {
      this.inventory[index] = {
        ...this.inventory[index],
        ...updates,
        unitCost: updates.unitCost !== undefined ? parseFloat(updates.unitCost) : this.inventory[index].unitCost,
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

    const container = document.getElementById('stockItemsList');
    if (!container) return;

    const filtered = this.getFilteredList();

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">🔍</span>
          <p>Arama kriterine uygun ürün bulunamadı.</p>
          <small>Filtreleri temizleyebilir veya yeni ürün ekleyebilirsiniz.</small>
        </div>
      `;
      return;
    }

    const profitMargin = window.paramManager ? window.paramManager.getProfitMargin() : 25;

    container.innerHTML = '';
    filtered.forEach(item => {
      const isCritical = (parseInt(item.currentStock) || 0) <= (parseInt(item.minStock) || 0);
      const salePrice = item.unitCost * (1 + (profitMargin / 100));

      const card = document.createElement('div');
      card.className = `stock-card ${isCritical ? 'critical-border' : ''}`;
      card.innerHTML = `
        <div class="stock-card-header">
          <div>
            <div class="stock-card-title">${item.name}</div>
            <div class="stock-card-category">📁 ${item.category || 'Genel'}</div>
          </div>
          <div>
            ${isCritical 
              ? `<span class="badge-alert">🚨 KRİTİK STOK (${item.currentStock}/${item.minStock})</span>` 
              : `<span class="badge-normal">✅ Yeterli (${item.currentStock})</span>`}
          </div>
        </div>

        <div class="stock-card-details">
          <div>
            <span style="font-size:0.72rem; color:var(--text-muted);">Birim Maliyet:</span>
            <strong class="text-mono" style="display:block;">${parseFloat(item.unitCost).toFixed(2)} TL</strong>
          </div>
          <div>
            <span style="font-size:0.72rem; color:var(--text-muted);">Satış Fiyatı (+%${profitMargin}):</span>
            <strong class="text-mono" style="display:block; color:var(--primary);">${salePrice.toFixed(2)} TL</strong>
          </div>
        </div>

        <div class="stock-card-actions">
          <div style="display:flex; align-items:center; gap:6px;">
            <span style="font-size:0.78rem; font-weight:700;">Stok:</span>
            <button class="btn btn-outline-secondary btn-xs adjust-stock-btn" data-id="${item.id}" data-delta="-1">➖</button>
            <span class="text-mono text-bold" style="font-size:0.95rem; min-width:24px; text-align:center;">${item.currentStock}</span>
            <button class="btn btn-outline-secondary btn-xs adjust-stock-btn" data-id="${item.id}" data-delta="1">➕</button>
          </div>
          <div style="display:flex; gap:6px;">
            <button class="btn btn-outline-primary btn-xs edit-item-btn" data-id="${item.id}">✏️ Düzenle</button>
            <button class="btn btn-outline-danger btn-xs delete-item-btn" data-id="${item.id}">🗑️</button>
          </div>
        </div>
      `;
      container.appendChild(card);
    });

    this.attachCardEvents();
  }

  renderCategoryPills() {
    const container = document.getElementById('categoryPills');
    if (!container) return;

    const categories = this.getCategories();
    let html = `<button class="cat-pill ${this.activeCategory === 'all' ? 'active' : ''}" data-cat="all">Tüm Kategoriler</button>`;

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
        if (item && confirm(`"${item.name}" ürününü silmek istediğinize emin misiniz?`)) {
          this.deleteItem(id);
        }
      });
    });
  }

  /**
   * Google Sheets CSV Senkronizasyonu
   */
  async syncGoogleSheets(csvUrl) {
    if (!csvUrl) {
      throw new Error('Google Sheets CSV bağlantı adresi girilmedi. Lütfen Fiş & İletişim sekmesinden URL tanımlayın.');
    }

    const response = await fetch(csvUrl);
    if (!response.ok) {
      throw new Error(`Google Sheets tablosuna erişilemedi: Durum Kodu ${response.status}`);
    }

    const csvText = await response.text();
    this.parseAndImportCsv(csvText);
  }

  /**
   * CSV Metnini Ayrıştırıp Envantere Ekler
   */
  parseAndImportCsv(csvText) {
    const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length <= 1) {
      throw new Error('CSV dosyasında veri satırı bulunamadı.');
    }

    const newInventory = [];
    // 0. satır başlıklar (Urun_Adi, Birim_Maliyet, Mevcut_Stok, Min_Stok, Kategori)
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
      if (parts.length >= 2 && parts[0]) {
        newInventory.push({
          id: 'item_' + (i) + '_' + Date.now(),
          name: parts[0],
          unitCost: parseFloat(parts[1].replace(',', '.')) || 0,
          currentStock: parseInt(parts[2]) || 0,
          minStock: parseInt(parts[3]) || 0,
          category: parts[4] || 'Genel'
        });
      }
    }

    if (newInventory.length > 0) {
      this.inventory = newInventory;
      this.saveInventory();
      this.renderUI();
      return newInventory.length;
    } else {
      throw new Error('Geçerli ürün satırları okunamadı.');
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
    link.setAttribute('download', `SahaVeteriner_Stok_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

window.stockManager = new StockManager();
