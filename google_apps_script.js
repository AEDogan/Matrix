/**
 * ==============================================================================
 * VETASSIST GOOGLE SHEETS 2 YÖNLÜ CANLI ENTEGRASYON SCRIPTI (APPS SCRIPT)
 * ==============================================================================
 * Bu script sayesinde VetAssist web/mobil uygulamasından:
 * 1. Stok listenizi anlık olarak içeri çekebilir (GET / Senkronizasyon),
 * 2. Uygulanan tedavilerdeki ilaçları tablodaki 'Stok' sekmesinden otomatik düşebilir,
 * 3. Satış ve adisyon dökümünü 'Gecmis' sekmesine otomatik olarak satır satır kaydedebilirsiniz.
 * 
 * KURULUM ADIMLARI (1 Dakika):
 * 1. Google Sheets tablonuzu açın (Stok sayfanızın adı 'Stok' olsun).
 * 2. Üst menüden: Uzantılar (Extensions) > Apps Script seçeneğine tıklayın.
 * 3. Açılan kod editöründeki her şeyi silip BU KODLARI yapıştırın.
 * 4. Sağ üstteki mavi 'Dağıt (Deploy)' > 'Yeni dağıtım (New deployment)' butonuna tıklayın.
 * 5. Tür seçin: 'Web uygulaması (Web app)'.
 * 6. Erişim yetkisi (Who has access): 'Herkes (Anyone)' olarak seçin ve 'Dağıt'a basın.
 * 7. Oluşan 'Web Uygulaması URL'sini (https://script.google.com/macros/s/.../exec) kopyalayın.
 * 8. VetAssist > Ayarlar > 'Google Sheets Linki' alanına yapıştırıp kaydedin!
 * ==============================================================================
 */

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Stok") || ss.getSheets()[0];
  var data = sheet.getDataRange().getValues();
  
  if (data.length < 1) {
    return ContentService.createTextOutput("Urun_Adi,Birim_Maliyet,Mevcut_Stok,Min_Stok,Kategori\n")
      .setMimeType(ContentService.MimeType.TEXT);
  }
  
  var csvLines = [];
  for (var i = 0; i < data.length; i++) {
    var row = data[i].map(function(cell) {
      var val = String(cell).replace(/"/g, '""');
      return '"' + val + '"';
    });
    csvLines.push(row.join(','));
  }
  
  return ContentService.createTextOutput(csvLines.join('\n'))
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  try {
    var postRaw = e.postData ? e.postData.contents : '{}';
    var contents = JSON.parse(postRaw);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var updatedProducts = 0;
    
    // 1. Stok Tablosunda Miktarları Canlı Düş
    if (contents.consumptions && contents.consumptions.length > 0) {
      var stockSheet = ss.getSheetByName("Stok") || ss.getSheets()[0];
      var data = stockSheet.getDataRange().getValues();
      
      var nameCol = 0;
      var stockCol = 2;
      
      if (data.length > 0) {
        for (var c = 0; c < data[0].length; c++) {
          var header = String(data[0][c]).toLowerCase();
          if (header.includes('urun') || header.includes('ürün') || header.includes('name') || header.includes('ilac') || header.includes('ilaç')) {
            nameCol = c;
          }
          if (header.includes('mevcut') || header.includes('stok') || header.includes('stock') || header.includes('qty')) {
            stockCol = c;
          }
        }
      }
      
      contents.consumptions.forEach(function(item) {
        var itemName = String(item.name || '').trim().toLowerCase();
        var qty = parseFloat(item.totalQty) || 0;
        if (!itemName || qty <= 0) return;
        
        for (var r = 1; r < data.length; r++) {
          var rowName = String(data[r][nameCol] || '').trim().toLowerCase();
          if (rowName === itemName) {
            var currentVal = parseFloat(data[r][stockCol]) || 0;
            var newVal = Math.max(0, currentVal - qty);
            stockSheet.getRange(r + 1, stockCol + 1).setValue(newVal);
            data[r][stockCol] = newVal;
            updatedProducts++;
            break;
          }
        }
      });
    }
    
    // 2. Geçmiş / Adisyonlar Sekmesine Kayıt Ekle
    var addedLogs = 0;
    if (contents.logs && contents.logs.length > 0) {
      var logSheet = ss.getSheetByName("Gecmis");
      if (!logSheet) {
        logSheet = ss.insertSheet("Gecmis");
        logSheet.appendRow(["Tarih_Saat", "Islem_Tipi", "Musteri_Detay", "Satilan_Kalemler", "Ara_Toplam", "KDV", "Genel_Toplam", "Durum"]);
        logSheet.getRange("A1:H1").setFontWeight("bold").setBackground("#e2e8f0");
      }
      
      contents.logs.forEach(function(l) {
        var kdvStr = l.isVatEnabled ? (l.vatAmount + " TL (%" + l.vatRate + ")") : "KDV Yok";
        logSheet.appendRow([
          l.dateStr || new Date().toLocaleString(),
          l.mode === 'treatment' ? 'Uygulanan Tedavi' : 'Fiyat Teklifi',
          l.customer || '-',
          l.itemsSummary || '-',
          l.subTotal || 0,
          kdvStr,
          l.grandTotal || 0,
          'Stoktan Dusuldu'
        ]);
        addedLogs++;
      });
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Stok guncellendi ve gecmis kaydedildi",
      updatedProducts: updatedProducts,
      addedLogs: addedLogs
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
