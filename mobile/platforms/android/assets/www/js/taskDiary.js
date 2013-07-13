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
			'name TEXT, description TEXT, dueDate DATE)');
	t.executeSql('create table if not exists task_contacts(id INTEGER PRIMARY KEY AUTOINCREMENT, ' +
			'task_id INTEGER, contact_id INTEGER)');
	t.executeSql('create table if not exists task_lifecycle(id INTEGER PRIMARY KEY AUTOINCREMENT, ' +
			'task_id INTEGER, status TEXT, misc_info TEXT, validity_start DATE, validity_end DATE)');
	
	//Preferences
	t.executeSql('create table if not exists preferences(id INTEGER PRIMARY KEY AUTOINCREMENT, ' +
			'enable_reminder INTEGER, reminder_headstart_mins INTEGER)');
}

TaskDiary.prototype.saveTask = function(data, callback) {
	console.log(data);
	this.db.transaction(
		function(t) {
			if(data.id == null) {
				t.executeSql('insert into task(name, description, dueDate) values(?, ?, ?)',
						[data.name, data.desc, data.dueDate],
						function(tx, results) {
							data.id = results.insertId;
							saveTaskDetails(data, callback);
						}, this.dbErrorHandler);

			} else {
				t.executeSql('update task set name = ?, description = ?, dueDate = ? where id = ?',
						[data.name, data.desc, data.dueDate, data.id],
						function() {
							saveTaskDetails(data, callback);
						}, this.dbErrorHandler);
			}
		}, this.dbErrorHandler);
}

function saveTaskDetails(data, callback) {
	that.db.transaction(
			function(t) {
				for(var i = 0; i < data.contacts.length; i++) {
					t.executeSql('insert into task_contacts(task_id, contact_id) values(?, ?)',
							[data.id, data.contacts[i].id]);
				}
				t.executeSql('insert into task_lifecycle(task_id, status, validity_start) values(?, ?, ?)',
						[data.id, data.taskStatus, new Date().getTime()]);
			}, that.dbErrorHandler, callback);
}

TaskDiary.prototype.updateTaskStatus = function(data, callback) {
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

TaskDiary.prototype.getTasks = function(callback, id) {
	console.log('Running getTasks');
	this.db.transaction(
		function(t) {
			var whereClause = ' where ';
			if(arguments.length === 1) {
				whereClause += '1 = 1 or 1 = ?' 
			} else {
				whereClause += 't.id = ?'
			}
			t.executeSql('select t.id, t.name, t.description, t.dueDate, tc.contact_id, tl.status, tl.misc_info, tl.validity_start, tl.validity_end'
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
			task.desc = row.desc;
			task.dueDate = row.dueDate;
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
