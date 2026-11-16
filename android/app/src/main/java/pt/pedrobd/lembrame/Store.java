package pt.pedrobd.lembrame;

import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/** Guarda no telemóvel os próximos avisos (vindos da interface), as definições e as ações feitas nas notificações. */
final class Store {
    private Store() {}

    private static SharedPreferences prefs(Context c) {
        return c.getApplicationContext().getSharedPreferences("lembra-me", Context.MODE_PRIVATE);
    }

    static synchronized JSONArray events(Context c) {
        try { return new JSONArray(prefs(c).getString("events", "[]")); }
        catch (JSONException e) { return new JSONArray(); }
    }

    static synchronized void setEvents(Context c, JSONArray events) {
        prefs(c).edit().putString("events", events.toString()).commit();
    }

    static synchronized JSONObject settings(Context c) {
        try { return new JSONObject(prefs(c).getString("settings", "{}")); }
        catch (JSONException e) { return new JSONObject(); }
    }

    static synchronized void setSettings(Context c, JSONObject s) {
        prefs(c).edit().putString("settings", s.toString()).commit();
    }

    static synchronized void addAction(Context c, JSONObject action) {
        JSONArray a;
        try { a = new JSONArray(prefs(c).getString("actions", "[]")); }
        catch (JSONException e) { a = new JSONArray(); }
        a.put(action);
        prefs(c).edit().putString("actions", a.toString()).commit();
    }

    /** Registo de diagnóstico: as últimas 40 linhas, para perceber onde um aviso falhou. */
    static synchronized void log(Context c, String msg) {
        JSONArray a;
        try { a = new JSONArray(prefs(c).getString("log", "[]")); }
        catch (JSONException e) { a = new JSONArray(); }
        a.put(Msg.hm(System.currentTimeMillis()) + "  " + msg);
        JSONArray keep = new JSONArray();
        for (int i = Math.max(0, a.length() - 40); i < a.length(); i++) keep.put(a.optString(i));
        prefs(c).edit().putString("log", keep.toString()).commit();
    }

    static synchronized JSONArray logLines(Context c) {
        try { return new JSONArray(prefs(c).getString("log", "[]")); }
        catch (JSONException e) { return new JSONArray(); }
    }

    static synchronized String takeActions(Context c) {
        String s = prefs(c).getString("actions", "[]");
        prefs(c).edit().putString("actions", "[]").commit();
        return s;
    }
}
