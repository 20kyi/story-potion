package com.storypotion.app;

import android.app.Activity;
import android.content.Context;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.ConsumeParams;
import com.android.billingclient.api.ConsumeResponseListener;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.ProductDetailsResponseListener;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.PurchasesResponseListener;
import com.android.billingclient.api.PurchasesUpdatedListener;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryPurchasesParams;
import com.android.billingclient.api.AcknowledgePurchaseParams;
import com.android.billingclient.api.AcknowledgePurchaseResponseListener;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@CapacitorPlugin(name = "Billing")
public class BillingPlugin extends Plugin implements PurchasesUpdatedListener {

    private BillingClient billingClient;
    private boolean isServiceConnected = false;

    @PluginMethod
    public void initialize(PluginCall call) {
        android.util.Log.d("BillingPlugin", "[인앱결제] initialize 시작");
        
        Activity activity = getActivity();
        if (activity == null) {
            android.util.Log.e("BillingPlugin", "[인앱결제] Activity가 null");
            call.reject("Activity is null");
            return;
        }

        billingClient = BillingClient.newBuilder(activity)
                .setListener(this)
                .enablePendingPurchases()
                .build();

        android.util.Log.d("BillingPlugin", "[인앱결제] BillingClient 생성 완료, 연결 시작");
        billingClient.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(BillingResult billingResult) {
                android.util.Log.d("BillingPlugin", "[인앱결제] onBillingSetupFinished - responseCode: " + billingResult.getResponseCode());
                
                if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    isServiceConnected = true;
                    android.util.Log.d("BillingPlugin", "[인앱결제] 초기화 성공");
                    JSObject result = new JSObject();
                    result.put("success", true);
                    call.resolve(result);
                } else {
                    isServiceConnected = false;
                    android.util.Log.e("BillingPlugin", "[인앱결제] 초기화 실패: " + billingResult.getDebugMessage());
                    call.reject("Billing setup failed: " + billingResult.getDebugMessage());
                }
            }

            @Override
            public void onBillingServiceDisconnected() {
                android.util.Log.w("BillingPlugin", "[인앱결제] Billing service 연결 끊김");
                isServiceConnected = false;
            }
        });
    }

    @PluginMethod
    public void queryProductDetails(PluginCall call) {
        if (!isServiceConnected) {
            call.reject("Billing service not connected. Call initialize first.");
            return;
        }

        JSONArray productIdsArray = call.getArray("productIds");
        String productType = call.getString("productType", "inapp");

        if (productIdsArray == null || productIdsArray.length() == 0) {
            call.reject("productIds array is required");
            return;
        }

        List<String> productIds = new ArrayList<>();
        try {
            for (int i = 0; i < productIdsArray.length(); i++) {
                productIds.add(productIdsArray.getString(i));
            }
        } catch (JSONException e) {
            call.reject("Invalid productIds array: " + e.getMessage());
            return;
        }

        List<QueryProductDetailsParams.Product> productList = new ArrayList<>();
        for (String productId : productIds) {
            productList.add(QueryProductDetailsParams.Product.newBuilder()
                    .setProductId(productId)
                    .setProductType(productType.equals("subs") ? 
                        BillingClient.ProductType.SUBS : BillingClient.ProductType.INAPP)
                    .build());
        }

        QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder()
                .setProductList(productList)
                .build();

        billingClient.queryProductDetailsAsync(params, new ProductDetailsResponseListener() {
            @Override
            public void onProductDetailsResponse(BillingResult billingResult, List<ProductDetails> productDetailsList) {
                if (billingResult.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                    call.reject("Failed to query product details: " + billingResult.getDebugMessage());
                    return;
                }

                JSONArray products = new JSONArray();
                for (ProductDetails productDetails : productDetailsList) {
                    try {
                        JSONObject product = new JSONObject();
                        product.put("productId", productDetails.getProductId());
                        product.put("title", productDetails.getTitle());
                        product.put("description", productDetails.getDescription());
                        
                        if (productType.equals("subs")) {
                            // 구독 상품의 경우 첫 번째 가격 정보 사용
                            if (!productDetails.getSubscriptionOfferDetails().isEmpty()) {
                                ProductDetails.SubscriptionOfferDetails offer = 
                                    productDetails.getSubscriptionOfferDetails().get(0);
                                if (!offer.getPricingPhases().getPricingPhaseList().isEmpty()) {
                                    ProductDetails.PricingPhase phase = 
                                        offer.getPricingPhases().getPricingPhaseList().get(0);
                                    product.put("price", phase.getPriceAmountMicros() / 1000000.0);
                                    product.put("priceCurrencyCode", phase.getPriceCurrencyCode());
                                    product.put("priceFormatted", phase.getFormattedPrice());
                                }
                            }
                        } else {
                            // 일회성 상품의 경우
                            ProductDetails.OneTimePurchaseOfferDetails oneTimeDetails = 
                                productDetails.getOneTimePurchaseOfferDetails();
                            if (oneTimeDetails != null) {
                                product.put("price", oneTimeDetails.getPriceAmountMicros() / 1000000.0);
                                product.put("priceCurrencyCode", oneTimeDetails.getPriceCurrencyCode());
                                product.put("priceFormatted", oneTimeDetails.getFormattedPrice());
                            }
                        }
                        
                        products.put(product);
                    } catch (JSONException e) {
                        // Skip this product if JSON creation fails
                    }
                }

                JSObject result = new JSObject();
                result.put("products", products);
                call.resolve(result);
            }
        });
    }

    @PluginMethod
    public void purchaseProduct(PluginCall call) {
        android.util.Log.d("BillingPlugin", "[인앱결제] purchaseProduct 시작");
        
        if (!isServiceConnected) {
            android.util.Log.e("BillingPlugin", "[인앱결제] Billing service가 연결되지 않음");
            call.reject("Billing service not connected. Call initialize first.");
            return;
        }

        String productId = call.getString("productId");
        String productType = call.getString("productType", "inapp");

        android.util.Log.d("BillingPlugin", "[인앱결제] 파라미터 - productId: " + productId + ", productType: " + productType);

        if (productId == null || productId.isEmpty()) {
            android.util.Log.e("BillingPlugin", "[인앱결제] productId가 없음");
            call.reject("productId is required");
            return;
        }

        // Store the call for later use in onPurchasesUpdated
        saveCall(call);
        android.util.Log.d("BillingPlugin", "[인앱결제] PluginCall 저장 완료");

        QueryProductDetailsParams.Product product = QueryProductDetailsParams.Product.newBuilder()
                .setProductId(productId)
                .setProductType(productType.equals("subs") ? 
                    BillingClient.ProductType.SUBS : BillingClient.ProductType.INAPP)
                .build();

        List<QueryProductDetailsParams.Product> productList = new ArrayList<>();
        productList.add(product);

        QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder()
                .setProductList(productList)
                .build();

        android.util.Log.d("BillingPlugin", "[인앱결제] queryProductDetailsAsync 호출");
        billingClient.queryProductDetailsAsync(params, new ProductDetailsResponseListener() {
            @Override
            public void onProductDetailsResponse(BillingResult billingResult, List<ProductDetails> productDetailsList) {
                android.util.Log.d("BillingPlugin", "[인앱결제] queryProductDetailsAsync 응답 - responseCode: " + billingResult.getResponseCode() + 
                    ", productDetailsList size: " + (productDetailsList != null ? productDetailsList.size() : 0));
                
                if (billingResult.getResponseCode() != BillingClient.BillingResponseCode.OK || 
                    productDetailsList == null || productDetailsList.isEmpty()) {
                    String errorMsg = "Failed to get product details: " + billingResult.getDebugMessage() + 
                        " (ResponseCode: " + billingResult.getResponseCode() + ")";
                    android.util.Log.e("BillingPlugin", "[인앱결제] 상품 정보 조회 실패: " + errorMsg);
                    
                    // 일반적인 에러 코드에 대한 설명 추가
                    String userFriendlyMsg = errorMsg;
                    if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.ITEM_UNAVAILABLE) {
                        userFriendlyMsg = "상품을 찾을 수 없습니다. Google Play Console에서 상품 ID '" + productId + "'가 등록되어 있는지 확인해주세요.";
                    } else if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.SERVICE_UNAVAILABLE) {
                        userFriendlyMsg = "Google Play 서비스를 사용할 수 없습니다. 네트워크 연결을 확인해주세요.";
                    } else if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.BILLING_UNAVAILABLE) {
                        userFriendlyMsg = "인앱 결제를 사용할 수 없습니다. Google Play 서비스가 설치되어 있는지 확인해주세요.";
                    }
                    
                    call.reject(userFriendlyMsg);
                    return;
                }

                ProductDetails productDetails = productDetailsList.get(0);
                android.util.Log.d("BillingPlugin", "[인앱결제] 상품 정보 조회 성공 - productId: " + productDetails.getProductId());
                
                Activity activity = getActivity();
                if (activity == null) {
                    android.util.Log.e("BillingPlugin", "[인앱결제] Activity가 null");
                    call.reject("Activity is null");
                    return;
                }

                BillingFlowParams.ProductDetailsParams.Builder productDetailsParamsBuilder = 
                    BillingFlowParams.ProductDetailsParams.newBuilder()
                        .setProductDetails(productDetails);

                // 구독 상품의 경우 오퍼 토큰 설정 필요
                if (productType.equals("subs")) {
                    List<ProductDetails.SubscriptionOfferDetails> offers = 
                        productDetails.getSubscriptionOfferDetails();
                    if (offers != null && !offers.isEmpty()) {
                        String offerToken = offers.get(0).getOfferToken();
                        android.util.Log.d("BillingPlugin", "[인앱결제] 구독 오퍼 토큰 설정: " + offerToken);
                        productDetailsParamsBuilder.setOfferToken(offerToken);
                    } else {
                        android.util.Log.w("BillingPlugin", "[인앱결제] 구독 오퍼를 찾을 수 없음");
                    }
                }

                BillingFlowParams.Builder flowParamsBuilder = BillingFlowParams.newBuilder()
                        .setProductDetailsParamsList(Arrays.asList(
                            productDetailsParamsBuilder.build()
                        ));

                android.util.Log.d("BillingPlugin", "[인앱결제] launchBillingFlow 호출");
                BillingResult result = billingClient.launchBillingFlow(activity, flowParamsBuilder.build());
                
                if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                    android.util.Log.e("BillingPlugin", "[인앱결제] launchBillingFlow 실패: " + result.getDebugMessage());
                    call.reject("Failed to launch billing flow: " + result.getDebugMessage());
                } else {
                    android.util.Log.d("BillingPlugin", "[인앱결제] launchBillingFlow 성공 - 결제 창 표시됨");
                }
            }
        });
    }

    @PluginMethod
    public void acknowledgePurchase(PluginCall call) {
        if (!isServiceConnected) {
            call.reject("Billing service not connected. Call initialize first.");
            return;
        }

        String purchaseToken = call.getString("purchaseToken");
        if (purchaseToken == null || purchaseToken.isEmpty()) {
            call.reject("purchaseToken is required");
            return;
        }

        AcknowledgePurchaseParams acknowledgePurchaseParams = AcknowledgePurchaseParams.newBuilder()
                .setPurchaseToken(purchaseToken)
                .build();

        billingClient.acknowledgePurchase(acknowledgePurchaseParams, new AcknowledgePurchaseResponseListener() {
            @Override
            public void onAcknowledgePurchaseResponse(BillingResult billingResult) {
                if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    JSObject result = new JSObject();
                    result.put("success", true);
                    call.resolve(result);
                } else {
                    call.reject("Failed to acknowledge purchase: " + billingResult.getDebugMessage());
                }
            }
        });
    }

    @PluginMethod
    public void queryPurchases(PluginCall call) {
        if (!isServiceConnected) {
            call.reject("Billing service not connected. Call initialize first.");
            return;
        }

        String productType = call.getString("productType", "inapp");
        String billingType = productType.equals("subs") ? 
            BillingClient.ProductType.SUBS : BillingClient.ProductType.INAPP;

        QueryPurchasesParams params = QueryPurchasesParams.newBuilder()
                .setProductType(billingType)
                .build();

        billingClient.queryPurchasesAsync(params, new PurchasesResponseListener() {
            @Override
            public void onQueryPurchasesResponse(BillingResult billingResult, List<Purchase> purchases) {
                if (billingResult.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                    call.reject("Failed to query purchases: " + billingResult.getDebugMessage());
                    return;
                }

                JSONArray purchasesArray = new JSONArray();
                for (Purchase purchase : purchases) {
                    try {
                        JSONObject purchaseObj = new JSONObject();
                        purchaseObj.put("orderId", purchase.getOrderId());
                        purchaseObj.put("packageName", purchase.getPackageName());
                        purchaseObj.put("purchaseTime", purchase.getPurchaseTime());
                        purchaseObj.put("purchaseToken", purchase.getPurchaseToken());
                        purchaseObj.put("signature", purchase.getSignature());
                        purchaseObj.put("isAcknowledged", purchase.isAcknowledged());
                        purchaseObj.put("isAutoRenewing", purchase.isAutoRenewing());
                        
                        JSONArray products = new JSONArray();
                        for (String productId : purchase.getProducts()) {
                            products.put(productId);
                        }
                        purchaseObj.put("products", products);
                        
                        purchasesArray.put(purchaseObj);
                    } catch (JSONException e) {
                        // Skip this purchase if JSON creation fails
                    }
                }

                JSObject result = new JSObject();
                result.put("purchases", purchasesArray);
                call.resolve(result);
            }
        });
    }

    @Override
    public void onPurchasesUpdated(BillingResult billingResult, List<Purchase> purchases) {
        android.util.Log.d("BillingPlugin", "[인앱결제] onPurchasesUpdated 호출 - responseCode: " + billingResult.getResponseCode() + 
            ", purchases: " + (purchases != null ? purchases.size() : 0));
        
        PluginCall savedCall = getSavedCall();
        if (savedCall == null) {
            android.util.Log.w("BillingPlugin", "[인앱결제] savedCall이 null - 이전 호출이 없음");
            return;
        }

        if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK && purchases != null) {
            android.util.Log.d("BillingPlugin", "[인앱결제] 구매 성공 처리 시작");
            for (Purchase purchase : purchases) {
                try {
                    android.util.Log.d("BillingPlugin", "[인앱결제] 구매 정보 - orderId: " + purchase.getOrderId() + 
                        ", productIds: " + purchase.getProducts());
                    
                    JSONObject purchaseObj = new JSONObject();
                    purchaseObj.put("orderId", purchase.getOrderId());
                    purchaseObj.put("packageName", purchase.getPackageName());
                    purchaseObj.put("purchaseTime", purchase.getPurchaseTime());
                    purchaseObj.put("purchaseToken", purchase.getPurchaseToken());
                    purchaseObj.put("signature", purchase.getSignature());
                    purchaseObj.put("isAcknowledged", purchase.isAcknowledged());
                    purchaseObj.put("isAutoRenewing", purchase.isAutoRenewing());
                    
                    JSONArray products = new JSONArray();
                    for (String productId : purchase.getProducts()) {
                        products.put(productId);
                    }
                    purchaseObj.put("products", products);

                    JSObject result = new JSObject();
                    result.put("purchase", purchaseObj);
                    android.util.Log.d("BillingPlugin", "[인앱결제] 구매 성공 - resolve 호출");
                    savedCall.resolve(result);
                    return;
                } catch (JSONException e) {
                    android.util.Log.e("BillingPlugin", "[인앱결제] JSON 생성 실패: " + e.getMessage(), e);
                    // Continue to next purchase
                }
            }
            android.util.Log.w("BillingPlugin", "[인앱결제] 유효한 구매를 찾을 수 없음");
            savedCall.reject("No valid purchase found");
        } else if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.USER_CANCELED) {
            android.util.Log.d("BillingPlugin", "[인앱결제] 사용자가 구매 취소");
            savedCall.reject("User canceled the purchase");
        } else {
            android.util.Log.e("BillingPlugin", "[인앱결제] 구매 실패: " + billingResult.getDebugMessage());
            savedCall.reject("Purchase failed: " + billingResult.getDebugMessage());
        }
    }
}

