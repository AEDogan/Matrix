import 'package:flutter/material.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'models/urun_model.dart';
import 'models/satis_log_model.dart';
import 'services/sheets_service.dart';
import 'services/hesaplama_service.dart';
import 'widgets/receipt_widget.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Hive.initFlutter();
  runApp(const SahaVeterinerApp());
}

class SahaVeterinerApp extends StatelessWidget {
  const SahaVeterinerApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'SahaVeteriner',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.light,
        primaryColor: const Color(0xFF0284C7),
        scaffoldBackgroundColor: const Color(0xFFF4F5F8),
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF0284C7),
          primary: const Color(0xFF0284C7),
          secondary: const Color(0xFFF59E0B),
          surface: Colors.white,
        ),
        cardTheme: CardTheme(
          elevation: 1,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
            side: const BorderSide(color: Color(0xFFCBD5E1), width: 1.5),
          ),
        ),
        fontFamily: 'Roboto',
      ),
      home: const HomeScreen(),
    );
  }
}

class HomeScreen extends StatefulWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;
  final SheetsService _sheetsService = SheetsService();

  List<Urun> _urunler = [];
  List<SatisLog> _logs = [];

  // Sepet: { urun: Urun, adet: int }
  final List<Map<String, dynamic>> _cart = [];
  int _distanceKm = 0;
  bool _isDistanceEnabled = true;
  bool _isVatEnabled = false;
  int _vatRate = 18;

  // Mod: 'treatment' (Tedavi - Stok Düşer) | 'quote' (Fiyat Teklifi - Stok Sabit)
  String _mode = 'treatment';
  String _customerName = '';

  // Parametreler
  double _profitMargin = 25.0; // %25
  double _kmRate = 25.0; // 25 TL/km
  double _fixedClinicFee = 400.0; // 400 TL
  bool _distributeFixedExpense = false; // Gider Giydirme (PDF formülü)

  // Klinik Bilgileri
  String _clinicTitle = "VETERİNER HİZMET DETAYI";
  String _bankName = "Ziraat Bankası";
  String _ibanNo = "TR12 0001 0002 0003 0004 0005 06";
  String _clinicAddress = "Kamçıllı, Mandıra Sokak No 12, 10085 Karesi/Balıkesir";
  String _phoneNo = "0552 185 03 08";
  String _sheetsUrl = "";

  @override
  void initState() {
    super.initState();
    _loadInitialData();
  }

  Future<void> _loadInitialData() async {
    final urunler = await _sheetsService.urunleriGetir(_sheetsUrl);
    final logs = await _sheetsService.loglariGetir();
    setState(() {
      _urunler = urunler;
      _logs = logs;
    });
  }

  void _addToCart(Urun urun, [int qty = 1]) {
    setState(() {
      final index = _cart.indexWhere((c) => (c['urun'] as Urun).id == urun.id);
      if (index != -1) {
        _cart[index]['adet'] = (_cart[index]['adet'] as int) + qty;
      } else {
        _cart.add({'urun': urun, 'adet': qty});
      }
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('"${urun.urunAdi}" ($qty adet) eklendi'),
        duration: const Duration(seconds: 1),
      ),
    );
  }

  void _updateCartQty(String id, int delta) {
    setState(() {
      final index = _cart.indexWhere((c) => (c['urun'] as Urun).id == id);
      if (index != -1) {
        final current = _cart[index]['adet'] as int;
        if (current + delta <= 0) {
          _cart.removeAt(index);
        } else {
          _cart[index]['adet'] = current + delta;
        }
      }
    });
  }

  void _clearCart() {
    setState(() {
      _cart.clear();
      _distanceKm = 0;
      _customerName = '';
    });
  }

  Map<String, dynamic> _calculateTotals() {
    final List<Map<String, dynamic>> rawItems = _cart.map((c) {
      final urun = c['urun'] as Urun;
      final adet = c['adet'] as int;
      return {
        'id': urun.id,
        'ad': urun.urunAdi,
        'hamMaliyet': urun.birimMaliyet,
        'adet': adet,
      };
    }).toList();

    // PDF Şartnamesindeki Exact Fiyat ve Gider Dağıtım Fonksiyonu
    final processedItems = FiyatHesaplayici.maliyetVeGiderHesapla(
      kalemler: rawItems,
      karOraniYuzde: _profitMargin,
      sabitKlinikGideri: _fixedClinicFee,
      orantiliGiderDagit: _distributeFixedExpense,
    );

    double itemsTotal = 0.0;
    final List<Map<String, dynamic>> finalReceiptItems = [];

    for (var it in processedItems) {
      final double total = (it['sonToplamFiyat'] as double);
      itemsTotal += total;
      finalReceiptItems.add({
        'ad': it['ad'],
        'adet': it['adet'],
        'sonFiyat': total,
      });
    }

    // Ulaşım
    final double distanceTotal = _isDistanceEnabled ? (_distanceKm * _kmRate) : 0.0;
    if (_isDistanceEnabled && _distanceKm > 0) {
      finalReceiptItems.add({
        'ad': 'Ulaşım Bedeli (${_distanceKm} km)',
        'adet': '$_distanceKm km',
        'sonFiyat': distanceTotal,
      });
    }

    // Eğer sabit gider dağıtılmadıysa ayrı satır olarak ekle
    double extraFee = 0.0;
    if (!_distributeFixedExpense && _fixedClinicFee > 0) {
      extraFee = _fixedClinicFee;
      finalReceiptItems.add({
        'ad': 'Sabit Klinik Hizmet Gideri',
        'adet': '1',
        'sonFiyat': extraFee,
      });
    }

    final double araToplam = itemsTotal + distanceTotal + extraFee;
    final double kdvTutar = _isVatEnabled ? (araToplam * (_vatRate / 100)) : 0.0;
    final double genelToplam = araToplam + kdvTutar;

    return {
      'items': finalReceiptItems,
      'itemsTotal': itemsTotal,
      'distanceTotal': distanceTotal,
      'araToplam': araToplam,
      'kdvTutar': kdvTutar,
      'genelToplam': genelToplam,
      'isDistributing': _distributeFixedExpense && _cart.isNotEmpty,
    };
  }

  void _finalizeReceipt(Map<String, dynamic> calc) async {
    final bool isTreatment = _mode == 'treatment';

    // 1. Stok Düş
    if (isTreatment) {
      for (var c in _cart) {
        final urun = c['urun'] as Urun;
        final adet = c['adet'] as int;
        final index = _urunler.indexWhere((u) => u.id == urun.id);
        if (index != -1) {
          final newStock = (_urunler[index].mevcutStok - adet).clamp(0, 999999);
          _urunler[index] = _urunler[index].copyWith(mevcutStok: newStock);
        }
      }
      await _sheetsService.urunleriKaydet(_urunler);
    }

    // 2. Log Kaydet
    final now = DateTime.now();
    final dateStr =
        "${now.day.toString().padLeft(2, '0')}.${now.month.toString().padLeft(2, '0')}.${now.year} ${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}";

    final summary = _cart
        .map((c) => "${c['adet']}x ${(c['urun'] as Urun).urunAdi}")
        .join(', ');

    final newLog = SatisLog(
      id: 'log_${now.millisecondsSinceEpoch}',
      tarihSaat: dateStr,
      islemTipi: isTreatment ? 'Uygulanan Tedavi' : 'Fiyat Teklifi',
      musteri: _customerName.trim().isEmpty ? 'Genel Müşteri' : _customerName.trim(),
      satilanKalemler: summary,
      araToplam: calc['araToplam'] as double,
      kdvTutar: calc['kdvTutar'] as double,
      genelToplam: calc['genelToplam'] as double,
      stokDustu: isTreatment,
      giderGiydirildi: _distributeFixedExpense,
    );

    await _sheetsService.logKaydet(newLog);
    final logs = await _sheetsService.loglariGetir();

    setState(() {
      _logs = logs;
      _clearCart();
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(isTreatment
            ? '✅ Tedavi tamamlandı ve stoklar güncellendi!'
            : '📄 Fiyat teklifi kaydedildi (stoklar korundu).'),
        backgroundColor: isTreatment ? const Color(0xFF16A34A) : const Color(0xFF0284C7),
      ),
    );
  }

  void _showReceiptDialog() {
    if (_cart.isEmpty && _distanceKm == 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Lütfen önce ilaç seçin veya KM girin.')),
      );
      return;
    }

    final calc = _calculateTotals();
    final isQuote = _mode == 'quote';
    final baslik = isQuote ? "FİYAT TEKLİFİ / BİLGİLENDİRME" : _clinicTitle;

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        contentPadding: EdgeInsets.zero,
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ReceiptWidget(
                baslik: baslik,
                musteri: _customerName,
                kalemler: List<Map<String, dynamic>>.from(calc['items']),
                araToplam: calc['araToplam'] as double,
                kdvTutar: calc['kdvTutar'] as double,
                genelToplam: calc['genelToplam'] as double,
                kdvUygula: _isVatEnabled,
                kdvOrani: _vatRate,
                banka: _bankName,
                iban: _ibanNo,
                adres: _clinicAddress,
                telefon: _phoneNo,
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Kapat'),
          ),
          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF16A34A),
              foregroundColor: Colors.white,
            ),
            icon: const Icon(Icons.check_circle),
            label: Text(isQuote ? 'Teklifi Kaydet' : 'Tedaviyi Onayla & Stok Düş'),
            onPressed: () {
              Navigator.pop(ctx);
              _finalizeReceipt(calc);
            },
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          '🐾 SahaVeteriner',
          style: TextStyle(fontWeight: FontWeight.w800, letterSpacing: -0.5),
        ),
        backgroundColor: const Color(0xFF0284C7),
        elevation: 2,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Yenile',
            onPressed: _loadInitialData,
          ),
        ],
      ),
      body: IndexedStack(
        index: _currentIndex,
        children: [
          _buildCalcTab(),
          _buildStockTab(),
          _buildLogsTab(),
          _buildParamsTab(),
          _buildSettingsTab(),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        type: BottomNavigationBarType.fixed,
        selectedItemColor: const Color(0xFF0284C7),
        unselectedItemColor: const Color(0xFF64748B),
        selectedLabelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11),
        unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 11),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.calculate), label: 'Hesapla'),
          BottomNavigationBarItem(icon: Icon(Icons.inventory_2), label: 'Stok'),
          BottomNavigationBarItem(icon: Icon(Icons.history), label: 'Geçmiş'),
          BottomNavigationBarItem(icon: Icon(Icons.tune), label: 'Giderler'),
          BottomNavigationBarItem(icon: Icon(Icons.settings), label: 'Ayarlar'),
        ],
      ),
    );
  }

  // =========================================================================
  // 1. HESAPLAMA SEKMESİ (Mobil Saha Odaklı)
  // =========================================================================
  Widget _buildCalcTab() {
    final calc = _calculateTotals();
    final bool isTreatment = _mode == 'treatment';

    return SingleChildScrollView(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAlignment.stretch,
        children: [
          // MOD SEÇİCİ (Uygulanan Tedavi vs Fiyat Teklifi)
          Card(
            child: Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton.icon(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: isTreatment ? const Color(0xFFDCFCE7) : const Color(0xFFF1F5F9),
                            foregroundColor: isTreatment ? const Color(0xFF16A34A) : const Color(0xFF475569),
                            side: BorderSide(
                              color: isTreatment ? const Color(0xFF16A34A) : const Color(0xFFCBD5E1),
                              width: isTreatment ? 2 : 1,
                            ),
                            padding: const EdgeInsets.symmetric(vertical: 12),
                          ),
                          icon: const Icon(Icons.vaccines, size: 20),
                          label: const Text(
                            'Uygulanan Tedavi\n(Stok Düşer)',
                            textAlign: TextAlign.center,
                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                          ),
                          onPressed: () => setState(() => _mode = 'treatment'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: ElevatedButton.icon(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: !isTreatment ? const Color(0xFFE0F2FE) : const Color(0xFFF1F5F9),
                            foregroundColor: !isTreatment ? const Color(0xFF0284C7) : const Color(0xFF475569),
                            side: BorderSide(
                              color: !isTreatment ? const Color(0xFF0284C7) : const Color(0xFFCBD5E1),
                              width: !isTreatment ? 2 : 1,
                            ),
                            padding: const EdgeInsets.symmetric(vertical: 12),
                          ),
                          icon: const Icon(Icons.description, size: 20),
                          label: const Text(
                            'Fiyat Teklifi\n(Stok Sabit)',
                            textAlign: TextAlign.center,
                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                          ),
                          onPressed: () => setState(() => _mode = 'quote'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 10),

          // MÜŞTERİ BİLGİSİ
          Card(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              child: TextField(
                decoration: const InputDecoration(
                  icon: Icon(Icons.person),
                  hintText: 'Hasta Sahibi / Çiftlik Adı (Opsiyonel)',
                  border: InputBorder.none,
                ),
                onChanged: (val) => _customerName = val,
              ),
            ),
          ),
          const SizedBox(height: 10),

          // İLAÇ EKLEME
          Card(
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAlignment.start,
                children: [
                  const Text('➕ İlaç & Malzeme Seçimi', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                  const SizedBox(height: 8),
                  Autocomplete<Urun>(
                    displayStringForOption: (u) => u.urunAdi,
                    optionsBuilder: (TextEditingValue textVal) {
                      if (textVal.text.isEmpty) return const Iterable<Urun>.empty();
                      return _urunler.where((u) => u.urunAdi.toLowerCase().contains(textVal.text.toLowerCase()));
                    },
                    onSelected: (Urun selected) => _addToCart(selected, 1),
                    fieldViewBuilder: (context, textEditingController, focusNode, onFieldSubmitted) {
                      return TextField(
                        controller: textEditingController,
                        focusNode: focusNode,
                        decoration: InputDecoration(
                          hintText: 'İlaç veya malzeme ara...',
                          prefixIcon: const Icon(Icons.search),
                          filled: true,
                          fillColor: const Color(0xFFF8FAFC),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 10),

          // SEPET LİSTESİ
          if (_cart.isNotEmpty)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Seçilen Kalemler (${_cart.length})', style: const TextStyle(fontWeight: FontWeight.bold)),
                        TextButton(onPressed: _clearCart, child: const Text('Temizle', style: TextStyle(color: Colors.red))),
                      ],
                    ),
                    const Divider(),
                    ..._cart.map((c) {
                      final urun = c['urun'] as Urun;
                      final adet = c['adet'] as int;
                      final salePrice = urun.satisFiyati(_profitMargin);

                      return ListTile(
                        contentPadding: EdgeInsets.zero,
                        title: Text(urun.urunAdi, style: const TextStyle(fontWeight: FontWeight.bold)),
                        subtitle: Text('Birim: ${salePrice.toStringAsFixed(2)} TL | Stok: ${urun.mevcutStok}'),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            IconButton(icon: const Icon(Icons.remove_circle_outline), onPressed: () => _updateCartQty(urun.id, -1)),
                            Text('$adet', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                            IconButton(icon: const Icon(Icons.add_circle_outline), onPressed: () => _updateCartQty(urun.id, 1)),
                          ],
                        ),
                      );
                    }),
                  ],
                ),
              ),
            ),
          const SizedBox(height: 10),

          // ULAŞIM (KM)
          Card(
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('🚗 Ulaşım (KM)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                      Switch(
                        value: _isDistanceEnabled,
                        onChanged: (v) => setState(() => _isDistanceEnabled = v),
                      ),
                    ],
                  ),
                  if (_isDistanceEnabled) ...[
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            keyboardType: TextInputType.number,
                            decoration: InputDecoration(
                              labelText: 'Mesafe',
                              suffixText: 'KM',
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                            ),
                            onChanged: (v) => setState(() => _distanceKm = int.tryParse(v) ?? 0),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Wrap(
                          spacing: 4,
                          children: [5, 10, 15, 25].map((km) {
                            return ActionChip(
                              label: Text('+$km'),
                              onPressed: () => setState(() => _distanceKm += km),
                            );
                          }).toList(),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
          ),
          const SizedBox(height: 10),

          // GİDER GİYDİRME & KDV
          Card(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                children: [
                  SwitchListTile(
                    title: const Text('✨ Sabit Gideri İlaçlara Orantılı Dağıt', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                    subtitle: Text('Sabit Klinik Gideri (${_fixedClinicFee.toStringAsFixed(2)} TL) kârsız olarak ilaçlara giydirilir.'),
                    value: _distributeFixedExpense,
                    onChanged: (v) => setState(() => _distributeFixedExpense = v),
                  ),
                  const Divider(),
                  SwitchListTile(
                    title: const Text('📋 Faturalandır (KDV Ekle)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                    subtitle: Text('KDV Oranı: %$_vatRate'),
                    value: _isVatEnabled,
                    onChanged: (v) => setState(() => _isVatEnabled = v),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 10),

          // ÖZET TOPLAM KARTI
          Card(
            color: const Color(0xFF0F172A),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Ara Toplam:', style: TextStyle(color: Colors.white70)),
                      Text('${(calc['araToplam'] as double).toStringAsFixed(2)} TL', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                    ],
                  ),
                  if (_isVatEnabled) ...[
                    const SizedBox(height: 4),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('KDV (%$_vatRate):', style: const TextStyle(color: Colors.white70)),
                        Text('${(calc['kdvTutar'] as double).toStringAsFixed(2)} TL', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ],
                  const Divider(color: Colors.white24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('ÖDENECEK TUTAR:', style: TextStyle(color: Color(0xFFFEF08A), fontWeight: FontWeight.w900, fontSize: 15)),
                      Text('${(calc['genelToplam'] as double).toStringAsFixed(2)} TL', style: const TextStyle(color: Color(0xFFFEF08A), fontWeight: FontWeight.w900, fontSize: 22)),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 14),

          // BÜYÜK ADİSYON BUTONU
          SizedBox(
            height: 54,
            child: ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFF59E0B),
                foregroundColor: const Color(0xFF0F172A),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              icon: const Icon(Icons.receipt_long, size: 28),
              label: const Text('ADİSYON OLUŞTUR & ÖNİZLE', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 15)),
              onPressed: _showReceiptDialog,
            ),
          ),
        ],
      ),
    );
  }

  // =========================================================================
  // 2. STOK TAKİBİ SEKMESİ
  // =========================================================================
  Widget _buildStockTab() {
    final criticalItems = _urunler.where((u) => u.stokUyarisiVar).toList();

    return Column(
      children: [
        Container(
          color: Colors.white,
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(color: const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(10)),
                  child: Column(
                    children: [
                      Text('${_urunler.length}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                      const Text('Toplam Kalem', style: TextStyle(fontSize: 11, color: Colors.black54)),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(color: const Color(0xFFFEE2E2), borderRadius: BorderRadius.circular(10)),
                  child: Column(
                    children: [
                      Text('${criticalItems.length}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.red)),
                      const Text('🚨 Kritik Stok', style: TextStyle(fontSize: 11, color: Colors.red)),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.all(12),
            itemCount: _urunler.length,
            itemBuilder: (ctx, i) {
              final item = _urunler[i];
              final isCrit = item.stokUyarisiVar;

              return Card(
                child: ListTile(
                  title: Text(item.urunAdi, style: const TextStyle(fontWeight: FontWeight.bold)),
                  subtitle: Text('Maliyet: ${item.birimMaliyet} TL | Satış (+%${_profitMargin.toInt()}): ${item.satisFiyati(_profitMargin).toStringAsFixed(2)} TL'),
                  trailing: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: isCrit ? const Color(0xFFFEE2E2) : const Color(0xFFDCFCE7),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: isCrit ? Colors.red : Colors.green),
                    ),
                    child: Text(
                      'Stok: ${item.mevcutStok}',
                      style: TextStyle(fontWeight: FontWeight.bold, color: isCrit ? Colors.red : Colors.green),
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  // =========================================================================
  // 3. SATIŞ & TEKLİF GEÇMİŞİ (LOGLAR) SEKMESİ
  // =========================================================================
  Widget _buildLogsTab() {
    double totalTreatment = 0;
    double totalQuote = 0;
    for (var l in _logs) {
      if (l.islemTipi == 'Uygulanan Tedavi') {
        totalTreatment += l.genelToplam;
      } else {
        totalQuote += l.genelToplam;
      }
    }

    return Column(
      children: [
        Container(
          color: Colors.white,
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(color: const Color(0xFFDCFCE7), borderRadius: BorderRadius.circular(10)),
                  child: Column(
                    children: [
                      Text('${totalTreatment.toStringAsFixed(2)} TL', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Color(0xFF16A34A))),
                      const Text('💉 Tedavi Cirosu', style: TextStyle(fontSize: 11, color: Colors.black54)),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(color: const Color(0xFFE0F2FE), borderRadius: BorderRadius.circular(10)),
                  child: Column(
                    children: [
                      Text('${totalQuote.toStringAsFixed(2)} TL', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Color(0xFF0284C7))),
                      const Text('📄 Verilen Teklifler', style: TextStyle(fontSize: 11, color: Colors.black54)),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
        Expanded(
          child: _logs.isEmpty
              ? const Center(child: Text('Henüz işlem geçmişi bulunmuyor.'))
              : ListView.builder(
                  padding: const EdgeInsets.all(12),
                  itemCount: _logs.length,
                  itemBuilder: (ctx, i) {
                    final log = _logs[i];
                    final isTreatment = log.islemTipi == 'Uygulanan Tedavi';

                    return Card(
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Chip(
                                  backgroundColor: isTreatment ? const Color(0xFFDCFCE7) : const Color(0xFFE0F2FE),
                                  label: Text(
                                    log.islemTipi,
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 11,
                                      color: isTreatment ? const Color(0xFF16A34A) : const Color(0xFF0284C7),
                                    ),
                                  ),
                                ),
                                Text(log.tarihSaat, style: const TextStyle(fontSize: 11, color: Colors.black54)),
                              ],
                            ),
                            Text('👤 ${log.musteri}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                            const SizedBox(height: 4),
                            Text('Kalemler: ${log.satilanKalemler}', style: const TextStyle(fontSize: 12, color: Colors.black87)),
                            const Divider(),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  log.stokDustu ? '✅ Stok Düşüldü' : '🔒 Stok Sabit',
                                  style: const TextStyle(fontSize: 11, color: Colors.black54),
                                ),
                                Text(
                                  '${log.genelToplam.toStringAsFixed(2)} TL',
                                  style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: Color(0xFF0284C7)),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }

  // =========================================================================
  // 4. MALİYET PARAMETRELERİ SEKMESİ
  // =========================================================================
  Widget _buildParamsTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(14),
      child: Column(
        children: [
          Card(
            child: ListTile(
              title: const Text('İlaç / Ürün Kâr Marjı (%)', style: TextStyle(fontWeight: FontWeight.bold)),
              subtitle: const Text('Tüm ilaç maliyetlerine uygulanan varsayılan kâr yüzdesi.'),
              trailing: SizedBox(
                width: 80,
                child: TextField(
                  keyboardType: TextInputType.number,
                  textAlign: TextAlign.center,
                  decoration: InputDecoration(
                    suffixText: '%',
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  controller: TextEditingController(text: '${_profitMargin.toInt()}'),
                  onChanged: (v) => _profitMargin = double.tryParse(v) ?? 25.0,
                ),
              ),
            ),
          ),
          const SizedBox(height: 8),
          Card(
            child: ListTile(
              title: const Text('KM Başına Ulaşım Ücreti (TL)', style: TextStyle(fontWeight: FontWeight.bold)),
              subtitle: const Text('Mesafe ile çarpılan sabit KM tarifesi.'),
              trailing: SizedBox(
                width: 90,
                child: TextField(
                  keyboardType: TextInputType.number,
                  textAlign: TextAlign.center,
                  decoration: InputDecoration(
                    suffixText: 'TL',
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  controller: TextEditingController(text: '${_kmRate.toInt()}'),
                  onChanged: (v) => _kmRate = double.tryParse(v) ?? 25.0,
                ),
              ),
            ),
          ),
          const SizedBox(height: 8),
          Card(
            child: ListTile(
              title: const Text('Sabit Klinik Hizmet Gideri (TL)', style: TextStyle(fontWeight: FontWeight.bold)),
              subtitle: const Text('Her işleme eklenen standart klinik servis payı.'),
              trailing: SizedBox(
                width: 90,
                child: TextField(
                  keyboardType: TextInputType.number,
                  textAlign: TextAlign.center,
                  decoration: InputDecoration(
                    suffixText: 'TL',
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  controller: TextEditingController(text: '${_fixedClinicFee.toInt()}'),
                  onChanged: (v) => _fixedClinicFee = double.tryParse(v) ?? 400.0,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // =========================================================================
  // 5. FİŞ & İLETİŞİM AYARLARI SEKMESİ
  // =========================================================================
  Widget _buildSettingsTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAlignment.stretch,
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAlignment.start,
                children: [
                  const Text('🏢 Klinik & Banka Bilgileri', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  const SizedBox(height: 12),
                  TextField(
                    decoration: const InputDecoration(labelText: 'Klinik / Fiş Başlığı'),
                    controller: TextEditingController(text: _clinicTitle),
                    onChanged: (v) => _clinicTitle = v,
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    decoration: const InputDecoration(labelText: 'Banka Adı'),
                    controller: TextEditingController(text: _bankName),
                    onChanged: (v) => _bankName = v,
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    decoration: const InputDecoration(labelText: 'IBAN Numarası'),
                    controller: TextEditingController(text: _ibanNo),
                    onChanged: (v) => _ibanNo = v,
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    decoration: const InputDecoration(labelText: 'İşletme Adresi'),
                    controller: TextEditingController(text: _clinicAddress),
                    onChanged: (v) => _clinicAddress = v,
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    decoration: const InputDecoration(labelText: 'İletişim Telefonu'),
                    controller: TextEditingController(text: _phoneNo),
                    onChanged: (v) => _phoneNo = v,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
