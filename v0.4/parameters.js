/**
 * VetAssist - Dinamik Maliyet Parametreleri Modülü (parameters.js)
 * Kâr marjı, KM ücreti, sabit klinik gideri ve ek maliyetlerin yönetimini sağlar.
 * Sabit Klinik Masrafını Kalemlere Orantılı Dağıtma (Maliyet Giydirme) özelliğini destekler.
 */

const DEFAULT_PARAMETERS = [
  {
    id: 'profit_margin',
    name: 'İlaç/Ürün Kâr Marjı',
    name_en: 'Medication/Product Markup Margin',
    type: 'percent', // 'percent', 'fixed', 'multiplier'
    value: 25, // %25
    enabled: true,
    visibility: 'internal', // İlaç birim fiyatına doğrudan yansır
    isSystem: true,
    removable: false,
    description: 'Tüm ilaç ve malzeme maliyetlerinin üzerine eklenen kâr yüzdesi.',
    description_en: 'Profit margin percentage applied on top of medication & supply costs.'
  },
  {
    id: 'distance_rate',
    name: 'KM Başına Ulaşım Ücreti',
    name_en: 'Travel Fee per KM',
    type: 'multiplier',
    value: 25.00, // 25 TL/km
    enabled: true,
    visibility: 'separate', // 'separate' veya 'masked'
    isSystem: true,
    removable: false,
    description: 'Girilen mesafe (KM) ile çarpılarak ulaşıma eklenir.',
    description_en: 'Multiplied by distance traveled (KM) and added to billing.'
  },
  {
    id: 'clinic_fixed_fee',
    name: 'Sabit Klinik Hizmet Gideri',
    name_en: 'Fixed Clinic Service Fee',
    type: 'fixed',
    value: 400.00, // 400 TL
    enabled: true,
    visibility: 'separate', // 'separate' | 'masked'
    isSystem: false,
    removable: true,
    description: 'Her işleme standart olarak eklenen sabit servis payı.',
    description_en: 'Standard service fee added to each appointment/visit.'
  },
  {
    id: 'consumable_fee',
    name: 'Sarf Malzeme & Dezenfeksiyon Payı',
    name_en: 'Consumables & Sanitization Fee',
    type: 'fixed',
    value: 50.00, // 50 TL
    enabled: false,
    visibility: 'masked',
    isSystem: false,
    removable: true,
    description: 'Eldiven, enjektör, dezenfektan gibi genel sarf giderleri.',
    description_en: 'General consumables such as gloves, syringes, and sanitizers.'
  }
];

class ParameterManager {
  constructor() {
    this.storageKey = 'vetassist_parameters_v2';
    this.distributeKey = 'vetassist_distribute_fixed_expense_v2';
    this.parameters = this.loadParameters();
    this.distributeFixedExpense = this.loadDistributeFixedExpense();
  }

  loadParameters() {
    try {
      const saved = localStorage.getItem(this.storageKey) || localStorage.getItem('sahavet_parameters_v2');
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

  loadDistributeFixedExpense() {
    return (localStorage.getItem(this.distributeKey) || localStorage.getItem('sahavet_distribute_fixed_expense_v2')) === 'true';
  }

  setDistributeFixedExpense(val) {
    this.distributeFixedExpense = !!val;
    localStorage.setItem(this.distributeKey, this.distributeFixedExpense ? 'true' : 'false');
    if (window.app && typeof window.app.onParametersChanged === 'function') {
      window.app.onParametersChanged();
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

  getFixedClinicFee() {
    const p = this.get('clinic_fixed_fee');
    return (p && p.enabled) ? parseFloat(p.value) || 0 : 0;
  }

  addParameter(paramData) {
    const newParam = {
      id: 'custom_' + Date.now(),
      name: paramData.name,
      type: paramData.type || 'fixed',
      value: parseFloat(paramData.value) || 0,
      enabled: true,
      visibility: paramData.visibility || 'separate',
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
    this.distributeFixedExpense = false;
    localStorage.removeItem(this.distributeKey);
    this.saveParameters();
  }

  /**
   * Belirli bir sepet ve KM için parametre dökümünü hesaplar.
   */
  calculateBreakdown(cartSubtotal, distanceKm, hasCartItems = false) {
    const isEn = window.i18n && window.i18n.getLanguage() === 'en';
    let visibleItems = [];
    let maskedTotal = 0;
    let maskedItemsList = [];
    let totalAdditionalCost = 0;

    const isDistributing = this.distributeFixedExpense && hasCartItems;

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

      // Sabit Klinik Gideri dağıtılıyorsa, fişte ve görünür listede ayrı satır olarak gösterilmez!
      if (isDistributing && param.id === 'clinic_fixed_fee') {
        continue;
      }

      const paramDisplayName = isEn && param.name_en ? param.name_en : param.name;

      if (param.visibility === 'masked') {
        maskedTotal += amount;
        maskedItemsList.push({ name: paramDisplayName, amount: amount });
      } else {
        visibleItems.push({
          id: param.id,
          name: param.id === 'distance_rate' ? (isEn ? `Travel Fee (${distanceKm} km)` : `Ulaşım Bedeli (${distanceKm} km)`) : paramDisplayName,
          qty: param.id === 'distance_rate' ? `${distanceKm} km` : '1',
          unitPrice: amount,
          total: amount
        });
      }
    }

    // Eğer gizlenen kalemler varsa tek satırda topla
    if (maskedTotal > 0) {
      visibleItems.push({
        id: 'masked_other_expenses',
        name: isEn ? 'Other Services & Supplies' : 'Diğer Hizmet ve Sarf Bedelleri',
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
      totalAdditionalCost,
      isDistributing
    };
  }

  renderUI() {
    const container = document.getElementById('parametersList');
    if (!container) return;

    const isEn = window.i18n && window.i18n.getLanguage() === 'en';
    container.innerHTML = '';

    // Orantılı Sabit Gider Dağıtımı Banner / Kartı
    const distributeCard = document.createElement('div');
    distributeCard.className = 'card field-card distribute-setting-card';
    distributeCard.innerHTML = `
      <div class="card-title-row">
        <div>
          <h3 class="section-title" style="font-size:1rem; display:flex; align-items:center; gap:8px;">
            <span>✨</span> ${isEn ? 'Distribute Fixed Overhead Proportionally (Cost Absorption)' : 'Sabit Gideri İlaç Fiyatlarına Orantılı Dağıt (Maliyet Giydirme)'}
          </h3>
          <p class="section-desc">
            ${isEn ? 
              `When active, <strong>Fixed Clinic Fee (${this.getFixedClinicFee().toFixed(2)} TL)</strong> is not itemized separately on receipts; it is absorbed proportionally into the prices of medications based on their value.` : 
              `Açık olduğunda <strong>Sabit Klinik Gideri (${this.getFixedClinicFee().toFixed(2)} TL)</strong> fişte ayrı bir satır olarak görünmez; ilaçların kendi kârlı tutarları oranında fiyatlarına yedirilir.`
            }
          </p>
          <small style="color:var(--primary); font-weight:700;">
            ${isEn ? '💡 Rule: Profit margin applies strictly to wholesale medication costs; overhead fee is distributed cost-neutral without markup.' : '💡 Kural: Kâr oranı sadece ürünün ham maliyetine uygulanır; sabit gider kârsız yalın tutarıyla paylaştırılır.'}
          </small>
        </div>
        <label class="toggle-switch lg">
          <input type="checkbox" id="distributeFixedExpenseToggle" ${this.distributeFixedExpense ? 'checked' : ''}>
          <span class="toggle-slider"></span>
        </label>
      </div>
    `;
    container.appendChild(distributeCard);

    // Parametre Kartları
    this.parameters.forEach(param => {
      const card = document.createElement('div');
      card.className = `param-item-card ${param.enabled ? '' : 'disabled-opacity'}`;
      card.id = `param-card-${param.id}`;

      let suffix = 'TL';
      if (param.type === 'percent') suffix = '%';
      if (param.type === 'multiplier') suffix = 'TL/km';

      const isProfitMargin = param.id === 'profit_margin';
      const isClinicFee = param.id === 'clinic_fixed_fee';

      const paramTitle = isEn && param.name_en ? param.name_en : param.name;
      const paramDesc = isEn && param.description_en ? param.description_en : (param.description || '');

      let typeDesc = 'Sabit Tutar';
      if (param.type === 'percent') typeDesc = isEn ? 'Percentage' : 'Yüzde Oranı';
      else if (param.type === 'multiplier') typeDesc = isEn ? 'Multiplier' : 'Birim Çarpan';
      else typeDesc = isEn ? 'Fixed Amount' : 'Sabit Tutar';

      card.innerHTML = `
        <div class="param-header-row">
          <div>
            <span class="param-title">
              ${paramTitle}
              ${isClinicFee && this.distributeFixedExpense ? `<span class="badge-masked" style="margin-left:6px;">✨ ${isEn ? 'Distributing' : 'Dağıtımda'}</span>` : ''}
            </span>
            <p class="section-desc">${paramDesc}</p>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            ${param.removable ? `
              <button class="btn btn-outline-danger btn-xs delete-param-btn" data-id="${param.id}" title="${isEn ? 'Delete parameter' : 'Bu parametreyi tamamen sil'}">
                🗑️ ${isEn ? 'Delete' : 'Sil'}
              </button>
            ` : ''}
            <label class="toggle-switch">
              <input type="checkbox" class="param-enable-toggle" data-id="${param.id}" ${param.enabled ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>

        <div class="param-val-input-row">
          <label style="font-size:0.8rem; font-weight:700; color:var(--text-muted);">${isEn ? 'Value / Amount:' : 'Değer / Tutar:'}</label>
          <div class="input-with-suffix" style="max-width: 140px;">
            <input type="number" class="form-input text-bold param-value-input" data-id="${param.id}" value="${param.value}" step="0.5" min="0">
            <span class="input-suffix">${suffix}</span>
          </div>
          <span style="font-size:0.75rem; color:var(--text-muted);">(${typeDesc})</span>
        </div>

        ${!isProfitMargin ? `
          <div class="param-vis-switch-row">
            <div>
              <strong>${isEn ? 'Receipt Display Mode:' : 'Adisyonda Müşteriye Görünme Şekli:'}</strong>
              <div style="font-size:0.72rem; color:var(--text-muted);">
                ${isClinicFee && this.distributeFixedExpense ? 
                  (isEn ? '✨ Distributed into medication prices (Not itemized separately)' : '✨ İlaç fiyatlarına orantılı dağıtılır (Ayrı satır basılmaz)') : 
                  param.visibility === 'masked' ? 
                  (isEn ? '🔒 Grouped under "Other Expenses" header' : '🔒 "Diğer Giderler" başlığı altında toplanır') : 
                  (isEn ? '👁️ Itemized on its own line' : '👁️ Kendi adıyla ayrı satırda listelenir')}
              </div>
            </div>
            <select class="form-select param-vis-select" data-id="${param.id}" style="max-width:200px; padding:6px 10px; font-size:0.78rem;" ${isClinicFee && this.distributeFixedExpense ? 'disabled' : ''}>
              <option value="separate" ${param.visibility === 'separate' ? 'selected' : ''}>👁️ ${isEn ? 'Separate Line' : 'Ayrı Satırda Göster'}</option>
              <option value="masked" ${param.visibility === 'masked' ? 'selected' : ''}>🔒 ${isEn ? 'Group under "Other Expenses"' : '"Diğer Giderler" Olarak Birleştir'}</option>
            </select>
          </div>
        ` : ''}
      `;

      container.appendChild(card);
    });

    this.attachEvents();
  }

  attachEvents() {
    // Distribute toggle
    const distToggle = document.getElementById('distributeFixedExpenseToggle');
    if (distToggle) {
      distToggle.addEventListener('change', (e) => {
        this.setDistributeFixedExpense(e.target.checked);
        this.renderUI();
      });
    }

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
        const id = btn.getAttribute('data-id');
        const isEn = window.i18n && window.i18n.getLanguage() === 'en';
        if (confirm(isEn ? 'Are you sure you want to delete this cost parameter?' : 'Bu maliyet kalemini tamamen kaldırmak istediğinize emin misiniz?')) {
          this.deleteParameter(id);
          this.renderUI();
        }
      });
    });
  }
}

window.paramManager = new ParameterManager();
