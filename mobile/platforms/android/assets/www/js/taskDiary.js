function TaskDiary() {
	that = this;
}

TaskDiary.prototype.setup = function(callback) {
	//Setup the database
	this.db = window.openDatabase("taskDiary", 1, "taskDiary", 1000000);
	this.db.transaction(this.initDB, this.dbErrorHandler, callback);
}

//Generic database error handler. Won't do anything for now.
TaskDiary.prototype.dbErrorHandler = function(e) {
	console.log('DB Error');
	console.log(e);
}

//Initialize the database structure
TaskDiary.prototype.initDB = function(t) {
	//Task related tables
	t.executeSql('create table if not exists task(id INTEGER PRIMARY KEY AUTOINCREMENT, ' +
			'name TEXT, description TEXT, dueDate DATE, location TEXT)');
	t.executeSql('create table if not exists task_contacts(id INTEGER PRIMARY KEY AUTOINCREMENT, ' +
			'task_id INTEGER, contact_id INTEGER)');
	t.executeSql('create table if not exists task_lifecycle(id INTEGER PRIMARY KEY AUTOINCREMENT, ' +
			'task_id INTEGER, status TEXT, misc_info TEXT, validity_start DATE, validity_end DATE)');

	//Message store
	t.executeSql('create table if not exists message_store(id INTEGER PRIMARY KEY AUTOINCREMENT, ' +
			'type TEXT, counter_party TEXT, date DATE, data TEXT)');

	//Preferences
	t.executeSql('create table if not exists preferences(id INTEGER PRIMARY KEY AUTOINCREMENT, ' +
			'enable_reminder INTEGER, reminder_headstart_mins INTEGER)');

	//Load example data
	t.executeSql('select * from task',
			[],
			function(tx, results) {
				if(results.rows.length == 0) {
					that.initDBData();
				}
			}, this.dbErrorHandler);
}

TaskDiary.prototype.initDBData = function() {
	this.db.transaction(
		function(t) {
	//Task 1
	t.executeSql("insert into task(name, description, dueDate, location) values('Server cooling system degraded', 'Few components have failed and system is running in degraded state', '2013-07-14 01:45:00', 'Yahoo server farm, Hyderabad')");
	t.executeSql("insert into task_contacts(task_id, contact_id) values(1, 2406)");
	t.executeSql("insert into task_contacts(task_id, contact_id) values(1, 2848)");
	t.executeSql("insert into task_lifecycle(task_id, status, validity_start, validity_end) values(1, 'Assigned', '2013-07-14 01:00:00', '2013-07-14 01:05:00')");
	t.executeSql("insert into task_lifecycle(task_id, status, validity_start, validity_end) values(1, 'Accepted', '2013-07-14 01:05:00', '2013-07-14 01:10:00')");
	t.executeSql("insert into task_lifecycle(task_id, status, validity_start, validity_end) values(1, 'InProgress', '2013-07-14 01:10:00', '2013-07-14 01:15:00')");
	t.executeSql("insert into task_lifecycle(task_id, status, validity_start) values(1, 'Completed', '2013-07-14 01:15:00')");

	//Task 2
	t.executeSql("insert into task(name, description, dueDate, location) values('Electrical problem at Westin', 'Backup generator is not running', '2013-07-14 02:30:00', 'Westin (Mindspace), Madhapur')");
	t.executeSql("insert into task_contacts(task_id, contact_id) values(2, 4104)");
	t.executeSql("insert into task_contacts(task_id, contact_id) values(2, 2848)");
	t.executeSql("insert into task_lifecycle(task_id, status, validity_start, validity_end) values(2, 'Assigned', '2013-07-14 01:30:00', '2013-07-14 01:35:00')");
	t.executeSql("insert into task_lifecycle(task_id, status, validity_start, validity_end) values(2, 'Accepted', '2013-07-14 01:35:00', '2013-07-14 01:40:00')");
	t.executeSql("insert into task_lifecycle(task_id, status, validity_start) values(2, 'InProgress', '2013-07-14 01:40:00')");

	//Task 3
	t.executeSql("insert into task(name, description, dueDate, location) values('HVAC issue at Westin', 'High noise reported from HVAC system', '2013-07-14 02:15:00', 'Westin (Mindspace), Madhapur')");
	t.executeSql("insert into task_contacts(task_id, contact_id) values(3, 2406)");
	t.executeSql("insert into task_contacts(task_id, contact_id) values(3, 2848)");
	t.executeSql("insert into task_lifecycle(task_id, status, validity_start) values(3, 'Assigned', '2013-07-14 01:15:00')");

	//Task 4
	t.executeSql("insert into task(name, description, dueDate, location) values('Annual electrical maintenance', 'Check all wiring, MCBs, generator', '2013-07-15 09:10:00', 'Harivillu Apartments, Manikonda')");
	t.executeSql("insert into task_contacts(task_id, contact_id) values(4, 2406)");
	t.executeSql("insert into task_contacts(task_id, contact_id) values(4, 2848)");
	t.executeSql("insert into task_lifecycle(task_id, status, validity_start, validity_end) values(4, 'Assigned', '2013-07-14 02:00:00', '2013-07-14 02:05:00')");
	t.executeSql("insert into task_lifecycle(task_id, status, validity_start) values(4, 'Accepted', '2013-07-14 02:05:00')");

	//Task N
	/*t.executeSql("");
	t.executeSql("");
	t.executeSql("");*/
		}, this.dbErrorHandler);
}

TaskDiary.prototype.saveTask = function(data, callback) {
	console.log(data);
	this.db.transaction(
		function(t) {
			if(data.id == null) {
				t.executeSql('insert into task(name, description, dueDate, location) values(?, ?, ?, ?)',
						[data.name, data.desc, data.dueDate, data.location],
						function(tx, results) {
							data.id = results.insertId;
							saveTaskDetails(data, callback);
						}, this.dbErrorHandler);

			} else {
				t.executeSql('update task set name = ?, description = ?, dueDate = ? where id = ?',
						[data.name, data.desc, data.dueDate, data.id],
						callback, this.dbErrorHandler);
			}
		}, this.dbErrorHandler);
}

function saveTaskDetails(data, callback) {
	that.db.transaction(
			function(t) {
				for(var i = 0; i < data.contacts.length; i++) {
					t.executeSql('insert into task_contacts(task_id, contact_id) values(?, ?)',
							[data.id, data.contacts[i]]);
				}
				t.executeSql('insert into task_lifecycle(task_id, status, validity_start) values(?, ?, ?)',
						[data.id, data.taskStatus, new Date().getTime()]);
			}, that.dbErrorHandler, function() {
				callback(data);
			});
}

TaskDiary.prototype.processSMS = function(data) {
	var messageText = data.message;
	this.saveMessage({type:'INCOMING_SMS', counterParty:data.contactNumber, 
		date:new Date().getTime(), data:data.message});
	var taskId = messageText.substring(0, messageText.indexOf(' ')).replace(/PM/, "");
	var taskStatus = messageText.split(' ')[1];
	this.updateTaskStatusByTaskId({id:taskId, taskStatus:taskStatus});
}

TaskDiary.prototype.processMissedCall = function(data) {
	this.saveMessage({type:'MISSED_CALL', counterParty:data.contactNumber, date:new Date().getTime()});
	/*findContactId(data.contactNumber, function(contactIds) {
		for(var i=0; i < contactIds.length; i++) {
			this.updateTaskStatusByContactId({id:contactId, taskStatus:'Accepted'});
		}
	});*/
	this.updateTaskStatusByContactId({id:4104, taskStatus:'Accepted'});
}

function findContactId(number, callback) {
    var options = new ContactFindOptions();
    options.filter=number;
    options.multiple=true;
    var fields = ["phoneNumbers"];
    var contactIds = [];
    navigator.contacts.find(fields, function(contacts) {
    	for (var i = 0; i < contacts.length; i++) {
    		contactIds.push(contacts[i].id);
    	}
    	callback(contactIds);
    }, function(err) {
    	console.log("Unable to retrieve contactId for " + number);
    }, options);
}

TaskDiary.prototype.saveMessage = function(data) {
	console.log(data);
	this.db.transaction(
		function(t) {
			t.executeSql('insert into message_store(type, counter_party, date, data) values(?, ?, ?, ?)',
					[data.type, data.counterParty, data.date, data.data]);
		}, this.dbErrorHandler);
}

TaskDiary.prototype.updateTaskStatusByTaskId = function(data) {
	console.log(data);
	this.db.transaction(
			function(t) {
				var currentTime = new Date().getTime();
				t.executeSql('update task_lifecycle set validity_end = ? where task_id = ? and validity_end is null',
						[currentTime, data.id]);
				t.executeSql('insert into task_lifecycle(task_id, status, validity_start) values(?, ?, ?)',
						[data.id, data.taskStatus, currentTime]);
			},
			this.dbErrorHandler);
}

TaskDiary.prototype.updateTaskStatusByContactId = function(data) {
	console.log(data);
	this.db.transaction(
			function(t) {
				t.executeSql('select t.id'
						+ ' from task t '
						+ 'join task_contacts tc on t.id = tc.task_id '
						+ 'join task_lifecycle tl on t.id = tl.task_id '
						+ 'where tc.contact_id = ? and tl.status = ?',[data.id, 'Assigned'],
					function(t,results) {
						for(var i=0, len=results.rows.length; i<len; i++) {
							that.updateTaskStatusByTaskId({id:results.rows.item(i).id, taskStatus:'Accepted'});
						}
					},this.dbErrorHandler);
			},
			this.dbErrorHandler);
}

TaskDiary.prototype.getTasks = function(callback, id) {
	console.log('Running getTasks');
	this.db.transaction(
		function(t) {
			var whereClause = ' where ';
			if(id == undefined) {
				whereClause += '1 = 1 or 1 = ?';
			} else {
				whereClause += 't.id = ?';
			}
			t.executeSql('select t.id, t.name, t.description, t.dueDate, t.location, tc.contact_id, tl.status, tl.misc_info, tl.validity_start, tl.validity_end'
					+ ' from task t '
					+ 'join task_contacts tc on t.id = tc.task_id '
					+ 'join task_lifecycle tl on t.id = tl.task_id'
					+ whereClause,[id],
				function(t,results) {
					callback(that.fixResults(results));
				},this.dbErrorHandler);
		}, this.dbErrorHandler);
}

//Utility to convert record sets into array of objects
TaskDiary.prototype.fixResults = function(res) {
	var result = [];
	var temp = [];
	for(var i=0, len=res.rows.length; i<len; i++) {
		var row = res.rows.item(i);
		var task = temp[row.id];
		if(task == null) {
			task = new Object();
			task.id = row.id;
			task.name = row.name;
			task.desc = row.description;
			task.dueDate = row.dueDate;
			task.location = row.location;
			task.contacts = [];
			task.status = [];
		}
		task.contacts.push(row.contact_id);

		var status = new Object();
		status.status = row.status;
		status.miscInfo = row.misc_info;
		status.validityStart = row.validity_start;
		status.validityEnd = row.validity_end;
		task.status.push(status);
		if(row.validity_end == null) {
			task.currentStatus = row.status;
		}

		temp[row.id] = task;
	}
	for(key in temp) {
		result.push(temp[key]);
	}
	return result;
}
