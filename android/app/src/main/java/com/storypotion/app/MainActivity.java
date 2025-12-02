package com.storypotion.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

// 커스텀 빌링 플러그인
import com.storypotion.app.BillingPlugin;
// 커스텀 권한 플러그인
import com.storypotion.app.PermissionsPlugin;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // ✅ 커스텀 플러그인 등록 (여기가 핵심!)
        registerPlugin(BillingPlugin.class);
        registerPlugin(PermissionsPlugin.class);

        // 반드시 마지막에 super 호출
        super.onCreate(savedInstanceState);
    }
}
