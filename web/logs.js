/**
 * VetAssist - Satış & Teklif Geçmişi Log ve Tüketim Raporlama Modülü (logs.js)
 * Adisyonları 'Bekleyen' kuyruğunda saklar, toplu tüketim özeti çıkarır,
 * Google Sheets uyumlu pano/CSV aktarımı sağlar ve stoktan topluca düşüp arşivler.
 */

class LogManager {
  constructor() {
    this.storageKey = 'vetassist_sales_logs_v2';
    this.archiveKey = 'vetassist_archived_logs_v2';
    this.logs = this.loadLogs();
    this.archivedLogs = this.loadArchivedLogs();
    this.activeFilter = 'all'; // 'all' | 'treatment' | 'quote'
    this.searchTerm = '';
  }

  loadLogs() {
    try {
      const saved = localStorage.getItem(this.storageKey) || 
                    localStorage.getItem('sahavet_sales_logs_v2') ||
                    localStorage.getItem('vetassist_sales_logs') ||
                    localStorage.getItem('sahavet_sales_logs') ||
                    localStorage.getItem('vetassist_logs') ||
                    localStorage.getItem('sahavet_logs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          if (!localStorage.getItem(this.storageKey)) {
            localStorage.setItem(this.storageKey, JSON.stringify(parsed));
          }
          return parsed;
        }
      }
    } catch (e) {
      console.error('Aktif loglar yüklenirken hata:', e);
    }
    return [];
  }

  loadArchivedLogs() {
    try {
      const saved = localStorage.getItem(this.archiveKey) ||
                    localStorage.getItem('sahavet_archived_logs_v2') ||
                    localStorage.getItem('vetassist_archived_logs') ||
                    localStorage.getItem('sahavet_archived_logs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          if (!localStorage.getItem(this.archiveKey)) {
            localStorage.setItem(this.archiveKey, JSON.stringify(parsed));
          }
          return parsed;
        }
      }
    } catch (e) {
      console.error('Arşiv logları yüklenirken hata:', e);
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

  saveArchivedLogs() {
    try {
      localStorage.setItem(this.archiveKey, JSON.stringify(this.archivedLogs));
    } catch (e) {
      console.error('Arşiv kaydedilirken hata:', e);
    }
  }

  getAll() {
    return this.logs;
  }

  getArchived() {
    return this.archivedLogs;
  }

  get(id) {
    return this.logs.find(l => l.id === id);
  }

  /**
   * Yeni Satış veya Teklif Kaydı Ekle (Stok anında düşmez, kuyruğa eklenir)
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
      modeLabel: entryData.mode === 'treatment' ? (isEn ? 'Treatment' : 'Tedavi') : (isEn ? 'Quote' : 'Teklif'),
      customer: (entryData.customer || '').trim() || (isEn ? 'General Client' : 'Genel Müşteri'),
      items: entryData.items || [],
      allItems: entryData.allItems || [],
      itemsSummary: entryData.itemsSummary || '',
      distanceKm: entryData.distanceKm || 0,
      distanceTotal: entryData.distanceTotal || 0,
      subTotal: entryData.subTotal || 0,
      isVatEnabled: !!entryData.isVatEnabled,
      vatRate: entryData.vatRate || 18,
      vatAmount: entryData.vatAmount || 0,
      grandTotal: entryData.grandTotal || 0,
      stockDeducted: entryData.mode === 'treatment', // Tedavi modunda adisyon anında yerel stoktan düşüldü
      status: 'pending', // 'pending' | 'processed'
      distributedExpense: !!entryData.distributedExpense,
      partnerId: entryData.partnerId || null, // Syncra cari eşleşmesi (varsa)
      syncraSynced: false // Syncra köprüsüne iletildi mi? (Offline kuyruk)
    };

    // En başa ekle (en yeni kayıt üstte)
    this.logs.unshift(newLog);
    this.saveLogs();
    this.renderUI();

    // Syncra modu aktifse anında göndermeyi dene (internet yoksa kuyrukta bekler)
    if (window.app && typeof window.app.triggerSyncraAutoSync === 'function') {
      window.app.triggerSyncraAutoSync();
    }
    return newLog;
  }

  /**
   * Syncra'ya henüz iletilmemiş kayıtlar (aktif + arşiv). Yalnızca Syncra bağlantı tarihinden sonraki
   * kayıtlar gönderilir; böylece Google Sheets döneminden kalan eski adisyonlar Syncra'da mükerrer satış/stok düşümü yaratmaz.
   */
  getUnsyncedLogs() {
    const since = parseInt(localStorage.getItem('vetassist_syncra_since_v2') || '0', 10);
    if (!since) return [];
    const archivedLogs = [];
    this.archivedLogs.forEach(batch => {
      if (Array.isArray(batch.logs)) archivedLogs.push(...batch.logs);
    });
    const seen = new Set();
    return [...this.logs, ...archivedLogs].filter(l => {
      if (!l || l.syncraSynced || seen.has(l.id)) return false;
      seen.add(l.id);
      return (l.timestamp || 0) >= since;
    });
  }

  markLogsSyncedWithSyncra(ids) {
    const idSet = new Set(ids.map(String));
    let changed = false;
    this.logs.forEach(l => {
      if (idSet.has(String(l.id)) && !l.syncraSynced) { l.syncraSynced = true; changed = true; }
    });
    this.archivedLogs.forEach(batch => {
      (batch.logs || []).forEach(l => {
        if (idSet.has(String(l.id)) && !l.syncraSynced) { l.syncraSynced = true; changed = true; }
      });
    });
    if (changed) {
      this.saveLogs();
      this.saveArchivedLogs();
    }
  }

  updateLogCustomer(id, newCustomer) {
    const log = this.get(id);
    if (log) {
      log.customer = newCustomer.trim();
      this.saveLogs();
      this.renderUI();
    }
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

  /**
   * Bekleyen tedavilerdeki tüm ilaç/malzeme tüketimlerini toplar
   */
  getPendingConsumptions() {
    const summaryMap = new Map(); // key: productName -> { id, name, category, totalQty, currentStock, minStock }

    this.logs.forEach(log => {
      if (log.mode === 'treatment' && Array.isArray(log.items)) {
        log.items.forEach(it => {
          if (!it || !it.name) return;
          const key = it.name.trim();
          const qty = parseFloat(it.qty) || 1;

          if (!summaryMap.has(key)) {
            // Canlı stok bilgisini stockManager'dan al
            let currentStock = 0;
            let minStock = 0;
            let resolvedId = it.id || '';
            let category = it.category || 'Genel';

            if (window.stockManager) {
              const matched = it.id ? window.stockManager.get(it.id) : null;
              const byName = !matched ? window.stockManager.getAll().find(p => p.name.trim().toLowerCase() === key.toLowerCase()) : null;
              const product = matched || byName;
              if (product) {
                resolvedId = product.id;
                currentStock = parseInt(product.currentStock) || 0;
                minStock = parseInt(product.minStock) || 0;
                category = product.category || category;
              }
            }

            summaryMap.set(key, {
              id: resolvedId,
              name: key,
              category: category,
              totalQty: qty,
              currentStock: currentStock,
              minStock: minStock
            });
          } else {
            const existing = summaryMap.get(key);
            existing.totalQty += qty;
          }
        });
      }
    });

    // Array olarak döndür
    return Array.from(summaryMap.values()).map(item => ({
      ...item,
      remainingStock: item.currentStock - item.totalQty
    }));
  }

  /**
   * Toplu Tüketimleri Onaylayıp Stoktan Düşer ve Aktif Geçmişi Arşivler
   */
  deductAndArchive(customConsumptions) {
    const isEn = window.i18n && window.i18n.getLanguage() === 'en';
    const consumptionsToDeduct = customConsumptions || this.getPendingConsumptions();

    // 1. Stoktan Düşüm: Yalnızca adisyon anında henüz düşülmemiş loglar varsa mükerrerliği önleyerek düş
    const isSyncraMode = localStorage.getItem('vetassist_sync_mode_v2') === 'syncra';
    const hasPendingStockDeduction = this.logs.some(l => l.mode === 'treatment' && !l.stockDeducted);
    if (!isSyncraMode && hasPendingStockDeduction && window.stockManager && Array.isArray(consumptionsToDeduct)) {
      consumptionsToDeduct.forEach(ci => {
        const qtyToDeduct = parseFloat(ci.totalQty) || 0;
        if (qtyToDeduct > 0) {
          let targetId = ci.id;
          if (!targetId || targetId.startsWith('custom_')) {
            const found = window.stockManager.getAll().find(p => p.name.trim().toLowerCase() === ci.name.trim().toLowerCase());
            if (found) targetId = found.id;
          }
          if (targetId) {
            window.stockManager.adjustStock(targetId, -qtyToDeduct);
          }
        }
      });
    }

    // 2. Arşive Paket Oluştur
    const now = new Date();
    const dateStr = isEn 
      ? now.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) + ' ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      : now.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    let totalRevenue = 0;
    this.logs.forEach(l => {
      totalRevenue += parseFloat(l.grandTotal) || 0;
      l.stockDeducted = true;
      l.status = 'processed';
      l.processedAt = Date.now();
    });

    const archiveBatch = {
      batchId: 'batch_' + Date.now(),
      archivedAt: Date.now(),
      dateStr: dateStr,
      logsCount: this.logs.length,
      totalRevenue: totalRevenue,
      consumptions: consumptionsToDeduct,
      logs: JSON.parse(JSON.stringify(this.logs))
    };

    this.archivedLogs.unshift(archiveBatch);
    this.saveArchivedLogs();

    // 3. Aktif moda göre senkronizasyon: Syncra (kuyruk) veya Google Sheets (webhook)
    if (isSyncraMode) {
      if (window.app && typeof window.app.triggerSyncraAutoSync === 'function') window.app.triggerSyncraAutoSync();
    } else {
      this.syncToSheetsWebhook(archiveBatch);
    }

    // 4. Aktif Listeyi Sıfırla (Sayaç 0 olur)
    this.logs = [];
    this.saveLogs();
    this.renderUI();

    return archiveBatch;
  }

  /**
   * Google Apps Script Webhook Üzerinden Google Sheets Tablosunu Otomatik Günceller
   */
  async syncToSheetsWebhook(archiveBatch) {
    const isEn = window.i18n && window.i18n.getLanguage() === 'en';
    const sheetsUrl = localStorage.getItem('vetassist_sheets_url_v2') || '';
    if (!sheetsUrl || !sheetsUrl.includes('script.google.com')) {
      return; // Standart CSV export linki ise yalnızca okuma desteklenir
    }

    try {
      const payload = {
        action: 'deduct_and_archive',
        date: archiveBatch.dateStr,
        batchId: archiveBatch.batchId,
        consumptions: archiveBatch.consumptions,
        logs: archiveBatch.logs
      };

      // 1. Yerel test sunucusu proxy üzerinden POST dene
      try {
        const proxyUrl = `/api/proxy-post?url=${encodeURIComponent(sheetsUrl)}`;
        const res = await fetch(proxyUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          if (window.app) {
            window.app.showToast(isEn ? '✅ Google Sheet updated (Stock deducted & History logged)!' : '✅ Google Sheets güncellendi (Stok düşüldü ve Geçmişe eklendi)!');
          }
          return;
        }
      } catch (proxyErr) {
        console.warn('Local proxy post failed, falling back to direct POST:', proxyErr);
      }

      // 2. Doğrudan Google Apps Script endpoint'e POST dene (WebView / Browser)
      await fetch(sheetsUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (window.app) {
        window.app.showToast(isEn ? '✅ Google Sheet sync request sent!' : '✅ Google Sheets güncelleme isteği iletildi!');
      }
    } catch (err) {
      console.error('Google Sheets otomatik yazma hatası:', err);
      if (window.app) {
        window.app.showToast(isEn ? '⚠️ Could not update Google Sheet online.' : '⚠️ Google Sheets online güncellenemedi.');
      }
    }
  }

  /**
   * Google Sheets İçin Panoya Sekmeli (Tab-Separated) Metin Kopyalama
   */
  async exportToClipboard(customConsumptions) {
    const isEn = window.i18n && window.i18n.getLanguage() === 'en';
    const consumptions = customConsumptions || this.getPendingConsumptions();

    let text = isEn ? "=== VETASSIST PERIOD CONSUMPTION REPORT ===\n" : "=== VETASSIST DÖNEM TÜKETİM VE ADİSYON RAPORU ===\n";
    text += (isEn ? "Report Date:\t" : "Rapor Tarihi:\t") + new Date().toLocaleString() + "\n\n";

    // Bölüm 1: Tüketilen İlaç & Sarf Malzeme Özeti
    text += isEn ? "[1] MEDICINE & SUPPLY CONSUMPTION SUMMARY\n" : "[1] İLAÇ VE SARF MALZEME TÜKETİM ÖZETİ\n";
    text += isEn ? "Item_Name\tCategory\tConsumed_Qty\tInitial_Stock\tProjected_Remaining\n" : "Urun_Adi\tKategori\tTuketilen_Miktar\tMevcut_Stok\tKalan_Stok\n";

    consumptions.forEach(c => {
      text += `${c.name}\t${c.category || 'Genel'}\t${c.totalQty}\t${c.currentStock}\t${c.currentStock - c.totalQty}\n`;
    });

    text += "\n";

    // Bölüm 2: Adisyon İşlem Dökümü
    text += isEn ? "[2] DETAILED SALES & RECEIPTS\n" : "[2] DETAYLI ADİSYON İŞLEMLERİ\n";
    text += isEn ? "Date_Time\tType\tCustomer_Name\tItems_Summary\tSubTotal\tVAT\tGrand_Total\n" : "Tarih_Saat\tIslem_Tipi\tMusteri_Adi\tUygulanan_Kalemler\tAra_Toplam\tKDV\tGenel_Toplam\n";

    this.logs.forEach(l => {
      const typeStr = l.mode === 'treatment' ? (isEn ? 'Treatment' : 'Tedavi') : (isEn ? 'Quote' : 'Teklif');
      const kdvStr = l.isVatEnabled ? `${l.vatAmount.toFixed(2)} (${l.vatRate}%)` : (isEn ? 'No VAT' : 'KDV Yok');
      text += `${l.dateStr}\t${typeStr}\t${l.customer}\t${l.itemsSummary}\t${l.subTotal.toFixed(2)}\t${kdvStr}\t${l.grandTotal.toFixed(2)}\n`;
    });

    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    return false;
  }

  /**
   * Dosya İndirme Yardımcısı
   */
  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /**
   * Tekil Arşiv Dönemini İstenen Formatta İndirir (.csv, .json, .txt)
   */
  exportBatch(batch, format = 'csv') {
    if (!batch) return;
    const isEn = window.i18n && window.i18n.getLanguage() === 'en';
    const dateTag = (batch.dateStr || '').replace(/[^0-9a-zA-Z]/g, '_') || Date.now();

    if (format === 'json') {
      const jsonStr = JSON.stringify(batch, null, 2);
      this.downloadFile(jsonStr, `VetAssist_Arsiv_${dateTag}.json`, 'application/json;charset=utf-8;');
      return;
    }

    if (format === 'txt') {
      let txt = "============================================================\n";
      txt += isEn ? " VETASSIST ARCHIVED PERIOD REPORT\n" : " VETASSIST ARSIVLENMIS DONEM RAPORU\n";
      txt += "============================================================\n";
      txt += (isEn ? "Period Date       : " : "Donem Tarihi      : ") + (batch.dateStr || '-') + "\n";
      txt += (isEn ? "Processed Receipts: " : "Islenen Adisyon   : ") + (batch.logsCount || (batch.logs || []).length) + "\n";
      txt += (isEn ? "Total Revenue     : " : "Toplam Ciro       : ") + (window.i18n ? window.i18n.formatMoney(batch.totalRevenue) : (batch.totalRevenue || 0) + " TL") + "\n";
      txt += "============================================================\n\n";

      txt += isEn ? "[1] DEDUCTED MEDICINES & SUPPLIES SUMMARY:\n" : "[1] DUSULEN ILAC VE SARF MALZEME OZETI:\n";
      txt += "------------------------------------------------------------\n";
      (batch.consumptions || []).forEach((c, idx) => {
        txt += `${idx + 1}. ${(c.name || '').padEnd(30, ' ')} : ${c.totalQty} adet | Kategori: ${c.category || 'Genel'}\n`;
      });
      if (!batch.consumptions || batch.consumptions.length === 0) {
        txt += isEn ? "   (No item consumption recorded)\n" : "   (Ilac tuketim kaydi bulunmuyor)\n";
      }

      txt += "\n";
      txt += isEn ? "[2] DETAILED RECEIPTS & TRANSACTIONS:\n" : "[2] DETAYLI ADISYON VE ISLEM KAYITLARI:\n";
      txt += "------------------------------------------------------------\n";
      (batch.logs || []).forEach((l, idx) => {
        const typeStr = l.mode === 'treatment' ? (isEn ? 'Treatment' : 'Tedavi') : (isEn ? 'Quote' : 'Teklif');
        txt += `#${idx + 1} [${l.dateStr}] - ${l.customer || (isEn ? 'Anonymous' : 'Musteri Belirtilmedi')} (${typeStr})\n`;
        txt += `   Kalemler: ${l.itemsSummary || '-'}\n`;
        txt += `   Tutar   : ${l.grandTotal} TL\n`;
        txt += "------------------------------------------------------------\n";
      });

      this.downloadFile(txt, `VetAssist_Rapor_${dateTag}.txt`, 'text/plain;charset=utf-8;');
      return;
    }

    // Default: CSV
    let csv = isEn ? 'VETASSIST ARCHIVED PERIOD REPORT\n\n' : 'VETASSIST ARSIVLENMIS DONEM RAPORU\n\n';
    csv += (isEn ? 'Period_Date,' : 'Donem_Tarihi,') + `"${batch.dateStr || ''}"\n`;
    csv += (isEn ? 'Total_Revenue,' : 'Toplam_Ciro,') + `${batch.totalRevenue || 0}\n\n`;

    csv += isEn ? '--- CONSUMPTIONS ---\nItem_Name,Category,Consumed_Qty,Initial_Stock,Remaining_Stock\n' : '--- DUSULEN ILACLAR ---\nUrun_Adi,Kategori,Tuketilen_Miktar,Mevcut_Stok,Kalan_Stok\n';
    (batch.consumptions || []).forEach(c => {
      csv += `"${(c.name || '').replace(/"/g, '""')}","${c.category || 'Genel'}",${c.totalQty},${c.currentStock || 0},${(c.currentStock || 0) - c.totalQty}\n`;
    });

    csv += '\n--- ADISYON DETAYLARI ---\nTarih_Saat,Islem_Tipi,Musteri_Detay,Satilan_Kalemler,Ara_Toplam,KDV,Genel_Toplam,Durum\n';
    (batch.logs || []).forEach(log => {
      const itemsEscaped = `"${(log.itemsSummary || '').replace(/"/g, '""')}"`;
      const custEscaped = `"${(log.customer || '').replace(/"/g, '""')}"`;
      const typeStr = log.mode === 'treatment' ? (isEn ? 'Applied Treatment' : 'Uygulanan Tedavi') : (isEn ? 'Price Quote' : 'Fiyat Teklifi');
      const kdvStr = log.isVatEnabled ? `${log.vatAmount} TL (%${log.vatRate})` : 'KDV Yok';
      csv += `"${log.dateStr}","${typeStr}",${custEscaped},${itemsEscaped},${log.subTotal},"${kdvStr}",${log.grandTotal},"Stoktan Dusuldu"\n`;
    });

    this.downloadFile("\uFEFF" + csv, `VetAssist_Arsiv_${dateTag}.csv`, 'text/csv;charset=utf-8;');
  }

  /**
   * Tüm Arşivleri Topluca İstenen Formatta İndirir (.csv, .json, .txt)
   */
  exportAllArchives(format = 'csv') {
    const isEn = window.i18n && window.i18n.getLanguage() === 'en';
    const archived = this.archivedLogs || [];
    if (archived.length === 0) {
      alert(isEn ? 'No archives to export.' : 'Dışa aktarılacak geçmiş arşiv bulunmuyor.');
      return;
    }

    const dateTag = new Date().toISOString().slice(0, 10);

    if (format === 'json') {
      const jsonStr = JSON.stringify(archived, null, 2);
      this.downloadFile(jsonStr, `VetAssist_Tum_Arsivler_${dateTag}.json`, 'application/json;charset=utf-8;');
      return;
    }

    if (format === 'txt') {
      let txt = "============================================================\n";
      txt += isEn ? " VETASSIST ALL ARCHIVED PERIODS REPORT\n" : " VETASSIST TUM ARSIVLENMIS DONEMLER RAPORU\n";
      txt += "============================================================\n\n";

      archived.forEach((batch, bIdx) => {
        txt += `=== DONEM #${bIdx + 1}: ${batch.dateStr} ===\n`;
        txt += `Islenen Adisyon: ${batch.logsCount || (batch.logs || []).length} | Toplam Ciro: ${batch.totalRevenue || 0} TL\n`;
        txt += "Dusulen Ilaclar: " + (batch.consumptions || []).map(c => `${c.totalQty}x ${c.name}`).join(', ') + "\n";
        txt += "------------------------------------------------------------\n\n";
      });

      this.downloadFile(txt, `VetAssist_Tum_Arsivler_${dateTag}.txt`, 'text/plain;charset=utf-8;');
      return;
    }

    // Default: CSV
    let csv = isEn ? 'VETASSIST ALL ARCHIVES\n\n' : 'VETASSIST TUM DONEM ARSIVLERI\n\n';
    csv += 'Donem_Tarihi,Adisyon_Tarih_Saat,Islem_Tipi,Musteri_Detay,Satilan_Kalemler,Ara_Toplam,KDV,Genel_Toplam\n';
    archived.forEach(batch => {
      (batch.logs || []).forEach(log => {
        const itemsEscaped = `"${(log.itemsSummary || '').replace(/"/g, '""')}"`;
        const custEscaped = `"${(log.customer || '').replace(/"/g, '""')}"`;
        const typeStr = log.mode === 'treatment' ? (isEn ? 'Treatment' : 'Tedavi') : (isEn ? 'Quote' : 'Teklif');
        const kdvStr = log.isVatEnabled ? `${log.vatAmount} TL (%${log.vatRate})` : 'KDV Yok';
        csv += `"${batch.dateStr}","${log.dateStr}","${typeStr}",${custEscaped},${itemsEscaped},${log.subTotal},"${kdvStr}",${log.grandTotal}\n`;
      });
    });

    this.downloadFile("\uFEFF" + csv, `VetAssist_Tum_Arsivler_${dateTag}.csv`, 'text/csv;charset=utf-8;');
  }

  /**
   * Aktif / Bekleyen Geçmiş Adisyonlarını İstenen Formatta İndirir
   */
  exportPendingLogs(format = 'csv', customConsumptions = null) {
    const isEn = window.i18n && window.i18n.getLanguage() === 'en';
    const consumptions = customConsumptions || this.getPendingConsumptions();
    const dateTag = new Date().toISOString().slice(0, 10);

    if (format === 'json') {
      const data = {
        exportedAt: new Date().toISOString(),
        pendingConsumptions: consumptions,
        logs: this.logs
      };
      this.downloadFile(JSON.stringify(data, null, 2), `VetAssist_Gecmis_${dateTag}.json`, 'application/json;charset=utf-8;');
      return;
    }

    if (format === 'txt') {
      let txt = "============================================================\n";
      txt += isEn ? " VETASSIST CURRENT PERIOD REPORT\n" : " VETASSIST AKTIF DONEM RAPORU\n";
      txt += "============================================================\n";
      txt += (isEn ? "Date: " : "Tarih: ") + new Date().toLocaleString() + "\n\n";

      txt += isEn ? "[1] CONSUMPTION SUMMARY:\n" : "[1] TUKETIM OZETI:\n";
      consumptions.forEach(c => {
        txt += `• ${(c.name || '').padEnd(28, ' ')} : ${c.totalQty} adet\n`;
      });

      txt += "\n" + (isEn ? "[2] SALES DETAILS:\n" : "[2] ADISYON DETAYLARI:\n");
      this.logs.forEach((l, i) => {
        txt += `#${i + 1} ${l.dateStr} | ${l.customer} | ${l.itemsSummary} | ${l.grandTotal} TL\n`;
      });

      this.downloadFile(txt, `VetAssist_Gecmis_${dateTag}.txt`, 'text/plain;charset=utf-8;');
      return;
    }

    // Default: CSV
    this.exportCsv(customConsumptions);
  }

  /**
   * Google Sheets / Excel Uyumlu CSV Olarak İndir (Mevcut Aktif Dönem)
   */
  exportCsv(customConsumptions) {
    const isEn = window.i18n && window.i18n.getLanguage() === 'en';
    const consumptions = customConsumptions || this.getPendingConsumptions();

    let csv = isEn ? 'VETASSIST PERIOD CONSUMPTION & SALES REPORT\n\n' : 'VETASSIST DONEM TUKETIM VE ADISYON RAPORU\n\n';
    
    // 1. Tüketimler Tablosu
    csv += isEn ? '--- CONSUMPTION SUMMARY ---\nItem_Name,Category,Consumed_Qty,Current_Stock,Remaining_Stock\n' : '--- ILAC VE SARF TUKETIM OZETI ---\nUrun_Adi,Kategori,Tuketilen_Miktar,Mevcut_Stok,Kalan_Stok\n';
    consumptions.forEach(c => {
      csv += `"${(c.name || '').replace(/"/g, '""')}","${c.category || 'Genel'}",${c.totalQty},${c.currentStock},${c.currentStock - c.totalQty}\n`;
    });

    csv += '\n\n';

    // 2. Adisyonlar Tablosu
    csv += isEn 
      ? '--- DETAILED TRANSACTIONS ---\nDate_Time,Transaction_Type,Customer_Name,Items_Summary,SubTotal,VAT,Grand_Total,Status\n'
      : '--- DETAYLI ADISYON LISTESI ---\nTarih_Saat,Islem_Tipi,Musteri_Detay,Satilan_Kalemler,Ara_Toplam,KDV,Genel_Toplam,Durum\n';
    
    this.logs.forEach(log => {
      const itemsEscaped = `"${(log.itemsSummary || '').replace(/"/g, '""')}"`;
      const custEscaped = `"${(log.customer || '').replace(/"/g, '""')}"`;
      const typeStr = log.mode === 'treatment' ? (isEn ? 'Applied Treatment' : 'Uygulanan Tedavi') : (isEn ? 'Price Quote' : 'Fiyat Teklifi');
      const statusStr = log.stockDeducted ? (isEn ? 'Deducted & Archived' : 'Stoktan Düşüldü') : (isEn ? 'Pending Deduction' : 'Bekliyor');
      const kdvStr = log.isVatEnabled ? `${log.vatAmount.toFixed(2)} TL (%${log.vatRate})` : (isEn ? 'No VAT' : 'KDV Yok');

      csv += `"${log.dateStr}","${typeStr}",${custEscaped},${itemsEscaped},${log.subTotal.toFixed(2)},"${kdvStr}",${log.grandTotal.toFixed(2)},"${statusStr}"\n`;
    });

    this.downloadFile("\uFEFF" + csv, `VetAssist_${isEn ? 'Period_Report' : 'Donem_Raporu'}_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8;');
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

    // Üst bar rozeti: Sadece bekleyen aktif işlem sayısını gösterir
    if (logsCountBadge) {
      if (this.logs.length > 0) {
        logsCountBadge.textContent = this.logs.length;
        logsCountBadge.style.display = 'inline-block';
      } else {
        logsCountBadge.style.display = 'none';
      }
    }

    // Dönem Sonu Raporu Hero Banner görünürlüğü
    const reportHero = document.getElementById('reportActionHero');
    if (reportHero) {
      if (treatmentCount > 0) {
        reportHero.style.display = 'flex';
      } else {
        reportHero.style.display = 'none';
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
      const hasArchive = this.archivedLogs.length > 0;
      container.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">📜</span>
          <p>${window.i18n ? window.i18n.t('logs_empty_title') : 'Henüz bekleyen satış veya fiyat teklifi bulunmuyor.'}</p>
          <small>${window.i18n ? window.i18n.t('logs_empty_sub') : 'Adisyon oluşturduğunuzda işlemler burada toplanır ve gün sonunda topluca raporlanıp stoktan düşülür.'}</small>
          ${hasArchive ? `<div style="margin-top:10px;"><button type="button" id="openArchiveFromEmptyBtn" class="btn btn-outline-primary btn-xs">📦 ${isEn ? 'View Past Archives' : 'Geçmiş Arşivleri Görüntüle'} (${this.archivedLogs.length})</button></div>` : ''}
        </div>
      `;
      const archiveBtn = document.getElementById('openArchiveFromEmptyBtn');
      if (archiveBtn) {
        archiveBtn.addEventListener('click', () => {
          if (window.app && typeof window.app.openArchiveModal === 'function') {
            window.app.openArchiveModal();
          }
        });
      }
      return;
    }

    container.innerHTML = '';
    filtered.forEach((log, index) => {
      const isTreatment = log.mode === 'treatment';
      const card = document.createElement('div');
      card.className = `log-item-card ${isTreatment ? 'log-treatment' : 'log-quote'}`;
      
      const badgeText = isTreatment 
        ? (window.i18n ? window.i18n.t('log_treatment_badge') : (isEn ? 'Treatment' : 'Tedavi')) 
        : (window.i18n ? window.i18n.t('log_quote_badge') : (isEn ? 'Quote' : 'Teklif'));

      const stockStatusText = isTreatment
        ? (window.i18n ? window.i18n.t('log_status_pending') : (isEn ? '⏳ Pending Stock Deduction' : '⏳ Stok Düşümü Bekliyor'))
        : (isEn ? 'Quote (No Stock)' : 'Teklif (Stok Etkilemez)');

      const expenseBadge = log.distributedExpense 
        ? `<span class="badge-masked" style="margin-left:6px;">✨ ${isEn ? 'Overhead Distributed' : 'Gider Giydirildi'}</span>` 
        : '';

      card.innerHTML = `
        <div class="log-header-row">
          <div class="log-header-left">
            <span class="log-type-badge ${isTreatment ? 'badge-treatment' : 'badge-quote'}">
              ${isTreatment 
                ? `<svg class="pet-svg pet-svg-xs" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="13" fill="currentColor" fill-opacity="0.25" stroke="currentColor" stroke-width="2.2"/><path d="M12 7H20V12H25V20H20V25H12V20H7V12H12V7Z" fill="currentColor" fill-opacity="0.4" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M13 13L16 19L19 13" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
                : `<svg class="pet-svg pet-svg-xs" viewBox="0 0 32 32" fill="none"><rect x="7" y="5" width="18" height="22" rx="2" fill="currentColor" fill-opacity="0.25" stroke="currentColor" stroke-width="2.2"/><line x1="11" y1="11" x2="21" y2="11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="11" y1="16" x2="17" y2="16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`
              }
              <span>${badgeText}</span>
            </span>
            <span class="log-customer-name">
              <svg class="pet-svg pet-svg-xs" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="11" r="5" fill="currentColor" fill-opacity="0.2" stroke="currentColor" stroke-width="2"/><path d="M7 27C7 22.5 11 19 16 19C21 19 25 22.5 25 27" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
              <span>${log.customer}</span>
            </span>
          </div>
          <div class="log-header-right">
            <span class="log-date-text">
              <svg class="pet-svg pet-svg-xs" viewBox="0 0 32 32" fill="none"><rect x="5" y="7" width="22" height="20" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><line x1="5" y1="13" x2="27" y2="13" stroke="currentColor" stroke-width="2"/><line x1="10" y1="4" x2="10" y2="8" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><line x1="22" y1="4" x2="22" y2="8" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>
              <span>${log.dateStr}</span>
            </span>
            <div style="display:flex; gap:4px;">
              <button class="btn btn-outline-secondary btn-xs edit-log-btn" data-id="${log.id}" title="${isEn ? 'Edit Customer' : 'Müşteri Adını Düzenle'}">
                ✏️
              </button>
              <button class="btn btn-outline-danger btn-xs delete-log-btn" data-id="${log.id}" title="${isEn ? 'Delete Record' : 'Kaydı Sil'}">
                <svg class="pet-svg pet-svg-xs" viewBox="0 0 32 32" fill="none"><path d="M8 10H24M12 10V7C12 6.4 12.4 6 13 6H19C19.6 6 20 6.4 20 7V10M10 10L11.5 25C11.6 25.6 12.1 26 12.7 26H19.3C19.9 26 20.4 25.6 20.5 25L22 10" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
            </div>
          </div>
        </div>

        <div class="log-summary-content">
          <div class="log-items-text">
            <strong>${isEn ? 'Items:' : 'Kalemler:'}</strong> ${log.itemsSummary || (isEn ? 'No item details' : 'Kalem detayı yok')}
          </div>
        </div>

        <div class="log-footer-row">
          <div class="log-stock-status">
            <span class="${isTreatment ? 'status-stock-pending' : 'status-stock-fixed'}">
              <span>${stockStatusText}</span>
            </span>
            ${expenseBadge}
          </div>
          <div class="log-total-info">
            ${log.isVatEnabled ? `<small class="text-muted">(${isEn ? 'Incl. VAT' : 'KDV Dahil'}) </small>` : ''}
            <strong class="log-grand-amount text-mono">${window.i18n ? window.i18n.formatMoney(log.grandTotal) : parseFloat(log.grandTotal).toFixed(2) + ' TL'}</strong>
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
        if (confirm(isEn ? 'Are you sure you want to delete this log entry?' : 'Bu işlem kaydını silmek istediğinize emin misiniz?')) {
          this.deleteLog(id);
        }
      });
    });

    // Edit handlers
    container.querySelectorAll('.edit-log-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const log = this.get(id);
        if (log) {
          const newName = prompt(isEn ? 'Enter updated client / patient name:' : 'Güncel hasta sahibi / müşteri adı:', log.customer);
          if (newName !== null) {
            this.updateLogCustomer(id, newName);
          }
        }
      });
    });
  }
}

window.logManager = new LogManager();
