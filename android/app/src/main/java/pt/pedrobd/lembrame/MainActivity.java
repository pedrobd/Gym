package pt.pedrobd.lembrame;

import android.Manifest;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.speech.RecognizerIntent;
import android.view.WindowManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.webkit.WebViewAssetLoader;

import org.json.JSONObject;

import java.lang.ref.WeakReference;
import java.util.ArrayList;

/** Mostra a interface (a mesma da versão web) e liga-a à voz, ao microfone e aos alarmes do Android. */
public class MainActivity extends Activity {
    private static final int REQ_SPEECH = 7;
    private static final String START = "https://appassets.androidplatform.net/assets/www/index.html";
    private static WeakReference<MainActivity> current = new WeakReference<>(null);

    WebView web;
    Speech speech;
    Dictation dictation;
    private static final int REQ_MIC = 2;
    private String pendingListenMode = null;
    private boolean pageReady = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Notif.channels(this);
        speech = new Speech(this, false);
        dictation = new Dictation(this, new Dictation.Out() {
            @Override public void partial(String text) {
                js("window.__native && __native.onPartial && __native.onPartial(" + JSONObject.quote(text) + ")");
            }
            @Override public void done(String text, String error) {
                js("window.__native && __native.onListen(" + (text == null || text.isEmpty() ? "null" : JSONObject.quote(text))
                        + "," + (error == null ? "null" : JSONObject.quote(error)) + ")");
            }
        });

        web = new WebView(this);
        setContentView(web);
        WebSettings ws = web.getSettings();
        ws.setJavaScriptEnabled(true);
        ws.setDomStorageEnabled(true);
        ws.setMediaPlaybackRequiresUserGesture(false);
        ws.setAllowFileAccess(false);
        ws.setAllowContentAccess(false);

        final WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();
        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest req) {
                return loader.shouldInterceptRequest(req.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
                Uri u = req.getUrl();
                if ("appassets.androidplatform.net".equals(u.getHost())) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (ActivityNotFoundException ignored) {}
                return true;
            }

            @Override
            public void onPageFinished(WebView view, String url) { pageReady = true; }
        });
        web.setWebChromeClient(new WebChromeClient());
        web.addJavascriptInterface(new Bridge(this), "AndroidBridge");
        web.loadUrl(START);

        if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, 1);
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        current = new WeakReference<>(this);
        if (pageReady) js("window.__native && __native.onResume()");
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        if (requestCode == REQ_MIC) {
            String mode = pendingListenMode;
            pendingListenMode = null;
            boolean ok = grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED;
            if (mode != null) { if (ok) listen(mode); else startListening(); }
            return;
        }
        js("window.__native && __native.onResume()");
    }

    /** "dictation": ouve até 3,5 s de silêncio ou até tocar de novo. "answer": uma frase curta. */
    void listen(String mode) {
        if (!Dictation.available(this)) { startListening(); return; }
        if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            pendingListenMode = mode;
            requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, REQ_MIC);
            return;
        }
        if ("answer".equals(mode)) dictation.start(false, 7000);
        else dictation.start(true, 0);
    }

    void stopListening() {
        if (dictation != null && dictation.isActive()) dictation.finish();
    }

    @Override
    protected void onDestroy() {
        if (current.get() == this) current = new WeakReference<>(null);
        if (speech != null) speech.shutdown();
        if (dictation != null) dictation.destroy();
        if (web != null) web.destroy();
        super.onDestroy();
    }

    @Override
    public void onBackPressed() {
        // Primeiro fecha o que estiver aberto na interface (aviso, definições, edição).
        // Se não houver nada, a app vai para segundo plano: os alarmes continuam marcados.
        if (web == null || !pageReady) { moveTaskToBack(true); return; }
        web.evaluateJavascript("(window.__native && __native.onBack()) ? 'closed' : 'none'", result -> {
            if (result == null || !result.contains("closed")) moveTaskToBack(true);
        });
    }

    void js(final String code) {
        runOnUiThread(() -> { if (web != null) web.evaluateJavascript(code, null); });
    }

    /** Chama window.__native.<fn>(args...) na interface, se a app estiver aberta. */
    static void dispatch(String fn, String... args) {
        MainActivity a = current.get();
        if (a == null) return;
        StringBuilder sb = new StringBuilder("window.__native && __native.").append(fn).append('(');
        for (int i = 0; i < args.length; i++) {
            if (i > 0) sb.append(',');
            sb.append(JSONObject.quote(args[i]));
        }
        a.js(sb.append(')').toString());
    }

    void startListening() {
        Intent i = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        i.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "pt-PT");
        i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, "pt-PT");
        i.putExtra(RecognizerIntent.EXTRA_PROMPT, "Diz o que tens de fazer");
        i.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1);
        try {
            startActivityForResult(i, REQ_SPEECH);
        } catch (ActivityNotFoundException e) {
            js("window.__native && __native.onListen(null,'unsupported')");
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != REQ_SPEECH) return;
        String text = null;
        if (resultCode == RESULT_OK && data != null) {
            ArrayList<String> r = data.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS);
            if (r != null && !r.isEmpty()) text = r.get(0);
        }
        js("window.__native && __native.onListen(" + (text == null ? "null" : JSONObject.quote(text)) + ",null)");
    }

    void keepScreenOn(boolean on) {
        runOnUiThread(() -> {
            if (on) getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            else getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        });
    }
}
