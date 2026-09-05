package com.VetAssistv1;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.os.Build;
import android.util.Log;

import java.util.Calendar;

/**
 * =========================================================================
 * [GEÇİCİ MODÜL: 14 GÜNLÜK KAPALI TEST BİLDİRİMİ (SAAT 12:00)]
 * 14 günlük Google Play test süreci tamamlandığında bu dosya ve 
 * AndroidManifest.xml içindeki receiver tanımı silinerek kolayca kaldırılabilir.
 * =========================================================================
 * VetAssist - Günlük Test Doğrulama & Giriş Hatırlatıcısı
 * Sabit Saat: 12:00 (Öğlen)
 */
public class NightlyUpdateReceiver extends BroadcastReceiver {
    private static final String TAG = "VetAssistReminder";
    public static final String ACTION_NIGHTLY_CHECK = "com.VetAssistv1.ACTION_NIGHTLY_CHECK";
    private static final String CHANNEL_ID = "vetassist_daily_reminder_channel";
    private static final String PREFS_NAME = "vetassist_settings";
    private static final String KEY_REMINDER_HOUR = "reminder_hour";
    private static final String KEY_REMINDER_MINUTE = "reminder_minute";
    private static final int NOTIFICATION_ID = 2026;

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent != null ? intent.getAction() : null;
        Log.d(TAG, "Update/Reminder receiver triggered with action: " + action);

        // Cihaz yeniden başlatıldığında veya uygulama güncellendiğinde sadece alarmı tekrar kur
        if (Intent.ACTION_BOOT_COMPLETED.equals(action) || "android.intent.action.MY_PACKAGE_REPLACED".equals(action)) {
            Log.d(TAG, "Device rebooted or package replaced, rescheduling 12:00 daily alarm.");
            scheduleDailyAlarm(context, 12, 0);
            return;
        }

        // Bildirimi Göster
        showReminderNotification(context);

        // Bir sonraki gün için alarmı tekrar kur
        scheduleDailyAlarm(context, 12, 0);
    }

    /**
     * Varsayılan olarak saat 12:00'de tetiklenecek AlarmManager zamanlayıcısını kurar
     */
    public static void scheduleDailyAlarm(Context context) {
        scheduleDailyAlarm(context, 12, 0);
    }

    /**
     * Belirtilen saat ve dakikada günlük alarm kurar ve tercihi kaydeder
     */
    public static void scheduleDailyAlarm(Context context, int hour, int minute) {
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            prefs.edit().putInt(KEY_REMINDER_HOUR, hour).putInt(KEY_REMINDER_MINUTE, minute).apply();

            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (alarmManager == null) return;

            Intent intent = new Intent(context, NightlyUpdateReceiver.class);
            intent.setAction(ACTION_NIGHTLY_CHECK);

            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                flags |= PendingIntent.FLAG_IMMUTABLE;
            }

            PendingIntent pendingIntent = PendingIntent.getBroadcast(context, 100, intent, flags);

            Calendar calendar = Calendar.getInstance();
            calendar.setTimeInMillis(System.currentTimeMillis());
            calendar.set(Calendar.HOUR_OF_DAY, hour);
            calendar.set(Calendar.MINUTE, minute);
            calendar.set(Calendar.SECOND, 0);
            calendar.set(Calendar.MILLISECOND, 0);

            // Eğer bugün belirtilen saat geçmişse, bir sonraki güne kur
            if (calendar.getTimeInMillis() <= System.currentTimeMillis()) {
                calendar.add(Calendar.DAY_OF_YEAR, 1);
            }

            long triggerTime = calendar.getTimeInMillis();

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                if (alarmManager.canScheduleExactAlarms()) {
                    alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerTime, pendingIntent);
                } else {
                    alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerTime, pendingIntent);
                }
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerTime, pendingIntent);
            } else {
                alarmManager.set(AlarmManager.RTC_WAKEUP, triggerTime, pendingIntent);
            }

            Log.d(TAG, "Daily reminder alarm scheduled for: " + calendar.getTime().toString() + " (" + String.format("%02d:%02d", hour, minute) + ")");
        } catch (Exception e) {
            Log.e(TAG, "Failed to schedule daily alarm: " + e.getMessage(), e);
        }
    }

    /**
     * Test kullanıcısının telefonuna saat 12:00 hatırlatma bildirimi gönderir
     */
    private void showReminderNotification(Context context) {
        try {
            NotificationManager notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (notificationManager == null) return;

            // Android 8.0+ Bildirim Kanalı
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                NotificationChannel channel = new NotificationChannel(
                        CHANNEL_ID,
                        "VetAssist G\u00fcnl\u00fck Hat\u0131rlat\u0131c\u0131",
                        NotificationManager.IMPORTANCE_DEFAULT
                );
                channel.setDescription("VetAssist g\u00fcnl\u00fck giri\u015f ve takip hat\u0131rlatmas\u0131");
                channel.enableLights(true);
                channel.setLightColor(Color.BLUE);
                channel.enableVibration(true);
                notificationManager.createNotificationChannel(channel);
            }

            Intent appIntent = new Intent(context, MainActivity.class);
            appIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            appIntent.putExtra("TRIGGER_UPDATE_CHECK", true);

            int pendingFlags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                pendingFlags |= PendingIntent.FLAG_IMMUTABLE;
            }

            PendingIntent contentIntent = PendingIntent.getActivity(context, 200, appIntent, pendingFlags);

            Notification.Builder builder;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                builder = new Notification.Builder(context, CHANNEL_ID);
            } else {
                builder = new Notification.Builder(context);
            }

            // Kedi & Köpek Emojili ve Kibar Günlük Hatırlatma Metni
            String title = "\ud83d\udc31\ud83d\udc36 VetAssist G\u00fcnl\u00fck Hat\u0131rlatma";
            String shortText = "Minik dostlar\u0131m\u0131z\u0131n takibi i\u00e7in VetAssist'e g\u00fcnl\u00fck giri\u015f yapmay\u0131 unutmay\u0131n\u0131z. \ud83d\udc3e";
            String expandedText = "Minik dostlar\u0131m\u0131z\u0131n sa\u011fl\u0131k, a\u015f\u0131 ve klinik kay\u0131tlar\u0131n\u0131 g\u00fcncel tutmak i\u00e7in VetAssist'e g\u00fcnl\u00fck giri\u015f yapmay\u0131 unutmay\u0131n\u0131z. \ud83d\udc31\ud83d\udc36\ud83d\udc3e Harika ve verimli bir g\u00fcn dileriz!";

            builder.setContentTitle(title)
                    .setContentText(shortText)
                    .setSmallIcon(R.mipmap.ic_launcher)
                    .setAutoCancel(true)
                    .setContentIntent(contentIntent);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN) {
                builder.setStyle(new Notification.BigTextStyle().bigText(expandedText));
            }

            notificationManager.notify(NOTIFICATION_ID, builder.build());
            Log.d(TAG, "Reminder notification displayed successfully.");
        } catch (Exception e) {
            Log.e(TAG, "Error displaying notification: " + e.getMessage(), e);
        }
    }
}
