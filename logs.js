/**
 * SahaVeteriner - Satış & Teklif Geçmişi Log Modülü (logs.js)
 * Yapılan tedavileri ve verilen fiyat tekliflerini yerel hafızada saklar,
 * filtrelenebilir liste sunar, CSV olarak dışa aktarır ve Google Sheets formatına hazırlar.
 */

class LogManager {
  constructor() {
    this.storageKey = 'sahavet_sales_logs_v2';
    this.logs = this.loadLogs();
    this.activeFilter = 'all'; // 'all' | 'treatment' | 'quote'
    this.searchTerm = '';
  }

  loadLogs() {
    try {
      const saved = localStorage.getItem(this.storageKey);
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
    const now = new Date();
    const dateStr = now.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' +
                    now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    const newLog = {
      id: 'log_' + Date.now(),
      timestamp: Date.now(),
      dateStr: dateStr,
      mode: entryData.mode || 'treatment', // 'treatment' | 'quote'
      modeLabel: entryData.mode === 'treatment' ? 'Uygulanan Tedavi' : 'Fiyat Teklifi',
      customer: (entryData.customer || '').trim() || 'Genel Müşteri',
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

    if (kpiTreatmentEl) kpiTreatmentEl.textContent = `${treatmentTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`;
    if (kpiQuoteEl) kpiQuoteEl.textContent = `${quoteTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`;
    if (kpiTotalLogsEl) kpiTotalLogsEl.textContent = `${this.logs.length} İşlem (${treatmentCount} Tedavi / ${quoteCount} Teklif)`;
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
    const container = document.getElementById('salesLogsList');
    if (!container) return;

    const filtered = this.getFilteredLogs();

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">📜</span>
          <p>Henüz kayıtlı satış veya fiyat teklifi bulunmuyor.</p>
          <small>Adisyon oluşturup onayladığınızda veya paylaştığınızda işlemleriniz burada arşivlenir.</small>
        </div>
      `;
      return;
    }

    container.innerHTML = '';
    filtered.forEach(log => {
      const isTreatment = log.mode === 'treatment';
      const card = document.createElement('div');
      card.className = `log-item-card ${isTreatment ? 'log-treatment' : 'log-quote'}`;
      
      card.innerHTML = `
        <div class="log-header-row">
          <div class="log-header-left">
            <span class="log-type-badge ${isTreatment ? 'badge-treatment' : 'badge-quote'}">
              ${isTreatment ? '💉 Uygulanan Tedavi' : '📄 Fiyat Teklifi'}
            </span>
            <span class="log-customer-name">👤 ${log.customer}</span>
          </div>
          <div class="log-header-right">
            <span class="log-date-text">📅 ${log.dateStr}</span>
            <button class="btn btn-outline-danger btn-xs delete-log-btn" data-id="${log.id}" title="Kaydı Sil">🗑️</button>
          </div>
        </div>

        <div class="log-summary-content">
          <div class="log-items-text">
            <strong>Kalemler:</strong> ${log.itemsSummary || 'Kalem detayı yok'}
          </div>
        </div>

        <div class="log-footer-row">
          <div class="log-stock-status">
            ${log.stockDeducted 
              ? '<span class="status-stock-deducted">✅ Stoktan Düşüldü</span>' 
              : '<span class="status-stock-fixed">🔒 Stoklar Sabit Kaldı</span>'}
            ${log.distributedExpense ? '<span class="badge-masked" style="margin-left:6px;">✨ Gider Giydirildi</span>' : ''}
          </div>
          <div class="log-total-info">
            ${log.isVatEnabled ? `<small class="text-muted">(KDV Dahil) </small>` : ''}
            <strong class="log-grand-amount text-mono">${parseFloat(log.grandTotal).toFixed(2)} TL</strong>
          </div>
        </div>
      `;

      container.appendChild(card);
    });

    // Delete handlers
    container.querySelectorAll('.delete-log-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        if (confirm('Bu işlem kaydını silmek istediğinize emin misiniz?')) {
          this.deleteLog(id);
        }
      });
    });
  }

  /**
   * Google Sheets / Excel Uyumlu CSV Olarak İndir (Satis_Loglari.csv)
   * Kolonlar: Tarih_Saat, Islem_Tipi, Musteri_Detay, Satilan_Kalemler, Ara_Toplam, KDV, Genel_Toplam, Stok_Dustu
   */
  exportCsv() {
    let csv = 'Tarih_Saat,Islem_Tipi,Musteri_Detay,Satilan_Kalemler,Ara_Toplam,KDV,Genel_Toplam,Stok_Dustu\n';
    
    this.logs.forEach(log => {
      const itemsEscaped = `"${(log.itemsSummary || '').replace(/"/g, '""')}"`;
      const custEscaped = `"${(log.customer || '').replace(/"/g, '""')}"`;
      const typeStr = log.mode === 'treatment' ? 'Uygulanan Tedavi' : 'Fiyat Teklifi';
      const stockStr = log.stockDeducted ? 'EVET' : 'HAYIR';
      const kdvStr = log.isVatEnabled ? `${log.vatAmount.toFixed(2)} TL (%${log.vatRate})` : 'KDV Yok';

      csv += `"${log.dateStr}","${typeStr}",${custEscaped},${itemsEscaped},${log.subTotal.toFixed(2)},"${kdvStr}",${log.grandTotal.toFixed(2)},"${stockStr}"\n`;
    });

    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' }); // UTF-8 BOM for Turkish Excel
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `SahaVeteriner_Satis_Loglari_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

window.logManager = new LogManager();
