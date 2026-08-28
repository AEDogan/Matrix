param(
    [string]$KeystorePass = "sahaveteriner2026",
    [string]$KeyAlias = "sahaveteriner"
)

$ErrorActionPreference = "Stop"

# Base Directory Resolution
$androidDir = $PSScriptRoot
$projectRoot = Split-Path -Parent $androidDir
$webDir = "$projectRoot\web"
$distDir = "$projectRoot\dist"

# Tools Directory Resolution
$toolsDir = "C:\Projeler\tools"
if (!(Test-Path $toolsDir)) {
    $toolsDir = "C:\Users\ahmet\.gemini\antigravity\scratch\tools"
}

$jdkDir = "$toolsDir\jdk17.0.20_10"
$buildToolsDir = "$toolsDir\build-tools-34"
$androidJar = "$toolsDir\android.jar"
$r8Jar = "$toolsDir\r8.jar"
$bundletoolJar = "$toolsDir\bundletool.jar"

$env:JAVA_HOME = $jdkDir
$env:PATH = "$jdkDir\bin;$env:PATH"

$manifest = "$androidDir\AndroidManifest.xml"
if (!(Test-Path $manifest)) {
    throw "AndroidManifest.xml bulunamadi: $manifest"
}

# Parse Version dynamically
[xml]$manifestXml = Get-Content $manifest
$versionCode = $manifestXml.manifest.versionCode
$versionName = $manifestXml.manifest.versionName
$appVersion = "Surum $versionCode (v$versionName)"

$assetsDir = "$androidDir\assets"
$keystorePath = "$androidDir\sahaveteriner_release.keystore"

# Desktop output paths
$realDesktop = [Environment]::GetFolderPath('Desktop')
$desktopOutputs = @(
    "$realDesktop\VetAssist_PlayStore_GUNCEL_Surum$versionCode",
    "C:\Users\ahmet\Desktop\VetAssist_PlayStore_GUNCEL_Surum$versionCode",
    "C:\Users\ahmet\OneDrive\Masaüstü\VetAssist_PlayStore_GUNCEL_Surum$versionCode"
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "VetAssist $appVersion - Release APK & Play Store AAB Builder" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Sync & Obfuscate Web Assets
Write-Host "[1/7] Web varliklari senkronize ediliyor ve kodlar karartiliyor (Minification & Obfuscation)..." -ForegroundColor Yellow
if (Test-Path $assetsDir) { Remove-Item $assetsDir -Recurse -Force }
New-Item -ItemType Directory -Path $assetsDir | Out-Null

$minifyScript = "$androidDir\minify_assets.js"
if (Test-Path $minifyScript) {
    & node $minifyScript $webDir $assetsDir
}

# 2. Compile Resources
Write-Host "[2/7] Android XML kaynaklari derleniyor (AAPT2)..." -ForegroundColor Yellow
$compiledRes = "$androidDir\compiled_res.zip"
$baseApk = "$androidDir\base.apk"
$resDir = "$androidDir\res"
$srcDir = "$androidDir\src"

if (Test-Path $compiledRes) { Remove-Item $compiledRes -Force }
if (Test-Path $baseApk) { Remove-Item $baseApk -Force }

& "$buildToolsDir\aapt2.exe" compile --dir $resDir -o $compiledRes

$compiledZips = @($compiledRes)
$admobExtracted = "$androidDir\admob_extracted"
if (!(Test-Path $admobExtracted)) {
    $admobExtracted = "C:\Users\ahmet\.gemini\antigravity\scratch\sahaveteriner_build\admob_extracted"
}

$admobLibsDir = "$androidDir\admob_libs"
if (!(Test-Path $admobLibsDir)) {
    $admobLibsDir = "C:\Users\ahmet\.gemini\antigravity\scratch\sahaveteriner_build\admob_libs"
}

$idx = 0
if (Test-Path $admobExtracted) {
    Get-ChildItem -Path $admobExtracted -Directory | ForEach-Object {
        $subRes = "$($_.FullName)\res"
        if (Test-Path $subRes) {
            $subZip = "$androidDir\compiled_admob_$idx.zip"
            if (Test-Path $subZip) { Remove-Item $subZip -Force }
            & "$buildToolsDir\aapt2.exe" compile --dir $subRes -o $subZip
            if ($LASTEXITCODE -eq 0) {
                $compiledZips += $subZip
                $idx++
            }
        }
    }
}

$rJavaDir = "$androidDir\r_java"
if (Test-Path $rJavaDir) { Remove-Item $rJavaDir -Recurse -Force }
New-Item -ItemType Directory -Path $rJavaDir | Out-Null

$linkArgs = @("link", "-I", $androidJar, "--manifest", $manifest, "--java", $rJavaDir, "-o", $baseApk, "--auto-add-overlay")
foreach ($cz in $compiledZips) {
    $linkArgs += "-R"
    $linkArgs += $cz
}
& "$buildToolsDir\aapt2.exe" @linkArgs
if ($LASTEXITCODE -ne 0) { throw "AAPT2 link failed!" }

# 3. Compile Java Source Code
Write-Host "[3/7] Java kaynak kodlari derleniyor (Javac)..." -ForegroundColor Yellow
$classesDir = "$androidDir\classes"
if (Test-Path $classesDir) { Remove-Item $classesDir -Recurse -Force }
New-Item -ItemType Directory -Path $classesDir | Out-Null

$admobJars = @()
if (Test-Path $admobLibsDir) {
    Get-ChildItem -Path $admobLibsDir -Filter "*.jar" | ForEach-Object { $admobJars += $_.FullName }
}
if (Test-Path $admobExtracted) {
    Get-ChildItem -Path $admobExtracted -Filter "classes.jar" -Recurse | ForEach-Object { $admobJars += $_.FullName }
}
$classpath = ($admobJars + $androidJar) -join ";"

$javaSources = @()
Get-ChildItem -Path $srcDir -Filter "*.java" -Recurse | ForEach-Object { $javaSources += $_.FullName }
Get-ChildItem -Path $rJavaDir -Filter "*.java" -Recurse | ForEach-Object { $javaSources += $_.FullName }

$javacSourcesFile = "$androidDir\javac_sources.txt"
$javaSources | Set-Content -Path $javacSourcesFile -Encoding ASCII

& "$jdkDir\bin\javac.exe" -encoding UTF-8 -cp $classpath -d $classesDir -source 1.8 -target 1.8 ("@" + $javacSourcesFile)
if ($LASTEXITCODE -ne 0) { throw "Javac compilation failed!" }
Remove-Item $javacSourcesFile -Force

# 4. Generate DEX (D8 Multidex)
Write-Host "[4/7] DEX dosyalari uretiliyor (D8 Multidex)..." -ForegroundColor Yellow
Get-ChildItem -Path $androidDir -Filter "classes*.dex" | Remove-Item -Force

$classFiles = @()
Get-ChildItem -Path $classesDir -Filter "*.class" -Recurse | ForEach-Object { $classFiles += $_.FullName }
$allInputsForD8 = $classFiles + $admobJars

$paramsFile = "$androidDir\d8_inputs.txt"
$d8Params = @(
    "--release",
    "--min-api", "21",
    "--lib", "$androidJar",
    "--output", "$androidDir"
) + $allInputsForD8
$d8Params | Set-Content -Path $paramsFile -Encoding ASCII

& "$jdkDir\bin\java.exe" -cp $r8Jar com.android.tools.r8.D8 ("@" + $paramsFile)
if ($LASTEXITCODE -ne 0) { throw "D8 Dexing failed!" }
Remove-Item $paramsFile -Force

# Verify that MainActivity is in classes.dex
$hasMainActivity = $false
Get-ChildItem -Path $androidDir -Filter "classes*.dex" | ForEach-Object {
    $bytes = [System.IO.File]::ReadAllBytes($_.FullName)
    $text = [System.Text.Encoding]::ASCII.GetString($bytes)
    if ($text.Contains("Lcom/VetAssistv1/MainActivity;")) {
        $hasMainActivity = $true
        Write-Host "  -> MainActivity bulundu: $($_.Name)" -ForegroundColor Green
    }
}
if (-not $hasMainActivity) {
    throw "KRITIK HATA: MainActivity DEX dosyalarinda bulunamadi! APK calisamaz."
}

# 5. Build and Sign Production APK
Write-Host "[5/7] Imzali Production APK olusturuluyor (Zipalign + Apksigner)..." -ForegroundColor Yellow
$unalignedApk = "$androidDir\unaligned.apk"
$alignedApk = "$androidDir\aligned.apk"
Copy-Item $baseApk $unalignedApk -Force

# Add DEX files
Get-ChildItem -Path $androidDir -Filter "classes*.dex" | ForEach-Object {
    Set-Location $androidDir
    & "$jdkDir\bin\jar.exe" uf $unalignedApk $_.Name
    if ($LASTEXITCODE -ne 0) { throw "Failed adding $($_.Name) to APK!" }
}

# Add Assets
Set-Location $androidDir
& "$jdkDir\bin\jar.exe" uf $unalignedApk assets
if ($LASTEXITCODE -ne 0) { throw "Failed adding assets to APK!" }
if (!(Test-Path $distDir)) { New-Item -ItemType Directory -Path $distDir | Out-Null }

$releaseApk = "$distDir\VetAssist_SurumKodu$($versionCode)_Release.apk"
$testApk = "$distDir\VetAssist_SurumKodu$($versionCode)_Test_Yuklenebilir.apk"

if (Test-Path $alignedApk) { Remove-Item $alignedApk -Force }
if (Test-Path $releaseApk) { Remove-Item $releaseApk -Force }
if (Test-Path $testApk) { Remove-Item $testApk -Force }

& "$buildToolsDir\zipalign.exe" -f -p 4 $unalignedApk $alignedApk
if ($LASTEXITCODE -ne 0) { throw "Zipalign failed!" }
Remove-Item $unalignedApk -Force

& "$jdkDir\bin\java.exe" -jar "$buildToolsDir\lib\apksigner.jar" sign --ks $keystorePath --ks-pass "pass:$KeystorePass" --ks-key-alias $KeyAlias --key-pass "pass:$KeystorePass" --v1-signing-enabled true --v2-signing-enabled true --v3-signing-enabled true --out $releaseApk $alignedApk
if ($LASTEXITCODE -ne 0) { throw "Apksigner failed!" }
Remove-Item $alignedApk -Force

Copy-Item $releaseApk $testApk -Force

# 6. Verify Signature
Write-Host "[6/7] APK Dijital Imzasi dogrulaniyor..." -ForegroundColor Yellow
& "$jdkDir\bin\java.exe" -jar "$buildToolsDir\lib\apksigner.jar" verify --verbose --print-certs $releaseApk
if ($LASTEXITCODE -ne 0) { throw "Apksigner verify failed!" }

# 7. Generate AAB with Bundletool
Write-Host "[7/7] Google Play Store Android App Bundle (.aab) hazirlaniyor..." -ForegroundColor Yellow
$aabOutput = "$distDir\VetAssist_SurumKodu$($versionCode)_PlayStore.aab"

if (Test-Path $bundletoolJar) {
    $bundleDir = "$androidDir\bundle_tmp"
    if (Test-Path $bundleDir) { Remove-Item $bundleDir -Recurse -Force }
    New-Item -ItemType Directory -Path "$bundleDir\base\manifest" | Out-Null
    New-Item -ItemType Directory -Path "$bundleDir\base\dex" | Out-Null
    New-Item -ItemType Directory -Path "$bundleDir\base\assets" | Out-Null
    New-Item -ItemType Directory -Path "$bundleDir\proto_extracted" | Out-Null

    $protoZip = "$androidDir\proto.zip"
    if (Test-Path $protoZip) { Remove-Item $protoZip -Force }

    $protoArgs = @("link", "--proto-format", "-I", $androidJar, "--manifest", $manifest, "-o", $protoZip, "--auto-add-overlay")
    foreach ($cz in $compiledZips) {
        $protoArgs += "-R"
        $protoArgs += $cz
    }
    & "$buildToolsDir\aapt2.exe" @protoArgs
    if ($LASTEXITCODE -ne 0) { throw "AAPT2 proto link failed!" }

    Expand-Archive -Path $protoZip -DestinationPath "$bundleDir\proto_extracted" -Force
    Copy-Item "$bundleDir\proto_extracted\AndroidManifest.xml" "$bundleDir\base\manifest\AndroidManifest.xml" -Force
    if (Test-Path "$bundleDir\proto_extracted\resources.pb") {
        Copy-Item "$bundleDir\proto_extracted\resources.pb" "$bundleDir\base\resources.pb" -Force
    }
    if (Test-Path "$bundleDir\proto_extracted\res") {
        Copy-Item "$bundleDir\proto_extracted\res" "$bundleDir\base\res" -Recurse -Force
    }

    Get-ChildItem -Path $androidDir -Filter "classes*.dex" | ForEach-Object {
        Copy-Item $_.FullName "$bundleDir\base\dex\$($_.Name)" -Force
    }
    Copy-Item "$assetsDir\*" "$bundleDir\base\assets\" -Recurse -Force

    $baseZip = "$androidDir\base.zip"
    if (Test-Path $baseZip) { Remove-Item $baseZip -Force }
    
    Set-Location "$bundleDir\base"
    & "$jdkDir\bin\jar.exe" cMf $baseZip manifest res dex assets resources.pb

    if (Test-Path $aabOutput) { Remove-Item $aabOutput -Force }
    & "$jdkDir\bin\java.exe" -jar $bundletoolJar build-bundle --modules=$baseZip --output=$aabOutput
    if ($LASTEXITCODE -ne 0) { throw "Bundletool failed!" }
    & "$jdkDir\bin\jarsigner.exe" -keystore $keystorePath -storepass $KeystorePass -keypass $KeystorePass $aabOutput $KeyAlias

    Write-Host "[+] Android App Bundle (.aab) basariyla uretildi ve imzalandi!" -ForegroundColor Green
}

# 8. Copy to Desktop folders
foreach ($desk in $desktopOutputs) {
    if (Test-Path (Split-Path -Parent $desk)) {
        if (!(Test-Path $desk)) { New-Item -ItemType Directory -Path $desk -Force | Out-Null }
        Copy-Item "$aabOutput" "$desk\VetAssist_SurumKodu$($versionCode)_PlayStore.aab" -Force
        Copy-Item "$releaseApk" "$desk\VetAssist_SurumKodu$($versionCode)_Release.apk" -Force
        Copy-Item "$testApk" "$desk\VetAssist_SurumKodu$($versionCode)_Test_Yuklenebilir.apk" -Force
        Copy-Item "$keystorePath" "$desk\sahaveteriner_release.keystore" -Force
        if (Test-Path "$webDir\Feature_Graphic_1024x500.png") {
            Copy-Item "$webDir\Feature_Graphic_1024x500.png" "$desk\Feature_Graphic_1024x500.png" -Force
        }
        if (Test-Path "$webDir\PlayStore_Icon_512x512.png") {
            Copy-Item "$webDir\PlayStore_Icon_512x512.png" "$desk\PlayStore_Icon_512x512.png" -Force
        }
        $storeAssetsDir = "$projectRoot\store_assets"
        if (Test-Path $storeAssetsDir) {
            $destGorselDir = "$desk\PlayStore_Gorselleri"
            if (!(Test-Path $destGorselDir)) { New-Item -ItemType Directory -Path $destGorselDir -Force | Out-Null }
            Copy-Item "$storeAssetsDir\*" $destGorselDir -Force
        }
        Write-Host "[+] Paketler ve gorseller kopyalandi: $desk" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "VETASSIST SURUM $versionCode BASARIYLA DERLENDI!" -ForegroundColor Green
Write-Host "Guvenli Imzali APK : $releaseApk" -ForegroundColor Cyan
Write-Host "Play Store AAB     : $aabOutput" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Green
