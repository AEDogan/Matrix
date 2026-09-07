param(
    [string]$Track = "VetAssist Test Group,internal",
    [string]$ReleaseNotes = "9 dil desteği (TR, EN, DE, FR, ES, IT, PT, RU, AR), çoklu para birimi seçimi, WhatsApp adisyon motoru, modern landing page ve genel kararlılık güncellemeleri.",
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
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$manifestContent = [System.IO.File]::ReadAllText($manifestPath, [System.Text.Encoding]::UTF8)
[xml]$manifestXml = $manifestContent
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
    $manifestContent = $manifestContent -replace "android:versionCode=""\d+""", "android:versionCode=""$nextVersionCode"""
    $manifestContent = $manifestContent -replace "android:versionName=""[^""]+""", "android:versionName=""$nextVersionName"""
    [System.IO.File]::WriteAllText($manifestPath, $manifestContent, $utf8NoBom)

    # Web & Landing page versiyon rozetlerini otomatik güncelle
    $landingFiles = @("$projectDir\web\landing.html", "$projectDir\landing\index.html", "$projectDir\docs\index.html", "$projectDir\web\google_sites_embed.html")
    foreach ($lPath in $landingFiles) {
        if (Test-Path $lPath) {
            $landingContent = [System.IO.File]::ReadAllText($lPath, [System.Text.Encoding]::UTF8)
            $landingContent = $landingContent -replace 'class="badge-version">v[^<]+<', "class=`"badge-version`">v$nextVersionName<"
            [System.IO.File]::WriteAllText($lPath, $landingContent, $utf8NoBom)
        }
    }
    Write-Host "[+] Landing page surum rozetleri guncellendi (v$nextVersionName)." -ForegroundColor Green
    
    $i18nPath = "$projectDir\web\i18n.js"
    if (Test-Path $i18nPath) {
        $i18nContent = [System.IO.File]::ReadAllText($i18nPath, [System.Text.Encoding]::UTF8)
        $i18nContent = $i18nContent -replace "version_text:\s*'v[^']+'", "version_text: 'v$nextVersionName'"
        [System.IO.File]::WriteAllText($i18nPath, $i18nContent, $utf8NoBom)
        Write-Host "[+] web/i18n.js surum rozeti guncellendi (v$nextVersionName)." -ForegroundColor Green
    }

    $indexHtmlPath = "$projectDir\web\index.html"
    if (Test-Path $indexHtmlPath) {
        $indexContent = [System.IO.File]::ReadAllText($indexHtmlPath, [System.Text.Encoding]::UTF8)
        $indexContent = $indexContent -replace 'id="appVersionBadge"><span data-i18n="version_text">v[^<]+<', "id=`"appVersionBadge`"><span data-i18n=`"version_text`">v$nextVersionName<"
        [System.IO.File]::WriteAllText($indexHtmlPath, $indexContent, $utf8NoBom)
        Write-Host "[+] web/index.html surum rozeti guncellendi (v$nextVersionName)." -ForegroundColor Green
    }

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
