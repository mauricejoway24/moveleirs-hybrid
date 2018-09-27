package chat.moveleiros.com;

import android.app.Service;
import android.content.Intent;
import android.os.IBinder;
import android.util.Log;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.WebSocket;
import okhttp3.WebSocketListener;

public class PushService extends Service {

  private OkHttpClient client;
  private final String CHAT_LOG = "ChatLogService";
  private String currentJwtToken = "";

  private final class PushWebSocketListener extends WebSocketListener {
    @Override
    public void onOpen(WebSocket webSocket, Response response) {
      webSocket.send("Teste saporra");
      webSocket.close(1000, "Bye!");
    }

    @Override
    public void onMessage(WebSocket webSocket, String text) {
      Log.d(CHAT_LOG, text);
    }

    @Override
    public void onClosing(WebSocket webSocket, int code, String reason) {
      webSocket.close(1000, "Bye!");
      Log.d(CHAT_LOG, "Fechou");
    }

    @Override
    public void onFailure(WebSocket webSocket, Throwable t, Response response) {
      Log.d(CHAT_LOG, t.getMessage());
    }
  }

//  @Override
//  public void onCreate() {
//    super.onCreate();
//    android.os.Debug.waitForDebugger();
//  }

  @Override
  public int onStartCommand(Intent intent, int flags, int startId) {
    // onTaskRemoved(intent);

    if (intent != null && intent.getExtras() != null) {
      currentJwtToken = intent.getExtras().getString(PushServicePlugin.JWT_TOKEN_KEY);
    }

    Log.d(CHAT_LOG, currentJwtToken);

    client = new OkHttpClient();

    start();

    return START_STICKY;
  }

  private void start() {
    Request request = new Request.Builder().url("ws://echo.websocket.org/").build();
    PushWebSocketListener pushWebSocketListener = new PushWebSocketListener();
    WebSocket webSocket = client.newWebSocket(request, pushWebSocketListener);

    client.dispatcher().executorService().shutdown();
  }

  @Override
  public IBinder onBind(Intent intent) {
    return null;
  }

  @Override
  public void onTaskRemoved(Intent rootIntent) {
    Intent restartServiceIntent = new Intent(getApplicationContext(), this.getClass());
    restartServiceIntent.setPackage(getPackageName());
    startService(restartServiceIntent);

    super.onTaskRemoved(rootIntent);
  }

  public static void startPushService(Intent intent) {
    PushService pushService = new PushService();
    pushService.startService(intent);
  }
}
