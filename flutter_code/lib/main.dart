import 'package:flutter/material.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'models/urun_model.dart';
import 'services/sheets_service.dart';
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
        primarySwatch: Colors.blue,
        scaffoldBackgroundColor: const Color(0xFFF4F5F8),
        fontFamily: 'Roboto',
      ),
      home: const MainScreen(),
    );
  }
}

class MainScreen extends StatefulWidget {
  const MainScreen({Key? key}) : super(key: key);

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('🐾 SahaVeteriner', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: const Color(0xFF0284C7),
        elevation: 2,
      ),
      body: Center(
        child: Text('SahaVeteriner Sekme $_currentIndex'),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        type: BottomNavigationBarType.fixed,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.flash_on), label: 'Hesaplama'),
          BottomNavigationBarItem(icon: Icon(Icons.inventory_2), label: 'Stok Takibi'),
          BottomNavigationBarItem(icon: Icon(Icons.tune), label: 'Parametreler'),
          BottomNavigationBarItem(icon: Icon(Icons.settings), label: 'Fiş Ayarları'),
        ],
      ),
    );
  }
}
