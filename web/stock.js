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
    this.partnersKey = 'vetassist_partners_v2';
    this.inventory = this.loadInventory();
    this.partners = this.loadPartners();
    this.activeFilter = 'all'; // 'all' | 'critical'
    this.activeCategory = 'all';
    this.searchTerm = '';
    setTimeout(() => this.renderPartnersDatalist(), 100);
  }

  loadPartners() {
    try {
      const saved = localStorage.getItem(this.partnersKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Partner portföyü yüklenirken hata:', e);
    }
    return [];
  }

  savePartners(partnersList) {
    try {
      if (Array.isArray(partnersList)) {
        this.partners = partnersList;
        localStorage.setItem(this.partnersKey, JSON.stringify(this.partners));
        this.renderPartnersDatalist();
      }
    } catch (e) {
      console.error('Partner portföyü kaydedilirken hata:', e);
    }
  }

  getPartners() {
    return this.partners || [];
  }

  findPartnerByName(name) {
    if (!name) return null;
    const clean = name.trim().toLowerCase();
    return (this.partners || []).find(p => (p.name || '').trim().toLowerCase() === clean) || null;
  }

  renderPartnersDatalist() {
    const dl = document.getElementById('vetassistPartnersDatalist');
    if (!dl) return;
    dl.innerHTML = (this.partners || []).map(pt => {
      const debtInfo = pt.currentDebt > 0 ? `Borç: ${pt.currentDebt} TL` : '';
      const limitInfo = pt.creditLimit > 0 ? `Limit: ${pt.creditLimit} TL` : '';
      const finInfo = [debtInfo, limitInfo].filter(Boolean).join(' / ');
      const meta = [pt.phone, finInfo, pt.city, pt.district].filter(Boolean).join(' • ');
      const roleLabel = pt.isVendor && !pt.isCustomer ? 'Tedarikçi' : 'Müşteri';
      const label = meta ? `${roleLabel}: ${meta}` : roleLabel;
      const escapedName = String(pt.name || '').replace(/"/g, '&quot;');
      const escapedLabel = String(label).replace(/"/g, '&quot;');
      return `<option value="${escapedName}" label="${escapedLabel}"></option>`;
    }).join('');
  }

  loadInventory() {
    try {
      const saved = localStorage.getItem(this.storageKey) || 
                    localStorage.getItem('sahavet_inventory_v2') ||
                    localStorage.getItem('vetassist_inventory') ||
                    localStorage.getItem('sahavet_inventory');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const loaded = parsed.map(item => ({
            id: item.id || ('prod_' + Math.random().toString(36).substr(2, 9)),
            syncraId: item.syncraId || null,
            sku: item.sku || null,
            name: item.name || '',
            unitCost: parseFloat(item.unitCost !== undefined ? item.unitCost : (item.cost !== undefined ? item.cost : (item.price !== undefined ? item.price : 0))) || 0,
            currentStock: parseFloat(item.currentStock) || 0,
            minStock: parseFloat(item.minStock) || 0,
            category: item.category || 'Genel'
          }));
          // Eğer eski anahtardan geldiyse güncel anahtara da yaz
          if (!localStorage.getItem(this.storageKey)) {
            localStorage.setItem(this.storageKey, JSON.stringify(loaded));
          }
          return loaded;
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
    return this.inventory.find(item => item.id === id || item.syncraId === id);
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
   * Google Sheets Linklerini CSV Export Formatına Normalize Eder
   */
  normalizeSheetsUrl(rawUrl) {
    if (!rawUrl) return '';
    let url = rawUrl.trim();

    if (url.includes('docs.google.com/spreadsheets')) {
      // 1. Web'de yayınlanan link (/pubhtml -> /pub?output=csv)
      if (url.includes('/pubhtml') || url.includes('/pub')) {
        url = url.split('?')[0].replace(/\/pubhtml$/, '/pub');
        if (!url.endsWith('/pub')) {
          url = url.replace(/\/pub.*/, '/pub');
        }
        return url + '?output=csv';
      }

      // 2. Normal düzenleme/paylaşım linki (/d/{ID}/edit...)
      const docMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (docMatch) {
        const docId = docMatch[1];
        let gid = '0';
        const gidMatch = url.match(/[?&#]gid=([0-9]+)/);
        if (gidMatch) {
          gid = gidMatch[1];
        }
        return `https://docs.google.com/spreadsheets/d/${docId}/export?format=csv&gid=${gid}`;
      }
    }

    return url;
  }

  /**
   * Google Sheets CSV Senkronizasyonu
   */
  async syncGoogleSheets(csvUrl) {
    const isEn = window.i18n && window.i18n.getLanguage() === 'en';
    if (!csvUrl) {
      throw new Error(isEn ? 'Google Sheets CSV link is not configured. Please enter a published URL in Settings or Stock tab.' : 'Google Sheets CSV bağlantı adresi girilmedi. Lütfen Stok sekmesindeki link alanından veya Ayarlar sekmesinden URL tanımlayın.');
    }

    const normalizedUrl = this.normalizeSheetsUrl(csvUrl);
    let csvText = null;

    // 1. Doğrudan Tarayıcı Fetch Dene
    try {
      const response = await fetch(normalizedUrl);
      if (response.ok) {
        const text = await response.text();
        if (text && !text.trim().toLowerCase().startsWith('<!doctype') && !text.trim().toLowerCase().startsWith('<html')) {
          csvText = text;
        }
      }
    } catch (err) {
      console.warn('Doğrudan fetch başarısız (CORS koruması aktif olabilir):', err);
    }

    // 2. Yerel Node.js Proxy Endpoint (/api/proxy-csv) Dene (Localhost / Test Ortamları İçin)
    if (!csvText && !normalizedUrl.startsWith('/') && !normalizedUrl.startsWith('.')) {
      try {
        const proxyUrl = `/api/proxy-csv?url=${encodeURIComponent(normalizedUrl)}`;
        const response = await fetch(proxyUrl);
        if (response.ok) {
          const text = await response.text();
          if (text && !text.trim().toLowerCase().startsWith('<!doctype') && !text.trim().toLowerCase().startsWith('<html')) {
            csvText = text;
          }
        }
      } catch (err) {
        console.warn('Yerel proxy fetch başarısız:', err);
      }
    }

    // 3. Genel CORS Proxy (allorigins) Dene
    if (!csvText && (normalizedUrl.startsWith('http://') || normalizedUrl.startsWith('https://'))) {
      try {
        const publicProxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(normalizedUrl)}`;
        const response = await fetch(publicProxyUrl);
        if (response.ok) {
          const text = await response.text();
          if (text && !text.trim().toLowerCase().startsWith('<!doctype') && !text.trim().toLowerCase().startsWith('<html')) {
            csvText = text;
          }
        }
      } catch (err) {
        console.warn('Genel CORS proxy fetch başarısız:', err);
      }
    }

    if (!csvText) {
      const tipTr = 'Google Sheets tablosuna erişilemedi.\n\nLütfen şunları kontrol edin:\n1. Google Sheets\'te: Dosya > Paylaş > Web\'de Yayınla > CSV seçeneğini kullanın.\n2. Veya "Paylaş" ayarını "Bağlantıya sahip herkes (Görüntüleyen)" yapın.';
      const tipEn = 'Could not access Google Sheets table.\n\nPlease check:\n1. In Google Sheets: File > Share > Publish to web > CSV.\n2. Or set Link Sharing to "Anyone with the link can view".';
      throw new Error(isEn ? tipEn : tipTr);
    }

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
      this.mergeExternalInventory(newInventory);
      return newInventory.length;
    } else {
      throw new Error(isEn ? 'Valid product rows could not be parsed.' : 'Geçerli ürün satırları okunamadı.');
    }
  }

  /**
   * Dış kaynaktan (Google Sheets veya Syncra API) gelen envanteri mevcut yerel ürünlerle veri kaybetmeden birleştirir
   */
  mergeExternalInventory(incomingItems) {
    if (!Array.isArray(incomingItems) || incomingItems.length === 0) return;

    const merged = [...incomingItems.map(inc => ({
      id: inc.id || ('prod_' + Math.random().toString(36).substr(2, 9)),
      syncraId: inc.syncraId || inc.id || null,
      sku: inc.sku || null,
      name: (inc.name || '').trim(),
      unitCost: parseFloat(inc.unitCost) || 0,
      currentStock: Math.max(0, parseFloat(inc.currentStock) || 0),
      minStock: Math.max(0, parseFloat(inc.minStock) || 0),
      category: inc.category || 'Genel'
    }))];

    // Yerelde olup gelen listede olmayan ürünleri koru (veri kaybını engelle)
    this.inventory.forEach(localItem => {
      const localName = (localItem.name || '').trim().toLowerCase();
      if (!localName) return;
      const existsInIncoming = merged.some(
        m => (m.syncraId && m.syncraId === localItem.syncraId) ||
             m.id === localItem.id ||
             m.name.toLowerCase() === localName
      );
      if (!existsInIncoming) {
        merged.push(localItem);
      }
    });

    this.inventory = merged;
    this.saveInventory();
    this.renderUI();
  }

  /**
   * Syncra ERP Saha Köprüsü ile Çift Yönlü Senkronizasyon (Stok + Müşteri Portföyü + Bekleyen Çevrimdışı Kayıtlar)
   */
  async syncWithSyncra(options = {}) {
    const serverUrl = (options.serverUrl || localStorage.getItem('vetassist_syncra_url_v2') || 'http://localhost:3000').replace(/\/+$/, '');
    const apiKey = (options.apiKey || localStorage.getItem('vetassist_syncra_key_v2') || '').trim();
    const deviceToken = (options.deviceToken || localStorage.getItem('vetassist_syncra_device_token_v2') || '').trim();
    const doctorName = (options.doctorName || localStorage.getItem('vetassist_syncra_doctor_name_v2') || '').trim();
    const mergeLocal = options.mergeLocal !== false;

    if (!apiKey && !deviceToken) {
      throw new Error('Syncra bağlantısı bulunamadı. Lütfen QR kod okutarak veya API anahtarınızı girerek Syncra\'ya bağlanın.');
    }

    const unsyncedLogs = (window.logManager && typeof window.logManager.getUnsyncedLogs === 'function')
      ? window.logManager.getUnsyncedLogs()
      : [];

    const payload = {
      apiKey,
      deviceToken,
      doctorName,
      localProducts: mergeLocal ? this.inventory : [],
      logs: unsyncedLogs.map(l => ({ ...l, doctorName }))
    };

    const headers = {
      'Content-Type': 'application/json'
    };
    if (apiKey) headers['x-vetassist-key'] = apiKey;
    if (deviceToken) headers['x-vetassist-device-token'] = deviceToken;

    const response = await fetch(`${serverUrl}/api/vetassist-bridge/push`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
      if (response.status === 403) {
        throw new Error(`🚫 ERİŞİM İPTALİ: ${data.error || 'Bu cihazın klinik bağlantısı başhekim tarafından iptal edilmiştir.'}`);
      }
      throw new Error(data.error || 'Syncra sunucusu ile bağlantı kurulamadı.');
    }

    // 1. Güncel Syncra ürünlerini yerel envanterle birleştir
    if (Array.isArray(data.products) && data.products.length > 0) {
      this.mergeExternalInventory(data.products.map(p => ({
        ...p,
        syncraId: p.id
      })));
    }

    // 2. Güncel Müşteri & Tedarikçi (Partner) portföyünü kaydet ve otomatik tamamlamayı yenile
    if (Array.isArray(data.partners)) {
      this.savePartners(data.partners);
    }

    // 3. Gönderilen logları 'syncraSynced = true' olarak işaretle
    if (window.logManager && Array.isArray(data.syncedLogIds) && data.syncedLogIds.length > 0) {
      window.logManager.markLogsSyncedWithSyncra(data.syncedLogIds);
    }

    return data;
  }

  /**
   * Fiyat ve stok listesinin toplu dışa aktarımı güvenlik nedeniyle engellenmiştir.
   */
  exportCsv() {
    const msg = '🔒 Güvenlik Politikası: Kurumsal fiyat ve ürün kataloğunun toplu olarak cihaz dışına aktarılması veya indirilmesi güvenlik nedeniyle engellenmiştir.';
    if (window.app && window.app.showToast) {
      window.app.showToast(msg);
    } else {
      alert(msg);
    }
  }
}

window.stockManager = new StockManager();

