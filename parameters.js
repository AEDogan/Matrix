/**
 * SahaVeteriner - Dinamik Maliyet Parametreleri Modülü (parameters.js)
 * Kâr marjı, KM ücreti, sabit giderler ve özel ek maliyetlerin yönetimini sağlar.
 * Müşteri adisyonu görünürlük maskelemesini ("Diğer Giderler") destekler.
 */

const DEFAULT_PARAMETERS = [
  {
    id: 'profit_margin',
    name: 'İlaç/Ürün Kâr Marjı',
    type: 'percent', // 'percent', 'fixed', 'multiplier'
    value: 25, // %25
    enabled: true,
    visibility: 'internal', // İlaç birim fiyatına doğrudan yansır
    isSystem: true,
    removable: false,
    description: 'Tüm ilaç ve malzeme maliyetlerinin üzerine eklenen kâr yüzdesi.'
  },
  {
    id: 'distance_rate',
    name: 'KM Başına Ulaşım Ücreti',
    type: 'multiplier',
    value: 25.00, // 25 TL/km
    enabled: true,
    visibility: 'separate', // 'separate' veya 'masked'
    isSystem: true,
    removable: false,
    description: 'Girilen mesafe (KM) ile çarpılarak ulaşıma eklenir.'
  },
  {
    id: 'clinic_fixed_fee',
    name: 'Sabit Klinik Hizmet Gideri',
    type: 'fixed',
    value: 400.00, // 400 TL
    enabled: true,
    visibility: 'masked', // Adisyonda "Diğer Giderler / Hizmet Bedeli" olarak birleştirilir
    isSystem: false,
    removable: true, // Komple kaldırılabilir!
    description: 'Her işleme standart olarak eklenen sabit servis payı.'
  },
  {
    id: 'consumable_fee',
    name: 'Sarf Malzeme & Dezenfeksiyon Payı',
    type: 'fixed',
    value: 50.00, // 50 TL
    enabled: false, // İsteğe bağlı kapalı başlar
    visibility: 'masked',
    isSystem: false,
    removable: true,
    description: 'Eldiven, enjektör, dezenfektan gibi genel sarf giderleri.'
  }
];

class ParameterManager {
  constructor() {
    this.storageKey = 'sahavet_parameters_v2';
    this.parameters = this.loadParameters();
  }

  loadParameters() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Parametreler yüklenirken hata:', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_PARAMETERS));
  }

  saveParameters() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.parameters));
      if (window.app && typeof window.app.onParametersChanged === 'function') {
        window.app.onParametersChanged();
      }
    } catch (e) {
      console.error('Parametreler kaydedilirken hata:', e);
    }
  }

  getAll() {
    return this.parameters;
  }

  get(id) {
    return this.parameters.find(p => p.id === id);
  }

  getProfitMargin() {
    const p = this.get('profit_margin');
    return (p && p.enabled) ? parseFloat(p.value) || 0 : 0;
  }

  getKmRate() {
    const p = this.get('distance_rate');
    return (p && p.enabled) ? parseFloat(p.value) || 0 : 0;
  }

  addParameter(paramData) {
    const newParam = {
      id: 'custom_' + Date.now(),
      name: paramData.name,
      type: paramData.type || 'fixed',
      value: parseFloat(paramData.value) || 0,
      enabled: true,
      visibility: paramData.visibility || 'separate', // 'separate' | 'masked'
      isSystem: false,
      removable: true,
      description: paramData.description || 'Özel tanımlı maliyet kalemi'
    };
    this.parameters.push(newParam);
    this.saveParameters();
    return newParam;
  }

  updateParameter(id, updates) {
    const index = this.parameters.findIndex(p => p.id === id);
    if (index !== -1) {
      this.parameters[index] = { ...this.parameters[index], ...updates };
      this.saveParameters();
      return true;
    }
    return false;
  }

  deleteParameter(id) {
    const param = this.get(id);
    if (param && param.removable) {
      this.parameters = this.parameters.filter(p => p.id !== id);
      this.saveParameters();
      return true;
    }
    return false;
  }

  toggleParameter(id, enabledState) {
    const param = this.get(id);
    if (param) {
      param.enabled = enabledState !== undefined ? enabledState : !param.enabled;
      this.saveParameters();
      return true;
    }
    return false;
  }

  resetToDefaults() {
    this.parameters = JSON.parse(JSON.stringify(DEFAULT_PARAMETERS));
    this.saveParameters();
  }

  /**
   * Belirli bir sepet ve KM için aktif parametrelerin tutarlarını hesaplar.
   * Adisyonda ayrı gösterilecekler ile 'Diğer Giderler' olarak toplanacakları ayırır.
   */
  calculateBreakdown(cartSubtotal, distanceKm) {
    let visibleItems = [];
    let maskedTotal = 0;
    let maskedItemsList = [];
    let totalAdditionalCost = 0;

    for (const param of this.parameters) {
      if (!param.enabled) continue;
      if (param.id === 'profit_margin') continue; // İlaçlara zaten eklendi

      let amount = 0;
      if (param.id === 'distance_rate') {
        amount = (parseFloat(distanceKm) || 0) * (parseFloat(param.value) || 0);
      } else if (param.type === 'fixed') {
        amount = parseFloat(param.value) || 0;
      } else if (param.type === 'percent') {
        amount = cartSubtotal * ((parseFloat(param.value) || 0) / 100);
      } else if (param.type === 'multiplier') {
        amount = parseFloat(param.value) || 0;
      }

      if (amount <= 0 && param.id !== 'distance_rate') continue;

      totalAdditionalCost += amount;

      if (param.visibility === 'masked') {
        maskedTotal += amount;
        maskedItemsList.push({ name: param.name, amount: amount });
      } else {
        visibleItems.push({
          id: param.id,
          name: param.id === 'distance_rate' ? `Ulaşım Bedeli (${distanceKm} km)` : param.name,
          qty: param.id === 'distance_rate' ? `${distanceKm} km` : '1',
          unitPrice: amount,
          total: amount
        });
      }
    }

    // Eğer gizlenen kalemler varsa adisyona "Diğer Giderler / Hizmet Bedeli" tek satır olarak eklenir
    if (maskedTotal > 0) {
      visibleItems.push({
        id: 'masked_other_expenses',
        name: 'Diğer Hizmet & Klinik Giderleri',
        qty: '1',
        unitPrice: maskedTotal,
        total: maskedTotal,
        subItems: maskedItemsList
      });
    }

    return {
      visibleItems,
      maskedTotal,
      maskedItemsList,
      totalAdditionalCost
    };
  }

  renderUI() {
    const container = document.getElementById('parametersList');
    if (!container) return;

    container.innerHTML = '';

    this.parameters.forEach(param => {
      const card = document.createElement('div');
      card.className = `param-item-card ${param.enabled ? '' : 'disabled-opacity'}`;
      card.id = `param-card-${param.id}`;

      let suffix = 'TL';
      if (param.type === 'percent') suffix = '%';
      if (param.type === 'multiplier') suffix = 'TL/km';

      const isProfitMargin = param.id === 'profit_margin';
      const isDistance = param.id === 'distance_rate';

      card.innerHTML = `
        <div class="param-header-row">
          <div>
            <span class="param-title">${param.name}</span>
            <p class="section-desc">${param.description || ''}</p>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            ${param.removable ? `
              <button class="btn btn-outline-danger btn-xs delete-param-btn" data-id="${param.id}" title="Bu parametreyi tamamen sil">
                🗑️ Sil
              </button>
            ` : ''}
            <label class="toggle-switch">
              <input type="checkbox" class="param-enable-toggle" data-id="${param.id}" ${param.enabled ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>

        <div class="param-val-input-row">
          <label style="font-size:0.8rem; font-weight:700; color:var(--text-muted);">Değer / Tutar:</label>
          <div class="input-with-suffix" style="max-width: 140px;">
            <input type="number" class="form-input text-bold param-value-input" data-id="${param.id}" value="${param.value}" step="0.5" min="0">
            <span class="input-suffix">${suffix}</span>
          </div>
          <span style="font-size:0.75rem; color:var(--text-muted);">(${param.type === 'percent' ? 'Yüzde Oranı' : param.type === 'multiplier' ? 'Birim Çarpan' : 'Sabit Tutar'})</span>
        </div>

        ${!isProfitMargin ? `
          <div class="param-vis-switch-row">
            <div>
              <strong>Adisyonda Müşteriye Görünme Şekli:</strong>
              <div style="font-size:0.72rem; color:var(--text-muted);">
                ${param.visibility === 'masked' ? '🔒 "Diğer Giderler" başlığı altında toplanır (Ayrı görünmez)' : '👁️ Kendi adıyla ayrı satırda listelenir'}
              </div>
            </div>
            <select class="form-select param-vis-select" data-id="${param.id}" style="max-width:200px; padding:6px 10px; font-size:0.78rem;">
              <option value="separate" ${param.visibility === 'separate' ? 'selected' : ''}>👁️ Ayrı Satırda Göster</option>
              <option value="masked" ${param.visibility === 'masked' ? 'selected' : ''}>🔒 "Diğer Giderler" Olarak Birleştir</option>
            </select>
          </div>
        ` : ''}
      `;

      container.appendChild(card);
    });

    this.attachEvents();
  }

  attachEvents() {
    // Value changes
    document.querySelectorAll('.param-value-input').forEach(input => {
      input.addEventListener('change', (e) => {
        const id = e.target.getAttribute('data-id');
        const val = parseFloat(e.target.value) || 0;
        this.updateParameter(id, { value: val });
      });
    });

    // Enable / Disable toggles
    document.querySelectorAll('.param-enable-toggle').forEach(toggle => {
      toggle.addEventListener('change', (e) => {
        const id = e.target.getAttribute('data-id');
        this.toggleParameter(id, e.target.checked);
        this.renderUI();
      });
    });

    // Visibility changes
    document.querySelectorAll('.param-vis-select').forEach(select => {
      select.addEventListener('change', (e) => {
        const id = e.target.getAttribute('data-id');
        this.updateParameter(id, { visibility: e.target.value });
        this.renderUI();
      });
    });

    // Delete buttons
    document.querySelectorAll('.delete-param-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        if (confirm('Bu maliyet kalemini tamamen kaldırmak istediğinize emin misiniz?')) {
          this.deleteParameter(id);
          this.renderUI();
        }
      });
    });
  }
}

window.paramManager = new ParameterManager();
