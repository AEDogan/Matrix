import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:csv/csv.dart';
import 'package:hive_flutter/hive_flutter.dart';
import '../models/urun_model.dart';
import '../models/satis_log_model.dart';

class SheetsService {
  static const String _boxUrunler = "urun_deposu";
  static const String _boxLogs = "satis_log_deposu";
  static const String _keyCachedUrunler = "cached_urunler";
  static const String _keyCachedLogs = "cached_logs";

  /// Google Sheets CSV Senkronizasyonu (Offline-First)
  Future<List<Urun>> urunleriGetir(String sheetCsvUrl) async {
    var box = await Hive.openBox(_boxUrunler);

    if (sheetCsvUrl.isNotEmpty) {
      try {
        final response = await http
            .get(Uri.parse(sheetCsvUrl))
            .timeout(const Duration(seconds: 8));

        if (response.statusCode == 200) {
          List<List<dynamic>> csvTable =
              const CsvToListConverter().convert(response.body);
          List<Urun> urunler = [];

          // İlk satır başlıklar
          for (var i = 1; i < csvTable.length; i++) {
            if (csvTable[i].isNotEmpty && csvTable[i][0].toString().trim().isNotEmpty) {
              urunler.add(Urun.fromCsv(csvTable[i], i));
            }
          }

          if (urunler.isNotEmpty) {
            // İnternet var, yerel veritabanını güncelle
            List<String> rawJsonList =
                urunler.map((e) => jsonEncode(e.toJson())).toList();
            await box.put(_keyCachedUrunler, rawJsonList);
            return urunler;
          }
        }
      } catch (e) {
        print("Google Sheets bağlantı hatası veya çevrimdışı: $e");
      }
    }

    // İnternet yoksa veya hata alındıysa yerel veritabanından oku
    if (box.containsKey(_keyCachedUrunler)) {
      List<dynamic> rawJsonList = box.get(_keyCachedUrunler);
      return rawJsonList.map((e) => Urun.fromJson(jsonDecode(e))).toList();
    }

    // Varsayılan başlangıç ürünleri
    return _varsayilanUrunleriGetir();
  }

  /// Satış ve Teklif Loglarını Getir
  Future<List<SatisLog>> loglariGetir() async {
    var box = await Hive.openBox(_boxLogs);
    if (box.containsKey(_keyCachedLogs)) {
      List<dynamic> rawJsonList = box.get(_keyCachedLogs);
      return rawJsonList.map((e) => SatisLog.fromJson(jsonDecode(e))).toList();
    }
    return [];
  }

  /// Yeni Satış / Teklif Logu Kaydet
  Future<void> logKaydet(SatisLog log) async {
    var box = await Hive.openBox(_boxLogs);
    List<SatisLog> mevcut = await loglariGetir();
    mevcut.insert(0, log); // En başa ekle

    List<String> rawJsonList =
        mevcut.map((e) => jsonEncode(e.toJson())).toList();
    await box.put(_keyCachedLogs, rawJsonList);
  }

  /// Logları Temizle
  Future<void> loglariTemizle() async {
    var box = await Hive.openBox(_boxLogs);
    await box.delete(_keyCachedLogs);
  }

  /// Yerel Envanteri Güncelle
  Future<void> urunleriKaydet(List<Urun> urunler) async {
    var box = await Hive.openBox(_boxUrunler);
    List<String> rawJsonList =
        urunler.map((e) => jsonEncode(e.toJson())).toList();
    await box.put(_keyCachedUrunler, rawJsonList);
  }

  List<Urun> _varsayilanUrunleriGetir() {
    return [
      Urun(id: '1', urunAdi: 'Serum 500 ml (SF)', birimMaliyet: 45.0, mevcutStok: 15, minStok: 5, kategori: 'Serum & Sıvılar'),
      Urun(id: '2', urunAdi: 'Serum 500 ml (Dekstroz %5)', birimMaliyet: 55.0, mevcutStok: 12, minStok: 4, kategori: 'Serum & Sıvılar'),
      Urun(id: '3', urunAdi: 'Vitamin A-D3-E (100 ml)', birimMaliyet: 120.0, mevcutStok: 2, minStok: 3, kategori: 'Vitamin & Mineral'),
      Urun(id: '4', urunAdi: 'Enjektör 10cc (Adet)', birimMaliyet: 2.5, mevcutStok: 50, minStok: 20, kategori: 'Sarf Malzeme'),
      Urun(id: '5', urunAdi: 'Antibiyotik Enjeksiyon (100 ml)', birimMaliyet: 250.0, mevcutStok: 6, minStok: 2, kategori: 'Antibiyotikler'),
      Urun(id: '6', urunAdi: 'Ağrı Kesici & Antienflamatuar', birimMaliyet: 180.0, mevcutStok: 8, minStok: 3, kategori: 'Antienflamatuar'),
      Urun(id: '7', urunAdi: 'Kuduz Aşısı (Doz)', birimMaliyet: 110.0, mevcutStok: 18, minStok: 5, kategori: 'Aşı & Parazit'),
      Urun(id: '8', urunAdi: 'Meme İçi Tüp (Antibakteriyel)', birimMaliyet: 65.0, mevcutStok: 3, minStok: 4, kategori: 'Meme Sağlığı'),
    ];
  }
}
