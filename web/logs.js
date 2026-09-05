/**
 * VetAssist - Satış & Teklif Geçmişi Log Modülü (logs.js)
 * Yapılan tedavileri ve verilen fiyat tekliflerini yerel hafızada saklar,
 * filtrelenebilir liste sunar, CSV olarak dışa aktarır ve Google Sheets formatına hazırlar.
 */

class LogManager {
  constructor() {
    this.storageKey = 'vetassist_sales_logs_v2';
    this.logs = this.loadLogs();
    this.activeFilter = 'all'; // 'all' | 'treatment' | 'quote'
    this.searchTerm = '';
  }

  loadLogs() {
    try {
      const saved = localStorage.getItem(this.storageKey) || localStorage.getItem('sahavet_sales_logs_v2');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Loglar yüklenirken hata:', e);
    }
    return [];
  }

  saveLogs() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.logs));
      this.updateKPIs();
    } catch (e) {
      console.error('Loglar kaydedilirken hata:', e);
    }
  }

  getAll() {
    return this.logs;
  }

  get(id) {
    return this.logs.find(l => l.id === id);
  }

  /**
   * Yeni Satış veya Teklif Kaydı Ekle
   */
  addLog(entryData) {
    const isEn = window.i18n && window.i18n.getLanguage() === 'en';
    const now = new Date();
    const dateStr = isEn 
      ? now.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) + ' ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      : now.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    const newLog = {
      id: 'log_' + Date.now(),
      timestamp: Date.now(),
      dateStr: dateStr,
      mode: entryData.mode || 'treatment', // 'treatment' | 'quote'
      modeLabel: entryData.mode === 'treatment' ? (isEn ? 'Applied Treatment' : 'Uygulanan Tedavi') : (isEn ? 'Price Quote' : 'Fiyat Teklifi'),
      customer: (entryData.customer || '').trim() || (isEn ? 'General Client' : 'Genel Müşteri'),
      items: entryData.items || [],
      itemsSummary: entryData.itemsSummary || '',
      distanceKm: entryData.distanceKm || 0,
      distanceTotal: entryData.distanceTotal || 0,
      subTotal: entryData.subTotal || 0,
      isVatEnabled: !!entryData.isVatEnabled,
      vatRate: entryData.vatRate || 18,
      vatAmount: entryData.vatAmount || 0,
      grandTotal: entryData.grandTotal || 0,
      stockDeducted: entryData.mode === 'treatment',
      distributedExpense: !!entryData.distributedExpense
    };

    // En başa ekle (en yeni kayıt üstte)
    this.logs.unshift(newLog);
    this.saveLogs();
    this.renderUI();
    return newLog;
  }

  deleteLog(id) {
    this.logs = this.logs.filter(l => l.id !== id);
    this.saveLogs();
    this.renderUI();
  }

  clearAll() {
    this.logs = [];
    this.saveLogs();
    this.renderUI();
  }

  getFilteredLogs() {
    return this.logs.filter(log => {
      if (this.activeFilter === 'treatment' && log.mode !== 'treatment') return false;
      if (this.activeFilter === 'quote' && log.mode !== 'quote') return false;

      if (this.searchTerm) {
        const term = this.searchTerm.toLowerCase();
        const matchCust = log.customer.toLowerCase().includes(term);
        const matchSummary = log.itemsSummary.toLowerCase().includes(term);
        const matchDate = log.dateStr.toLowerCase().includes(term);
        if (!matchCust && !matchSummary && !matchDate) return false;
      }

      return true;
    });
  }

  updateKPIs() {
    const isEn = window.i18n && window.i18n.getLanguage() === 'en';
    let treatmentTotal = 0;
    let quoteTotal = 0;
    let treatmentCount = 0;
    let quoteCount = 0;

    this.logs.forEach(l => {
      if (l.mode === 'treatment') {
        treatmentTotal += (parseFloat(l.grandTotal) || 0);
        treatmentCount++;
      } else {
        quoteTotal += (parseFloat(l.grandTotal) || 0);
        quoteCount++;
      }
    });

    const kpiTreatmentEl = document.getElementById('kpiTreatmentRevenue');
    const kpiQuoteEl = document.getElementById('kpiQuoteRevenue');
    const kpiTotalLogsEl = document.getElementById('kpiTotalLogsCount');
    const logsCountBadge = document.getElementById('logsCountBadge');

    if (kpiTreatmentEl) kpiTreatmentEl.textContent = window.i18n ? window.i18n.formatMoney(treatmentTotal) : `${treatmentTotal.toFixed(2)} TL`;
    if (kpiQuoteEl) kpiQuoteEl.textContent = window.i18n ? window.i18n.formatMoney(quoteTotal) : `${quoteTotal.toFixed(2)} TL`;
    
    if (kpiTotalLogsEl) {
      if (window.i18n) {
        kpiTotalLogsEl.textContent = window.i18n.t('logs_count_text', {
          total: this.logs.length,
          treatment: treatmentCount,
          quote: quoteCount
        });
      } else {
        kpiTotalLogsEl.textContent = `${this.logs.length} İşlem (${treatmentCount} Tedavi / ${quoteCount} Teklif)`;
      }
    }

    if (logsCountBadge) {
      if (this.logs.length > 0) {
        logsCountBadge.textContent = this.logs.length;
        logsCountBadge.style.display = 'inline-block';
      } else {
        logsCountBadge.style.display = 'none';
      }
    }
  }

  renderUI() {
    this.updateKPIs();
    const isEn = window.i18n && window.i18n.getLanguage() === 'en';
    const container = document.getElementById('salesLogsList');
    if (!container) return;

    const filtered = this.getFilteredLogs();

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">📜</span>
          <p>${window.i18n ? window.i18n.t('logs_empty_title') : 'Henüz kayıtlı satış veya fiyat teklifi bulunmuyor.'}</p>
          <small>${window.i18n ? window.i18n.t('logs_empty_sub') : 'Adisyon oluşturup onayladığınızda veya paylaştığınızda işlemleriniz burada arşivlenir.'}</small>
        </div>
      `;
      return;
    }

    container.innerHTML = '';
    filtered.forEach((log, index) => {
      const isTreatment = log.mode === 'treatment';
      const card = document.createElement('div');
      card.className = `log-item-card ${isTreatment ? 'log-treatment' : 'log-quote'}`;
      
      const badgeText = isTreatment 
        ? (isEn ? '💉 Applied Treatment' : '💉 Uygulanan Tedavi') 
        : (isEn ? '📄 Price Quote' : '📄 Fiyat Teklifi');

      const stockStatusText = log.stockDeducted 
        ? (isEn ? '✅ Stock Deducted' : '✅ Stoktan Düşüldü') 
        : (isEn ? '🔒 Stock Unchanged' : '🔒 Stoklar Sabit Kaldı');

      const expenseBadge = log.distributedExpense 
        ? `<span class="badge-masked" style="margin-left:6px;">✨ ${isEn ? 'Overhead Distributed' : 'Gider Giydirildi'}</span>` 
        : '';

      card.innerHTML = `
        <div class="log-header-row">
          <div class="log-header-left">
            <span class="log-type-badge ${isTreatment ? 'badge-treatment' : 'badge-quote'}">
              ${badgeText}
            </span>
            <span class="log-customer-name">👤 ${log.customer}</span>
          </div>
          <div class="log-header-right">
            <span class="log-date-text">📅 ${log.dateStr}</span>
            <button class="btn btn-outline-danger btn-xs delete-log-btn" data-id="${log.id}" title="${isEn ? 'Delete Record' : 'Kaydı Sil'}">🗑️</button>
          </div>
        </div>

        <div class="log-summary-content">
          <div class="log-items-text">
            <strong>${isEn ? 'Items:' : 'Kalemler:'}</strong> ${log.itemsSummary || (isEn ? 'No item details' : 'Kalem detayı yok')}
          </div>
        </div>

        <div class="log-footer-row">
          <div class="log-stock-status">
            <span class="${log.stockDeducted ? 'status-stock-deducted' : 'status-stock-fixed'}">${stockStatusText}</span>
            ${expenseBadge}
          </div>
          <div class="log-total-info">
            ${log.isVatEnabled ? `<small class="text-muted">(${isEn ? 'Incl. VAT' : 'KDV Dahil'}) </small>` : ''}
            <strong class="log-grand-amount text-mono">${window.i18n ? window.i18n.formatMoney(log.grandTotal) : parseFloat(log.grandTotal).toFixed(2) + ' TL'}</strong>
          </div>
        </div>
      `;

      container.appendChild(card);

      // Organic Glass Inline Ad Banner (Banner #3) after 3rd log entry or at bottom
      if (index === 2 || (filtered.length < 3 && index === filtered.length - 1)) {
        const adCard = document.createElement('div');
        adCard.className = 'inline-ad-card';
        adCard.innerHTML = `
          <div class="inline-ad-header">
            <span class="ad-pill-badge">${isEn ? 'SPONSORED / AD' : 'SPONSOR / TAVSİYE'}</span>
            <small style="color:var(--text-muted); font-size:0.7rem;">VetAssist Partner</small>
          </div>
          <div class="inline-ad-body">
            <div class="inline-ad-icon">📊</div>
            <div class="inline-ad-content">
              <div class="inline-ad-title">${isEn ? 'Veterinary Clinic Management & E-Prescription' : 'Veteriner Klinik Yönetim & E-Reçete Çözümleri'}</div>
              <div class="inline-ad-subtitle">${isEn ? 'Automatic patient record archiving, integrated SMS reminders and accounting.' : 'Otomatik hasta geçmişi arşivleme, e-reçete ve hızlı cari hesap takibi.'}</div>
            </div>
          </div>
        `;
        container.appendChild(adCard);
      }
    });

    // Delete handlers
    container.querySelectorAll('.delete-log-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        if (confirm(isEn ? 'Are you sure you want to delete this log entry?' : 'Bu işlem kaydını silmek istediğinize emin misiniz?')) {
          this.deleteLog(id);
        }
      });
    });
  }

  /**
   * Google Sheets / Excel Uyumlu CSV Olarak İndir (Sales_Logs.csv)
   */
  exportCsv() {
    const isEn = window.i18n && window.i18n.getLanguage() === 'en';
    let csv = isEn 
      ? 'Date_Time,Transaction_Type,Customer_Name,Items_Summary,SubTotal,VAT,Grand_Total,Stock_Deducted\n'
      : 'Tarih_Saat,Islem_Tipi,Musteri_Detay,Satilan_Kalemler,Ara_Toplam,KDV,Genel_Toplam,Stok_Dustu\n';
    
    this.logs.forEach(log => {
      const itemsEscaped = `"${(log.itemsSummary || '').replace(/"/g, '""')}"`;
      const custEscaped = `"${(log.customer || '').replace(/"/g, '""')}"`;
      const typeStr = isTreatmentType(log.mode, isEn);
      const stockStr = log.stockDeducted ? (isEn ? 'YES' : 'EVET') : (isEn ? 'NO' : 'HAYIR');
      const kdvStr = log.isVatEnabled ? `${log.vatAmount.toFixed(2)} TL (%${log.vatRate})` : (isEn ? 'No VAT' : 'KDV Yok');

      csv += `"${log.dateStr}","${typeStr}",${custEscaped},${itemsEscaped},${log.subTotal.toFixed(2)},"${kdvStr}",${log.grandTotal.toFixed(2)},"${stockStr}"\n`;
    });

    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' }); // UTF-8 BOM for Excel
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `VetAssist_${isEn ? 'Sales_Logs' : 'Satis_Loglari'}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

function isTreatmentType(mode, isEn) {
  if (mode === 'treatment') return isEn ? 'Applied Treatment' : 'Uygulanan Tedavi';
  return isEn ? 'Price Quote' : 'Fiyat Teklifi';
}

window.logManager = new LogManager();
