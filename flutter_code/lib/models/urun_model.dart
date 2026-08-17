class Urun {
  final String id;
  final String urunAdi;
  final double birimMaliyet;
  final int mevcutStok;
  final int minStok;
  final String kategori;

  Urun({
    required this.id,
    required this.urunAdi,
    required this.birimMaliyet,
    required this.mevcutStok,
    required this.minStok,
    required this.kategori,
  });

  // Stok uyarı kontrolü
  bool get stokUyarisiVar => mevcutStok <= minStok;

  // Satış Fiyatı Hesaplama
  double satisFiyati(double karMarjiYuzde) {
    return birimMaliyet * (1 + (karMarjiYuzde / 100));
  }

  // CSV Satırından Model Oluşturma
  factory Urun.fromCsv(List<dynamic> row, [int index = 0]) {
    return Urun(
      id: 'prod_$index',
      urunAdi: row[0].toString().trim(),
      birimMaliyet: double.tryParse(row[1].toString().replaceAll(',', '.')) ?? 0.0,
      mevcutStok: int.tryParse(row[2].toString()) ?? 0,
      minStok: int.tryParse(row[3].toString()) ?? 0,
      kategori: row.length >= 5 ? row[4].toString().trim() : 'Genel',
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'urunAdi': urunAdi,
    'birimMaliyet': birimMaliyet,
    'mevcutStok': mevcutStok,
    'minStok': minStok,
    'kategori': kategori,
  };

  factory Urun.fromJson(Map<String, dynamic> json) => Urun(
    id: json['id'] ?? '',
    urunAdi: json['urunAdi'] ?? '',
    birimMaliyet: (json['birimMaliyet'] as num?)?.toDouble() ?? 0.0,
    mevcutStok: (json['mevcutStok'] as num?)?.toInt() ?? 0,
    minStok: (json['minStok'] as num?)?.toInt() ?? 0,
    kategori: json['kategori'] ?? 'Genel',
  );
}
