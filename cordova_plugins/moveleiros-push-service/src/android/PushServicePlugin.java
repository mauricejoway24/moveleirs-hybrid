package chat.moveleiros.com;

import org.apache.cordova.*;
import org.json.JSONArray;
import org.json.JSONException;
import android.util.Log;
import android.content.Intent;

public class PushServicePlugin extends CordovaPlugin {

    private final String CHAT_LOG = "ChatLogService";
    public static final String JWT_TOKEN_KEY = "JWT_TOKEN_KEY";

    @Override
    public void initialize(CordovaInterface cordova, CordovaWebView webView) {
      super.initialize(cordova, webView);
      Log.d(CHAT_LOG, "==> PushServicePlugin initialize");

      // Start push service
    }
  
    @Override
    public boolean execute(String action, JSONArray data, CallbackContext callbackContext) throws JSONException {
        Log.d(CHAT_LOG, "Testando action: " + action);

        if (action.equals("test")) {

            String name = data.getString(0);
            String message = "Hello, " + name;
            callbackContext.success(message);

            return true;

        } else if (action.equals("initiateService")) {
            
            String jwtToken = data.getString(0);

            Log.d(CHAT_LOG, "initiateService received token: " + jwtToken);

            /// TODO persist on local storage
            Intent mIntent = new Intent();
            mIntent.putExtra(JWT_TOKEN_KEY, jwtToken);

            PushService.startPushService(mIntent);

            callbackContext.success("Push service started.");

            return true;
        } else {
            return false;
        }
    }
}