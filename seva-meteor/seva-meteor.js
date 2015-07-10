// seva-meteor.js
Tasks = new Mongo.Collection("tasks");
Counters = new Mongo.Collection("counters");
Trivia = new Mongo.Collection("trivia");
TriviaCount = new Mongo.Collection("trivaCount");
if (Meteor.isClient) {
	Meteor.subscribe("tasks");
	Session.setDefault('random_trivia', "Unable to retrieve trivia");
	Session.setDefault('trivia_count',0);
	Session.setDefault('counter', 0);
	setInterval(function(){ 
		console.log("Hello World");
		var z = Meteor.call("getTriviaCount",function(err, data){
			if(err){
				console.log(err);
			}
			else
			{
				console.log(data);	
				Session.set('trivia_count',data);
			}
		}); }, 60000);
		// This code only runs on the client
		Template.body.helpers({
			tasks: function () {
				return Tasks.find({});
			}
		});
		
		Template.trivia.helpers({
			random_trivia: function () {
				return Session.get('random_trivia');			
			},
			counter: function () {
				return Session.get('counter');			
			}
		});
		
		Template.trivia.events({
			"click .get_trivia": function () {
				Session.set('counter',Session.get('counter')+1);
				var x = Meteor.call("getTrivia", function(err, data){
					if(err){
						console.log(err);
					}
					else
					{
						console.log(data);	
						Session.set('random_trivia',"\""+data+" \"");
					}
				});
				
				
			}
		});
		
		Template.body.events({
			"submit .new-task": function (event) {
				// This function is called when the new task form is submitted
				
				var text = event.target.text.value;
				
				Meteor.call("addTask", text);
				
				// Clear form
				event.target.text.value = "";
				
				// Prevent default form submit
				return false;
			},
			"change .hide-completed input": function (event) {
				Session.set("hideCompleted", event.target.checked);
			}		
		});
		
		// Replace the existing Template.body.helpers
		Template.body.helpers({
			tasks: function () {
				if (Session.get("hideCompleted")) {
					// If hide completed is checked, filter tasks
					return Tasks.find({checked: {$ne: true}}, {sort: {createdAt: -1}});
					} else {
					// Otherwise, return all of the tasks
					return Tasks.find({}, {sort: {createdAt: -1}});
				}
			},
			hideCompleted: function () {
				return Session.get("hideCompleted");
			},
			incompleteCount: function () {
				return Tasks.find({checked: {$ne: true}}).count();
			},
			trivia_count: function() {
				return Session.get('trivia_count');
			}
		});
		
		// In the client code, below everything else
		Template.task.events({
			"click .toggle-checked": function () {
				// Set the checked property to the opposite of its current value
				Meteor.call("setChecked", this._id, ! this.checked);
			},
			"click .delete": function () {
				Meteor.call("deleteTask", this._id);
			},
			"click .toggle-private": function () {
				Meteor.call("setPrivate", this._id, ! this.private);
			}
		});
		Accounts.ui.config({
			passwordSignupFields: "USERNAME_ONLY"
		});
		Template.task.helpers({
			isOwner: function () {
				return this.owner === Meteor.userId();
			}
		});
		
}

Meteor.methods({
	addTask: function (text) {
		// Make sure the user is logged in before inserting a task
		if (! Meteor.userId()) {
			throw new Meteor.Error("not-authorized");
		}
		
		Tasks.insert({
			text: text,
			createdAt: new Date(),
			owner: Meteor.userId(),
			username: Meteor.user().username
		});
	},
	deleteTask: function (taskId) {
		var task = Tasks.findOne(taskId);
		if (task.private && task.owner !== Meteor.userId()) {
			// If the task is private, make sure only the owner can delete it
			throw new Meteor.Error("not-authorized");
		}
		else{
			Tasks.remove(taskId);
		}
		
	},
	setChecked: function (taskId, setChecked) {
		var task = Tasks.findOne(taskId);
		if (task.private && task.owner !== Meteor.userId()) {
			// If the task is private, make sure only the owner can check it off
			throw new Meteor.Error("not-authorized");
		}
		else{
			Tasks.update(taskId, { $set: { checked: setChecked} });
		}
	},
	setPrivate: function (taskId, setToPrivate) {
		var task = Tasks.findOne(taskId);
		
		// Make sure only the task owner can make a task private
		if (task.owner !== Meteor.userId()) {
			throw new Meteor.Error("not-authorized");
		}
		
		Tasks.update(taskId, { $set: { private: setToPrivate } });
	},
	getTrivia: function () {		
		this.unblock();
		try {
			var maxresult = HTTP.call("GET", "http://45.55.76.36:3555/sevabot/counters?query=%7B%22chat_id%22%3A%22%23j0kur33z33%2F%24612a20053604dfe4%22%7D"
			,{params: {limit: 1}}
			);
			var max = maxresult.data[0].sequence;
			console.log(max);
			var rando = Math.floor((Math.random() * max) + 1)
			console.log(rando);
			var newUrl= "http://45.55.76.36:3555/sevabot/trivia?query=%7B%22chat_id%22%3A%22%23j0kur33z33%2F%24612a20053604dfe4%22%2C%22trivia_id%22%3A"+rando+"%7D";
			console.log(newUrl);
			var result = HTTP.call("GET", newUrl,{params: {limit: 1}});
			console.log(result.data[0].info);
			return ""+result.data[0].info;
			} catch (e) {
			return false;
		};
		
	},
	getTriviaCount: function(){
		this.unblock();
		try {
			var maxresult = HTTP.call("GET", "http://45.55.76.36:3555/sevabot/counters?query=%7B%22chat_id%22%3A%22%23j0kur33z33%2F%24612a20053604dfe4%22%7D"
			,{params: {limit: 1}}
			);
			var max = maxresult.data[0].sequence;
			return max;
			} catch (e) {
			return false;
		};
	},
	getCounters: function(){
		this.unblock();
		try {
			var sourceCounters = HTTP.call("GET", "http://45.55.76.36:3555/sevabot/counters",false,function(err,result){
				if(err)
				console.log(err);
				else
				return result.data;
			});
			return sourceCounters;
			} catch (e) {
			return false;
		};
	}
});



if (Meteor.isServer) {
	Meteor.publish("tasks", function () {
		return Tasks.find({
			$or: [
			{ private: {$ne: true} },
			{ owner: this.userId }
			]
		});
	});
	/*
		getCounterData = function(callback){
		HTTP.call("GET", "http://45.55.76.36:3555/sevabot/counters",false,
		function(err, res) {
		if (err) throw new Error(err.message);
		else callback && callback( null, res);
		}
		);
		};
	*/
	/*
	setInterval(function(){ 
		console.log("interval executed");
		var getCounterDataSynchronously = Meteor.wrapAsync(Meteor.call("getCounters",function(err,sourceCounters){
			if(err) throw new Error(err.message);
			else{
				var sourceCounters = getCounterDataSynchronously().data;
				for(var i = 0; i < sourceCounters.length;i++){
					var sourceCounter = sourceCounters[i];
					//if(Counters.find({"_id":sourceCounter._id}).count()>0)
					var sourceCount = Counters.find({"_id":sourceCounter._id}).count();
					console.log("sourceCounter: "+sourceCounter._id);
				}
			}
		}
		));
	}, 5000);
	*/
	Meteor.setInterval(function(){ 
			var sourceCounters = HTTP.call("GET", "http://45.55.76.36:3555/sevabot/counters").data;
			for(var i = 0; i < sourceCounters.length;i++){
					var sourceCounter = sourceCounters[i];
					if(Counters.find({"source_id":sourceCounter._id}).count()>0){
						console.log("sourceCounter: "+sourceCounter._id);
					}
					else{
						console.log("sourceCounter.chat_id: "+sourceCounter._id);
						var url = "http://45.55.76.36:3555/sevabot/counters?query=%7B%22chat_id%22%3A%22"+encodeURIComponent(sourceCounter.chat_id)+"%22%7D";
						console.log("trivia_url: "+url);
						var sourceTrivia = HTTP.call("GET", url).data;
						if(sourceTrivia.length>0)
						{
							for(var i = 0; i < sourceTrivia.length;i++){
								var sourceTrivium = sourceTrivia[i];
								Trivia.insert({
									source_id: sourceTrivium._id,
									info: sourceTrivium.info,
									chat_id: sourceTrivium.chat_id,
									full_name: sourceTrivium.full_name,
									date: sourceTrivium.date,
									trivia_id: sourceTrivium.trivia_id
								});
							}
						}
						Counters.insert({
							source_id: sourceCounter._id,
							chat_id: sourceCounter.chat_id,
							collection: sourceCounter.collection,
							sequence: sourceCounter.sequence
						});
					}
				}
		},5000);
}
