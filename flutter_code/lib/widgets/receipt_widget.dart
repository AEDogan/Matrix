import 'package:flutter/material.dart';

class ReceiptWidget extends StatelessWidget {
  final String baslik; // "VETERİNER HİZMET DETAYI" veya "FİYAT TEKLİFİ / BİLGİLENDİRME"
  final String? musteri;
  final List<Map<String, dynamic>> kalemler; // [{ 'ad': 'Serum', 'adet': 1, 'sonFiyat': 200.0 }]
  final double araToplam;
  final double kdvTutar;
  final double genelToplam;
  final bool kdvUygula;
  final int kdvOrani;
  final String banka;
  final String iban;
  final String adres;
  final String telefon;

  const ReceiptWidget({
    Key? key,
    required this.baslik,
    this.musteri,
    required this.kalemler,
    required this.araToplam,
    required this.kdvTutar,
    required this.genelToplam,
    this.kdvUygula = false,
    this.kdvOrani = 18,
    this.banka = "Ziraat Bankası",
    this.iban = "TR12 0001 0002 0003 0004 0005 06",
    this.adres = "Kamçıllı, Mandıra Sokak No 12, 10085 Karesi/Balıkesir",
    this.telefon = "0552 185 03 08",
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 420,
      color: Colors.white,
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 26),
      child: Column(
        crossAxisAlignment: CrossAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          // Başlık
          Center(
            child: Text(
              baslik.toUpperCase(),
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w800,
                letterSpacing: 0.5,
                color: Colors.black,
              ),
            ),
          ),
          const SizedBox(height: 4),
          Center(
            child: Text(
              "${DateTime.now().day.toString().padLeft(2, '0')}.${DateTime.now().month.toString().padLeft(2, '0')}.${DateTime.now().year} ${DateTime.now().hour.toString().padLeft(2, '0')}:${DateTime.now().minute.toString().padLeft(2, '0')}",
              style: const TextStyle(fontSize: 11, color: Colors.black54),
            ),
          ),

          if (musteri != null && musteri!.trim().isNotEmpty) ...[
            const SizedBox(height: 4),
            Center(
              child: Text(
                "Hasta Sahibi / Müşteri: $musteri",
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
              ),
            ),
          ],

          const SizedBox(height: 10),
          const Divider(thickness: 2, color: Colors.black),

          // Tablo Başlıkları
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 4),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  flex: 3,
                  child: Text(
                    "Ürün / Hizmet Adı",
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                      color: Colors.black,
                    ),
                  ),
                ),
                Expanded(
                  flex: 1,
                  child: Text(
                    "Adet/KM",
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                      color: Colors.black,
                    ),
                  ),
                ),
                Expanded(
                  flex: 2,
                  child: Text(
                    "Tutar",
                    textAlign: TextAlign.right,
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                      color: Colors.black,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const Divider(color: Colors.black45),

          // Kalem Listesi
          ...kalemler.map((item) {
            final double sonFiyat = (item['sonFiyat'] ?? item['tutar'] ?? 0.0) as double;
            return Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Row(
                children: [
                  Expanded(
                    flex: 3,
                    child: Text(
                      item['ad'].toString(),
                      style: const TextStyle(fontSize: 13, color: Colors.black),
                    ),
                  ),
                  Expanded(
                    flex: 1,
                    child: Text(
                      item['adet'].toString(),
                      textAlign: TextAlign.center,
                      style: const TextStyle(fontSize: 13, color: Colors.black),
                    ),
                  ),
                  Expanded(
                    flex: 2,
                    child: Text(
                      "${sonFiyat.toStringAsFixed(2)} TL",
                      textAlign: TextAlign.right,
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        color: Colors.black,
                      ),
                    ),
                  ),
                ],
              ),
            );
          }),

          const Divider(thickness: 2, color: Colors.black),

          // Ara Toplam
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text("Ara Toplam:", style: TextStyle(fontSize: 13, color: Colors.black)),
              Text(
                "${araToplam.toStringAsFixed(2)} TL",
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  color: Colors.black,
                ),
              ),
            ],
          ),

          if (kdvUygula) ...[
            const SizedBox(height: 4),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text("KDV (%$kdvOrani):", style: const TextStyle(fontSize: 13, color: Colors.black)),
                Text(
                  "${kdvTutar.toStringAsFixed(2)} TL",
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: Colors.black,
                  ),
                ),
              ],
            ),
          ],

          const SizedBox(height: 6),

          // Ödenecek Tutar
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                "Ödenecek Tutar:",
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Colors.black,
                ),
              ),
              Text(
                "${genelToplam.toStringAsFixed(2)} TL",
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.black,
                ),
              ),
            ],
          ),

          const Divider(thickness: 2, color: Colors.black),
          const SizedBox(height: 6),

          // Alt Bilgiler
          Text("Banka: $banka", style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.black)),
          const SizedBox(height: 2),
          Text("IBAN: $iban", style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.black)),
          const SizedBox(height: 2),
          Text("Adres: $adres", style: const TextStyle(fontSize: 11, color: Colors.black87)),
          const SizedBox(height: 2),
          Text("Tel: $telefon", style: const TextStyle(fontSize: 11, color: Colors.black87)),

          const SizedBox(height: 10),
          const Divider(color: Colors.black45),
          const SizedBox(height: 8),

          // Mali Uyarı
          const Center(
            child: Text(
              "MALİ BELGE DEĞİLDİR",
              style: TextStyle(
                color: Colors.red,
                fontWeight: FontWeight.w900,
                fontSize: 13,
                letterSpacing: 1.2,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
