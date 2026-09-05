package com.VetAssistv1;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.AsyncTask;
import android.util.Log;
import android.widget.Toast;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * VetAssist - Otomatik Uygulama İçi Güncelleme Yöneticisi
 */
public class VersionUpdateManager {
    private static final String TAG = "VetAssistUpdateMgr";
    private static final String VERSION_CHECK_URL = "https://tester-tracker.vercel.app/api/app-version";
    private Activity activity;

    public VersionUpdateManager(Activity activity) {
        this.activity = activity;
    }

    /**
     * Güncellemeleri kontrol eder
     * @param isManualUserCheck Kullanıcı ayarlardan elle mi tetikledi?
     */
    public void checkForUpdates(final boolean isManualUserCheck) {
        if (activity == null || activity.isFinishing()) return;

        new AsyncTask<Void, Void, UpdateResult>() {
            @Override
            protected UpdateResult doInBackground(Void... voids) {
                try {
                    int currentVersionCode = getCurrentVersionCode();
                    String currentVersionName = getCurrentVersionName();

                    // Sürüm kontrol endpoint'i
                    URL url = new URL(VERSION_CHECK_URL);
                    HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                    conn.setConnectTimeout(6000);
                    conn.setReadTimeout(6000);
                    conn.setRequestMethod("GET");
                    conn.setRequestProperty("Accept", "application/json");

                    int responseCode = conn.getResponseCode();
                    if (responseCode == 200) {
                        BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                        StringBuilder sb = new StringBuilder();
                        String line;
                        while ((line = reader.readLine()) != null) {
                            sb.append(line);
                        }
                        reader.close();

                        JSONObject json = new JSONObject(sb.toString());
                        int latestVersionCode = json.optInt("versionCode", currentVersionCode);
                        String latestVersionName = json.optString("versionName", currentVersionName);
                        String releaseNotes = json.optString("releaseNotes", "Performans ve aray\u00fcz iyile\u015ftirmeleri yap\u0131ld\u0131.");
                        boolean isForceUpdate = json.optBoolean("forceUpdate", false);

                        return new UpdateResult(currentVersionCode, latestVersionCode, currentVersionName, latestVersionName, releaseNotes, isForceUpdate, true);
                    }
                } catch (Exception e) {
                    Log.w(TAG, "Version check error (network/offline): " + e.getMessage());
                }
                return new UpdateResult(0, 0, "", "", "", false, false);
            }

            @Override
            protected void onPostExecute(UpdateResult result) {
                if (activity == null || activity.isFinishing()) return;

                if (result.success && result.latestVersionCode > result.currentVersionCode) {
                    // Yeni sürüm bulundu! Kullanıcıya güncelleme penceresi göster
                    showUpdateDialog(result);
                } else if (isManualUserCheck) {
                    // Kullanıcı elle tıkladı ve sürüm güncel
                    Toast.makeText(activity, "VetAssist en g\u00fcncel s\u00fcr\u00fcmd\u00fcr! (v" + getCurrentVersionName() + ")", Toast.LENGTH_SHORT).show();
                }
            }
        }.execute();
    }

    /**
     * Güncelleme bilgi penceresini açar
     */
    private void showUpdateDialog(final UpdateResult updateInfo) {
        try {
            AlertDialog.Builder builder = new AlertDialog.Builder(activity)
                    .setTitle("\ud83d\ude80 Yeni VetAssist G\u00fcncellemesi Mevcut!")
                    .setMessage("VetAssist'in yeni s\u00fcr\u00fcm\u00fc (v" + updateInfo.latestVersionName + ") yay\u0131nland\u0131.\n\n"
                            + "\u2728 Yenilikler:\n" + updateInfo.releaseNotes + "\n\n"
                            + "En iyi performans ve g\u00fcncel test deneyimi i\u00e7in Google Play \u00fczerinden g\u00fcncelleme yap\u0131n\u0131z.")
                    .setPositiveButton("\u2705 \u015eimdi G\u00fcncelle", new DialogInterface.OnClickListener() {
                        @Override
                        public void onClick(DialogInterface dialog, int which) {
                            openPlayStore();
                        }
                    });

            if (!updateInfo.isForceUpdate) {
                builder.setNegativeButton("Daha Sonra", null);
            } else {
                builder.setCancelable(false);
            }

            builder.create().show();
        } catch (Exception e) {
            Log.e(TAG, "Failed to show update dialog: " + e.getMessage(), e);
        }
    }

    /**
     * Google Play Store sayfasını açar
     */
    public void openPlayStore() {
        if (activity == null) return;
        final String appPackageName = activity.getPackageName();
        try {
            activity.startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=" + appPackageName)));
        } catch (ActivityNotFoundException e) {
            activity.startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse("https://play.google.com/store/apps/details?id=" + appPackageName)));
        }
    }

    public int getCurrentVersionCode() {
        try {
            PackageInfo pInfo = activity.getPackageManager().getPackageInfo(activity.getPackageName(), 0);
            return pInfo.versionCode;
        } catch (PackageManager.NameNotFoundException e) {
            return 1;
        }
    }

    public String getCurrentVersionName() {
        try {
            PackageInfo pInfo = activity.getPackageManager().getPackageInfo(activity.getPackageName(), 0);
            return pInfo.versionName;
        } catch (PackageManager.NameNotFoundException e) {
            return "1.0.0";
        }
    }

    private static class UpdateResult {
        int currentVersionCode;
        int latestVersionCode;
        String currentVersionName;
        String latestVersionName;
        String releaseNotes;
        boolean isForceUpdate;
        boolean success;

        UpdateResult(int current, int latest, String curName, String latName, String notes, boolean force, boolean succ) {
            this.currentVersionCode = current;
            this.latestVersionCode = latest;
            this.currentVersionName = curName;
            this.latestVersionName = latName;
            this.releaseNotes = notes;
            this.isForceUpdate = force;
            this.success = succ;
        }
    }
}
