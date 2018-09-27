package chat.moveleiros.com;

import org.apache.cordova.*;
import org.json.JSONArray;
import org.json.JSONException;
import android.util.Log;
import android.app.Activity;
import android.os.Bundle;

public class PushServicePluginActivity extends Activity {

  private final String CHAT_LOG = "ChatLogService";

  @Override
  public void onCreate(Bundle savedInstanceState) {
      super.onCreate(savedInstanceState);
      Log.d(CHAT_LOG, "==> PushServicePluginActivity onCreate");
  }
}