package com.gae.scaffolder.plugin;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;

import com.google.firebase.iid.FirebaseInstanceId;
import com.google.firebase.iid.FirebaseInstanceIdService;

public class MyFirebaseInstanceIDService extends FirebaseInstanceIdService {

  private static final String TAG = "FCMPlugin";

  @Override
  public void onTokenRefresh() {
    // Get updated InstanceID token.

    String refreshedToken = FirebaseInstanceId.getInstance().getToken();
    Log.d(TAG, "Refreshed token: " + refreshedToken);
    FCMPlugin.sendTokenRefresh(refreshedToken);

    // Persist and send token info to server
    SharedPreferences preferences = FCMPlugin.gWebView.getContext()
      .getSharedPreferences(FCMPlugin.MOV_SHARED_CONFIGURATION_NAME, Context.MODE_PRIVATE);

    String authToken = preferences.getString(FCMPlugin.MOV_SHARED_CONFIGURATION_AUTH_TOKEN, "");
    String livechatUserId = preferences.getString(FCMPlugin.MOV_SHARED_CONFIGURATION_LIVECHAT_ID, "");

    // Remove from server
    FCMPlugin.unregisterToken(null);

    // Update just token
    FCMPlugin.setUserData(refreshedToken, "", "");

    // Send to server
    FCMPlugin.sendTokenAndRegister(refreshedToken,
      authToken,
      livechatUserId,
      null);
  }
}
