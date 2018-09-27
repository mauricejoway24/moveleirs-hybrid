package com.gae.scaffolder.plugin;

import android.content.Context;
import android.content.SharedPreferences;
import android.support.annotation.Nullable;
import android.util.Log;

import com.android.volley.AuthFailureError;
import com.android.volley.DefaultRetryPolicy;
import com.android.volley.RequestQueue;
import com.android.volley.Response;
import com.android.volley.VolleyError;
import com.android.volley.VolleyLog;
import com.android.volley.toolbox.StringRequest;
import com.android.volley.toolbox.Volley;
import com.google.firebase.iid.FirebaseInstanceId;
import com.google.firebase.messaging.FirebaseMessaging;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CordovaWebView;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.UnsupportedEncodingException;
import java.util.HashMap;
import java.util.Map;

import chatmoveleiros.moveleiros.com.BuildConfig;
import de.appplant.cordova.plugin.localnotification.LocalNotification;

public class FCMPlugin extends CordovaPlugin {

  private static final String TAG = "FCMPlugin";

  public static CordovaWebView gWebView;
  public static String notificationCallBack = "FCMPlugin.onNotificationReceived";
  public static String tokenRefreshCallBack = "FCMPlugin.onTokenRefreshReceived";
  public static Boolean notificationCallBackReady = false;
  public static Map<String, Object> lastPush = null;

  public static String MOV_SHARED_CONFIGURATION_NAME = "ChatMoveleirosSharedConfiguration";
  public static String MOV_SHARED_CONFIGURATION_AUTH_TOKEN = "ChatMoveleirosSharedConfiguration.AuthToken";
  public static String MOV_SHARED_CONFIGURATION_LIVECHAT_ID = "ChatMoveleirosSharedConfiguration.LivechatId";
  public static String MOV_SHARED_CONFIGURATION_TOKEN = "ChatMoveleirosSharedConfiguration.Token";
  // public static String CHAT_API_DEBUG = "http://192.168.1.36:59471";
  public static String CHAT_API_DEBUG = "http://10.0.2.2:59471";

  public FCMPlugin() {
  }

  public void initialize(CordovaInterface cordova, CordovaWebView webView) {
    super.initialize(cordova, webView);
    gWebView = webView;
    Log.d(TAG, "==> FCMPlugin initialize");
    FirebaseMessaging.getInstance().subscribeToTopic("android");
    FirebaseMessaging.getInstance().subscribeToTopic("all");
  }

  public boolean execute(final String action, final JSONArray args, final CallbackContext callbackContext) throws JSONException {

    Log.d(TAG, "==> FCMPlugin execute: " + action);

    try {
      // READY //
      if (action.equals("ready")) {
        //
        callbackContext.success();
      }
      // GET TOKEN //
      else if (action.equals("getToken")) {
        cordova.getActivity().runOnUiThread(() -> {
          try {
            String token = FirebaseInstanceId.getInstance().getToken();
            callbackContext.success(FirebaseInstanceId.getInstance().getToken());
            Log.d(TAG, "\tToken: " + token);
          } catch (Exception e) {
            Log.d(TAG, "\tError retrieving token");
          }
        });
      } else if (action.equals("getTokenAndRegister")) {
        cordova.getActivity().runOnUiThread(() -> {
          try {
            // register a new token to its device
            String token = FirebaseInstanceId.getInstance().getToken();
            String authToken = args.getString(0);
            String livechatUserId = args.getString(1);

            SharedPreferences preferences = cordova.getContext()
              .getSharedPreferences(MOV_SHARED_CONFIGURATION_NAME, Context.MODE_PRIVATE);

            SharedPreferences.Editor prefEdit = preferences.edit();
            prefEdit.putString(MOV_SHARED_CONFIGURATION_AUTH_TOKEN, authToken);
            prefEdit.putString(MOV_SHARED_CONFIGURATION_LIVECHAT_ID, livechatUserId);
            prefEdit.putString(MOV_SHARED_CONFIGURATION_TOKEN, token);
            prefEdit.apply();

            sendTokenAndRegister(token, authToken, livechatUserId, callbackContext);

            Log.d(TAG, "\tToken: " + token);
          } catch (Exception e) {
            Log.d(TAG, "\tError getTokenAndRegister " + e.getMessage());
          }
        });
      } else if (action.equals("unregisterToken")) {
        cordova.getActivity().runOnUiThread(() -> {
          try {
            unregisterToken(callbackContext);

            Log.d(TAG, "\tunregisterToken executed");
          } catch (Exception e) {
            Log.d(TAG, "\tError unregisterToken " + e.getMessage());
          }
        });
      }
      // NOTIFICATION CALLBACK REGISTER //
      else if (action.equals("registerNotification")) {
        notificationCallBackReady = true;
        cordova.getActivity().runOnUiThread(() -> {
//          if (lastPush != null) FCMPlugin.sendPushPayload(null, lastPush);
//          lastPush = null;
          callbackContext.success();
        });
      }
      // UN/SUBSCRIBE TOPICS //
      else if (action.equals("subscribeToTopic")) {
        cordova.getThreadPool().execute(() -> {
          try {
            FirebaseMessaging.getInstance().subscribeToTopic(args.getString(0));
            callbackContext.success();
          } catch (Exception e) {
            callbackContext.error(e.getMessage());
          }
        });
      } else if (action.equals("unsubscribeFromTopic")) {
        cordova.getThreadPool().execute(() -> {
          try {
            FirebaseMessaging.getInstance().unsubscribeFromTopic(args.getString(0));
            callbackContext.success();
          } catch (Exception e) {
            callbackContext.error(e.getMessage());
          }
        });
      } else {
        callbackContext.error("Method not found");
        return false;
      }
    } catch (Exception e) {
      Log.d(TAG, "ERROR: onPluginAction: " + e.getMessage());
      callbackContext.error(e.getMessage());
      return false;
    }

    //cordova.getThreadPool().execute(new Runnable() {
    //	public void run() {
    //	  //
    //	}
    //});

    //cordova.getActivity().runOnUiThread(new Runnable() {
    //    public void run() {
    //      //
    //    }
    //});
    return true;
  }

  public static void setUserData(String token, @Nullable String authToken, @Nullable String livechatUserId) {
    SharedPreferences preferences = gWebView.getContext()
      .getSharedPreferences(MOV_SHARED_CONFIGURATION_NAME, Context.MODE_PRIVATE);

    SharedPreferences.Editor prefEdit = preferences.edit();
    if (!authToken.isEmpty())
      prefEdit.putString(MOV_SHARED_CONFIGURATION_AUTH_TOKEN, authToken);
    if (!livechatUserId.isEmpty())
      prefEdit.putString(MOV_SHARED_CONFIGURATION_LIVECHAT_ID, livechatUserId);
    prefEdit.putString(MOV_SHARED_CONFIGURATION_TOKEN, token);
    prefEdit.apply();
  }

  public static void unregisterToken(final CallbackContext callbackContext) {
    SharedPreferences preferences = gWebView.getContext()
      .getSharedPreferences(MOV_SHARED_CONFIGURATION_NAME, Context.MODE_PRIVATE);

    String authToken = preferences.getString(MOV_SHARED_CONFIGURATION_AUTH_TOKEN, "");
    String livechatUserId = preferences.getString(MOV_SHARED_CONFIGURATION_LIVECHAT_ID, "");
    String token = preferences.getString(MOV_SHARED_CONFIGURATION_TOKEN, "");

    if (authToken.equalsIgnoreCase("") || livechatUserId.equalsIgnoreCase("")) {
      if (callbackContext != null)
        callbackContext.error("No authtoken or livechatId registered in SharedConfiguration");
      return;
    }

    try {
      JSONObject jsonBody = new JSONObject();
      jsonBody.put("Device", "android");
      jsonBody.put("Token", token);
      jsonBody.put("AuthToken", authToken);
      jsonBody.put("LivechatUserId", livechatUserId);
      String requestBody = jsonBody.toString();

      String url = "https://chatapi.moveleiros.com.br";

      if (BuildConfig.DEBUG) {
        url = CHAT_API_DEBUG;
      }

      url = url + "/token/unregistertoken";

      RequestQueue mRequestQueue = Volley.newRequestQueue(gWebView.getContext());
      StringRequest stringRequest = new StringRequest(1, url, response -> {
        Log.d(TAG, "unregistertoken completed" + response);
        if (callbackContext != null)
          callbackContext.success();
      }, error -> {
        Log.d(TAG, "unregistertoken error" + error.getMessage());
        if (error instanceof AuthFailureError) {
          if (callbackContext != null)
            callbackContext.error("401");
        } else {
          if (callbackContext != null)
            callbackContext.error(error.getMessage());
        }
      }) {
        @Override
        public String getBodyContentType() {
          return String.format("application/json; charset=utf-8");
        }

        @Override
        public Map<String, String> getHeaders() throws AuthFailureError {
          Map<String, String> params = new HashMap<>();
          params.put("Authorization", "Bearer " + authToken);
          return params;
        }

        @Override
        public byte[] getBody() throws AuthFailureError {
          try {
            return requestBody == null ? null : requestBody.getBytes("utf-8");
          } catch (UnsupportedEncodingException uee) {
            VolleyLog.wtf("Unsupported Encoding while trying to get the bytes of %s using %s",
              requestBody, "utf-8");
            return null;
          }
        }
      };

      stringRequest.setRetryPolicy(new DefaultRetryPolicy(120000,
        2,
        DefaultRetryPolicy.DEFAULT_BACKOFF_MULT));

      mRequestQueue.add(stringRequest);
    } catch (JSONException e) {
      if (callbackContext != null)
        callbackContext.error(e.getMessage());
      e.printStackTrace();
    }
  }

  public static void sendTokenAndRegister(String token, String authToken, String livechatUserId, final CallbackContext callbackContext) {

    if (token == null || token.isEmpty() ||
      authToken == null || authToken.isEmpty() ||
      livechatUserId == null || livechatUserId.isEmpty()) {
      return;
    }

    try {
      JSONObject jsonBody = new JSONObject();
      jsonBody.put("Device", "android");
      jsonBody.put("Token", token);
      jsonBody.put("Version", "1.0.1");
      jsonBody.put("AuthToken", authToken);
      jsonBody.put("LivechatUserId", livechatUserId);
      String requestBody = jsonBody.toString();

      String url = "https://chatapi.moveleiros.com.br";

      if (BuildConfig.DEBUG) {
        url = CHAT_API_DEBUG;
      }

      url = url + "/token/registertoken";

      RequestQueue mRequestQueue = Volley.newRequestQueue(gWebView.getContext());
      StringRequest stringRequest = new StringRequest(1, url, response -> {
        Log.d(TAG, "registertoken completed" + response);
        if (callbackContext != null)
          callbackContext.success(token);
      }, error -> {
        Log.d(TAG, "registertoken error" + error.getMessage());

        if (error instanceof AuthFailureError) {
          if (callbackContext != null)
            callbackContext.error("401");
        } else {
          if (callbackContext != null)
            callbackContext.error(error.getMessage());
        }
      }) {
        @Override
        public String getBodyContentType() {
          return String.format("application/json; charset=utf-8");
        }

        @Override
        public Map<String, String> getHeaders() throws AuthFailureError {
          Map<String, String> params = new HashMap<>();
          params.put("Authorization", "Bearer " + authToken);
          return params;
        }

        @Override
        public byte[] getBody() throws AuthFailureError {
          try {
            return requestBody == null ? null : requestBody.getBytes("utf-8");
          } catch (UnsupportedEncodingException uee) {
            VolleyLog.wtf("Unsupported Encoding while trying to get the bytes of %s using %s",
              requestBody, "utf-8");
            return null;
          }
        }
      };

      stringRequest.setRetryPolicy(new DefaultRetryPolicy(120000,
        2,
        DefaultRetryPolicy.DEFAULT_BACKOFF_MULT));

      mRequestQueue.add(stringRequest);
    } catch (JSONException e) {
      if (callbackContext != null)
        callbackContext.error(e.getMessage());
      e.printStackTrace();
    }
  }

  public static void sendPushPayload(Context context, Map<String, Object> payload) {
    Log.d(TAG, "==> FCMPlugin sendPushPayload");
    Log.d(TAG, "\tnotificationCallBackReady: " + notificationCallBackReady);
    Log.d(TAG, "\tgWebView: " + gWebView);
    try {
      JSONObject jo = new JSONObject();
      for (String key : payload.keySet()) {
        jo.put(key, payload.get(key));
        Log.d(TAG, "\tpayload: " + key + " => " + payload.get(key));
      }
      String callBack = "javascript:" + notificationCallBack + "(" + jo.toString() + ")";
      if (notificationCallBackReady && gWebView != null) {
        Log.d(TAG, "\tSent PUSH to view: " + callBack);
        gWebView.sendJavascript(callBack);
        return;
      }

      Log.d(TAG, "\tView not ready. SAVED NOTIFICATION: " + callBack);
      //lastPush = payload;

      if (!payload.containsKey("chat_mobile"))
        return;

      // Moveleiros Hacking ;)
      LocalNotification lNotification = new LocalNotification();
      JSONArray ja = new JSONArray();
      String msg = (String) payload.get("chat_mobile");
      ja.put(new JSONObject(msg));

      lNotification.schedule(context, ja);

    } catch (Exception e) {
      Log.d(TAG, "\tERROR sendPushToView. SAVED NOTIFICATION: " + e.getMessage());
      //lastPush = payload;
    }
  }

  public static void sendTokenRefresh(String token) {
    Log.d(TAG, "==> FCMPlugin sendRefreshToken");
    try {
      String callBack = "javascript:" + tokenRefreshCallBack + "('" + token + "')";
      gWebView.sendJavascript(callBack);
    } catch (Exception e) {
      Log.d(TAG, "\tERROR sendRefreshToken: " + e.getMessage());
    }
  }

  @Override
  public void onDestroy() {
    gWebView = null;
    notificationCallBackReady = false;
  }
}
