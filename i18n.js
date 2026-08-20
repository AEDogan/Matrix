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
    version_text: 'VetAssist v2.0',
    online_status_online: '🟢 Çevrimiçi (Sheets Senkronizasyonu Hazır)',
    online_status_offline: '🟡 Çevrimdışı Saha Modu (Yerel Hafıza Aktif)',
    theme_toggle_title: 'Tema Değiştir (Güneş Işığı / Koyu Saha)',
    theme_dark_active: 'Koyu Saha Teması Aktif 🌙',
    theme_light_active: 'Güneş Işığı (Yüksek Kontrast) Teması Aktif ☀️',

    // Nav Tabs
    tab_calc: 'Hesapla',
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
    cart_title: 'Seçilen Kalemler',
    btn_clear_cart: 'Tümünü Temizle',
    cart_empty_title: 'Henüz ilaç veya malzeme eklenmedi.',
    cart_empty_sub: 'Yukarıdan arayarak veya "+ Çoklu Kalem Ekle" butonuna basarak seçim yapabilirsiniz.',
    cost_label: 'Maliyet',
    profit_label: 'Kâr',
    critical_stock_badge: '🚨 Kritik Stok: {count}',
    added_expense_badge: '+{amount} TL Gider',
    unit_qty_label: 'Adet:',
    distance_title: '🚗 Ulaşım / Mesafe Hesabı',
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
    summary_other_params: 'Diğer Hizmet ve Sarf Bedelleri:',
    summary_subtotal: 'Ara Toplam (Net):',
    summary_vat_total: 'KDV Tutarı:',
    summary_grand_total: 'ÖDENECEK TUTAR',
    btn_create_receipt: 'Adisyon Oluştur & Önizle',
    btn_create_receipt_sub: 'Görsel fişi incele ve WhatsApp\'a aktar',

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
    param_vis_masked: '"Diğer Giderler" Altında Gizli',
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

    // Modal 1: Batch Add
    batch_modal_title: 'Çoklu İlaç & Kalem Ekle',
    batch_modal_sub: 'Birden fazla ürünü adetleriyle birlikte seçip tek seferde ekleyin.',
    batch_search_placeholder: 'İlaç ara...',
    batch_selected_count: 'Seçilen Kalem:',
    btn_cancel: 'İptal',
    btn_confirm_batch: 'Seçilenleri Sepete Ekle',

    // Modal 2: Receipt Preview & WhatsApp
    receipt_modal_title: 'Adisyon Önizleme & Onay',
    receipt_modal_sub: 'Görsel fişi ve hesaplama detaylarını kontrol edin.',
    tab_view_visual: '🖼️ Görsel Fiş (JPG Slip)',
    tab_view_text: '💬 WhatsApp Metin Formatı',
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
    btn_whatsapp_all: 'WhatsApp (Metin + JPG) Paylaş',
    btn_whatsapp_jpg: 'WhatsApp\'a JPG Gönder',
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

    // Toast & Dialog Alerts
    toast_added_to_cart: '"{name}" ({qty} adet) sepete eklendi',
    toast_cart_cleared: 'Tüm seçili kalemler temizlendi',
    toast_item_saved: 'Ürün başarıyla kaydedildi',
    toast_item_deleted: 'Ürün silindi',
    toast_param_saved: 'Maliyet parametresi güncellendi',
    toast_param_deleted: 'Parametre silindi',
    toast_settings_saved: 'Klinik ve dil ayarları başarıyla kaydedildi! 💾',
    toast_logs_cleared: 'Tüm log geçmişi temizlendi.',
    toast_logs_exported: 'Satış ve Teklif Logları CSV olarak indirildi! 📥',
    toast_copied_clipboard: 'Adisyon metni panoya kopyalandı! 📋',
    toast_jpg_downloaded: 'Görsel adisyon (JPG) cihazınıza indirildi! 📥',
    toast_sheets_sync_success: 'Stoklar Google Sheets üzerinden başarıyla güncellendi! ({count} ürün) 🔄',
    toast_sheets_url_saved: 'Google Sheets linki kaydedildi ve kilitlendi! 🔒',
    confirm_clear_cart: 'Tüm seçili kalemleri sepetten temizlemek istediğinize emin misiniz?',
    confirm_clear_logs: 'Tüm geçmiş satış ve teklif loglarını silmek istediğinize emin misiniz?',
    confirm_reset_settings: 'Tüm ayarları varsayılan fabrika değerlerine döndürmek istediğinize emin misiniz?',
    confirm_delete_product: 'Bu ürünü silmek istediğinize emin misiniz?'
  },

  en: {
    // Brand & General
    app_name: 'VetAssist',
    brand_title: 'VetAssist',
    brand_subtitle: 'Price Calculator & Field Billing',
    version_text: 'VetAssist v2.0',
    online_status_online: '🟢 Online (Sheets Sync Ready)',
    online_status_offline: '🟡 Offline Field Mode (Local Storage Active)',
    theme_toggle_title: 'Toggle Theme (Sunlight / Dark Field)',
    theme_dark_active: 'Dark Field Theme Active 🌙',
    theme_light_active: 'Sunlight (High Contrast) Theme Active ☀️',

    // Nav Tabs
    tab_calc: 'Calculate',
    tab_stock: 'Inventory',
    tab_logs: 'History',
    tab_params: 'Expenses',
    tab_settings: 'Settings',

    // Tab 1: Calculation
    mode_treatment_title: 'Applied Treatment',
    mode_treatment_sub: 'Deducted from Stock',
    mode_quote_title: 'Price Quote',
    mode_quote_sub: 'Stock Remains Constant',
    mode_treatment_hint: '💉 <strong>Applied Treatment:</strong> When completed, medications used are automatically deducted from inventory and logged into sales history.',
    mode_quote_hint: '📄 <strong>Price Quote:</strong> Informational breakdown. Stock is untouched and recorded as a quote in history.',
    customer_label: '👤 Client / Farm / Patient Owner (Optional):',
    customer_placeholder: 'e.g. John Doe / Green Valley Farm',
    med_selection_title: 'Medication & Supply Selection',
    btn_batch_add: 'Add Multiple Items',
    quick_search_placeholder: 'Type medication or supply name...',
    cart_title: 'Selected Items',
    btn_clear_cart: 'Clear All',
    cart_empty_title: 'No medications or supplies added yet.',
    cart_empty_sub: 'Search above or click "+ Add Multiple Items" to select products.',
    cost_label: 'Cost',
    profit_label: 'Markup',
    critical_stock_badge: '🚨 Low Stock: {count}',
    added_expense_badge: '+{amount} Overhead',
    unit_qty_label: 'Qty:',
    distance_title: '🚗 Travel / Distance Calculation',
    distance_km_label: 'Distance Traveled (KM)',
    btn_reset_km: 'Reset',
    distance_total_label: 'Travel Total:',
    distribute_toggle_title: 'Distribute Fixed Overhead Proportionally',
    distribute_toggle_sub: 'Hides fixed clinic fee on receipt, distributing it cost-neutral across medications.',
    distribute_notice_text: 'Fixed Clinic Fee ({amount}) has been distributed proportionally across items without markup.',
    invoice_apply_vat: '📋 Apply VAT / Invoice',
    vat_rate_label: 'VAT Rate: %{rate}',
    summary_items_total: 'Items Total:',
    summary_distance_total: 'Travel Fee:',
    summary_other_params: 'Other Services & Supplies:',
    summary_subtotal: 'Subtotal (Net):',
    summary_vat_total: 'VAT Amount:',
    summary_grand_total: 'TOTAL DUE',
    btn_create_receipt: 'Create & Preview Receipt',
    btn_create_receipt_sub: 'Review visual slip & share to WhatsApp',

    // Tab 2: Stock
    kpi_total_items: 'Total Products/Supplies',
    kpi_critical_items: 'Critical Stock Alert',
    stock_management_title: 'Inventory & Stock Management',
    btn_new_product: 'New Product',
    btn_sync_sheets: 'Sync Sheets',
    stock_search_placeholder: 'Search stock (Name, Category)...',
    filter_all: 'All',
    filter_critical: '🚨 Low Stock',
    category_all: 'All Categories',
    csv_banner_info: '💡 <strong>Google Sheets / CSV:</strong> You can sync or export your inventory and pricing list in CSV format via Google Sheets.',
    btn_import_csv: 'Import CSV',
    btn_export_csv: 'Export CSV',
    btn_load_sample: 'Load Sample Data',
    sheets_sync_title: 'Google Sheets Stock Sync URL',
    sheets_sync_desc: 'Enter your published Google Sheets CSV URL to update your inventory from cloud.',
    lock_unlock_btn: 'Unlock',
    lock_locked_btn: 'Lock',
    lock_hint_locked: '🔒 URL is locked to prevent accidental modifications.',
    lock_hint_unlocked: '🔓 URL is unlocked. Paste your newly published web CSV link and click save.',
    btn_save_link: 'Save URL',
    btn_sync_stock_now: 'Sync Stock from Sheets',
    stock_card_cost: 'Cost:',
    stock_card_price: 'Price:',
    stock_card_stock: 'Stock:',
    stock_card_min: 'Min:',
    stock_empty_title: 'No products found.',
    stock_empty_sub: 'Try modifying your search or click "+ New Product" to add items.',

    // Tab 3: Logs
    kpi_treatment_revenue: 'Treatment Revenue',
    kpi_quote_revenue: 'Quotes Total Value',
    logs_title: 'Sales & Quotes History (Sales_Logs)',
    logs_count_text: '{total} Transactions ({treatment} Treatments / {quote} Quotes)',
    btn_export_logs: 'Export Logs CSV',
    btn_clear_logs: 'Clear',
    logs_search_placeholder: 'Search client, medicine or date...',
    filter_logs_all: 'All Records',
    filter_logs_treatment: '💉 Treatments (Stocked)',
    filter_logs_quote: '📄 Quotes (Unstocked)',
    logs_empty_title: 'No transaction history recorded yet.',
    logs_empty_sub: 'When you finalize or share a receipt, records will appear here.',
    log_treatment_badge: '💉 Treatment',
    log_quote_badge: '📄 Price Quote',
    log_stock_deducted: 'Stock Deducted',
    log_stock_not_deducted: 'Stock Unchanged',
    log_items_detail_btn: 'Show Items',

    // Tab 4: Parameters
    params_title: 'Cost Parameters Management',
    params_desc: 'Customize markup profit margin, per-KM rate, clinic fees, and extra supplies.',
    btn_new_param: 'Add New Parameter',
    param_visibility_info_title: 'Receipt Visibility & Masking Rules:',
    param_visibility_info_desc: 'For clinic overhead or extra costs you do not wish to itemize individually on customer receipts, use <em>"Distribute Fixed Overhead Proportionally"</em> or <em>"Combine as Other Expenses"</em>.',
    param_type_percent: 'Percentage (%)',
    param_type_fixed: 'Fixed Amount',
    param_type_multiplier: 'Multiplier (per KM/unit)',
    param_vis_separate: 'Separate Line',
    param_vis_masked: 'Grouped under "Other Expenses"',
    param_vis_internal: 'Embedded in Price (Internal)',
    param_system_locked: 'System Parameter',

    // Tab 5: Settings
    settings_title: '🏢 Clinic & Payment Details',
    settings_desc: 'Official details and payment info displayed at the bottom of receipt slips.',
    settings_lang_label: '🌐 Application Language / Dil',
    settings_clinic_name: 'Clinic / Veterinarian Title',
    settings_bank_name: 'Bank Name',
    settings_iban: 'IBAN Number',
    settings_address: 'Business / Clinic Address',
    settings_phone: 'Contact Phone (WhatsApp)',
    settings_vat_rate: 'Default VAT Rate (%)',
    settings_sheets_url: 'Google Sheets Published CSV URL',
    settings_sheets_hint: 'Google Sheets > File > Share > Publish to web > Select CSV format and paste here.',
    btn_save_settings: 'Save Settings',
    btn_reset_defaults: 'Reset to Factory Defaults',

    // Modal 1: Batch Add
    batch_modal_title: 'Add Multiple Items',
    batch_modal_sub: 'Select multiple medications with quantities and add them in one go.',
    batch_search_placeholder: 'Search medication...',
    batch_selected_count: 'Selected Items:',
    btn_cancel: 'Cancel',
    btn_confirm_batch: 'Add Selected to Cart',

    // Modal 2: Receipt Preview & WhatsApp
    receipt_modal_title: 'Receipt Preview & Confirmation',
    receipt_modal_sub: 'Review the visual receipt slip and calculation details.',
    tab_view_visual: '🖼️ Visual Receipt (JPG Slip)',
    tab_view_text: '💬 WhatsApp Text Format',
    receipt_treatment_banner: '💉 APPLIED TREATMENT (Stock will be deducted)',
    receipt_quote_banner: '📄 PRICE QUOTE (Stock remains unchanged)',
    receipt_quote_title: 'PRICE QUOTE / ESTIMATE',
    receipt_default_title: 'VETERINARY SERVICE DETAILS',
    receipt_customer_label: 'Client / Patient Owner:',
    receipt_th_item: 'Item / Service Name',
    receipt_th_qty: 'Qty/KM',
    receipt_th_total: 'Amount',
    receipt_subtotal: 'Subtotal:',
    receipt_vat: 'VAT (%{rate}):',
    receipt_grand_total: 'Total Due:',
    receipt_bank_label: 'Bank:',
    receipt_iban_label: 'IBAN:',
    receipt_addr_label: 'Address:',
    receipt_tel_label: 'Phone:',
    receipt_legal_warning: 'NOT A FINANCIAL INVOICE',
    btn_whatsapp_all: 'Share via WhatsApp (Text + JPG)',
    btn_whatsapp_jpg: 'Send JPG to WhatsApp',
    btn_download_jpg: 'Download JPG',
    btn_copy_text: 'Copy Text',
    btn_save_only: 'Save Only',
    whatsapp_thank_you: 'Thank you for choosing our veterinary services.',

    // Modal 3: Product Edit
    modal_add_product_title: 'Add New Medication / Supply',
    modal_edit_product_title: 'Edit Product / Medication',
    prod_name_label: 'Product / Supply Name *',
    prod_name_placeholder: 'e.g. Saline Solution 500ml',
    prod_cost_label: 'Unit Cost *',
    prod_category_label: 'Category',
    prod_stock_label: 'Current Stock Qty *',
    prod_min_stock_label: 'Min. Stock Alert Threshold *',
    btn_save: 'Save',

    // Modal 4: Parameter Edit
    modal_add_param_title: 'Add New Cost Parameter',
    modal_edit_param_title: 'Edit Cost Parameter',
    param_name_label: 'Parameter Name *',
    param_type_label: 'Calculation Type *',
    param_value_label: 'Default Value *',
    param_vis_label: 'Visibility on Customer Receipt *',
    param_vis_radio_sep: 'Show as Separate Line',
    param_vis_radio_sep_sub: 'Displays with its own name and amount on the receipt.',
    param_vis_radio_mask: 'Group under "Other Expenses" (Masked)',
    param_vis_radio_mask_sub: 'Amount is added to total, grouped under "Other Expenses" on the receipt.',

    // Toast & Dialog Alerts
    toast_added_to_cart: '"{name}" ({qty} pcs) added to cart',
    toast_cart_cleared: 'All selected items cleared',
    toast_item_saved: 'Product saved successfully',
    toast_item_deleted: 'Product deleted',
    toast_param_saved: 'Cost parameter updated',
    toast_param_deleted: 'Parameter deleted',
    toast_settings_saved: 'Clinic & language settings saved successfully! 💾',
    toast_logs_cleared: 'All history logs cleared.',
    toast_logs_exported: 'Sales and Quote logs exported to CSV! 📥',
    toast_copied_clipboard: 'Receipt text copied to clipboard! 📋',
    toast_jpg_downloaded: 'Visual receipt (JPG) downloaded to device! 📥',
    toast_sheets_sync_success: 'Inventory synced successfully from Google Sheets! ({count} items) 🔄',
    toast_sheets_url_saved: 'Google Sheets URL saved and locked! 🔒',
    confirm_clear_cart: 'Are you sure you want to clear all items from the cart?',
    confirm_clear_logs: 'Are you sure you want to delete all transaction and quote logs?',
    confirm_reset_settings: 'Are you sure you want to reset all settings to factory defaults?',
    confirm_delete_product: 'Are you sure you want to delete this product?'
  }
};

class I18nManager {
  constructor() {
    this.storageKey = 'vetassist_language';
    this.lang = this.loadLanguage();
  }

  loadLanguage() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved && (saved === 'tr' || saved === 'en')) {
        return saved;
      }
    } catch (e) {}
    return 'tr';
  }

  getLanguage() {
    return this.lang;
  }

  setLanguage(newLang) {
    if (newLang !== 'tr' && newLang !== 'en') newLang = 'tr';
    this.lang = newLang;
    try {
      localStorage.setItem(this.storageKey, newLang);
    } catch (e) {}

    document.documentElement.lang = newLang;
    this.translateDOM();

    // Trigger re-render of dynamic components
    if (window.app) {
      if (typeof window.app.onLanguageChanged === 'function') {
        window.app.onLanguageChanged();
      }
    }
    if (window.stockManager && typeof window.stockManager.renderUI === 'function') {
      window.stockManager.renderUI();
    }
    if (window.paramManager && typeof window.paramManager.renderUI === 'function') {
      window.paramManager.renderUI();
    }
    if (window.logManager && typeof window.logManager.renderUI === 'function') {
      window.logManager.renderUI();
    }
  }

  t(key, params = {}) {
    const dict = TRANSLATIONS[this.lang] || TRANSLATIONS['tr'];
    let text = dict[key] || TRANSLATIONS['tr'][key] || key;

    if (params && typeof params === 'object') {
      Object.keys(params).forEach(p => {
        text = text.replace(new RegExp(`\\{${p}\\}`, 'g'), params[p]);
      });
    }
    return text;
  }

  translateDOM() {
    // Translate inner text / HTML
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const translation = this.t(key);
      if (translation) {
        if (translation.includes('<') && translation.includes('>')) {
          el.innerHTML = translation;
        } else {
          el.textContent = translation;
        }
      }
    });

    // Translate placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      const translation = this.t(key);
      if (translation) el.placeholder = translation;
    });

    // Translate titles
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      const translation = this.t(key);
      if (translation) el.title = translation;
    });

    // Update document title
    document.title = `${this.t('brand_title')} - ${this.t('brand_subtitle')}`;
  }
}

// Global instance
window.i18n = new I18nManager();
