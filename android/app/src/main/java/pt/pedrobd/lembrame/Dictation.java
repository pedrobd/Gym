package pt.pedrobd.lembrame;

import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;

import java.util.ArrayList;

/**
 * Ditado sem pressa: o reconhecedor do Android pára à primeira pausa, por isso voltamos a ligá-lo
 * e juntamos o texto até haver ~3,5 s de silêncio (ou até a pessoa tocar outra vez no microfone).
 */
final class Dictation implements RecognitionListener {
    interface Out {
        void partial(String text);
        void done(String text, String error);
    }

    private static final long SILENCE_MS = 3500;     // silêncio depois de falar = terminou
    private static final long FIRST_WAIT_MS = 8000;  // tempo para começar a falar
    private static final long MAX_MS = 90000;        // limite de segurança

    private final Context context;
    private final Out out;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private SpeechRecognizer recognizer;
    private final StringBuilder committed = new StringBuilder();
    private String partial = "";
    private boolean active = false, continuous = true;

    Dictation(Context context, Out out) {
        this.context = context;
        this.out = out;
    }

    static boolean available(Context c) { return SpeechRecognizer.isRecognitionAvailable(c); }

    boolean isActive() { return active; }

    /** continuous=false: uma só frase (para responder "feito" a um aviso). */
    void start(boolean continuous, long firstWaitMs) {
        if (active) abort();
        this.continuous = continuous;
        committed.setLength(0);
        partial = "";
        active = true;
        handler.removeCallbacksAndMessages(null);
        handler.postDelayed(this::finish, MAX_MS);
        armSilence(firstWaitMs > 0 ? firstWaitMs : FIRST_WAIT_MS);
        begin();
    }

    private void begin() {
        if (recognizer == null) {
            recognizer = SpeechRecognizer.createSpeechRecognizer(context);
            recognizer.setRecognitionListener(this);
        }
        Intent i = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        i.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "pt-PT");
        i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, "pt-PT");
        i.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
        i.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1);
        i.putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, context.getPackageName());
        // Alguns motores respeitam estes tempos; nos outros, o recomeço automático trata do resto.
        i.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, SILENCE_MS);
        i.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS, SILENCE_MS);
        i.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS, 4000L);
        try {
            recognizer.startListening(i);
        } catch (Exception e) {
            handler.postDelayed(this::restart, 300);
        }
    }

    private void restart() {
        if (!active) return;
        try { recognizer.cancel(); } catch (Exception ignored) {}
        begin();
    }

    private final Runnable silenceStop = this::finish;

    private void armSilence(long ms) {
        handler.removeCallbacks(silenceStop);
        handler.postDelayed(silenceStop, ms);
    }

    private String text() {
        String c = committed.toString().trim();
        String p = partial.trim();
        return (c + (c.isEmpty() || p.isEmpty() ? "" : " ") + p).trim();
    }

    /** Termina e entrega o que foi dito até agora. */
    void finish() {
        if (!active) return;
        active = false;
        handler.removeCallbacksAndMessages(null);
        try { recognizer.stopListening(); recognizer.cancel(); } catch (Exception ignored) {}
        out.done(text(), null);
    }

    void abort() {
        active = false;
        handler.removeCallbacksAndMessages(null);
        try { if (recognizer != null) recognizer.cancel(); } catch (Exception ignored) {}
    }

    void destroy() {
        abort();
        if (recognizer != null) { recognizer.destroy(); recognizer = null; }
    }

    private static String first(Bundle b) {
        if (b == null) return "";
        ArrayList<String> r = b.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
        return r == null || r.isEmpty() || r.get(0) == null ? "" : r.get(0).trim();
    }

    @Override public void onReadyForSpeech(Bundle params) {}
    @Override public void onBeginningOfSpeech() { if (active) armSilence(SILENCE_MS + 2000); }
    @Override public void onRmsChanged(float rmsdB) {}
    @Override public void onBufferReceived(byte[] buffer) {}
    @Override public void onEndOfSpeech() {}
    @Override public void onEvent(int eventType, Bundle params) {}

    @Override
    public void onPartialResults(Bundle b) {
        if (!active) return;
        String t = first(b);
        if (t.isEmpty()) return;
        partial = t;
        armSilence(SILENCE_MS);
        out.partial(text());
    }

    @Override
    public void onResults(Bundle b) {
        if (!active) return;
        String t = first(b);
        if (!t.isEmpty()) {
            if (committed.length() > 0) committed.append(' ');
            committed.append(t);
            armSilence(SILENCE_MS);
        }
        partial = "";
        out.partial(text());
        if (!continuous) { finish(); return; }
        handler.postDelayed(this::restart, 60);
    }

    @Override
    public void onError(int error) {
        if (!active) return;
        if (error == SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS) {
            active = false;
            handler.removeCallbacksAndMessages(null);
            out.done(text(), "not-allowed");
            return;
        }
        if (error == SpeechRecognizer.ERROR_NETWORK || error == SpeechRecognizer.ERROR_NETWORK_TIMEOUT
                || error == SpeechRecognizer.ERROR_SERVER) {
            if (text().isEmpty()) {
                active = false;
                handler.removeCallbacksAndMessages(null);
                out.done("", "network");
            } else finish();
            return;
        }
        if (!continuous && !text().isEmpty()) { finish(); return; }
        // pausa sem palavras, ou reconhecedor ocupado: volta a ouvir; o temporizador de silêncio decide quando acabar
        handler.postDelayed(this::restart, error == SpeechRecognizer.ERROR_RECOGNIZER_BUSY ? 400 : 120);
    }
}
