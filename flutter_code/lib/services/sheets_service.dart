import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:csv/csv.dart';
import 'package:hive_flutter/hive_flutter.dart';
import '../models/urun_model.dart';

class SheetsService {
  static const String _boxName = "urun_deposu";
  static const String _cacheKey = "cached_urunler";

  // Google Sheets veya Yayınlanan CSV Bağlantısından Veri Çek
  Future<List<Urun>> urunleriGetir(String sheetCsvUrl) async {
    var box = await Hive.openBox(_boxName);

    try {
      if (sheetCsvUrl.isNotEmpty) {
        final response = await http.get(Uri.parse(sheetCsvUrl)).timeout(const Duration(seconds: 8));

        if (response.statusCode == 200) {
          List<List<dynamic>> csvTable = const CsvToListConverter().convert(response.body);
          List<Urun> urunler = [];

          // İlk satır başlıklar olduğu için 1. indeksten başlıyoruz
          for (var i = 1; i < csvTable.length; i++) {
            if (csvTable[i].length >= 2) {
              urunler.add(Urun.fromCsv(csvTable[i], i));
            }
          }

          // İnternet var, yerel depoyu güncelle
          List<String> rawJsonList = urunler.map((e) => jsonEncode(e.toJson())).toList();
          await box.put(_cacheKey, rawJsonList);

          return urunler;
        }
      }
    } catch (e) {
      print("Google Sheets bağlantı hatası veya internet yok: $e");
    }

    // İnternet yoksa veya hata alındıysa yerel hafızadan (Offline-First) oku
    if (box.containsKey(_cacheKey)) {
      List<dynamic> rawJsonList = box.get(_cacheKey);
      return rawJsonList.map((e) => Urun.fromJson(jsonDecode(e))).toList();
    }

    return _varsayilanUrunleriGetir();
  }

  List<Urun> _varsayilanUrunleriGetir() {
    return [
      Urun(id: '1', urunAdi: 'Serum 500 ml (SF)', birimMaliyet: 45.00, mevcutStok: 15, minStok: 5, kategori: 'Serum & Sıvılar'),
      Urun(id: '2', urunAdi: 'Vitamin A-D3-E', birimMaliyet: 120.00, mevcutStok: 2, minStok: 3, kategori: 'Vitamin & Mineral'),
      Urun(id: '3', urunAdi: 'Enjektör 10cc', birimMaliyet: 2.50, mevcutStok: 50, minStok: 20, kategori: 'Sarf Malzeme'),
      Urun(id: '4', urunAdi: 'Antibiyotik Enjeksiyon', birimMaliyet: 250.00, mevcutStok: 6, minStok: 2, kategori: 'Antibiyotikler'),
    ];
  }
}
