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

$assetsDir = "$androidDir\assets"
$keystorePath = "$androidDir\sahaveteriner_release.keystore"

# Desktop output paths
$realDesktop = [Environment]::GetFolderPath('Desktop')
$desktopOutputs = @(
    "$realDesktop\VetAssist_PlayStore_v0.8",
    "C:\Users\ahmet\Desktop\VetAssist_PlayStore_v0.8",
    "C:\Users\ahmet\OneDrive\Masaüstü\VetAssist_PlayStore_v0.8"
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "🐾 VetAssist v0.8 - Release APK & Play Store AAB Builder 🐾" -ForegroundColor Cyan
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
$manifest = "$androidDir\AndroidManifest.xml"
$resDir = "$androidDir\res"
$srcDir = "$androidDir\src"

if (Test-Path $compiledRes) { Remove-Item $compiledRes -Force }
if (Test-Path $baseApk) { Remove-Item $baseApk -Force }

& "$buildToolsDir\aapt2.exe" compile --dir $resDir -o $compiledRes

$compiledZips = @($compiledRes)
$admobExtracted = "$androidDir\admob_extracted"
$idx = 0
Get-ChildItem -Path $admobExtracted -Directory | ForEach-Object {
    $subRes = "$($_.FullName)\res"
    if (Test-Path $subRes) {
        $subZip = "$androidDir\compiled_admob_$idx.zip"
        if (Test-Path $subZip) { Remove-Item $subZip -Force }
        & "$buildToolsDir\aapt2.exe" compile --dir $subRes -o $subZip
        $compiledZips += $subZip
        $idx++
    }
}

$linkArgs = @("link", "-I", $androidJar, "--manifest", $manifest, "-o", $baseApk, "-A", $assetsDir, "--auto-add-overlay")
foreach ($cz in $compiledZips) {
    $linkArgs += "-R"
    $linkArgs += $cz
}
& "$buildToolsDir\aapt2.exe" @linkArgs

# 3. Compile Java Source Code
Write-Host "[3/7] Java kaynak kodlari derleniyor (Javac)..." -ForegroundColor Yellow
$classesDir = "$androidDir\classes"
if (Test-Path $classesDir) { Remove-Item $classesDir -Recurse -Force }
New-Item -ItemType Directory -Path $classesDir | Out-Null

$rJavaDir = "$androidDir\r_java"
if (Test-Path $rJavaDir) { Remove-Item $rJavaDir -Recurse -Force }
New-Item -ItemType Directory -Path $rJavaDir | Out-Null

$linkRArgs = @("link", "-I", $androidJar, "--manifest", $manifest, "--java", $rJavaDir, "--auto-add-overlay")
foreach ($cz in $compiledZips) {
    $linkRArgs += "-R"
    $linkRArgs += $cz
}
& "$buildToolsDir\aapt2.exe" @linkRArgs

$admobJars = @()
Get-ChildItem -Path "$androidDir\admob_libs" -Filter "*.jar" | ForEach-Object { $admobJars += $_.FullName }
Get-ChildItem -Path $admobExtracted -Filter "classes.jar" -Recurse | ForEach-Object { $admobJars += $_.FullName }
$classpath = "$androidJar;" + ($admobJars -join ";")

$javaFiles = @()
Get-ChildItem -Path $srcDir -Filter "*.java" -Recurse | ForEach-Object { $javaFiles += $_.FullName }
Get-ChildItem -Path $rJavaDir -Filter "*.java" -Recurse | ForEach-Object { $javaFiles += $_.FullName }

& "$jdkDir\bin\javac.exe" -source 1.8 -target 1.8 -cp $classpath -d $classesDir @javaFiles

# 4. Generate DEX (D8 Multidex)
Write-Host "[4/7] DEX dosyalari uretiliyor (D8 Multidex)..." -ForegroundColor Yellow
$classFiles = @()
Get-ChildItem -Path $classesDir -Filter "*.class" -Recurse | ForEach-Object { $classFiles += $_.FullName }
$allInputsForD8 = $classFiles + $admobJars

$paramsFile = "$androidDir\d8_inputs.txt"
$allInputsForD8 | Out-File -FilePath $paramsFile -Encoding ASCII

Get-ChildItem -Path $androidDir -Filter "classes*.dex" | Remove-Item -Force
& "$jdkDir\bin\java.exe" -cp $r8Jar com.android.tools.r8.D8 "--min-api" "21" "--lib" $androidJar "--output" $androidDir "@$paramsFile"
Remove-Item $paramsFile -Force

# 5. Build and Sign Production APK
Write-Host "[5/7] Imzali Production APK olusturuluyor (Zipalign + Apksigner)..." -ForegroundColor Yellow
$unalignedApk = "$androidDir\unaligned.apk"
Copy-Item $baseApk $unalignedApk -Force

Get-ChildItem -Path $androidDir -Filter "classes*.dex" | ForEach-Object {
    & "$jdkDir\bin\jar.exe" uf $unalignedApk -C $androidDir $_.Name
}

if (!(Test-Path $distDir)) { New-Item -ItemType Directory -Path $distDir | Out-Null }
$releaseApk = "$distDir\VetAssist_v0.8_Release.apk"
$testApk = "$distDir\VetAssist_v0.8_Test_Yuklenebilir.apk"

if (Test-Path $releaseApk) { Remove-Item $releaseApk -Force }
if (Test-Path $testApk) { Remove-Item $testApk -Force }

& "$buildToolsDir\zipalign.exe" -f -p 4 $unalignedApk $releaseApk
Remove-Item $unalignedApk -Force

& "$jdkDir\bin\java.exe" -jar "$buildToolsDir\lib\apksigner.jar" sign --ks $keystorePath --ks-pass "pass:$KeystorePass" --ks-key-alias $KeyAlias --key-pass "pass:$KeystorePass" --v1-signing-enabled true --v2-signing-enabled true --v3-signing-enabled true $releaseApk

Copy-Item $releaseApk $testApk -Force

# 6. Verify Signature
Write-Host "[6/7] APK Dijital Imzasi dogrulaniyor..." -ForegroundColor Yellow
& "$jdkDir\bin\java.exe" -jar "$buildToolsDir\lib\apksigner.jar" verify --verbose --print-certs $releaseApk

# 7. Generate AAB with Bundletool
Write-Host "[7/7] Google Play Store Android App Bundle (.aab) hazirlaniyor..." -ForegroundColor Yellow
$aabOutput = "$distDir\VetAssist_v0.8_PlayStore.aab"

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
    & "$jdkDir\bin\jarsigner.exe" -keystore $keystorePath -storepass $KeystorePass -keypass $KeystorePass $aabOutput $KeyAlias

    Write-Host "✅ Android App Bundle (.aab) basariyla uretildi ve imzalandi!" -ForegroundColor Green
}

# 8. Copy to Desktop folders
foreach ($desk in $desktopOutputs) {
    if (Test-Path (Split-Path -Parent $desk)) {
        if (!(Test-Path $desk)) { New-Item -ItemType Directory -Path $desk -Force | Out-Null }
        Copy-Item "$distDir\VetAssist_v0.8_PlayStore.aab" "$desk\VetAssist_v0.8_PlayStore.aab" -Force
        Copy-Item "$distDir\VetAssist_v0.8_Release.apk" "$desk\VetAssist_v0.8_Release.apk" -Force
        Copy-Item "$distDir\VetAssist_v0.8_Test_Yuklenebilir.apk" "$desk\VetAssist_v0.8_Test_Yuklenebilir.apk" -Force
        Copy-Item "$keystorePath" "$desk\sahaveteriner_release.keystore" -Force
        if (Test-Path "$webDir\Feature_Graphic_1024x500.png") {
            Copy-Item "$webDir\Feature_Graphic_1024x500.png" "$desk\Feature_Graphic_1024x500.png" -Force
        }
        if (Test-Path "$webDir\PlayStore_Icon_512x512.png") {
            Copy-Item "$webDir\PlayStore_Icon_512x512.png" "$desk\PlayStore_Icon_512x512.png" -Force
        }
        Write-Host "📦 Paketler kopyalandi: $desk" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "🎉 VETASSIST v0.8 BASARIYLA DERLENDI!" -ForegroundColor Green
Write-Host "📱 Guvenli Imzali APK : $distDir\VetAssist_v0.8_Release.apk" -ForegroundColor Cyan
Write-Host "🏪 Play Store AAB    : $distDir\VetAssist_v0.8_PlayStore.aab" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Green
