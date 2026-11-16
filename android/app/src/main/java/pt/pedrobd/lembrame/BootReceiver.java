package pt.pedrobd.lembrame;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Depois de reiniciar o telemóvel (ou de atualizar a app) volta a marcar o próximo aviso. */
public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        Scheduler.scheduleNext(context);
    }
}
