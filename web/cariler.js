// web/cariler.js - VetAssist Ultra-Sade Cari & Bakiye Yönetimi
// Minimalist: Sadece İsim, Rol Rozeti, Açık Bakiye + Sabit Alt Toplamlar + Eşik Uyarısı

class CarilerManager {
  constructor() {
    this.thresholdKey = 'vetassist_receivable_threshold';
    this.currentThreshold = parseFloat(localStorage.getItem(this.thresholdKey)) || 50000;
    this.currentFilter = 'all'; // 'all' | 'debtors' | 'creditors' | 'zero'
    this.sortMode = 'debt_desc'; // 'debt_desc' | 'name_asc'
    this.searchQuery = '';

    // Sayfa DOM yüklendiğinde başlat
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      setTimeout(() => this.init(), 50);
    }
  }

  init() {
    this.bindDrawerElements();
    this.bindModalElements();
    this.checkThreshold();
  }

  // 1. Menü Çekmecesi (Settings Drawer) Bileşenleri
  bindDrawerElements() {
    const inputThreshold = document.getElementById('settingReceivableThreshold');
    if (inputThreshold) {
      inputThreshold.value = this.currentThreshold;
      inputThreshold.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value) || 0;
        this.currentThreshold = val;
        localStorage.setItem(this.thresholdKey, val.toString());
        this.checkThreshold();
        this.updateModalTotals();
      });
    }

    const btnOpen = document.getElementById('btnOpenCarilerModal');
    if (btnOpen) {
      btnOpen.addEventListener('click', () => {
        this.openModal();
      });
    }

    const btnOpenFromLogs = document.getElementById('btnOpenCarilerFromLogs');
    if (btnOpenFromLogs) {
      btnOpenFromLogs.addEventListener('click', () => {
        this.openModal();
      });
    }
  }

  // 2. Cari Modal Bileşenleri
  bindModalElements() {
    const btnClose = document.getElementById('closeCarilerModalBtn');
    if (btnClose) {
      btnClose.addEventListener('click', () => this.closeModal());
    }

    const modal = document.getElementById('carilerModal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeModal();
      });
    }

    const searchInput = document.getElementById('carilerSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = (e.target.value || '').trim().toLowerCase();
        this.renderCards();
      });
    }

    const sortBtn = document.getElementById('carilerSortToggleBtn');
    if (sortBtn) {
      sortBtn.addEventListener('click', () => {
        this.sortMode = this.sortMode === 'debt_desc' ? 'name_asc' : 'debt_desc';
        const label = document.getElementById('carilerSortLabel');
        if (label) {
          label.textContent = this.sortMode === 'debt_desc' ? 'Açık Tutara Göre (Azalan)' : 'Alfabetik (A-Z)';
        }
        this.renderCards();
      });
    }

    const filterChips = document.querySelectorAll('.cari-filter-chip');
    filterChips.forEach(chip => {
      chip.addEventListener('click', () => {
        filterChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.currentFilter = chip.dataset.filter || 'all';
        this.renderCards();
      });
    });
  }

  openModal() {
    const modal = document.getElementById('carilerModal');
    if (!modal) return;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    this.renderCards();
    this.checkThreshold();
  }

  closeModal() {
    const modal = document.getElementById('carilerModal');
    if (!modal) return;
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }

  // Veri Havuzunu Topla: Syncra Partners + Yerel Tedavi Logları
  getAllCariler() {
    const list = [];
    const nameMap = new Set();

    // 1. Syncra Partners
    const partners = (window.stockManager && typeof window.stockManager.getPartners === 'function')
      ? window.stockManager.getPartners()
      : (JSON.parse(localStorage.getItem('vetassist_partners_v2') || '[]'));

    if (Array.isArray(partners)) {
      partners.forEach(pt => {
        const rawDebt = typeof pt.currentDebt === 'number' ? pt.currentDebt : parseFloat(pt.currentDebt) || 0;
        const isVendor = !!pt.isVendor && !pt.isCustomer;
        const name = (pt.name || '').trim();
        if (!name) return;

        nameMap.add(name.toLowerCase());
        list.push({
          id: pt.id || name,
          name: name,
          role: isVendor ? 'Tedarikçi' : 'Müşteri',
          isVendor: isVendor,
          isCustomer: !isVendor,
          balance: rawDebt, // Pozitif: Müşteri borcu veya Tedarikçiye borç
          phone: pt.phone || ''
        });
      });
    }

    // 2. Yerel Tedavi Loglarından müşteri borçlarını kontrol et (Syncra'da olmayanlar için)
    try {
      const logs = JSON.parse(localStorage.getItem('sahavet_treatment_logs_v2') || '[]');
      if (Array.isArray(logs)) {
        const logDebts = {};
        logs.forEach(lg => {
          const cust = (lg.customer || '').trim();
          if (cust && lg.paymentStatus === 'unpaid') {
            const amt = parseFloat(lg.price) || 0;
            logDebts[cust] = (logDebts[cust] || 0) + amt;
          }
        });

        Object.keys(logDebts).forEach(custName => {
          if (!nameMap.has(custName.toLowerCase())) {
            nameMap.add(custName.toLowerCase());
            list.push({
              id: 'local_' + custName,
              name: custName,
              role: 'Müşteri',
              isVendor: false,
              isCustomer: true,
              balance: logDebts[custName],
              phone: ''
            });
          }
        });
      }
    } catch (e) {
      console.warn('Yerel log borçları taranırken hata:', e);
    }

    return list;
  }

  // Hesaplamalar: Toplam Alacak, Toplam Verecek, Net
  calculateTotals() {
    const all = this.getAllCariler();
    let totalReceivable = 0; // Müşterilerden alacaklarımız
    let totalPayable = 0;    // Tedarikçilere borçlarımız

    all.forEach(item => {
      if (item.isVendor) {
        if (item.balance > 0) totalPayable += item.balance;
      } else {
        if (item.balance > 0) totalReceivable += item.balance;
      }
    });

    const net = totalReceivable - totalPayable;
    return { totalReceivable, totalPayable, net, all };
  }

  // Eşik Değeri Kontrolü (Set Değeri Aşıldı mı?)
  checkThreshold() {
    const { totalReceivable } = this.calculateTotals();
    const isExceeded = this.currentThreshold > 0 && totalReceivable > this.currentThreshold;

    // 1. Menü Çekmecesindeki Uyarı Bandı
    const drawerBanner = document.getElementById('drawerThresholdWarningBanner');
    const drawerText = document.getElementById('drawerThresholdWarningText');
    if (drawerBanner && drawerText) {
      if (isExceeded) {
        drawerBanner.style.display = 'flex';
        drawerText.textContent = `Toplam alacak (${this.formatCurrency(totalReceivable)}) belirlenen ${this.formatCurrency(this.currentThreshold)} sınırını aştı!`;
      } else {
        drawerBanner.style.display = 'none';
      }
    }

    // 2. Modal Footer Uyarı Bandı
    const modalBanner = document.getElementById('carilerFooterThresholdWarning');
    const modalText = document.getElementById('carilerFooterThresholdText');
    if (modalBanner && modalText) {
      if (isExceeded) {
        modalBanner.style.display = 'flex';
        modalText.textContent = `⚠️ DİKKAT: Toplam alacak (${this.formatCurrency(totalReceivable)}), ${this.formatCurrency(this.currentThreshold)} uyarı eşiğini aştı!`;
      } else {
        modalBanner.style.display = 'none';
      }
    }
  }

  // Kartları ve Listeyi Çiz (Yalnızca Sade Kartlar)
  renderCards() {
    const container = document.getElementById('carilerCardsList');
    if (!container) return;

    const { totalReceivable, totalPayable, net, all } = this.calculateTotals();

    // Filtreleme
    let filtered = all.filter(item => {
      // Metin Arama
      if (this.searchQuery && !item.name.toLowerCase().includes(this.searchQuery)) {
        return false;
      }

      // Kategori Filtresi
      if (this.currentFilter === 'debtors') {
        return !item.isVendor && item.balance > 0;
      } else if (this.currentFilter === 'creditors') {
        return item.isVendor && item.balance > 0;
      } else if (this.currentFilter === 'zero') {
        return item.balance === 0;
      }
      return true;
    });

    // Sıralama
    filtered.sort((a, b) => {
      if (this.sortMode === 'debt_desc') {
        return b.balance - a.balance;
      } else {
        return a.name.localeCompare(b.name, 'tr');
      }
    });

    // Alt Başlık Sayacı
    const countSub = document.getElementById('carilerCountSubtitle');
    if (countSub) {
      countSub.textContent = `${filtered.length} Gösterilen / ${all.length} Toplam Cari`;
    }

    // Kartlar Boşsa
    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding:30px 16px; color:var(--text-muted);">
          <span style="font-size:2rem; display:block; margin-bottom:8px;">🔍</span>
          <p style="font-size:0.85rem; margin:0;">Kayıtlı cari bulunamadı veya filtreye uymuyor.</p>
        </div>
      `;
      this.updateModalTotals();
      return;
    }

    // SADE KARTLAR HTML ÜRETİMİ
    container.innerHTML = filtered.map(item => {
      const isDebt = item.balance > 0;
      const isVendor = item.isVendor;

      // Renk ve Rozet Sınıfları
      const roleClass = isVendor ? 'cari-badge-vendor' : 'cari-badge-customer';
      let balanceClass = 'cari-balance-zero';
      let balanceSuffix = '';

      if (isDebt) {
        balanceClass = isVendor ? 'cari-balance-vendor-debt' : 'cari-balance-customer-debt';
        balanceSuffix = isVendor ? ' (Ödenecek)' : ' (Alacak)';
      }

      return `
        <div class="cari-minimal-card">
          <div class="cari-card-header">
            <span class="cari-card-name">${this.escapeHtml(item.name)}</span>
            <span class="cari-role-badge ${roleClass}">${item.role}</span>
          </div>
          <div class="cari-card-body">
            <span class="cari-card-label">Açık Bakiye</span>
            <span class="cari-card-val ${balanceClass}">${this.formatCurrency(item.balance)}${balanceSuffix}</span>
          </div>
        </div>
      `;
    }).join('');

    this.updateModalTotals();
  }

  // Alt Sticky Footer Toplamlarını Güncelle
  updateModalTotals() {
    const { totalReceivable, totalPayable, net } = this.calculateTotals();

    const elRec = document.getElementById('carilerTotalReceivable');
    const elPay = document.getElementById('carilerTotalPayable');
    const elNet = document.getElementById('carilerTotalNet');

    if (elRec) elRec.textContent = this.formatCurrency(totalReceivable);
    if (elPay) elPay.textContent = this.formatCurrency(totalPayable);
    if (elNet) elNet.textContent = this.formatCurrency(net);
  }

  formatCurrency(num) {
    const val = typeof num === 'number' ? num : parseFloat(num) || 0;
    return val.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺';
  }

  escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}

// Global instance
window.carilerManager = new CarilerManager();
