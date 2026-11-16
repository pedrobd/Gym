package pt.pedrobd.lembrame;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/** Botões da notificação: "Feito" e "+10 min"/"+30 min". Funcionam com a app fechada. */
public class ActionReceiver extends BroadcastReceiver {
    static final String DONE = "pt.pedrobd.lembrame.DONE";
    static final String SNOOZE = "pt.pedrobd.lembrame.SNOOZE";

    @Override
    public void onReceive(Context c, Intent intent) {
        JSONObject e;
        try { e = new JSONObject(intent.getStringExtra("event")); }
        catch (JSONException | NullPointerException ex) { return; }
        String rid = e.optString("rid");
        long now = System.currentTimeMillis();
        c.stopService(new Intent(c, ReminderService.class));
        Notif.cancel(c, rid);

        JSONArray all = Store.events(c), keep = new JSONArray();
        try {
            if (DONE.equals(intent.getAction())) {
                for (int i = 0; i < all.length(); i++) {
                    JSONObject o = all.optJSONObject(i);
                    if (o != null && !rid.equals(o.optString("rid"))) keep.put(o);
                }
                Store.addAction(c, new JSONObject().put("type", "done").put("rid", rid).put("at", now));
            } else if (SNOOZE.equals(intent.getAction())) {
                long until = now + intent.getIntExtra("minutes", 10) * 60000L;
                for (int i = 0; i < all.length(); i++) {
                    JSONObject o = all.optJSONObject(i);
                    if (o == null) continue;
                    boolean sameRegular = rid.equals(o.optString("rid")) && o.optLong("at") < until
                            && ("regular".equals(o.optString("kind")) || "snooze".equals(o.optString("kind")));
                    if (!sameRegular) keep.put(o);
                }
                JSONObject sn = new JSONObject(e.toString()).put("at", until).put("kind", "snooze");
                keep.put(sn);
                Store.addAction(c, new JSONObject().put("type", "snooze").put("rid", rid).put("until", until));
            }
        } catch (JSONException ignored) {}
        Store.setEvents(c, keep);
        Scheduler.scheduleNext(c);
        MainActivity.dispatch("onActions");
    }
}
