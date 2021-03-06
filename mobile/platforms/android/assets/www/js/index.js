/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var taskDiary;
var iconMap = {
		"completed": "awaitingacceptance",
		"inprogress": "active",
		"assigned": "assigned",
		"accepted": "active",
		"rejected": "problem"
};
var app = {
    // Application Constructor
    initialize: function(page) {
    	console.log("Initializing...");
        this.bindEvents();
        app.page = page;
        console.log(page);
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicity call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
        
        // Stepping up SMS receiver
        var smsInboxPlugin = cordova.require('cordova/plugin/smsinboxplugin');
        smsInboxPlugin.startReception (function(msg) {
        	taskDiary.processSMS({contactNumber: msg.substring(0, msg.indexOf('>')), message: msg.substring(msg.indexOf('>') + 1)});
        	$(".badge").html(Number($(".badge").html()) + 1).show('fadeIn');
          }, function(err) {
            alert("Error while receiving messages: " + err);
          });
        
        // Missed call alerts
        var missedCallPlugin = cordova.require('cordova/plugin/missedcallplugin');
        missedCallPlugin.startReception (function(msg) {
        	taskDiary.processMissedCall(msg);
        	$(".badge").html(Number($(".badge").html()) + 1).show('fadeIn');
          }, function(err) {
            alert("Error while receiving calls: " + err);
          });
        
        // Send SMS
        $('#btnSend').on("click", function() {
        	var smsSendingPlugin = cordova.require('cordova/plugin/smssendingplugin');
            
            smsSendingPlugin.send ("09490484193", "Hello World !", function() {
                alert("Message sent :-)");
              }, function() {
                alert("Message not sent :s");
              });
        });
        
        //Add task
        $('#addTask').on("click", function() {
        	taskDiary.saveTask({name:$('#txtSubject').val(),desc:$('#txtDesc').val(),dueDate:new Date(),location: $('#txtLocation').val(), contacts:[4104, 2848],taskStatus:'Assigned'}, function(task) {
        		var smsSendingPlugin = cordova.require('cordova/plugin/smssendingplugin');
                
                smsSendingPlugin.send (app.findContactById(4104), "PM" + task.id + " " + task.name + " " + task.desc + " Client name: " + app.findContactById(2848) + " (" + task.location + ")", function() {
                    //alert("Message sent :-)");
                  }, function() {
                    //alert("Message not sent :s");
                  });
    			alert("Task added!!");
    		});
        });
        
        //Read tasks
        $('#btnRefresh').on("click", function() {
        	taskDiary.getTasks(app.loadTasks);
        	$(".badge").html(0).hide('fadeOut');
        });

    	//create a new instance of our TaskDiary and listen for it to complete it's setup
    	taskDiary = new TaskDiary();
    	taskDiary.setup(function() {});
    	
    	taskDiary.getTasks(app.loadTasks);
    	
    	$("#Conference").on("click", function() {
    		taskDiary.getTasks(function(data) {
    			var summary = {}, userSummary = {};
    			for (var i = 0; i < data.length; i++) {
    				var user = app.findNameById(data[i].contacts[0]);
    				
    				if (summary[data[i].currentStatus] == null)
    					summary[data[i].currentStatus] = {status: data[i].currentStatus, count: 0};
    				
    				if (userSummary[user] == null)
    					userSummary[user] = {};
    				
    				if (userSummary[user][data[i].currentStatus] == null)
    					userSummary[user][data[i].currentStatus] = 0;
    				
    				userSummary[user][data[i].currentStatus]++;
    				summary[data[i].currentStatus].count++;
    			}
    			
    			var rows = [], rows1 = [];
    			for (var k in summary) {
    				rows.push(summary[k]);
    			}
    			
    			for (var k in userSummary) {
    				var user = userSummary[k];
    				var row = {user: k};
    				for (var k1 in user) {
    					row[k1] = user[k1];
    				}
    				rows1.push(row);
    			}
    			
    			$('#mychart').html("");
    			$('#mychart1').html("");
    			
    			console.log(JSON.stringify(rows1));
    			
    			YUI().use('charts-legend', function (Y) 
    	    			{ 
    	    			    var pieGraph = new Y.Chart({
    	    			            render:"#mychart", 
    	    			            categoryKey:"status", 
    	    			            seriesKeys:["count"], 
    	    			            dataProvider:rows, 
    	    			            type:"pie", 
    	    			            seriesCollection:[
    	    			                {
    	    			                    categoryKey:"status",
    	    			                    valueKey:"count",
    	    			                    styles:{fill: {colors:['#4572A7', 
    	    	    			                                     '#AA4643', 
    	    	    			                                     '#89A54E', 
    	    	    			                                     '#80699B', 
    	    	    			                                     '#3D96AE', 
    	    	    			                                     '#DB843D', 
    	    	    			                                     '#92A8CD', 
    	    	    			                                     '#A47D7C', 
    	    	    			                                     '#B5CA92']}}
    	    			                }
    	    			            ],
    	    			            legend: {
    	    			            	position: 'bottom',
    	    			            	width: 300,
    	                                height: 300,
    	                                styles: {
    	                                    hAlign: "center",
    	                                    hSpacing: 4
    	                                }
    	    			            },
    	    			            styles: {
    	    			            	legend: { display: 'bottom' }
    	    			            }
    	    			            
    	    			        });
    	    			});
    			YUI().use('charts', function(Y) {
        			new Y.Chart({
                        dataProvider:rows1, 
                        render:"#mychart1", 
                        type:"column",
                        categoryKey: 'user',
                        seriesCollection: [
                                           {
       	    			                    styles:{fill: {colors:['#4572A7', 
       	    	    			                                     '#AA4643', 
       	    	    			                                     '#89A54E', 
       	    	    			                                     '#80699B', 
       	    	    			                                     '#3D96AE', 
       	    	    			                                     '#DB843D', 
       	    	    			                                     '#92A8CD', 
       	    	    			                                     '#A47D7C', 
       	    	    			                                     '#B5CA92']}}
                                           }]
                    });
        		});
    		});
    	});
    	
    	//window.localStorage.clear();
        var contacts = window.localStorage.getItem("contacts");
        if (contacts == null) {
        	app.buildContactList([], "Arun");
        } else {
        	app.renderContacts(JSON.parse(contacts));
        }
    },
    loadTasks: function(data) {
    	$('#tasksList').html("");
    	var str = "";
    	for (var i = 0; i < data.length; i++) {
    		var task = '<li><input type="hidden" class="taskId" value="' + data[i].id + '"/>';
    		task += "<a class='taskItem' href='#taskdetails'>";
    		task += '<img src="content/statusicons/' + iconMap[data[i].currentStatus.toLowerCase()] + '.png" class="ui-li-icon ui-corner-none">';
    		task += '<h2>PM' + data[i].id + ': ' + data[i].name + '</h2>';
    		task += '<p><strong>' + app.findNameById(data[i].contacts[0]) + '</strong></p>';
    		task += '<p>' + data[i].location + '</p>';
    		task += '<p>' + data[i].currentStatus + '</p>';
    		task += '<p class="ui-li-aside"><strong>' + new Date(data[i].dueDate).getHours() + ":" + new Date(data[i].dueDate).getMinutes() + '</strong> PM</p>';
    		task += '</a></li>';
    		
    		str += task;
    	} 
    	$('#tasksList').append(str).listview('refresh').trigger('create');
    	$(".taskItem").on("click", function(){
    		taskDiary.getTasks(function(data) {
    			var task = data[0];
    			$("#taskdetails").find("#id").html("PM"+task.id);
    			$("#taskdetails").find("#status").html(task.currentStatus);
    			$("#taskdetails").find("#client").html(app.findNameById(task.contacts[1]));
    			$("#taskdetails").find("#subject").html(task.name);
    			$("#taskdetails").find("#description").html(task.desc);
    			$("#taskdetails").find("#assignedTo").html(app.findNameById(task.contacts[0]));
    			$("#taskdetails").find("#dueDate").html(task.dueDate);
    			$("#taskdetails").find("#location").html(task.location);
    			var statusHistory = "";
    			for(var i=0; i < task.status.length; i++) {
    				statusHistory += '<div><img src="content/statusicons/' + iconMap[task.status[i].status.toLowerCase()] + '.png">';
    				statusHistory += "<b>" + task.status[i].status + "</b> as of " + task.status[i].validityStart + "</div>";
    				statusHistory += "<div style='clear:both;'></div>";
    			}
    			$("#taskdetails").find("#statusHistory").html(statusHistory);
    		}, $(this).parent().find(".taskId").val());
    	});
	},
    findContactById: function(id) {
    	var idMap = {
    		"2848": "09959879187",
    		"4104": "09963951917",
    		"2406": "09449052884",
    		"2405": "09490484193"
    	};
    	return idMap[id];
        	
    },
    findNameById: function(id) {
    	var idMap = {
        		"2848": "Raghuram Duraiswamy",
        		"4104": "Amit Bharti",
        		"2406": "Arunkumar Nagarajan",
        		"2405": "Varunkumar Nagarajan"
        	};
        	return idMap[id];
    },
    findContactByPhone: function(phone) {
    	var phoneMap = {
    		"09959879187": 2848,
    		"09963951917": 4104,
    		"09449052884": 2406,
    		"09490484193": 2405
    	};
    	return phoneMap[phone];
    },
    buildContactList: function(allContacts, name) {
    	if (name == "Arun")
    		window.localStorage.clear();
    	
    	var promise = 0;
    	
    	var fields = ["phoneNumbers", "displayName", "name", "id"];
    	var options = new ContactFindOptions();
        options.filter = name; 
        options.multiple = true;
        navigator.contacts.find(fields, function(contacts){
        	for (var i = 0; i < contacts.length; i++) {
        		allContacts.push(contacts[i]);
        	}
        	if (name == "Arun")
    			app.buildContactList(allContacts, "Raghu");
    		else if (name == "Raghu")
    			app.buildContactList(allContacts, "Amit");
    		else if (name == "Amit") {
    			window.localStorage.setItem("contacts", JSON.stringify(allContacts));
    	        app.renderContacts(allContacts);
    		}
    			
        }, function(err) {
        	//$('#contactsList').html("Error has occurred while fetching the contacts...");
        	if (name == "Arun")
    			app.buildContactList(allContacts, "Raghu");
    		else if (name == "Raghu")
    			app.buildContactList(allContacts, "Amit");
    		else if (name == "Amit") {
    			window.localStorage.setItem("contacts", JSON.stringify(allContacts));
    	        app.renderContacts(allContacts);
    		}
        }, options);

        
    },
    renderContacts: function(contacts) {
    	$('#contactsList').html("Updating the contacts list...");
    	var contactsStr = "";
    	for (var i = 0; i < contacts.length; i++) {
    		
    		try {
    			var displayName = contacts[i].displayName || contacts[i].name.formatted || contacts[i].emails[0].value;
	    		var contactName = "<li><a href='#contactdetails' data-rel='dialog'>" + (contacts[i].displayName || contacts[i].name.formatted || contacts[i].emails[0].value) + "</a></li>";
	    		contactsStr += contactName;
    		} catch (e) {
    			// do nothing\
    		}
    	}
    	
    	try {
    		$('#contactsList').html(contactsStr).listview('refresh');
    	} catch(e) {
    		$('#contactsList').html(contactsStr);
    	}
    	
    	try {
    		$('#contactsList0').html(contactsStr).listview('refresh');
    	} catch(e) {
    		$('#contactsList0').html(contactsStr);
    	}
    	
    	try {
    		$('#contactsList1').html(contactsStr).listview('refresh');
    	} catch(e) {
    		$('#contactsList1').html(contactsStr);
    	}
    	
    	try {
    		$('#contactsList2').html(contactsStr).listview('refresh');
    	} catch(e) {
    		$('#contactsList2').html(contactsStr);
    	}
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        /*var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);*/
    }
};
