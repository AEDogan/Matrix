/**
 * VetAssist - Uluslararasılaştırma & Çoklu Dil Modülü (i18n.js)
 * Türkçe (TR) ve İngilizce (EN) tam destek sağlar.
 */

const TRANSLATIONS = {
  tr: {
    // Brand & General
    app_name: 'VetAssist',
    brand_title: 'VetAssist',
    brand_subtitle: 'Fiyat Hesaplama & Saha Adisyonu',
    version_text: 'test version',
    online_status_online: '🟢 Çevrimiçi (Sheets Senkronizasyonu Hazır)',
    online_status_offline: '🟡 Çevrimdışı Saha Modu (Yerel Hafıza Aktif)',
    theme_toggle_title: 'Tema Değiştir (Güneş Işığı / Koyu Saha)',
    theme_dark_active: 'Koyu Saha Teması Aktif 🌙',
    theme_light_active: 'Güneş Işığı (Yüksek Kontrast) Teması Aktif ☀️',

    // Top Header & Settings Drawer
    btn_settings: 'Menü',
    settings_drawer_title: 'Klinik, Maliyet & Sistem Ayarları',
    drawer_tab_clinic: '🏢 Klinik & Banka',
    drawer_tab_params: '⚙️ Maliyet Parametreleri',
    drawer_tab_presets: '✨ Hazır Tedavi Setleri',
    btn_close_drawer: '✕ Kapat',

    // Nav Tabs (3 Sekme)
    tab_calc: 'Adisyon',
    tab_stock: 'Stok',
    tab_logs: 'Geçmiş',
    tab_params: 'Giderler',
    tab_settings: 'Ayarlar',

    // Tab 1: Calculation
    mode_treatment_title: 'Uygulanan Tedavi',
    mode_treatment_sub: 'Stoktan Düşülür',
    mode_quote_title: 'Fiyat Teklifi',
    mode_quote_sub: 'Stoklar Sabit Kalır',
    mode_treatment_hint: '💉 <strong>Uygulanan Tedavi:</strong> İşlem tamamlandığında kullanılan ilaçlar otomatik olarak stoktan düşülür ve satış kaydı işlenir.',
    mode_quote_hint: '📄 <strong>Fiyat Teklifi:</strong> Bilgilendirme amaçlıdır. Stoktan düşüm yapılmaz ve loglara teklif olarak kaydedilir.',
    customer_label: '👤 Hasta Sahibi / Çiftlik / Müşteri (Opsiyonel):',
    customer_placeholder: 'Örn: Ahmet Yılmaz / Mandıra Köyü',
    med_selection_title: 'İlaç & Malzeme Seçimi',
    btn_batch_add: 'Çoklu Kalem Ekle',
    quick_search_placeholder: 'İlaç veya malzeme adı yazın...',
    presets_title: '⚡ Hızlı Protokoller & Çantam:',
    btn_new_preset_short: 'Yeni Set Ekle',
    btn_create_new_preset: 'Yeni Set Oluştur',
    modal_preset_title: 'Yeni Tedavi Seti Oluştur',
    modal_preset_sub: 'Sık kullandığınız ilaçları tek tıkla uygulanabilir hazır paket olarak kaydedin.',
    preset_name_label: 'Set / Protokol Adı *',
    preset_items_label: 'Sete Dahil Edilecek İlaçlar & Adetler',
    btn_save_preset: 'Seti Kaydet',
    btn_save_as_preset: '★ Bu Sepeti Set Olarak Kaydet',
    preset_prompt_name: 'Bu tedavi seti için bir isim girin (Örn: Mastitis Başlangıç Seti):',
    preset_saved_toast: '✨ Tedavi seti kaydedildi: {name}',
    preset_deleted_toast: 'Tedavi seti silindi.',
    preset_loaded_toast: '💉 "{name}" seti sepete eklendi.',
    cart_title: 'Seçilen Kalemler',
    btn_clear_cart: 'Tümünü Temizle',
    cart_empty_title: 'Henüz ilaç veya malzeme eklenmedi.',
    cart_empty_sub: 'Yukarıdan arayarak, hazır protokollere basarak veya "+ Çoklu Ekle" ile seçim yapabilirsiniz.',
    cost_label: 'Maliyet',
    profit_label: 'Kâr',
    critical_stock_badge: '🚨 Kritik Stok: {count}',
    added_expense_badge: '+{amount} TL Gider',
    unit_qty_label: 'Adet:',
    distance_title: '🚗 Ulaşım & Yol Mesafesi Ekle',
    distance_toggle_label: 'Yol / Mesafe Ücreti Ekle',
    distance_km_label: 'Gidilen Mesafe (KM)',
    btn_reset_km: 'Sıfırla',
    distance_total_label: 'Mesafe Toplamı:',
    distribute_toggle_title: 'Sabit Gideri İlaç Fiyatlarına Orantılı Dağıt',
    distribute_toggle_sub: 'Sabit klinik giderini fişte ayrı göstermez, kârsız olarak ilaçlara giydirir.',
    distribute_notice_text: 'Sabit Klinik Bedeli ({amount} TL) ilaç kalemlerine kârsız olarak orantılı dağıtıldı.',
    invoice_apply_vat: '📋 Faturalandır (KDV Uygula)',
    vat_rate_label: 'KDV Oranı: %{rate}',
    summary_items_total: 'Kalemler Toplamı:',
    summary_distance_total: 'Ulaşım Bedeli:',
    summary_other_params: 'Diğer Hizmet Giderleri:',
    summary_subtotal: 'Ara Toplam (Net):',
    summary_vat_total: 'KDV Tutarı:',
    summary_grand_total: 'ÖDENECEK TUTAR',
    btn_create_receipt: 'Adisyon Oluştur & Paylaş',
    btn_create_receipt_sub: 'WhatsApp ile görsel veya metin olarak gönderin',
    capsule_btn_receipt: 'Adisyon Kes ➔',

    // Tab 2: Stock
    kpi_total_items: 'Toplam İlaç/Malzeme',
    kpi_critical_items: 'Kritik Stok Uyarısı',
    stock_management_title: 'Envanter & Stok Yönetimi',
    btn_new_product: 'Yeni Ürün',
    btn_sync_sheets: 'Sheets Senkronize Et',
    stock_search_placeholder: 'Stokta ara (İsim, Kategori)...',
    filter_all: 'Tümü',
    filter_critical: '🚨 Kritik Stok',
    category_all: 'Tüm Kategoriler',
    csv_banner_info: '💡 <strong>Google Sheets / CSV:</strong> İlaç ve maliyet listenizi CSV formatında Google Sheets üzerinden senkronize edebilir veya dışa aktarabilirsiniz.',
    btn_import_csv: 'CSV İçe Aktar',
    btn_export_csv: 'CSV İndir',
    btn_load_sample: 'Örnek Veri Yükle',
    sheets_sync_title: 'Google Sheets Stok Senkronizasyon Linki',
    sheets_sync_desc: 'Stok listenizi Google Sheets üzerinden güncellemek için web\'de yayınlanan CSV linkinizi girin.',
    lock_unlock_btn: 'Kilidi Aç',
    lock_locked_btn: 'Kilitle',
    lock_hint_locked: '🔒 Link kilitlidir. Yanlışlıkla düzenlenmemesi için korunmaktadır.',
    lock_hint_unlocked: '🔓 Link düzenlenebilir. Yeni yayın linkinizi yapıştırıp kaydedebilirsiniz.',
    btn_save_link: 'Linki Kaydet',
    btn_sync_stock_now: 'Sheets\'ten Stok Güncelle',
    stock_card_cost: 'Maliyet:',
    stock_card_price: 'Satış:',
    stock_card_stock: 'Stok:',
    stock_card_min: 'Min:',
    stock_empty_title: 'Kayıtlı ürün bulunamadı.',
    stock_empty_sub: 'Arama filtrenizi değiştirebilir veya yeni ürün ekleyebilirsiniz.',

    // Tab 3: Logs
    kpi_treatment_revenue: 'Uygulanan Tedavi Cirosu',
    kpi_quote_revenue: 'Verilen Teklif Tutarı',
    logs_title: 'Satış & Teklif Geçmişi (Satis_Loglari)',
    logs_count_text: '{total} İşlem ({treatment} Tedavi / {quote} Teklif)',
    btn_export_logs: 'Logları CSV İndir',
    btn_clear_logs: 'Temizle',
    logs_search_placeholder: 'Müşteri, ilaç veya tarih ara...',
    filter_logs_all: 'Tüm İşlemler',
    filter_logs_treatment: '💉 Tedaviler (Stoklu)',
    filter_logs_quote: '📄 Teklifler (Stoksuz)',
    logs_empty_title: 'Henüz kayıtlı işlem geçmişi yok.',
    logs_empty_sub: 'Bir adisyon oluşturup onayladığınızda veya paylaştığınızda burada listelenecektir.',
    log_treatment_badge: '💉 Uygulanan Tedavi',
    log_quote_badge: '📄 Fiyat Teklifi',
    log_stock_deducted: 'Stoktan Düşüldü',
    log_stock_not_deducted: 'Stok Düşülmedi',
    log_items_detail_btn: 'Kalemleri Göster',

    // Tab 4: Parameters
    params_title: 'Maliyet Parametreleri Yönetimi',
    params_desc: 'Kâr marjı, KM ücreti, klinik gideri ve ek maliyet kalemlerini özelleştirin.',
    btn_new_param: 'Yeni Parametre Ekle',
    param_visibility_info_title: 'Adisyon Görünürlük & Maskeleme Kuralı:',
    param_visibility_info_desc: 'Müşteriye verdiğiniz fişte doğrudan görünmesini istemediğiniz sabit klinik bedelleri veya özel ek masraflar için <em>"Sabit Gideri İlaç Fiyatlarına Orantılı Dağıt"</em> veya <em>"Diğer Giderler Olarak Birleştir"</em> seçeneklerini kullanabilirsiniz.',
    param_type_percent: 'Yüzde Oranı (%)',
    param_type_fixed: 'Sabit Tutar (TL)',
    param_type_multiplier: 'Çarpan (TL/KM)',
    param_vis_separate: 'Ayrı Satır',
    param_vis_masked: '"Diğer Hizmet Giderleri" Altında Gizli',
    param_vis_internal: 'İlaç Fiyatına Dahil (İçsel)',
    param_system_locked: 'Sistem Parametresi',

    // Tab 5: Settings
    settings_title: '🏢 Klinik & Banka Bilgileri',
    settings_desc: 'Adisyon/slip görselinin alt kısmında yer alacak resmi ve ödeme bilgileri.',
    settings_lang_label: '🌐 Uygulama Dili / Language',
    settings_clinic_name: 'Klinik / Hekim Ünvanı',
    settings_bank_name: 'Banka Adı',
    settings_iban: 'IBAN Numarası',
    settings_address: 'İşletme / Klinik Adresi',
    settings_phone: 'İletişim Telefonu (WhatsApp)',
    settings_vat_rate: 'Varsayılan KDV Oranı (%)',
    settings_sheets_url: 'Google Sheets Yayınlanan CSV Linki',
    settings_sheets_hint: 'Google Sheets > Dosya > Paylaş > Web\'de Yayınla > CSV formatını seçip yapıştırın.',
    btn_save_settings: 'Ayarları Kaydet',
    btn_reset_defaults: 'Fabrika Ayarlarına Dön',
    support_dev_title: 'VetAssist\'e Destek Olun',
    support_dev_desc: 'Uygulamanın ücretsiz kalmasını sağlamak ve geliştirmeyi desteklemek için kısa bir video reklam izleyebilirsiniz.',
    btn_watch_support_video: 'Kısa Video İzle & Destek Ol',
    privacy_policy_title: 'Gizlilik Politikası',

    // Modal 1: Batch Add
    batch_modal_title: 'Çoklu İlaç & Kalem Ekle',
    batch_modal_sub: 'Birden fazla ürünü adetleriyle birlikte seçip tek seferde ekleyin.',
    batch_search_placeholder: 'İlaç ara...',
    batch_selected_count: 'Seçilen Kalem:',
    btn_cancel: 'İptal',
    btn_confirm_batch: 'Seçilenleri Sepete Ekle',

    // Modal 2: Receipt Preview & WhatsApp
    receipt_modal_title: 'Adisyon Paylaşımı',
    receipt_modal_sub: 'Aşağıdaki butona basarak adisyon görselini (JPG) doğrudan WhatsApp üzerinden paylaşın.',
    tab_view_visual: 'Görsel Fiş (JPG Slip)',
    tab_view_text: 'WhatsApp Metin Formatı',
    receipt_treatment_banner: '💉 UYGULANAN TEDAVİ (Stoktan Düşülecek)',
    receipt_quote_banner: '📄 FİYAT TEKLİFİ (Stoktan Düşülmez)',
    receipt_quote_title: 'FİYAT TEKLİFİ / BİLGİLENDİRME',
    receipt_default_title: 'VETERİNER HİZMET DETAYI',
    receipt_customer_label: 'Hasta Sahibi / Müşteri:',
    receipt_th_item: 'Ürün / Hizmet Adı',
    receipt_th_qty: 'Adet/KM',
    receipt_th_total: 'Tutar',
    receipt_subtotal: 'Ara Toplam:',
    receipt_vat: 'KDV (%{rate}):',
    receipt_grand_total: 'Ödenecek Tutar:',
    receipt_bank_label: 'Banka:',
    receipt_iban_label: 'IBAN:',
    receipt_addr_label: 'Adres:',
    receipt_tel_label: 'Tel:',
    receipt_legal_warning: 'MALİ BELGE DEĞİLDİR',
    btn_whatsapp_all: 'WhatsApp Paylaş',
    btn_whatsapp_jpg: 'WhatsApp ile Görsel (JPG Slip) Gönder',
    btn_whatsapp_text: 'WhatsApp ile Metin Olarak Gönder',
    btn_download_jpg: 'JPG İndir',
    btn_copy_text: 'Metni Kopyala',
    btn_save_only: 'Sadece Kaydet',
    whatsapp_thank_you: 'Bizi tercih ettiğiniz için teşekkür ederiz.',

    // Modal 3: Product Edit
    modal_add_product_title: 'Yeni İlaç / Malzeme Ekle',
    modal_edit_product_title: 'İlaç / Malzemeyi Düzenle',
    prod_name_label: 'Ürün / Malzeme Adı *',
    prod_name_placeholder: 'Örn: Serum 500 ml',
    prod_cost_label: 'Birim Maliyet (TL) *',
    prod_category_label: 'Kategori',
    prod_stock_label: 'Mevcut Stok Adedi *',
    prod_min_stock_label: 'Min. Stok Uyarı Sınırı *',
    btn_save: 'Kaydet',

    // Modal 4: Parameter Edit
    modal_add_param_title: 'Yeni Maliyet Kalemi Ekle',
    modal_edit_param_title: 'Maliyet Kalemini Düzenle',
    param_name_label: 'Kalem / Parametre Adı *',
    param_type_label: 'Hesaplama Tipi *',
    param_value_label: 'Varsayılan Değer *',
    param_vis_label: 'Müşteri Adisyonunda Görünürlük *',
    param_vis_radio_sep: 'Ayrı Satırda Göster',
    param_vis_radio_sep_sub: 'Adisyonda kendi adıyla ve tutarıyla görünür.',
    param_vis_radio_mask: '"Diğer Giderler" Olarak Birleştir (Gizle)',
    param_vis_radio_mask_sub: 'Tutar hesaplamaya eklenir ancak fişte tek başına yazmaz, "Diğer Giderler" başlığı altında toplanır.',

    // Toasts & Messages
    toast_product_saved: 'Ürün başarıyla kaydedildi.',
    toast_product_deleted: 'Ürün silindi.',
    toast_added_to_cart: '"{name}" ({qty} adet) sepete eklendi.',
    toast_cart_cleared: 'Sepet temizlendi.',
    toast_settings_saved: 'Klinik ve sistem ayarları kaydedildi.',
    toast_factory_reset: 'Tüm veriler fabrika ayarlarına döndürüldü.',
    toast_logs_cleared: 'Tüm satış ve teklif geçmişi temizlendi.',
    toast_param_saved: 'Maliyet parametresi kaydedildi.',
    toast_param_deleted: 'Parametre silindi.',
    toast_copied_text: 'WhatsApp metni panoya kopyalandı!',
    toast_downloaded_jpg: 'Görsel fiş (JPG) indirildi.',
    toast_whatsapp_opened: 'WhatsApp başlatıldı ve kayıt işlendi.',
    toast_sheets_synced: 'Google Sheets üzerinden {count} ürün güncellendi!',
    toast_sheets_error: 'Sheets senkronizasyon hatası: Bağlantınızı kontrol edin.',
    toast_url_saved: 'Google Sheets linki kaydedildi.'
  },

  en: {
    // Brand & General
    app_name: 'VetAssist',
    brand_title: 'VetAssist',
    brand_subtitle: 'Price Calculator & Field Billing',
    version_text: 'test version',
    online_status_online: '🟢 Online (Sheets Sync Ready)',
    online_status_offline: '🟡 Offline Field Mode (Local Storage Active)',
    theme_toggle_title: 'Toggle Theme (Sunlight / Dark Field)',
    theme_dark_active: 'Dark Field Theme Active 🌙',
    theme_light_active: 'Sunlight (High Contrast) Theme Active ☀️',

    // Top Header & Settings Drawer
    btn_settings: 'Menu',
    settings_drawer_title: 'Clinic, Cost & System Settings',
    drawer_tab_clinic: '🏢 Clinic & Bank',
    drawer_tab_params: '⚙️ Cost Parameters',
    drawer_tab_presets: '✨ Treatment Presets',
    btn_close_drawer: '✕ Close',

    // Nav Tabs (3 Tabs)
    tab_calc: 'Billing',
    tab_stock: 'Stock',
    tab_logs: 'History',
    tab_params: 'Costs',
    tab_settings: 'Settings',

    // Tab 1: Calculation
    mode_treatment_title: 'Applied Treatment',
    mode_treatment_sub: 'Deducts from Stock',
    mode_quote_title: 'Price Quote',
    mode_quote_sub: 'Stock Remains Constant',
    mode_treatment_hint: '💉 <strong>Applied Treatment:</strong> When completed, medications used are automatically deducted from inventory and logged into sales history.',
    mode_quote_hint: '📄 <strong>Price Quote:</strong> Informational breakdown. Stock is untouched and recorded as a quote in history.',
    customer_label: '👤 Pet/Farm Owner / Client (Optional):',
    customer_placeholder: 'Ex: John Doe / Valley Farm',
    med_selection_title: 'Medication & Supply Selection',
    btn_batch_add: 'Batch Add Items',
    quick_search_placeholder: 'Type medication or supply name...',
    presets_title: '⚡ Quick Protocols & Bag:',
    btn_new_preset_short: 'New Preset',
    btn_create_new_preset: 'Create New Preset',
    modal_preset_title: 'Create Treatment Preset',
    modal_preset_sub: 'Save frequently used items as a one-tap ready package.',
    preset_name_label: 'Preset / Protocol Name *',
    preset_items_label: 'Medicines & Quantities in Preset',
    btn_save_preset: 'Save Preset',
    btn_save_as_preset: '★ Save Cart as Preset',
    preset_prompt_name: 'Enter a name for this preset (e.g. Mastitis Protocol):',
    preset_saved_toast: '✨ Preset saved: {name}',
    preset_deleted_toast: 'Preset removed.',
    preset_loaded_toast: '💉 "{name}" loaded into cart.',
    cart_title: 'Selected Items',
    btn_clear_cart: 'Clear All',
    cart_empty_title: 'No medications or supplies added yet.',
    cart_empty_sub: 'Search above, tap quick protocols, or use "+ Batch Add Items".',
    cost_label: 'Cost',
    profit_label: 'Profit',
    critical_stock_badge: '🚨 Low Stock: {count}',
    added_expense_badge: '+{amount} Expense',
    unit_qty_label: 'Qty:',
    distance_title: '🚗 Add Travel & Mileage',
    distance_toggle_label: 'Add Mileage / Travel Fee',
    distance_km_label: 'Distance Traveled (KM)',
    btn_reset_km: 'Reset',
    distance_total_label: 'Distance Subtotal:',
    distribute_toggle_title: 'Proportionately Distribute Fixed Expense into Medication Prices',
    distribute_toggle_sub: 'Blends fixed clinic overhead without profit margin into medication unit prices.',
    distribute_notice_text: 'Fixed Clinic Fee ({amount}) is proportionately blended into items without markup.',
    invoice_apply_vat: '📋 Apply Official Tax (VAT)',
    vat_rate_label: 'VAT Rate: %{rate}',
    summary_items_total: 'Items Subtotal:',
    summary_distance_total: 'Travel Fee:',
    summary_other_params: 'Other Service Expenses:',
    summary_subtotal: 'Subtotal (Net):',
    summary_vat_total: 'VAT Amount:',
    summary_grand_total: 'TOTAL TO PAY',
    btn_create_receipt: 'Create & Share Bill',
    btn_create_receipt_sub: 'Send via WhatsApp as image or text',
    capsule_btn_receipt: 'Bill / Receipt ➔',

    // Tab 2: Stock
    kpi_total_items: 'Total Items',
    kpi_critical_items: 'Critical Stock Alerts',
    stock_management_title: 'Inventory & Stock Management',
    btn_new_product: 'New Item',
    btn_sync_sheets: 'Sync with Sheets',
    stock_search_placeholder: 'Search stock (Name, Category)...',
    filter_all: 'All',
    filter_critical: '🚨 Low Stock',
    category_all: 'All Categories',
    csv_banner_info: '💡 <strong>Google Sheets / CSV:</strong> Synchronize your inventory live via Google Sheets published CSV URL or export backup.',
    btn_import_csv: 'Import CSV',
    btn_export_csv: 'Export CSV',
    btn_load_sample: 'Load Sample Data',
    sheets_sync_title: 'Google Sheets Live Sync URL',
    sheets_sync_desc: 'Enter your published Google Sheets CSV link to sync inventory with one tap.',
    lock_unlock_btn: 'Unlock',
    lock_locked_btn: 'Lock',
    lock_hint_locked: '🔒 URL is locked to prevent accidental modification.',
    lock_hint_unlocked: '🔓 URL is editable. Paste your published CSV link and save.',
    btn_save_link: 'Save Link',
    btn_sync_stock_now: 'Sync Inventory from Sheets',
    stock_card_cost: 'Cost:',
    stock_card_price: 'Price:',
    stock_card_stock: 'Stock:',
    stock_card_min: 'Min:',
    stock_empty_title: 'No items found.',
    stock_empty_sub: 'Try changing your search filter or add a new product.',

    // Tab 3: Logs
    kpi_treatment_revenue: 'Applied Treatments Total',
    kpi_quote_revenue: 'Price Quotes Total',
    logs_title: 'Sales & Quotes Log History',
    logs_count_text: '{total} Records ({treatment} Treatments / {quote} Quotes)',
    btn_export_logs: 'Export Logs CSV',
    btn_clear_logs: 'Clear History',
    logs_search_placeholder: 'Search client, item, or date...',
    filter_logs_all: 'All Logs',
    filter_logs_treatment: '💉 Treatments (Stock Deducted)',
    filter_logs_quote: '📄 Quotes (Stock Untouched)',
    logs_empty_title: 'No transaction history recorded yet.',
    logs_empty_sub: 'When you finalize or share a bill, it will appear here.',
    log_treatment_badge: '💉 Applied Treatment',
    log_quote_badge: '📄 Price Quote',
    log_stock_deducted: 'Stock Deducted',
    log_stock_not_deducted: 'Stock Untouched',
    log_items_detail_btn: 'View Line Items',

    // Tab 4: Parameters
    params_title: 'Cost Parameters Configuration',
    params_desc: 'Customize profit margin, KM travel rate, clinic base fee, and custom overheads.',
    btn_new_param: 'Add New Parameter',
    param_visibility_info_title: 'Bill Visibility & Masking Rules:',
    param_visibility_info_desc: 'To keep fixed overheads discreet on customer slips, choose <em>"Proportionately Distribute"</em> or <em>"Mask under Other Expenses"</em>.',
    param_type_percent: 'Percentage (%)',
    param_type_fixed: 'Fixed Amount',
    param_type_multiplier: 'Multiplier (per KM)',
    param_vis_separate: 'Separate Line Item',
    param_vis_masked: 'Masked under "Other Service Expenses"',
    param_vis_internal: 'Embedded in Price',
    param_system_locked: 'System Parameter',

    // Tab 5: Settings
    settings_title: '🏢 Clinic & Banking Details',
    settings_desc: 'Official clinic branding and payment details rendered on the visual receipt slip.',
    settings_lang_label: '🌐 Application Language',
    settings_clinic_name: 'Clinic / Veterinarian Name',
    settings_bank_name: 'Bank Name',
    settings_iban: 'IBAN Number',
    settings_address: 'Clinic / Business Address',
    settings_phone: 'Contact Phone (WhatsApp)',
    settings_vat_rate: 'Default VAT Rate (%)',
    settings_sheets_url: 'Google Sheets Published CSV Link',
    settings_sheets_hint: 'Google Sheets > File > Share > Publish to web > Select CSV format and paste here.',
    btn_save_settings: 'Save Settings',
    btn_reset_defaults: 'Reset to Factory Defaults',
    support_dev_title: 'Support VetAssist',
    support_dev_desc: 'To support continuous updates and keep the app free, you can watch a short video ad.',
    btn_watch_support_video: 'Watch Short Video & Support',
    privacy_policy_title: 'Privacy Policy',

    // Modal 1: Batch Add
    batch_modal_title: 'Batch Add Items',
    batch_modal_sub: 'Quickly select multiple medications with quantities.',
    batch_search_placeholder: 'Search medication...',
    batch_selected_count: 'Selected Items:',
    btn_cancel: 'Cancel',
    btn_confirm_batch: 'Add Selected to Cart',

    // Modal 2: Receipt Preview & WhatsApp
    receipt_modal_title: 'Share Receipt',
    receipt_modal_sub: 'Tap the button below to share the visual receipt slip (JPG) directly via WhatsApp.',
    tab_view_visual: 'Visual Receipt (JPG Slip)',
    tab_view_text: 'WhatsApp Text Format',
    receipt_treatment_banner: '💉 APPLIED TREATMENT (Stock Deducted)',
    receipt_quote_banner: '📄 PRICE QUOTE (Stock Untouched)',
    receipt_quote_title: 'PRICE QUOTE / ESTIMATE',
    receipt_default_title: 'VETERINARY SERVICE SUMMARY',
    receipt_customer_label: 'Client / Farm:',
    receipt_th_item: 'Item / Service',
    receipt_th_qty: 'Qty/KM',
    receipt_th_total: 'Total',
    receipt_subtotal: 'Subtotal:',
    receipt_vat: 'VAT (%{rate}):',
    receipt_grand_total: 'Total Due:',
    receipt_bank_label: 'Bank:',
    receipt_iban_label: 'IBAN:',
    receipt_addr_label: 'Address:',
    receipt_tel_label: 'Phone:',
    receipt_legal_warning: 'NOT AN OFFICIAL TAX INVOICE',
    btn_whatsapp_all: 'Share WhatsApp',
    btn_whatsapp_jpg: 'Send Visual JPG Slip via WhatsApp',
    btn_whatsapp_text: 'Send Text Breakdown via WhatsApp',
    btn_download_jpg: 'Download JPG',
    btn_copy_text: 'Copy Text',
    btn_save_only: 'Save Only',
    whatsapp_thank_you: 'Thank you for choosing our veterinary clinic.',

    // Modal 3: Product Edit
    modal_add_product_title: 'Add New Product / Supply',
    modal_edit_product_title: 'Edit Product / Supply',
    prod_name_label: 'Product Name *',
    prod_name_placeholder: 'Ex: Saline Solution 500ml',
    prod_cost_label: 'Unit Cost *',
    prod_category_label: 'Category',
    prod_stock_label: 'Current Stock Qty *',
    prod_min_stock_label: 'Min Stock Alert Threshold *',
    btn_save: 'Save',

    // Modal 4: Parameter Edit
    modal_add_param_title: 'Add New Cost Parameter',
    modal_edit_param_title: 'Edit Cost Parameter',
    param_name_label: 'Parameter Name *',
    param_type_label: 'Calculation Type *',
    param_value_label: 'Default Value *',
    param_vis_label: 'Customer Slip Visibility *',
    param_vis_radio_sep: 'Show as Separate Line',
    param_vis_radio_sep_sub: 'Appears with its own name and amount on the bill.',
    param_vis_radio_mask: 'Combine into "Other Expenses"',
    param_vis_radio_mask_sub: 'Added into calculation, but hidden under a generic label on the bill.',

    // Toasts & Messages
    toast_product_saved: 'Product saved successfully.',
    toast_product_deleted: 'Product removed.',
    toast_added_to_cart: '"{name}" ({qty} pcs) added to cart.',
    toast_cart_cleared: 'Cart cleared.',
    toast_settings_saved: 'Settings saved successfully.',
    toast_factory_reset: 'Reset to factory defaults completed.',
    toast_logs_cleared: 'All history records cleared.',
    toast_param_saved: 'Cost parameter saved.',
    toast_param_deleted: 'Parameter removed.',
    toast_copied_text: 'WhatsApp text copied to clipboard!',
    toast_downloaded_jpg: 'JPG Slip downloaded.',
    toast_whatsapp_opened: 'WhatsApp launched and transaction recorded.',
    toast_sheets_synced: '{count} products synchronized from Google Sheets!',
    toast_sheets_error: 'Sheets sync failed: Please check your network and URL.',
    toast_url_saved: 'Google Sheets URL saved.'
  }
};

class I18nManager {
  constructor() {
    this.storageKey = 'vetassist_lang';
    this.currentLang = this.loadLanguage();
  }

  loadLanguage() {
    return localStorage.getItem(this.storageKey) || 'tr';
  }

  setLanguage(lang) {
    if (lang !== 'tr' && lang !== 'en') lang = 'tr';
    this.currentLang = lang;
    localStorage.setItem(this.storageKey, lang);
    this.translateDOM();
    if (window.app && typeof window.app.onLanguageChanged === 'function') {
      window.app.onLanguageChanged();
    }
  }

  getLanguage() {
    return this.currentLang;
  }

  t(key, params = {}) {
    const dict = TRANSLATIONS[this.currentLang] || TRANSLATIONS.tr;
    let text = dict[key] || TRANSLATIONS.tr[key] || key;
    
    // Replace {paramName}
    for (const [pKey, pVal] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${pKey}\\}`, 'g'), pVal);
    }
    return text;
  }

  translateDOM() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.innerHTML = this.t(key);
    });

    const placeholders = document.querySelectorAll('[data-i18n-placeholder]');
    placeholders.forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      el.setAttribute('placeholder', this.t(key));
    });

    const titles = document.querySelectorAll('[data-i18n-title]');
    titles.forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      el.setAttribute('title', this.t(key));
    });
  }
}

// Global instance
window.i18n = new I18nManager();
