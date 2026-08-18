class FiyatHesaplayici {
  /// Sabit Klinik Giderini Kalemlere Orantılı Dağıtma Hesabı
  /// Kural: Kâr SADECE ürünün ham maliyetine uygulanır.
  /// Sabit klinik gideri kârsız (yalın tutarıyla) ilacın kârlı satış fiyatına eklenir.
  /// Formül: (Ürün Maliyeti * (1 + Kar Oranı)) + Dağıtılan Sabit Gider Payı
  static List<Map<String, dynamic>> maliyetVeGiderHesapla({
    required List<Map<String, dynamic>> kalemler, // [{ 'ad': 'Serum', 'hamMaliyet': 160.0, 'adet': 1 }]
    required double karOraniYuzde, // örn: 25
    required double sabitKlinikGideri, // örn: 400.0
    required bool orantiliGiderDagit,
  }) {
    if (kalemler.isEmpty) return [];

    double karCarpani = 1 + (karOraniYuzde / 100);

    // 1. Kâr SADECE ürünün ham maliyetine uygulanır
    List<Map<String, dynamic>> karliKalemler = kalemler.map((item) {
      double hamMaliyet = (item['hamMaliyet'] as num).toDouble();
      int adet = (item['adet'] as num?)?.toInt() ?? 1;
      double karliBirimFiyat = hamMaliyet * karCarpani;
      double karliToplamFiyat = karliBirimFiyat * adet;

      return {
        ...item,
        'karliBirimFiyat': karliBirimFiyat,
        'karliToplamFiyat': karliToplamFiyat,
      };
    }).toList();

    // 2. Sabit gider dağıtımı KAPALIYSA doğrudan kârlı fiyatı döndür
    if (!orantiliGiderDagit || sabitKlinikGideri <= 0) {
      return karliKalemler.map((item) => {
        ...item,
        'sonBirimFiyat': item['karliBirimFiyat'],
        'sonToplamFiyat': item['karliToplamFiyat'],
        'eklenenGiderPayi': 0.0,
      }).toList();
    }

    // 3. Sabit gider AÇIKSA, ağırlık oranına göre KÂRSIZ olarak dağıtılır
    double toplamKarliTutar = karliKalemler.fold(
      0.0,
      (sum, item) => sum + (item['karliToplamFiyat'] as double),
    );

    if (toplamKarliTutar == 0) return karliKalemler;

    return karliKalemler.map((item) {
      double karliToplamFiyat = item['karliToplamFiyat'] as double;
      int adet = (item['adet'] as num?)?.toInt() ?? 1;
      double oran = karliToplamFiyat / toplamKarliTutar;
      double eklenecekGiderPayi = sabitKlinikGideri * oran; // Kârsız yalın pay
      double nihaiToplamFiyat = karliToplamFiyat + eklenecekGiderPayi;
      double nihaiBirimFiyat = nihaiToplamFiyat / adet;

      return {
        ...item,
        'sonBirimFiyat': nihaiBirimFiyat,
        'sonToplamFiyat': nihaiToplamFiyat,
        'eklenenGiderPayi': eklenecekGiderPayi,
      };
    }).toList();
  }
}
