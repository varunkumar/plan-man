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
	console.dir(e);
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
	console.dir(data);
	this.db.transaction(
		function(t) {
			if(data.id == null) {
				t.executeSql('insert into task(name, description, dueDate) values(?, ?, ?)',
						[data.name, data.desc, data.dueDate],
						function() {
							saveTaskDetails(data, callback);
						}, this.dbErrorHandler);

			} else {
				t.executeSql('update task set name = ?, description = ?, dueDate = ? where id = ?',
						[data.name, data.desc, data.dueDate, data.id],
						function(tx, results) {
							data.id = results.insertId;
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
	console.dir(data);
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

TaskDiary.prototype.getTasks = function(start,callback) {
	console.log('Running getTasks');
	if(arguments.length === 1) callback = arguments[0];

	this.db.transaction(
		function(t) {
			t.executeSql('select id, name, description from task',[],
				function(t,results) {
					callback(that.fixResults(results));
				},this.dbErrorHandler);
		}, this.dbErrorHandler);

}

TaskDiary.prototype.getTask = function(id, callback) {
	this.db.transaction(
		function(t) {
			t.executeSql('select id, title, body, image, published from diary where id = ?', [id],
				function(t, results) {
					callback(that.fixResult(results));
				}, this.dbErrorHandler);
			}, this.dbErrorHandler);

}

//Utility to convert record sets into array of objects
TaskDiary.prototype.fixResults = function(res) {
	var result = [];
	for(var i=0, len=res.rows.length; i<len; i++) {
		var row = res.rows.item(i);
		result.push(row);
	}
	return result;
}

//I'm a lot like fixResults, but I'm only used in the context of expecting one row, so I return an ob, not an array
TaskDiary.prototype.fixResult = function(res) {
	if(res.rows.length) {
		return res.rows.item(0);
	} else return {};
}