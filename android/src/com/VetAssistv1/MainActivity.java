package com.VetAssistv1;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.util.Base64;
import android.util.Log;
import android.view.KeyEvent;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowManager;
import android.webkit.ConsoleMessage;
import android.webkit.JavascriptInterface;
import android.webkit.JsPromptResult;
import android.webkit.JsResult;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.Toast;

import com.google.android.gms.ads.AdError;
import com.google.android.gms.ads.AdListener;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.AdSize;
import com.google.android.gms.ads.AdView;
import com.google.android.gms.ads.FullScreenContentCallback;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.OnUserEarnedRewardListener;
import com.google.android.gms.ads.initialization.InitializationStatus;
import com.google.android.gms.ads.initialization.OnInitializationCompleteListener;
import com.google.android.gms.ads.rewarded.RewardItem;
import com.google.android.gms.ads.rewarded.RewardedAd;
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;

public class MainActivity extends Activity {
    private static final String TAG = "VetAssist";
    private WebView webView;
    private AdView adView;
    private RewardedAd rewardedAd;
    private boolean isRewardedAdLoading = false;
    private ValueCallback<Uri[]> fileUploadCallback;
    private final static int FILE_CHOOSER_RESULT_CODE = 1001;
    private VersionUpdateManager versionUpdateManager;

    public class WebAppInterface {
        private Context mContext;

        WebAppInterface(Context context) {
            mContext = context;
        }

        @JavascriptInterface
        public void showRewardedAd(final String actionType) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    // Reklamsiz profesyonel mod: Islem beklemeden ve reklamsiz dogrudan gerceklesir
                    if (webView != null) {
                        webView.evaluateJavascript("if (window.onRewardedAdSuccess) { window.onRewardedAdSuccess('" + actionType + "'); }", null);
                    }
                }
            });
        }

        @JavascriptInterface
        public boolean isRewardedAdLoaded() {
            return true;
        }

        @JavascriptInterface
        public void shareImageToWhatsApp(final String base64Data, final String caption) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    try {
                        String cleanBase64 = base64Data;
                        if (cleanBase64.contains(",")) {
                            cleanBase64 = cleanBase64.substring(cleanBase64.indexOf(",") + 1);
                        }
                        byte[] decodedBytes = Base64.decode(cleanBase64, Base64.DEFAULT);

                        File cacheDir = getCacheDir();
                        File imageFile = new File(cacheDir, "adisyon_slip.jpg");
                        if (imageFile.exists()) {
                            imageFile.delete();
                        }

                        FileOutputStream fos = new FileOutputStream(imageFile);
                        fos.write(decodedBytes);
                        fos.flush();
                        fos.close();

                        Uri contentUri = Uri.parse("content://" + AppFileProvider.AUTHORITY + "/adisyon_slip.jpg");

                        Intent intent = new Intent(Intent.ACTION_SEND);
                        intent.setType("image/jpeg");
                        intent.putExtra(Intent.EXTRA_STREAM, contentUri);
                        intent.setClipData(android.content.ClipData.newRawUri("adisyon_slip", contentUri));
                        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
                        if (caption != null && !caption.trim().isEmpty()) {
                            intent.putExtra(Intent.EXTRA_TEXT, caption);
                        }

                        // Explicitly grant URI permission to target apps
                        try {
                            grantUriPermission("com.whatsapp", contentUri, Intent.FLAG_GRANT_READ_URI_PERMISSION);
                            grantUriPermission("com.whatsapp.w4b", contentUri, Intent.FLAG_GRANT_READ_URI_PERMISSION);
                        } catch (Exception ignored) {}

                        // Try standard WhatsApp first
                        intent.setPackage("com.whatsapp");
                        try {
                            startActivity(intent);
                        } catch (Exception e1) {
                            // Try WhatsApp Business
                            try {
                                intent.setPackage("com.whatsapp.w4b");
                                startActivity(intent);
                            } catch (Exception e2) {
                                // Fallback to general sharing chooser
                                intent.setPackage(null);
                                Intent chooser = Intent.createChooser(intent, "Adisyon G\u00f6rselini Payla\u015f");
                                chooser.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                                startActivity(chooser);
                            }
                        }
                    } catch (Exception e) {
                        Log.e(TAG, "Error sharing JPG image: " + e.getMessage(), e);
                        Toast.makeText(MainActivity.this, "G\u00f6rsel payla\u015f\u0131lamad\u0131: " + e.getMessage(), Toast.LENGTH_SHORT).show();
                    }
                }
            });
        }

        @JavascriptInterface
        public void showToast(final String message) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    Toast.makeText(MainActivity.this, message, Toast.LENGTH_SHORT).show();
                }
            });
        }

        @JavascriptInterface
        public void checkForUpdates() {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    if (versionUpdateManager != null) {
                        versionUpdateManager.checkForUpdates(true);
                    }
                }
            });
        }

        @JavascriptInterface
        public boolean saveSecureBackup(final String jsonPayload) {
            try {
                if (jsonPayload == null || jsonPayload.isEmpty()) return false;
                File backupFile = new File(getFilesDir(), "vetassist_local_backup.json");
                FileOutputStream fos = new FileOutputStream(backupFile);
                fos.write(jsonPayload.getBytes("UTF-8"));
                fos.flush();
                fos.close();
                Log.d(TAG, "Secure local backup written successfully: " + backupFile.length() + " bytes");
                return true;
            } catch (Exception e) {
                Log.e(TAG, "Secure backup save error: " + e.getMessage(), e);
                return false;
            }
        }

        @JavascriptInterface
        public String loadSecureBackup() {
            try {
                File backupFile = new File(getFilesDir(), "vetassist_local_backup.json");
                if (!backupFile.exists() || backupFile.length() == 0) return "";
                FileInputStream fis = new FileInputStream(backupFile);
                byte[] data = new byte[(int) backupFile.length()];
                fis.read(data);
                fis.close();
                return new String(data, "UTF-8");
            } catch (Exception e) {
                Log.e(TAG, "Secure backup load error: " + e.getMessage(), e);
                return "";
            }
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        try {
            Window window = getWindow();
            window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS | WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION);
            window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
            window.setStatusBarColor(0xFF0284C7);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                window.setNavigationBarColor(0xFFF4F6FB);
                View decorView = window.getDecorView();
                decorView.setSystemUiVisibility(decorView.getSystemUiVisibility() | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
            }
        } catch (Exception ignored) {}

        setContentView(R.layout.activity_main);

        final View rootContainer = findViewById(R.id.root_container);
        if (rootContainer != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT_WATCH) {
            rootContainer.setOnApplyWindowInsetsListener(new View.OnApplyWindowInsetsListener() {
                @Override
                public WindowInsets onApplyWindowInsets(View v, WindowInsets insets) {
                    v.setPadding(
                            insets.getSystemWindowInsetLeft(),
                            insets.getSystemWindowInsetTop(),
                            insets.getSystemWindowInsetRight(),
                            insets.getSystemWindowInsetBottom()
                    );
                    return insets.consumeSystemWindowInsets();
                }
            });
        }

        webView = findViewById(R.id.webview);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);

        // Inject Native Android Bridge
        webView.addJavascriptInterface(new WebAppInterface(this), "AndroidBridge");

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return handleUrl(request.getUrl().toString());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return handleUrl(url);
            }

            private boolean handleUrl(String url) {
                if (url.startsWith("file:///android_asset/")) {
                    return false;
                }
                if (url.startsWith("http://") || url.startsWith("https://")) {
                    if (url.contains("whatsapp.com") || url.contains("wa.me")) {
                        try {
                            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                            startActivity(intent);
                            return true;
                        } catch (Exception e) {
                            Toast.makeText(MainActivity.this, "WhatsApp a\u00e7\u0131lamad\u0131", Toast.LENGTH_SHORT).show();
                        }
                    } else {
                        try {
                            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                            startActivity(intent);
                            return true;
                        } catch (Exception ignored) {}
                    }
                } else if (url.startsWith("tel:") || url.startsWith("mailto:") || url.startsWith("whatsapp:")) {
                    try {
                        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                        startActivity(intent);
                        return true;
                    } catch (Exception e) {
                        Toast.makeText(MainActivity.this, "Eylem a\u00e7\u0131lamad\u0131", Toast.LENGTH_SHORT).show();
                    }
                }
                return false;
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onConsoleMessage(ConsoleMessage cm) {
                Log.d(TAG, cm.sourceId() + ":" + cm.lineNumber() + " -> " + cm.message());
                return true;
            }

            @Override
            public boolean onJsAlert(WebView view, String url, String message, final JsResult result) {
                new AlertDialog.Builder(MainActivity.this)
                        .setTitle("VetAssist")
                        .setMessage(message)
                        .setPositiveButton("Tamam", new DialogInterface.OnClickListener() {
                            @Override
                            public void onClick(DialogInterface dialog, int which) {
                                result.confirm();
                            }
                        })
                        .setCancelable(false)
                        .create()
                        .show();
                return true;
            }

            @Override
            public boolean onJsConfirm(WebView view, String url, String message, final JsResult result) {
                new AlertDialog.Builder(MainActivity.this)
                        .setTitle("VetAssist")
                        .setMessage(message)
                        .setPositiveButton("Evet", new DialogInterface.OnClickListener() {
                            @Override
                            public void onClick(DialogInterface dialog, int which) {
                                result.confirm();
                            }
                        })
                        .setNegativeButton("\u0130ptal", new DialogInterface.OnClickListener() {
                            @Override
                            public void onClick(DialogInterface dialog, int which) {
                                result.cancel();
                            }
                        })
                        .setCancelable(false)
                        .create()
                        .show();
                return true;
            }

            @Override
            public boolean onJsPrompt(WebView view, String url, String message, String defaultValue, final JsPromptResult result) {
                final EditText input = new EditText(MainActivity.this);
                input.setText(defaultValue);
                new AlertDialog.Builder(MainActivity.this)
                        .setTitle("VetAssist")
                        .setMessage(message)
                        .setView(input)
                        .setPositiveButton("Tamam", new DialogInterface.OnClickListener() {
                            @Override
                            public void onClick(DialogInterface dialog, int which) {
                                result.confirm(input.getText().toString());
                            }
                        })
                        .setNegativeButton("\u0130ptal", new DialogInterface.OnClickListener() {
                            @Override
                            public void onClick(DialogInterface dialog, int which) {
                                result.cancel();
                            }
                        })
                        .setCancelable(false)
                        .create()
                        .show();
                return true;
            }

            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback, FileChooserParams fileChooserParams) {
                if (fileUploadCallback != null) {
                    fileUploadCallback.onReceiveValue(null);
                }
                fileUploadCallback = filePathCallback;
                Intent intent = fileChooserParams.createIntent();
                try {
                    startActivityForResult(intent, FILE_CHOOSER_RESULT_CODE);
                } catch (Exception e) {
                    fileUploadCallback = null;
                    return false;
                }
                return true;
            }
        });

        webView.loadUrl("file:///android_asset/index.html");

        // Reklamlar tamamen devre disi birakildi (Tamamen reklamsiz, temiz profesyonel surum)
        try {
            final FrameLayout adContainer = findViewById(R.id.ad_container);
            if (adContainer != null) {
                adContainer.setVisibility(View.GONE);
                adContainer.removeAllViews();
            }
        } catch (Throwable t) {
            Log.d(TAG, "Ad container hidden");
        }

        try {
            versionUpdateManager = new VersionUpdateManager(this);
            versionUpdateManager.checkForUpdates(false);
            NightlyUpdateReceiver.cancelDailyAlarm(this);
        } catch (Throwable t) {
            Log.w(TAG, "Version update manager init error: " + t.getMessage());
        }
    }

    private void initAdMobBanner() {
        final FrameLayout adContainer = findViewById(R.id.ad_container);
        if (adContainer != null) {
            adContainer.setVisibility(View.GONE);
            adContainer.removeAllViews();
        }
    }

    private void loadRewardedAd() {
        isRewardedAdLoading = false;
        rewardedAd = null;
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (adView != null) {
            adView.resume();
        }
    }

    @Override
    protected void onPause() {
        if (adView != null) {
            adView.pause();
        }
        super.onPause();
    }

    @Override
    protected void onDestroy() {
        if (adView != null) {
            adView.destroy();
        }
        super.onDestroy();
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == FILE_CHOOSER_RESULT_CODE) {
            if (fileUploadCallback != null) {
                Uri[] results = null;
                if (resultCode == Activity.RESULT_OK && data != null) {
                    if (data.getData() != null) {
                        results = new Uri[]{data.getData()};
                    } else if (data.getClipData() != null) {
                        int count = data.getClipData().getItemCount();
                        results = new Uri[count];
                        for (int i = 0; i < count; i++) {
                            results[i] = data.getClipData().getItemAt(i).getUri();
                        }
                    }
                }
                fileUploadCallback.onReceiveValue(results);
                fileUploadCallback = null;
            }
        }
        super.onActivityResult(requestCode, resultCode, data);
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK) {
            if (webView != null) {
                webView.evaluateJavascript(
                    "(function() {" +
                    "  const insModal = document.getElementById('inseminationDocPreviewModal');" +
                    "  if (insModal && insModal.style.display !== 'none') { insModal.style.display = 'none'; return true; }" +
                    "  const pModal = document.getElementById('itsPrescriptionPreviewModal');" +
                    "  if (pModal && pModal.style.display !== 'none') { pModal.style.display = 'none'; return true; }" +
                    "  const scanner = document.getElementById('itsBarcodeScannerModal');" +
                    "  if (scanner && scanner.style.display !== 'none') { scanner.style.display = 'none'; if (window.itsManager) window.itsManager.stopBarcodeScanner(); return true; }" +
                    "  const qrModal = document.getElementById('syncraQrScanModal');" +
                    "  if (qrModal && qrModal.style.display !== 'none') { qrModal.style.display = 'none'; return true; }" +
                    "  const itsModal = document.getElementById('itsPrescriptionModal');" +
                    "  if (itsModal && itsModal.style.display !== 'none') { itsModal.style.display = 'none'; return true; }" +
                    "  const rModal = document.getElementById('receiptPreviewModal');" +
                    "  if (rModal && rModal.style.display !== 'none') { rModal.style.display = 'none'; return true; }" +
                    "  const drawer = document.getElementById('settingsDrawer');" +
                    "  if (drawer && drawer.classList.contains('open')) { drawer.classList.remove('open'); return true; }" +
                    "  return false;" +
                    "})()",
                    new ValueCallback<String>() {
                        @Override
                        public void onReceiveValue(String value) {
                            if (!"true".equals(value)) {
                                runOnUiThread(new Runnable() {
                                    @Override
                                    public void run() {
                                        if (webView.canGoBack()) {
                                            webView.goBack();
                                        } else {
                                            finish();
                                        }
                                    }
                                });
                            }
                        }
                    }
                );
                return true;
            }
        }
        return super.onKeyDown(keyCode, event);
    }
}
