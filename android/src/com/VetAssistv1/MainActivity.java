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
import java.io.FileOutputStream;

public class MainActivity extends Activity {
    private static final String TAG = "VetAssist";
    private WebView webView;
    private AdView adView;
    private RewardedAd rewardedAd;
    private boolean isRewardedAdLoading = false;
    private ValueCallback<Uri[]> fileUploadCallback;
    private final static int FILE_CHOOSER_RESULT_CODE = 1001;

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
                    try {
                        if (rewardedAd != null) {
                            rewardedAd.show(MainActivity.this, new OnUserEarnedRewardListener() {
                                @Override
                                public void onUserEarnedReward(RewardItem rewardItem) {
                                    Log.d(TAG, "User earned reward for action: " + actionType);
                                    runOnUiThread(new Runnable() {
                                        @Override
                                        public void run() {
                                            if (webView != null) {
                                                webView.evaluateJavascript("if (window.onRewardedAdSuccess) { window.onRewardedAdSuccess('" + actionType + "'); }", null);
                                            }
                                        }
                                    });
                                }
                            });
                        } else {
                            Log.w(TAG, "RewardedAd not ready, attempting reload and letting action proceed.");
                            Toast.makeText(MainActivity.this, "Reklam haz\u0131rlan\u0131yor, i\u015fleminiz ger\u00e7ekle\u015ftiriliyor...", Toast.LENGTH_SHORT).show();
                            loadRewardedAd();
                            if (webView != null) {
                                webView.evaluateJavascript("if (window.onRewardedAdSuccess) { window.onRewardedAdSuccess('" + actionType + "'); }", null);
                            }
                        }
                    } catch (Exception e) {
                        Log.e(TAG, "Error showing RewardedAd: " + e.getMessage(), e);
                        if (webView != null) {
                            webView.evaluateJavascript("if (window.onRewardedAdSuccess) { window.onRewardedAdSuccess('" + actionType + "'); }", null);
                        }
                    }
                }
            });
        }

        @JavascriptInterface
        public boolean isRewardedAdLoaded() {
            return rewardedAd != null;
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
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
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

        // Safe AdMob Banner & Rewarded Ad initialization
        try {
            MobileAds.initialize(this, new OnInitializationCompleteListener() {
                @Override
                public void onInitializationComplete(InitializationStatus initializationStatus) {
                    runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            initAdMobBanner();
                            loadRewardedAd();
                        }
                    });
                }
            });
        } catch (Throwable t) {
            Log.e(TAG, "AdMob setup failed: " + t.getMessage(), t);
        }
    }

    private void initAdMobBanner() {
        final FrameLayout adContainer = findViewById(R.id.ad_container);
        if (adContainer == null) return;

        try {
            if (adView != null) {
                adView.destroy();
            }
            adContainer.removeAllViews();

            adView = new AdView(MainActivity.this);
            adView.setAdSize(AdSize.BANNER);
            adView.setAdUnitId(getString(R.string.banner_ad_unit_id));

            adView.setAdListener(new AdListener() {
                @Override
                public void onAdLoaded() {
                    Log.d(TAG, "AdMob Live Banner loaded successfully.");
                }

                @Override
                public void onAdFailedToLoad(LoadAdError adError) {
                    Log.w(TAG, "Live Banner failed (Code " + adError.getCode() + ": " + adError.getMessage() + "). Loading fallback test banner...");
                    runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            try {
                                if (adView != null) {
                                    adView.destroy();
                                }
                                adContainer.removeAllViews();

                                adView = new AdView(MainActivity.this);
                                adView.setAdSize(AdSize.BANNER);
                                adView.setAdUnitId(getString(R.string.test_banner_ad_unit_id));
                                adView.setAdListener(new AdListener() {
                                    @Override
                                    public void onAdLoaded() {
                                        Log.d(TAG, "AdMob Test Banner loaded successfully.");
                                    }

                                    @Override
                                    public void onAdFailedToLoad(LoadAdError err) {
                                        Log.w(TAG, "AdMob Test Banner failed to load: " + err.getMessage());
                                    }
                                });
                                adContainer.addView(adView);
                                adView.loadAd(new AdRequest.Builder().build());
                            } catch (Throwable t) {
                                Log.e(TAG, "Fallback banner error: " + t.getMessage(), t);
                            }
                        }
                    });
                }
            });

            adContainer.addView(adView);
            adView.loadAd(new AdRequest.Builder().build());
        } catch (Throwable t) {
            Log.e(TAG, "Error initializing banner: " + t.getMessage(), t);
        }
    }

    private void loadRewardedAd() {
        if (isRewardedAdLoading || rewardedAd != null) return;
        isRewardedAdLoading = true;

        AdRequest adRequest = new AdRequest.Builder().build();
        String configuredId = getString(R.string.rewarded_ad_unit_id);
        if (configuredId.contains("~")) {
            Log.w(TAG, "rewarded_ad_unit_id is configured with App ID (~). Using test rewarded ID fallback.");
            configuredId = getString(R.string.test_rewarded_ad_unit_id);
        }

        final String targetAdUnitId = configuredId;
        RewardedAd.load(this, targetAdUnitId, adRequest, new RewardedAdLoadCallback() {
            @Override
            public void onAdLoaded(RewardedAd ad) {
                rewardedAd = ad;
                isRewardedAdLoading = false;
                Log.d(TAG, "AdMob RewardedAd loaded successfully with ID: " + targetAdUnitId);

                rewardedAd.setFullScreenContentCallback(new FullScreenContentCallback() {
                    @Override
                    public void onAdShowedFullScreenContent() {
                        Log.d(TAG, "AdMob RewardedAd showed full screen.");
                    }

                    @Override
                    public void onAdFailedToShowFullScreenContent(AdError adError) {
                        Log.e(TAG, "AdMob RewardedAd failed to show: " + adError.getMessage());
                        rewardedAd = null;
                        loadRewardedAd();
                    }

                    @Override
                    public void onAdDismissedFullScreenContent() {
                        Log.d(TAG, "AdMob RewardedAd dismissed.");
                        rewardedAd = null;
                        loadRewardedAd();
                    }
                });
            }

            @Override
            public void onAdFailedToLoad(LoadAdError loadAdError) {
                Log.w(TAG, "AdMob RewardedAd failed to load: " + loadAdError.getMessage() + " (Code: " + loadAdError.getCode() + "). Loading fallback test ad...");
                isRewardedAdLoading = false;
                rewardedAd = null;

                if (!targetAdUnitId.equals(getString(R.string.test_rewarded_ad_unit_id))) {
                    RewardedAd.load(MainActivity.this, getString(R.string.test_rewarded_ad_unit_id), new AdRequest.Builder().build(), new RewardedAdLoadCallback() {
                        @Override
                        public void onAdLoaded(RewardedAd fallbackAd) {
                            rewardedAd = fallbackAd;
                            Log.d(TAG, "AdMob Test RewardedAd fallback loaded successfully.");
                            rewardedAd.setFullScreenContentCallback(new FullScreenContentCallback() {
                                @Override
                                public void onAdDismissedFullScreenContent() {
                                    rewardedAd = null;
                                    loadRewardedAd();
                                }
                                @Override
                                public void onAdFailedToShowFullScreenContent(AdError adError) {
                                    rewardedAd = null;
                                }
                            });
                        }

                        @Override
                        public void onAdFailedToLoad(LoadAdError err) {
                            Log.w(TAG, "AdMob Test RewardedAd fallback also failed: " + err.getMessage());
                        }
                    });
                }
            }
        });
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
        if (keyCode == KeyEvent.KEYCODE_BACK && webView.canGoBack()) {
            webView.goBack();
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }
}
