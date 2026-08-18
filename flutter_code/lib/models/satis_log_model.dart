class SatisLog {
  final String id;
  final String tarihSaat;
  final String islemTipi; // 'Uygulanan Tedavi' | 'Fiyat Teklifi'
  final String musteri;
  final String satilanKalemler;
  final double araToplam;
  final double kdvTutar;
  final double genelToplam;
  final bool stokDustu;
  final bool giderGiydirildi;

  SatisLog({
    required this.id,
    required this.tarihSaat,
    required this.islemTipi,
    required this.musteri,
    required this.satilanKalemler,
    required this.araToplam,
    required this.kdvTutar,
    required this.genelToplam,
    required this.stokDustu,
    this.giderGiydirildi = false,
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'tarihSaat': tarihSaat,
    'islemTipi': islemTipi,
    'musteri': musteri,
    'satilanKalemler': satilanKalemler,
    'araToplam': araToplam,
    'kdvTutar': kdvTutar,
    'genelToplam': genelToplam,
    'stokDustu': stokDustu,
    'giderGiydirildi': giderGiydirildi,
  };

  factory SatisLog.fromJson(Map<String, dynamic> json) => SatisLog(
    id: json['id'] ?? '',
    tarihSaat: json['tarihSaat'] ?? '',
    islemTipi: json['islemTipi'] ?? 'Uygulanan Tedavi',
    musteri: json['musteri'] ?? '',
    satilanKalemler: json['satilanKalemler'] ?? '',
    araToplam: (json['araToplam'] as num?)?.toDouble() ?? 0.0,
    kdvTutar: (json['kdvTutar'] as num?)?.toDouble() ?? 0.0,
    genelToplam: (json['genelToplam'] as num?)?.toDouble() ?? 0.0,
    stokDustu: json['stokDustu'] ?? true,
    giderGiydirildi: json['giderGiydirildi'] ?? false,
  );
}
