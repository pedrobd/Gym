package pt.pedrobd.lembrame;

import org.json.JSONObject;

import java.util.Calendar;

/** As mesmas frases da versão web, montadas na hora do aviso (para o "faltam X minutos" estar certo). */
final class Msg {
    private Msg() {}

    static String build(JSONObject e, JSONObject s, long now) {
        String name = s.optString("name", "").trim();
        String who = name.isEmpty() ? "" : name + ", ";
        String task = e.optString("task", "Lembrete").replaceAll("[.!]+$", "");
        long end = e.optLong("end", 0);
        boolean dl = e.optBoolean("hasDeadline", false) && end > 0;
        String kind = e.optString("kind", "regular");
        String out;
        switch (kind) {
            case "final":
                out = who + "último aviso! " + task + ". Faltam " + duration(end - now) + ", tens até às " + time(end) + ".";
                break;
            case "deadline":
                out = who + "chegou a hora limite: " + task + ". Já está feito?";
                break;
            case "once":
                out = who + "está na hora: " + task + ".";
                break;
            case "snooze":
                out = who + "voltei a lembrar: " + task + (dl && end > now ? ". Tens até às " + time(end) + "." : ".");
                break;
            default:
                out = who + "lembrete: " + task + ".";
                if (dl && end > now) out += " Tens até às " + time(end) + ", faltam " + duration(end - now) + ".";
        }
        return out.isEmpty() ? out : Character.toUpperCase(out.charAt(0)) + out.substring(1);
    }

    static String title(String kind) {
        switch (kind) {
            case "final": return "Último aviso";
            case "deadline": return "Hora limite";
            case "once": return "Está na hora";
            case "snooze": return "Outra vez";
            default: return "Lembrete";
        }
    }

    static String time(long t) {
        Calendar c = Calendar.getInstance();
        c.setTimeInMillis(t);
        int h = c.get(Calendar.HOUR_OF_DAY), m = c.get(Calendar.MINUTE);
        if (h == 12 && m == 0) return "meio-dia";
        if (h == 23 && m == 59) return "meia-noite";
        if (m == 0) return h + (h == 1 ? " hora" : " horas");
        if (m == 30) return h + " e meia";
        return h + " e " + m;
    }

    static String hm(long t) {
        Calendar c = Calendar.getInstance();
        c.setTimeInMillis(t);
        return String.format(java.util.Locale.ROOT, "%02d:%02d", c.get(Calendar.HOUR_OF_DAY), c.get(Calendar.MINUTE));
    }

    static String duration(long ms) {
        long total = Math.max(1, Math.round(ms / 60000.0));
        long h = total / 60, m = total % 60;
        String hs = h == 0 ? "" : h + (h == 1 ? " hora" : " horas");
        String mins = m == 0 ? "" : m + (m == 1 ? " minuto" : " minutos");
        if (!hs.isEmpty() && !mins.isEmpty()) return hs + " e " + mins;
        return hs + mins;
    }
}
