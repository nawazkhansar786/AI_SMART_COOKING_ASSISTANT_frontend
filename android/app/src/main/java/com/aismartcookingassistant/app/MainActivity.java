
package com.aismartcookingassistant.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;
import com.aismartcookingassistant.app.plugins.OnnxDetectorPlugin;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {

        registerPlugin(OnnxDetectorPlugin.class);

        super.onCreate(savedInstanceState);
    }
}
