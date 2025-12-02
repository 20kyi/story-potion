package com.storypotion.app;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Build;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "Permissions")
public class PermissionsPlugin extends Plugin {

    private static final int PERMISSION_REQUEST_CODE = 1001;

    /**
     * 사진 액세스 권한 확인
     */
    @PluginMethod
    public void checkPhotoPermission(PluginCall call) {
        boolean granted = false;
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            // Android 13+ (API 33+)
            granted = ContextCompat.checkSelfPermission(
                getActivity(),
                Manifest.permission.READ_MEDIA_IMAGES
            ) == PackageManager.PERMISSION_GRANTED;
        } else {
            // Android 12 이하
            granted = ContextCompat.checkSelfPermission(
                getActivity(),
                Manifest.permission.READ_EXTERNAL_STORAGE
            ) == PackageManager.PERMISSION_GRANTED;
        }

        JSObject result = new JSObject();
        result.put("granted", granted);
        call.resolve(result);
    }

    /**
     * 사진 액세스 권한 요청
     */
    @PluginMethod
    public void requestPhotoPermission(PluginCall call) {
        String[] permissions;
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            // Android 13+ (API 33+)
            permissions = new String[]{Manifest.permission.READ_MEDIA_IMAGES};
        } else {
            // Android 12 이하
            permissions = new String[]{Manifest.permission.READ_EXTERNAL_STORAGE};
        }

        // 이미 권한이 있는지 확인
        boolean allGranted = true;
        for (String permission : permissions) {
            if (ContextCompat.checkSelfPermission(getActivity(), permission) 
                    != PackageManager.PERMISSION_GRANTED) {
                allGranted = false;
                break;
            }
        }

        if (allGranted) {
            JSObject result = new JSObject();
            result.put("granted", true);
            call.resolve(result);
            return;
        }

        // 권한 요청
        saveCall(call);
        ActivityCompat.requestPermissions(
            getActivity(),
            permissions,
            PERMISSION_REQUEST_CODE
        );
    }

    /**
     * 권한 요청 결과 처리
     */
    @Override
    public void handleRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.handleRequestPermissionsResult(requestCode, permissions, grantResults);
        
        if (requestCode == PERMISSION_REQUEST_CODE) {
            PluginCall savedCall = getSavedCall();
            if (savedCall == null) {
                return;
            }

            boolean granted = grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED;
            
            JSObject result = new JSObject();
            result.put("granted", granted);
            savedCall.resolve(result);
        }
    }
}

