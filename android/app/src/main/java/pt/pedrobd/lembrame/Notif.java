package pt.pedrobd.lembrame;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import org.json.JSONObject;

final class Notif {
    private Notif() {}

    static final String CH_REMIND = "lembretes";
    static final String CH_SERVICE = "a-falar";
    static final int FG_ID = 1;

    static void channels(Context c) {
        NotificationManager nm = c.getSystemService(NotificationManager.class);
        NotificationChannel remind = new NotificationChannel(CH_REMIND, "Lembretes", NotificationManager.IMPORTANCE_HIGH);
        remind.setDescription("O aviso com os botões Feito e Adiar");
        remind.setSound(null, null); // o som é a voz
        remind.enableVibration(true);
        remind.setVibrationPattern(new long[]{0, 300, 200, 300});
        nm.createNotificationChannel(remind);
        NotificationChannel svc = new NotificationChannel(CH_SERVICE, "A falar", NotificationManager.IMPORTANCE_LOW);
        svc.setDescription("Aparece enquanto a voz está a falar");
        svc.setSound(null, null);
        nm.createNotificationChannel(svc);
    }

    static int idFor(String rid) { return 1000 + (rid.hashCode() & 0xffff); }

    static PendingIntent openApp(Context c) {
        Intent i = new Intent(c, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        return PendingIntent.getActivity(c, 3, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    static android.app.Notification speaking(Context c) {
        return new NotificationCompat.Builder(c, CH_SERVICE)
                .setSmallIcon(R.drawable.ic_stat)
                .setContentTitle("Lembra-me")
                .setContentText("A falar um lembrete…")
                .setContentIntent(openApp(c))
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .build();
    }

    static void reminder(Context c, JSONObject e) {
        String rid = e.optString("rid");
        String kind = e.optString("kind", "regular");
        long end = e.optLong("end", 0);
        boolean dl = e.optBoolean("hasDeadline", false) && end > 0;
        String text = e.optString("task") + (dl && end > System.currentTimeMillis() ? " · até às " + Msg.hm(end) : "");
        NotificationCompat.Builder b = new NotificationCompat.Builder(c, CH_REMIND)
                .setSmallIcon(R.drawable.ic_stat)
                .setColor(0xFFE2552B)
                .setContentTitle(Msg.title(kind))
                .setContentText(text)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(text))
                .setCategory(NotificationCompat.CATEGORY_REMINDER)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setContentIntent(openApp(c))
                .setAutoCancel(true)
                .addAction(0, "Feito ✓", action(c, ActionReceiver.DONE, e, 10))
                .addAction(0, "+10 min", action(c, ActionReceiver.SNOOZE, e, 10))
                .addAction(0, "+30 min", action(c, ActionReceiver.SNOOZE, e, 30));
        try { NotificationManagerCompat.from(c).notify(idFor(rid), b.build()); }
        catch (SecurityException ignored) {}
    }

    private static PendingIntent action(Context c, String act, JSONObject e, int minutes) {
        Intent i = new Intent(c, ActionReceiver.class).setAction(act)
                .putExtra("event", e.toString())
                .putExtra("minutes", minutes);
        int code = (e.optString("rid") + act + minutes).hashCode();
        return PendingIntent.getBroadcast(c, code, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    static void cancel(Context c, String rid) {
        NotificationManagerCompat.from(c).cancel(idFor(rid));
    }
}
