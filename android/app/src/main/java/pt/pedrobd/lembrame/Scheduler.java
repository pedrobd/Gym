package pt.pedrobd.lembrame;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;

import org.json.JSONArray;

/** Marca no sistema um único alarme: o do próximo aviso. Quando toca, o serviço fala e marca o seguinte. */
final class Scheduler {
    private Scheduler() {}

    static void scheduleNext(Context c) {
        JSONArray ev = Store.events(c);
        long next = Long.MAX_VALUE;
        for (int i = 0; i < ev.length(); i++) {
            long at = ev.optJSONObject(i).optLong("at");
            if (at > 0 && at < next) next = at;
        }
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        PendingIntent pi = PendingIntent.getBroadcast(c, 1, new Intent(c, AlarmReceiver.class),
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        if (next == Long.MAX_VALUE) { am.cancel(pi); logOnce(c, "Sem avisos por marcar"); return; }
        long when = Math.max(next, System.currentTimeMillis() + 1000);
        // setAlarmClock é o tipo de alarme mais fiável: acorda o telemóvel mesmo em modo de poupança (Doze).
        PendingIntent show = PendingIntent.getActivity(c, 2, new Intent(c, MainActivity.class),
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        try {
            am.setAlarmClock(new AlarmManager.AlarmClockInfo(when, show), pi);
            logOnce(c, "Alarme marcado para " + Msg.hm(when) + " (" + ev.length() + " avisos na lista)");
        } catch (SecurityException e) {
            am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, when, pi);
            logOnce(c, "Sem permissão de alarmes exatos: marcado aproximado para " + Msg.hm(when));
        }
    }

    private static String lastLogged = "";

    private static void logOnce(Context c, String msg) {
        if (msg.equals(lastLogged)) return;
        lastLogged = msg;
        Store.log(c, msg);
    }

    /** Teste: alarme separado daqui a 10 segundos, que não mexe na lista de lembretes. */
    static void scheduleTest(Context c) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        PendingIntent pi = PendingIntent.getBroadcast(c, 9, new Intent(c, AlarmReceiver.class).putExtra("test", true),
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        PendingIntent show = PendingIntent.getActivity(c, 2, new Intent(c, MainActivity.class),
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        long when = System.currentTimeMillis() + 10000;
        try {
            am.setAlarmClock(new AlarmManager.AlarmClockInfo(when, show), pi);
            Store.log(c, "Teste marcado para daqui a 10 s");
        } catch (SecurityException e) {
            am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, when, pi);
            Store.log(c, "Teste: sem permissão de alarmes exatos");
        }
    }
}
