package pt.pedrobd.lembrame;

import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.media.ToneGenerator;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Corre quando o alarme toca: mostra a notificação, toca o sinal e diz o lembrete em voz alta, mesmo com o ecrã desligado. */
public class ReminderService extends Service {
    private static final long STALE_MS = 60 * 60 * 1000L; // avisos com mais de 1 h de atraso (ex.: telemóvel desligado) não se dizem
    private Speech speech;
    private PowerManager.WakeLock wakeLock;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private int outstanding = 0;
    private AudioManager audio;
    private AudioFocusRequest focus;
    private int seq = 0;

    @Override public IBinder onBind(Intent intent) { return null; }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        try {
            return start(intent != null && intent.getBooleanExtra("test", false));
        } catch (Throwable t) {
            Store.log(this, "Erro no serviço: " + t.getClass().getSimpleName() + " " + t.getMessage());
            fallback(this, false);
            stopSelf();
            return START_NOT_STICKY;
        }
    }

    /** Sem voz: mostra os avisos que chegaram como notificação com som. */
    static void fallback(Context c, boolean test) {
        Notif.channels(c);
        if (test) {
            Notif.loud(c, "teste", "Lembrete de teste", "A voz falhou, mas a notificação funciona.");
            return;
        }
        for (JSONObject e : takeDue(c)) {
            Notif.loud(c, e.optString("rid"), Msg.title(e.optString("kind")), e.optString("task"));
        }
        Scheduler.scheduleNext(c);
    }

    private int start(boolean test) throws Exception {
        Notif.channels(this);
        if (Build.VERSION.SDK_INT >= 29) startForeground(Notif.FG_ID, Notif.speaking(this), ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
        else startForeground(Notif.FG_ID, Notif.speaking(this));

        if (wakeLock == null) {
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
            wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "lembrame:speak");
            wakeLock.acquire(3 * 60 * 1000L);
        }
        handler.removeCallbacks(safetyStop);
        handler.postDelayed(safetyStop, 2 * 60 * 1000L);

        List<JSONObject> due;
        if (test) {
            due = new ArrayList<>();
            due.add(new JSONObject().put("rid", "teste").put("kind", "once").put("task", "isto é um teste. Se ouves isto com o ecrã desligado, está tudo a funcionar"));
        } else {
            due = takeDue(this);
            Scheduler.scheduleNext(this);
        }
        Store.log(this, "Serviço de voz arrancou (" + due.size() + " avisos)");
        if (due.isEmpty()) { maybeStop(); return START_NOT_STICKY; }

        JSONObject s = Store.settings(this);
        boolean alarm = s.optBoolean("alarmVolume", true);
        float rate = (float) s.optDouble("rate", 1.0);
        int repeat = Math.max(1, Math.min(3, s.optInt("repeat", 1)));
        if (speech == null) speech = new Speech(this, alarm, (ok, info) -> Store.log(this, "Voz: " + info));
        requestFocus(alarm);

        long now = System.currentTimeMillis();
        if (s.optBoolean("chime", true)) {
            try {
                ToneGenerator tg = new ToneGenerator(alarm ? AudioManager.STREAM_ALARM : AudioManager.STREAM_NOTIFICATION, 90);
                tg.startTone(ToneGenerator.TONE_PROP_BEEP2, 600);
                handler.postDelayed(tg::release, 1500);
            } catch (RuntimeException ignored) {}
            outstanding++;
            speech.pause(900, "pause-" + (seq++), id -> post(null));
        }
        for (JSONObject e : due) {
            Notif.reminder(this, e);
            final String rid = e.optString("rid");
            MainActivity.dispatch("onFired", rid, e.optString("kind"));
            String text = Msg.build(e, s, now);
            Store.log(this, "A dizer: " + e.optString("task"));
            for (int i = 0; i < repeat; i++) {
                final boolean last = i == repeat - 1;
                outstanding++;
                speech.speak(text, rate, "say-" + (seq++), false, id -> post(last ? rid : null));
                if (!last) { outstanding++; speech.pause(700, "gap-" + (seq++), id -> post(null)); }
            }
        }
        return START_NOT_STICKY;
    }

    /** Tira da lista os avisos que já chegaram; de cada lembrete fica só o mais recente. */
    private static List<JSONObject> takeDue(Context c) {
        long now = System.currentTimeMillis();
        JSONArray all = Store.events(c);
        JSONArray keep = new JSONArray();
        Map<String, JSONObject> latest = new LinkedHashMap<>();
        for (int i = 0; i < all.length(); i++) {
            JSONObject e = all.optJSONObject(i);
            if (e == null) continue;
            long at = e.optLong("at");
            if (at <= now + 30000) {
                if (now - at > STALE_MS && !"deadline".equals(e.optString("kind"))) continue;
                JSONObject prev = latest.get(e.optString("rid"));
                if (prev == null || prev.optLong("at") <= at) latest.put(e.optString("rid"), e);
            } else keep.put(e);
        }
        Store.setEvents(c, keep);
        return new ArrayList<>(latest.values());
    }

    private void post(String rid) { handler.post(() -> done(rid)); }

    private void done(String rid) {
        if (rid != null) { MainActivity.dispatch("onSpoken", rid); Store.log(this, "Voz terminou"); }
        outstanding--;
        maybeStop();
    }

    private void maybeStop() {
        if (outstanding > 0) return;
        handler.postDelayed(() -> { if (outstanding <= 0) stopSelf(); }, 400);
    }

    private final Runnable safetyStop = this::stopSelf;

    private void requestFocus(boolean alarm) {
        audio = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
        focus = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK)
                .setAudioAttributes(new AudioAttributes.Builder()
                        .setUsage(alarm ? AudioAttributes.USAGE_ALARM : AudioAttributes.USAGE_ASSISTANCE_NAVIGATION_GUIDANCE)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH).build())
                .build();
        audio.requestAudioFocus(focus);
    }

    @Override
    public void onDestroy() {
        handler.removeCallbacksAndMessages(null);
        if (speech != null) speech.shutdown();
        if (audio != null && focus != null) audio.abandonAudioFocusRequest(focus);
        if (wakeLock != null && wakeLock.isHeld()) wakeLock.release();
        stopForeground(STOP_FOREGROUND_REMOVE);
        super.onDestroy();
    }
}
