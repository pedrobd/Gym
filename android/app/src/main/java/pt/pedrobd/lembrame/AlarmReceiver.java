package pt.pedrobd.lembrame;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

import androidx.core.content.ContextCompat;

public class AlarmReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        boolean test = intent.getBooleanExtra("test", false);
        Store.log(context, test ? "Alarme de teste tocou" : "Alarme tocou");
        try {
            ContextCompat.startForegroundService(context,
                    new Intent(context, ReminderService.class).putExtra("test", test));
        } catch (Exception e) {
            // Plano B: o Android não deixou arrancar o serviço de voz. Pelo menos mostra as notificações com som.
            Store.log(context, "Erro ao arrancar a voz: " + e.getClass().getSimpleName() + " " + e.getMessage());
            ReminderService.fallback(context, test);
        }
    }
}
