const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function uploadToPlayStore({
    keyFilePath = path.join(__dirname, 'google_play_key.json'),
    packageName = 'com.VetAssistv1',
    aabPath,
    track = 'VetAssist Test Group,internal',
    releaseNotes = 'Adisyon ve tutar hesaplamalari, WhatsApp slip paylasimi ve genel performans iyilestirmeleri.'
}) {
    try {
        if (!fs.existsSync(keyFilePath)) {
            throw new Error(`Google Play Key dosyası bulunamadı: ${keyFilePath}`);
        }
        if (!fs.existsSync(aabPath)) {
            throw new Error(`AAB paketi bulunamadı: ${aabPath}`);
        }

        const key = JSON.parse(fs.readFileSync(keyFilePath, 'utf8'));
        const privateKey = key.private_key.replace(/\\n/g, '\n');

        console.log(`[*] Google Play API'ye baglaniliyor (${packageName})...`);
        const jwtClient = new google.auth.JWT({
            email: key.client_email,
            key: privateKey,
            scopes: ['https://www.googleapis.com/auth/androidpublisher']
        });

        await jwtClient.authorize();
        const androidPublisher = google.androidpublisher({
            version: 'v3',
            auth: jwtClient
        });

        console.log('[*] Yeni duzenleme oturumu (Edit Session) olusturuluyor...');
        const editRes = await androidPublisher.edits.insert({
            packageName: packageName
        });
        const editId = editRes.data.id;
        console.log(`[+] Duzenleme ID: ${editId}`);

        const aabSizeMb = (fs.statSync(aabPath).size / (1024 * 1024)).toFixed(2);
        console.log(`[*] AAB Paketi yukleniyor: ${path.basename(aabPath)} (${aabSizeMb} MB)...`);
        
        const uploadRes = await androidPublisher.edits.bundles.upload({
            packageName: packageName,
            editId: editId,
            media: {
                mimeType: 'application/octet-stream',
                body: fs.createReadStream(aabPath)
            }
        });

        const versionCode = uploadRes.data.versionCode;
        console.log(`[+] AAB basariyla yuklendi! Versiyon Kodu: ${versionCode}`);

        const tracksToUpdate = track.includes(',') ? track.split(',').map(t => t.trim()).filter(Boolean) : [track];
        for (const trk of tracksToUpdate) {
            console.log(`[*] Paket '${trk}' kanalina ataniyor...`);
            try {
                await androidPublisher.edits.tracks.update({
                    packageName: packageName,
                    editId: editId,
                    track: trk,
                    requestBody: {
                        releases: [
                            {
                                versionCodes: [versionCode.toString()],
                                status: 'completed',
                                releaseNotes: [
                                    { language: 'tr-TR', text: releaseNotes },
                                    { language: 'en-US', text: releaseNotes }
                                ]
                            }
                        ]
                    }
                });
                console.log(`  ✓ '${trk}' kanalina basariyla atandi.`);
            } catch (trackErr) {
                console.warn(`  ⚠️ '${trk}' kanalina atama uyarisi: ${trackErr.message}`);
                if (trackErr.response && trackErr.response.data) {
                    console.warn(`  Detay:`, JSON.stringify(trackErr.response.data));
                }
            }
        }

        console.log(`[*] Degisiklikler Google Play Console'da onaylaniyor (Commit)...`);
        await androidPublisher.edits.commit({
            packageName: packageName,
            editId: editId
        });

        console.log(`\n==========================================================`);
        console.log(`[SUCCESS] TEBRIKLER! VetAssist (Sürüm: ${versionCode}) basariyla Google Play'e gonderildi!`);
        console.log(`Kanal(lar): ${tracksToUpdate.join(', ')}`);
        console.log(`==========================================================\n`);
        return true;
    } catch (err) {
        console.error('\n[-] YUKLEME HATASI:', err.message);
        if (err.response && err.response.data) {
            console.error('Detay:', JSON.stringify(err.response.data, null, 2));
        }
        return false;
    }
}

// CLI desteği
const args = process.argv.slice(2);
let aabPath = args[0];
let track = args[1] || 'VetAssist Test Group,internal';
let notes = args[2] || 'Adisyon ve tutar hesaplamalari, WhatsApp slip paylasimi ve genel performans iyilestirmeleri.';

if (!aabPath) {
    console.error('Kullanim: node upload_playstore.js <AAB_DOSYA_YOLU> [kanallar (virgulle ayrilmis)] [NOTLAR]');
    process.exit(1);
}

uploadToPlayStore({
    aabPath: path.resolve(aabPath),
    track: track,
    releaseNotes: notes
}).then(success => {
    if (!success) process.exit(1);
});
