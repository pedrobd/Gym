package pt.pedrobd.lembrame;

import android.content.Context;
import android.media.AudioAttributes;
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

    private final TextToSpeech tts;
    private boolean ready = false, failed = false;
    private final List<Runnable> waiting = new ArrayList<>();
    private final Map<String, Done> callbacks = new HashMap<>();

    Speech(Context c, boolean alarmStream) {
        tts = new TextToSpeech(c.getApplicationContext(), this);
        tts.setAudioAttributes(new AudioAttributes.Builder()
                .setUsage(alarmStream ? AudioAttributes.USAGE_ALARM : AudioAttributes.USAGE_ASSISTANCE_NAVIGATION_GUIDANCE)
                .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                .build());
    }

    @Override
    public synchronized void onInit(int status) {
        if (status != TextToSpeech.SUCCESS) { failed = true; flushFailed(); return; }
        int r = tts.setLanguage(new Locale("pt", "PT"));
        if (r == TextToSpeech.LANG_MISSING_DATA || r == TextToSpeech.LANG_NOT_SUPPORTED) {
            r = tts.setLanguage(new Locale("pt", "BR"));
            if (r == TextToSpeech.LANG_MISSING_DATA || r == TextToSpeech.LANG_NOT_SUPPORTED) tts.setLanguage(new Locale("pt"));
        }
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

    boolean ok() { return !failed; }

    void shutdown() {
        try { tts.stop(); tts.shutdown(); } catch (Exception ignored) {}
    }
}
