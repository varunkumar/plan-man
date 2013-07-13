package com.ninjaduck.planman.plugin;

import org.apache.cordova.api.CallbackContext;
import org.apache.cordova.api.PluginResult;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.database.Cursor;
import android.os.Bundle;

public class MissedCallReceiver extends BroadcastReceiver {
	
	private CallbackContext callback_receive;
	private boolean isReceiving = true;
	
	private static String prevCallState = "";

	@Override
	public void onReceive(Context context, Intent intent) {
		Bundle bundle = intent.getExtras();
		String state = bundle.getString("state");
		JSONObject result = new JSONObject();
		if (prevCallState.equals("RINGING") && state.equals("IDLE")) {
			// get call log
			// CallLog.Calls.getLastOutgoingCall(context);
			System.out.println("State: Missed call. Trying to get the logs...");
			Cursor cursor = context.getContentResolver().query(
					android.provider.CallLog.Calls.CONTENT_URI, null, null,
					null, android.provider.CallLog.Calls.DATE + " DESC ");

			int numberColumnId = cursor
					.getColumnIndex(android.provider.CallLog.Calls.NUMBER);
			int nameColumnId = cursor
					.getColumnIndex(android.provider.CallLog.Calls.CACHED_NAME);
			int typeColumnId = cursor
					.getColumnIndex(android.provider.CallLog.Calls.TYPE);
			System.out.println("State: After getting the logs...");
			if (cursor.moveToFirst()) {
				// do {
				System.out.println("State: After reading the first log...");
				String contactNumber = cursor.getString(numberColumnId);
				int type = cursor.getInt(typeColumnId);
				String contactName = cursor.getString(nameColumnId);
				if (type == android.provider.CallLog.Calls.MISSED_TYPE) {
					System.out.println("State: Got a missed call...");
					if(this.isReceiving && this.callback_receive != null) {
						System.out.println("State: Got a missed call and sending on callback...");
						try {
							result.put("contactNumber", contactNumber);
							result.put("contactName", contactName);
						} catch (JSONException e) {
						}
						PluginResult res = new PluginResult(PluginResult.Status.OK, result);
			           	res.setKeepCallback(true);
			            callback_receive.sendPluginResult(res);
					}
				}
			}
		}
		prevCallState = state;
	}
	
	/*@Override
	public void onReceive(Context ctx, Intent intent) {
		
		// Get the SMS map from Intent
	    Bundle extras = intent.getExtras();
	    if (extras != null)
	    {
		   // Get received SMS Array
			Object[] smsExtra = (Object[]) extras.get(SMS_EXTRA_NAME);

			for (int i=0; i < smsExtra.length; i++)
			{
				SmsMessage sms = SmsMessage.createFromPdu((byte[]) smsExtra[i]);
				if(this.isReceiving && this.callback_receive != null) {
					String formattedMsg = sms.getOriginatingAddress() + ">" + sms.getMessageBody();
		        	PluginResult result = new PluginResult(PluginResult.Status.OK, formattedMsg);
		           	result.setKeepCallback(true);
		            callback_receive.sendPluginResult(result);
				}
			}

			// If the plugin is active and we don't want to broadcast to other receivers
			if (this.isReceiving && !broadcast) {
				//this.abortBroadcast();
			}
	     }
	}
	
	public void broadcast(boolean v) {
		this.broadcast = v;
	}*/
	
	public void startReceiving(CallbackContext ctx) {
		this.callback_receive = ctx;
		this.isReceiving = true;
	}

	public void stopReceiving() {
		this.callback_receive = null;
		this.isReceiving = false;
	}
}