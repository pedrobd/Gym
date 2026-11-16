package pt.pedrobd.lembrame;

import android.annotation.SuppressLint;
import android.app.AlarmManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;
import android.webkit.JavascriptInterface;

import androidx.core.app.NotificationManagerCompat;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/** O que a interface (JavaScript) pode pedir ao Android: window.AndroidBridge.* */
public class Bridge {
    private final MainActivity a;

    Bridge(MainActivity activity) { this.a = activity; }

    @JavascriptInterface
    public void speak(String text, float rate, String token) {
        a.speech.speak(text, rate, token, true, id -> MainActivity.dispatch("onSpeakDone", id));
    }

    @JavascriptInterface
    public void stopSpeaking() { a.speech.stop(); }

    @JavascriptInterface
    public void listen() { a.runOnUiThread(a::startListening); }

    /** Recebe da interface a lista de próximos avisos e as definições, e marca o próximo alarme. */
    @JavascriptInterface
    public void sync(String json) {
        try {
            JSONObject o = new JSONObject(json);
            JSONArray ev = o.optJSONArray("events");
            Store.setEvents(a, ev != null ? ev : new JSONArray());
            JSONObject s = o.optJSONObject("settings");
            if (s != null) Store.setSettings(a, s);
        } catch (JSONException ignored) {}
        Scheduler.scheduleNext(a);
    }

    @JavascriptInterface
    public String takeActions() { return Store.takeActions(a); }

    @JavascriptInterface
    public void cancelNotification(String rid) { Notif.cancel(a, rid); }

    @JavascriptInterface
    public void keepScreenOn(boolean on) { a.keepScreenOn(on); }

    @JavascriptInterface
    public String status() {
        JSONObject o = new JSONObject();
        try {
            o.put("notifications", NotificationManagerCompat.from(a).areNotificationsEnabled());
            AlarmManager am = (AlarmManager) a.getSystemService(Context.ALARM_SERVICE);
            o.put("exact", Build.VERSION.SDK_INT < 31 || am.canScheduleExactAlarms());
            PowerManager pm = (PowerManager) a.getSystemService(Context.POWER_SERVICE);
            o.put("battery", pm.isIgnoringBatteryOptimizations(a.getPackageName()));
            o.put("tts", a.speech.ok());
        } catch (JSONException ignored) {}
        return o.toString();
    }

    @SuppressLint("BatteryLife")
    @JavascriptInterface
    public void openBatterySettings() {
        a.runOnUiThread(() -> {
            try {
                a.startActivity(new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
                        Uri.parse("package:" + a.getPackageName())));
            } catch (Exception e) {
                a.startActivity(new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS));
            }
        });
    }

    @JavascriptInterface
    public void openNotificationSettings() {
        a.runOnUiThread(() -> a.startActivity(new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
                .putExtra(Settings.EXTRA_APP_PACKAGE, a.getPackageName())));
    }

    @JavascriptInterface
    public void openAlarmSettings() {
        if (Build.VERSION.SDK_INT < 31) return;
        a.runOnUiThread(() -> a.startActivity(new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM,
                Uri.parse("package:" + a.getPackageName()))));
    }

    @JavascriptInterface
    public void openTtsSettings() {
        a.runOnUiThread(() -> {
            try { a.startActivity(new Intent("com.android.settings.TTS_SETTINGS")); } catch (Exception ignored) {}
        });
    }
}
