package pt.pedrobd.lembrame;

import android.content.Context;
import android.media.AudioAttributes;
import android.net.ConnectivityManager;
import android.net.NetworkCapabilities;
import android.speech.tts.Voice;

import org.json.JSONArray;
import org.json.JSONObject;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/** Voz do Android (TextToSpeech) em português de Portugal. */
final class Speech implements TextToSpeech.OnInitListener {
    interface Done { void run(String id); }
    interface Ready { void run(boolean ok, String info); }

    private final TextToSpeech tts;
    private final Context appContext;
    private String voiceName = "";
    private boolean ready = false, failed = false;
    private final List<Runnable> waiting = new ArrayList<>();
    private final Map<String, Done> callbacks = new HashMap<>();

    private Ready onReady;

    Speech(Context c, boolean alarmStream, Ready onReady) {
        this(c, alarmStream);
        this.onReady = onReady;
    }

    Speech(Context c, boolean alarmStream) {
        appContext = c.getApplicationContext();
        tts = new TextToSpeech(appContext, this);
        tts.setAudioAttributes(new AudioAttributes.Builder()
                .setUsage(alarmStream ? AudioAttributes.USAGE_ALARM : AudioAttributes.USAGE_ASSISTANCE_NAVIGATION_GUIDANCE)
                .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                .build());
    }

    @Override
    public synchronized void onInit(int status) {
        if (status != TextToSpeech.SUCCESS) {
            failed = true;
            if (onReady != null) onReady.run(false, "o motor de voz do Android não arrancou");
            flushFailed();
            return;
        }
        String lang = "português de Portugal";
        int r = tts.setLanguage(new Locale("pt", "PT"));
        if (r == TextToSpeech.LANG_MISSING_DATA || r == TextToSpeech.LANG_NOT_SUPPORTED) {
            lang = "português do Brasil";
            r = tts.setLanguage(new Locale("pt", "BR"));
            if (r == TextToSpeech.LANG_MISSING_DATA || r == TextToSpeech.LANG_NOT_SUPPORTED) {
                lang = "sem voz portuguesa instalada";
                tts.setLanguage(new Locale("pt"));
            }
        }
        applyVoice();
        if (onReady != null) onReady.run(true, lang + (voiceName.isEmpty() ? "" : " · " + voiceName));
        tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
            @Override public void onStart(String id) {}
            @Override public void onDone(String id) { finish(id); }
            @Override public void onError(String id) { finish(id); }
            @Override public void onStop(String id, boolean interrupted) { finish(id); }
        });
        ready = true;
        for (Runnable w : waiting) w.run();
        waiting.clear();
    }

    private void finish(String id) {
        Done d;
        synchronized (this) { d = callbacks.remove(id); }
        if (d != null) d.run(id);
    }

    private void flushFailed() {
        for (Map.Entry<String, Done> e : new HashMap<>(callbacks).entrySet()) finish(e.getKey());
        waiting.clear();
    }

    /** flush = interromper o que está a dizer. */
    synchronized void speak(final String text, final float rate, final String id, final boolean flush, final Done done) {
        if (done != null) callbacks.put(id, done);
        if (failed) { finish(id); return; }
        Runnable r = () -> {
            applyVoice();
            tts.setSpeechRate(rate > 0 ? rate : 1f);
            Bundle b = new Bundle();
            int res = tts.speak(text, flush ? TextToSpeech.QUEUE_FLUSH : TextToSpeech.QUEUE_ADD, b, id);
            if (res != TextToSpeech.SUCCESS) finish(id);
        };
        if (ready) r.run(); else waiting.add(r);
    }

    synchronized void pause(long ms, String id, Done done) {
        if (done != null) callbacks.put(id, done);
        if (failed) { finish(id); return; }
        Runnable r = () -> tts.playSilentUtterance(ms, TextToSpeech.QUEUE_ADD, id);
        if (ready) r.run(); else waiting.add(r);
    }

    void stop() { if (ready) tts.stop(); }

    /** Voz escolhida nas definições ("" = a do sistema). */
    synchronized void setVoice(String name) {
        voiceName = name == null ? "" : name;
        if (ready) applyVoice();
    }

    private boolean online() {
        try {
            ConnectivityManager cm = (ConnectivityManager) appContext.getSystemService(Context.CONNECTIVITY_SERVICE);
            NetworkCapabilities nc = cm.getNetworkCapabilities(cm.getActiveNetwork());
            return nc != null && nc.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED);
        } catch (Exception e) { return false; }
    }

    /** Aplica a voz escolhida; se precisar de internet e não houver, usa uma voz do próprio telemóvel. */
    private void applyVoice() {
        if (voiceName.isEmpty()) return;
        try {
            Voice chosen = null, localTwin = null, anyLocal = null;
            for (Voice v : tts.getVoices()) {
                if (v.getName().equals(voiceName)) chosen = v;
            }
            if (chosen == null) return;
            if (chosen.isNetworkConnectionRequired() && !online()) {
                String twin = voiceName.replace("-network", "-local");
                for (Voice v : tts.getVoices()) {
                    if (v.isNetworkConnectionRequired() || !v.getLocale().equals(chosen.getLocale())) continue;
                    if (v.getName().equals(twin)) localTwin = v;
                    if (anyLocal == null) anyLocal = v;
                }
                chosen = localTwin != null ? localTwin : anyLocal != null ? anyLocal : chosen;
            }
            tts.setVoice(chosen);
        } catch (Exception ignored) {}
    }

    /** Vozes portuguesas disponíveis, para escolher nas definições. */
    synchronized String voicesJson() {
        JSONArray out = new JSONArray();
        if (!ready) return out.toString();
        try {
            for (Voice v : tts.getVoices()) {
                if (!"por".equals(v.getLocale().getISO3Language()) && !"pt".equals(v.getLocale().getLanguage())) continue;
                boolean notInstalled = v.getFeatures() != null && v.getFeatures().contains(TextToSpeech.Engine.KEY_FEATURE_NOT_INSTALLED);
                out.put(new JSONObject()
                        .put("name", v.getName())
                        .put("country", v.getLocale().getCountry())
                        .put("network", v.isNetworkConnectionRequired())
                        .put("quality", v.getQuality())
                        .put("installed", !notInstalled));
            }
        } catch (Exception ignored) {}
        return out.toString();
    }

    boolean ok() { return !failed; }

    void shutdown() {
        try { tts.stop(); tts.shutdown(); } catch (Exception ignored) {}
    }
}
