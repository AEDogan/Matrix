/**
 * Tester Tracker Client SDK for VetAssist
 * Otomatik Kapalı Test / 14 Gün Takip Entegrasyonu
 */

(function () {
  const STORAGE_KEY_EMAIL = 'vetassist_tester_email';
  const STORAGE_KEY_QUEUE = 'vetassist_tester_offline_queue';
  const STORAGE_KEY_DISMISSED = 'vetassist_tester_dismissed';

  const CONFIG = {
    appId: 'app-vetassist',
    appVersion: '8.1',
    // Yerel geliştirme sırasında localhost:3000, canlıda Vercel
    defaultServerUrl: (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.'))
      ? 'http://localhost:3000'
      : 'https://tester-tracker-drab.vercel.app'
  };

  class TesterTrackerClient {
    constructor() {
      this.serverUrl = localStorage.getItem('vetassist_tester_server_url') || CONFIG.defaultServerUrl;
      this.appId = CONFIG.appId;
      this.appVersion = CONFIG.appVersion;
    }

    init() {
      // Sayfa yüklendiğinde kısa bir gecikmeyle başlat
      setTimeout(() => {
        this.checkAndTrack();
        this.bindSettingsUI();
      }, 600);
    }

    getSavedEmail() {
      return localStorage.getItem(STORAGE_KEY_EMAIL) || '';
    }

    setSavedEmail(email) {
      if (email && email.trim()) {
        localStorage.setItem(STORAGE_KEY_EMAIL, email.trim().toLowerCase());
        localStorage.removeItem(STORAGE_KEY_DISMISSED);
      } else {
        localStorage.removeItem(STORAGE_KEY_EMAIL);
      }
    }

    async checkAndTrack() {
      const email = this.getSavedEmail();
      if (email) {
        // Kayıtlı e-posta var -> Arka planda sessizce sinyal gönder
        await this.trackOpening(email);
      } else {
        // Kayıtlı e-posta yok -> İlk açılışta sor
        const isDismissed = localStorage.getItem(STORAGE_KEY_DISMISSED);
        if (!isDismissed) {
          this.showPromptModal();
        }
      }
    }

    async trackOpening(userEmail, isManual = false) {
      if (!userEmail) return false;
      const cleanEmail = userEmail.trim().toLowerCase();
      const today = new Date().toISOString().split('T')[0];

      // 1. Offline Kuyruğu Yönet
      let queuedDates = [];
      try {
        queuedDates = JSON.parse(localStorage.getItem(STORAGE_KEY_QUEUE) || '[]');
      } catch (e) {
        queuedDates = [];
      }

      if (!queuedDates.includes(today)) {
        queuedDates.push(today);
        localStorage.setItem(STORAGE_KEY_QUEUE, JSON.stringify(queuedDates));
      }

      // 2. Cihaz Modeli
      let deviceModel = 'Web Browser';
      if (/Android/i.test(navigator.userAgent)) deviceModel = 'Android Device';
      else if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) deviceModel = 'iOS Device';

      try {
        const endpoint = `${this.serverUrl.replace(/\/+$/, '')}/api/ping`;
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            appId: this.appId,
            email: cleanEmail,
            deviceModel: deviceModel,
            appVersion: this.appVersion,
            queuedDates: queuedDates
          })
        });

        if (response.ok) {
          // Başarılı -> Kuyruğu temizle
          localStorage.removeItem(STORAGE_KEY_QUEUE);
          console.log('[TesterTracker] ✅ Açılış sinyali başarıyla iletildi:', cleanEmail);
          
          if (isManual && window.app && window.app.showToast) {
            window.app.showToast('✅ Test katılım sinyali başarıyla gönderildi!');
          }
          return true;
        } else {
          console.warn('[TesterTracker] ⚠️ Sunucu yanıt kodu:', response.status);
          if (isManual && window.app && window.app.showToast) {
            window.app.showToast('⚠️ Sunucuya ulaşılamadı. Sinyal hafızada saklandı.');
          }
          return false;
        }
      } catch (err) {
        console.warn('[TesterTracker] 💾 Sunucuya ulaşılamadı, sinyal sonraki açılış için telefonda saklandı.', err);
        if (isManual && window.app && window.app.showToast) {
          window.app.showToast('💾 Sinyal çevrimdışı kuyruğa kaydedildi.');
        }
        return false;
      }
    }

    showPromptModal() {
      const modal = document.getElementById('closedTesterPromptModal');
      if (!modal) return;
      
      const input = document.getElementById('testerPromptEmailInput');
      if (input) input.value = this.getSavedEmail();
      modal.style.display = 'flex';
    }

    closePromptModal() {
      const modal = document.getElementById('closedTesterPromptModal');
      if (modal) modal.style.display = 'none';
    }

    dismissPrompt() {
      localStorage.setItem(STORAGE_KEY_DISMISSED, 'true');
      this.closePromptModal();
    }

    submitPrompt() {
      const input = document.getElementById('testerPromptEmailInput');
      const email = input ? input.value.trim() : '';

      if (!email || !email.includes('@')) {
        alert('Lütfen geçerli bir Gmail / Google Play testçi e-posta adresi girin.');
        return;
      }

      this.setSavedEmail(email);
      this.closePromptModal();
      this.trackOpening(email, true);

      if (window.app && window.app.showToast) {
        window.app.showToast('🎉 Test katılımınız doğrulandı ve kaydedildi!');
      }

      this.updateSettingsUI();
    }

    bindSettingsUI() {
      const form = document.getElementById('testerTrackerSettingsForm');
      const input = document.getElementById('settingTesterEmail');
      const pingBtn = document.getElementById('btnManualPingTracker');

      if (input) {
        input.value = this.getSavedEmail();
      }

      if (pingBtn) {
        pingBtn.addEventListener('click', () => {
          const email = input ? input.value.trim() : this.getSavedEmail();
          if (email) {
            this.setSavedEmail(email);
            this.trackOpening(email, true);
          } else {
            alert('Lütfen önce test e-postanızı girin.');
          }
        });
      }

      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const email = input ? input.value.trim() : '';
          this.setSavedEmail(email);
          if (email) {
            this.trackOpening(email, true);
          }
          if (window.app && window.app.showToast) {
            window.app.showToast('💾 Testçi ayarları güncellendi.');
          }
        });
      }
    }

    updateSettingsUI() {
      const input = document.getElementById('settingTesterEmail');
      if (input) input.value = this.getSavedEmail();
    }
  }

  // Global erişim
  window.testerTracker = new TesterTrackerClient();
  document.addEventListener('DOMContentLoaded', () => {
    window.testerTracker.init();
  });
})();
