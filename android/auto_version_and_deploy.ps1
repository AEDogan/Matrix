param(
    [string]$Track = "VetAssist Test Group,internal",
    [string]$ReleaseNotes = "Adisyon ve tutar hesaplamalari, WhatsApp slip paylasimi, geriye donuk veri uyumlulugu ve genel stabilite guncellemeleri.",
    [switch]$SkipBump = $false
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " VetAssist - Otomatik Versiyonlama ve Play Store Yukleme   " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$androidDir = $PSScriptRoot
$projectDir = Split-Path -Parent $androidDir
$distDir = "$projectDir\dist"
$manifestPath = "$androidDir\AndroidManifest.xml"

# 1. Otomatik Versiyon Artırma (Version Bumping)
[xml]$manifestXml = Get-Content $manifestPath
$currentVersionCode = [int]$manifestXml.manifest.versionCode
$currentVersionName = $manifestXml.manifest.versionName

if (-not $SkipBump) {
    Write-Host "`n[1/4] Mevcut surum kontrol ediliyor..." -ForegroundColor Yellow
    $nextVersionCode = $currentVersionCode + 1

    # Version name increment (e.g. 1.0.8 -> 1.0.9)
    $parts = $currentVersionName.Split('.')
    if ($parts.Length -eq 3) {
        $patch = [int]$parts[2] + 1
        $nextVersionName = "$($parts[0]).$($parts[1]).$patch"
    } else {
        $nextVersionName = "$currentVersionName.$nextVersionCode"
    }

    Write-Host "Mevcut Surum : Kod: $currentVersionCode, Ad: $currentVersionName" -ForegroundColor Gray
    Write-Host "YENI SURUM   : Kod: $nextVersionCode, Ad: $nextVersionName" -ForegroundColor Green

    # AndroidManifest.xml güncelle
    $manifestContent = Get-Content $manifestPath -Raw
    $manifestContent = $manifestContent -replace "android:versionCode=""\d+""", "android:versionCode=""$nextVersionCode"""
    $manifestContent = $manifestContent -replace "android:versionName=""[^""]+""", "android:versionName=""$nextVersionName"""
    $manifestContent | Set-Content -Path $manifestPath -Encoding UTF8

    Write-Host "[+] AndroidManifest.xml basariyla guncellendi (v$nextVersionCode - $nextVersionName)." -ForegroundColor Green
} else {
    $nextVersionCode = $currentVersionCode
    $nextVersionName = $currentVersionName
    Write-Host "`n[1/4] Surum artirma atlandi. Mevcut Surum: Kod: $nextVersionCode, Ad: $nextVersionName" -ForegroundColor Yellow
}

# 2. build_all.ps1 çalıştır
Write-Host "`n[2/4] Derleme baslatiliyor (AAPT2, D8, Obfuscation, Zipalign, AAB)..." -ForegroundColor Yellow
$buildScript = "$androidDir\build_all.ps1"
& powershell.exe -ExecutionPolicy Bypass -File $buildScript

$aabPath = "$distDir\VetAssist_SurumKodu$($nextVersionCode)_PlayStore.aab"
if (-not (Test-Path $aabPath)) {
    $desktopDir = [Environment]::GetFolderPath('Desktop') + "\VetAssist_PlayStore_GUNCEL_Surum$nextVersionCode"
    $aabPath = "$desktopDir\VetAssist_SurumKodu$($nextVersionCode)_PlayStore.aab"
}

if (-not (Test-Path $aabPath)) {
    Write-Host "[-] HATA: AAB dosyasi bulunamadi: $aabPath" -ForegroundColor Red
    exit 1
}

Write-Host "`n[3/4] AAB Basariyla Hazirlandi: $aabPath" -ForegroundColor Green

# 3. Google Play Store'a Otomatik Yukleme
Write-Host "`n[4/4] Google Play Store'a yukleniyor (Kanal(lar): $Track)..." -ForegroundColor Yellow
$uploadScript = "$androidDir\upload_playstore.js"

Set-Location $androidDir
& node $uploadScript "$aabPath" "$Track" "$ReleaseNotes"

if ($LASTEXITCODE -eq 0) {
    $realDesktop = [Environment]::GetFolderPath('Desktop') + "\VetAssist_PlayStore_GUNCEL_Surum$nextVersionCode"
    Write-Host "`n==========================================================" -ForegroundColor Green
    Write-Host "  TUM ISLEMLER BASARIYLA TAMAMLANDI!                      " -ForegroundColor Green
    Write-Host "  Surum Kodu: $nextVersionCode                            " -ForegroundColor Green
    Write-Host "  Surum Adi : $nextVersionName                            " -ForegroundColor Green
    Write-Host "  Kanal(lar): $Track                                      " -ForegroundColor Green
    Write-Host "  Masaustu  : $realDesktop                                " -ForegroundColor Green
    Write-Host "==========================================================" -ForegroundColor Green
    if (Test-Path $realDesktop) {
        Start-Process "explorer.exe" $realDesktop
    }
} else {
    Write-Host "`n[!] Paket yerel olarak derlendi ve kaydedildi, ancak Google Play API yuklemesinde bir sorun olustu." -ForegroundColor DarkYellow
}
