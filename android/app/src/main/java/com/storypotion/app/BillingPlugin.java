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
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity is null");
            return;
        }

        billingClient = BillingClient.newBuilder(activity)
                .setListener(this)
                .enablePendingPurchases()
                .build();

        billingClient.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(BillingResult billingResult) {
                if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    isServiceConnected = true;
                    JSObject result = new JSObject();
                    result.put("success", true);
                    call.resolve(result);
                } else {
                    isServiceConnected = false;
                    call.reject("Billing setup failed: " + billingResult.getDebugMessage());
                }
            }

            @Override
            public void onBillingServiceDisconnected() {
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
        if (!isServiceConnected) {
            call.reject("Billing service not connected. Call initialize first.");
            return;
        }

        String productId = call.getString("productId");
        String productType = call.getString("productType", "inapp");

        if (productId == null || productId.isEmpty()) {
            call.reject("productId is required");
            return;
        }

        // Store the call for later use in onPurchasesUpdated
        saveCall(call);

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

        billingClient.queryProductDetailsAsync(params, new ProductDetailsResponseListener() {
            @Override
            public void onProductDetailsResponse(BillingResult billingResult, List<ProductDetails> productDetailsList) {
                if (billingResult.getResponseCode() != BillingClient.BillingResponseCode.OK || 
                    productDetailsList.isEmpty()) {
                    call.reject("Failed to get product details: " + billingResult.getDebugMessage());
                    return;
                }

                ProductDetails productDetails = productDetailsList.get(0);
                Activity activity = getActivity();
                if (activity == null) {
                    call.reject("Activity is null");
                    return;
                }

                BillingFlowParams.Builder flowParamsBuilder = BillingFlowParams.newBuilder()
                        .setProductDetailsParamsList(Arrays.asList(
                            BillingFlowParams.ProductDetailsParams.newBuilder()
                                .setProductDetails(productDetails)
                                .build()
                        ));

                BillingResult result = billingClient.launchBillingFlow(activity, flowParamsBuilder.build());
                if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                    call.reject("Failed to launch billing flow: " + result.getDebugMessage());
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
        PluginCall savedCall = getSavedCall();
        if (savedCall == null) {
            return;
        }

        if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK && purchases != null) {
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

                    JSObject result = new JSObject();
                    result.put("purchase", purchaseObj);
                    savedCall.resolve(result);
                    return;
                } catch (JSONException e) {
                    // Continue to next purchase
                }
            }
            savedCall.reject("No valid purchase found");
        } else if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.USER_CANCELED) {
            savedCall.reject("User canceled the purchase");
        } else {
            savedCall.reject("Purchase failed: " + billingResult.getDebugMessage());
        }
    }
}

