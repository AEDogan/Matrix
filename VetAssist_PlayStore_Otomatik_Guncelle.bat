@echo off
chcp 65001 > nul
title VetAssist - Play Store Otomatik Guncelleme
color 0b

echo ===================================================================
echo             VETASSIST OTOMATIK PLAY STORE GUNCELLEYICI             
echo ===================================================================
echo.
echo Bu islem:
echo  1. Surum kodunu ve surum adini otomatik olarak artiracak (Version bump).
echo  2. En son kodlari derleyip imzalayacak (.aab ve .apk).
echo  3. Google Play Store'a (Kapalı Test ve Test Grubu) otomatik yukleyecek.
echo.
echo ===================================================================
echo.

powershell.exe -ExecutionPolicy Bypass -File "C:\Projeler\VetAssist\android\auto_version_and_deploy.ps1" -Track "VetAssist Test Group,internal"

echo.
echo Islem tamamlandi. Pencereyi kapatmak icin herhangi bir tusa basin...
pause > nul
