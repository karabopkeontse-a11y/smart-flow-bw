package bw.smartflow.app;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {
  @Override public void onCreate(Bundle state) {
    super.onCreate(state);
    WebView view = new WebView(this);
    WebSettings settings = view.getSettings();
    settings.setJavaScriptEnabled(true);
    settings.setDomStorageEnabled(true);
    settings.setAllowFileAccess(true);
    settings.setAllowContentAccess(false);
    view.setWebViewClient(new WebViewClient() {
      @Override public void onPageFinished(WebView v, String url) {
        super.onPageFinished(v, url);
        v.evaluateJavascript("(function(){if(window.__sfLocalLoaded)return;window.__sfLocalLoaded=true;var s=document.createElement('script');s.src='file:///android_asset/local-core.js';document.head.appendChild(s);})();", null);
      }
    });
    view.setOverScrollMode(WebView.OVER_SCROLL_NEVER);
    view.loadUrl("file:///android_asset/index.html");
    setContentView(view);
  }
}
