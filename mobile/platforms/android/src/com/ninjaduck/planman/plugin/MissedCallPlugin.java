package com.ninjaduck.planman.plugin;

import org.apache.cordova.api.CallbackContext;
import org.apache.cordova.api.CordovaPlugin;
import org.apache.cordova.api.PluginResult;
import org.json.JSONArray;
import org.json.JSONException;

import android.content.IntentFilter;

public class MissedCallPlugin extends CordovaPlugin {
	public final String ACTION_RECEIVE_CALL = "StartReception";
	public final String ACTION_STOP_RECEIVE_CALL = "StopReception";
	
	private CallbackContext callback_receive;
	private MissedCallReceiver callReceiver = null;
	private boolean isReceiving = false;
	
	public MissedCallPlugin() {
		super();
	}
	
	@Override
	public boolean execute(String action, JSONArray arg1,
			final CallbackContext callbackContext) throws JSONException {
		
		if (action.equals(ACTION_RECEIVE_CALL)) {
			// if already receiving (this case can happen if the startReception is called
			// several times
			if(this.isReceiving) {
				// close the already opened callback ...
				PluginResult pluginResult = new PluginResult(
						PluginResult.Status.NO_RESULT);
				pluginResult.setKeepCallback(false);
				this.callback_receive.sendPluginResult(pluginResult);
				
				// ... before registering a new one to the sms receiver
			}
			this.isReceiving = true;
				
			if(this.callReceiver == null) {
				this.callReceiver = new MissedCallReceiver();
				IntentFilter fp = new IntentFilter("android.intent.action.PHONE_STATE");
			    fp.setPriority(1000);
			    // fp.setPriority(IntentFilter.SYSTEM_HIGH_PRIORITY);
			    this.cordova.getActivity().registerReceiver(this.callReceiver, fp);
			}
			
			this.callReceiver.startReceiving(callbackContext);
	
			PluginResult pluginResult = new PluginResult(
					PluginResult.Status.NO_RESULT);
			pluginResult.setKeepCallback(true);
			callbackContext.sendPluginResult(pluginResult);
			this.callback_receive = callbackContext;
			
			return true;
		}
		else if(action.equals(ACTION_STOP_RECEIVE_CALL)) {
			
			if(this.callReceiver != null) {
				callReceiver.stopReceiving();
			}

			this.isReceiving = false;
			
			// 1. Stop the receiving context
			PluginResult pluginResult = new PluginResult(
					PluginResult.Status.NO_RESULT);
			pluginResult.setKeepCallback(false);
			this.callback_receive.sendPluginResult(pluginResult);
			
			// 2. Send result for the current context
			pluginResult = new PluginResult(
					PluginResult.Status.OK);
			callbackContext.sendPluginResult(pluginResult);
			
			return true;
		}

		return false;
	}
}
