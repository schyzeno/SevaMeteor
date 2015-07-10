// seva-meteor.js
Tasks = new Mongo.Collection("tasks");
Counters = new Mongo.Collection("counters");
Trivia = new Mongo.Collection("trivia");
function ValidURL(str) {
	var pattern = new RegExp('^(https?:\/\/)?'+ // protocol
    '((([a-z\d]([a-z\d-]*[a-z\d])*)\.)+[a-z]{2,}|'+ // domain name
    '((\d{1,3}\.){3}\d{1,3}))'+ // OR ip (v4) address
    '(\:\d+)?(\/[-a-z\d%_.~+]*)*'+ // port and path
    '(\?[;&a-z\d%_.~+=-]*)?'+ // query string
    '(\#[-a-z\d_]*)?$','i'); // fragment locater
	if(!pattern.test(str)) {
		alert("Please enter a valid URL.");
		return false;
		} else {
		return true;
	}
}
if (Meteor.isClient) {
	Meteor.subscribe("trivia");
	Meteor.subscribe("counters");
	Session.setDefault('random_trivia', "Unable to retrieve trivia");
	Session.setDefault('trivia_count',0);
	Session.setDefault('counter', 0);
	setInterval(function(){ 
		var z = Meteor.call("getTriviaCount",function(err, data){
			if(err){
				console.log(err);
			}
			else
			{
				Session.set('trivia_count',data);
			}
		}); }, 60000);
		
		Template.trivia.events({
			"click .get_trivia": function () {
				Session.set('counter',Session.get('counter')+1);
				//"chat_id":"#j0kur33z33/$612a20053604dfe4"
				var max = Counters.findOne({}).sequence;
				do{				
				var rando = Math.floor((Math.random() * (max)) + 1);
				var rTrivia = Trivia.findOne({"trivia_id":rando});
				Session.set('random_trivia',rTrivia.info);
				}
				while(Session.get('random_trivia').toLowerCase().includes(" nam "));
			}
		});
		
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
			random_trivia_first_token: function() {
				var triv = Session.get('random_trivia');
				triv = triv.substring(triv.indexOf("http")).split(" ")[0];
				return triv;
			},
			random_trivia_remaining_tokens: function() {
				var triv = Session.get('random_trivia');
				var triviaArr = triv.substring(triv.indexOf("http")).split(" ");
				var remaining = "";
				for(var i=1;i<triviaArr.length;i++)
				{
					remaining= remaining+" "+triviaArr[i];
				}
				return remaining;
			},
			counter: function(){
				return Session.get('counter');
			},
			triviaIsURL: function(){
				
				if(Session.get('random_trivia').toLowerCase().trim().startsWith("http")
					|| Session.get('random_trivia').toLowerCase().trim().startsWith("https") ) {
					
					return true;
					} else {
					return false;
				}
				
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
			},
			counter: function() {
				return Session.get('counter');
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
	},
	getLocalTrivia: function () {		
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
		
	}
});


//Note that (counters.sequence-1) is equal to trivia.find{chat_id:}.count()
if (Meteor.isServer) {
	Meteor.publish("trivia", function () {
		return Trivia.find(
		{
			"chat_id":"#j0kur33z33/$612a20053604dfe4"
		});
	});
	Meteor.publish("counters", function () {
		return Counters.find(
		{
			"chat_id":"#j0kur33z33/$612a20053604dfe4"
		});
	});
	Meteor.setInterval(function(){ 
		var sourceCounters = HTTP.call("GET", "http://45.55.76.36:3555/sevabot/counters").data;
		for(var i = 0; i < sourceCounters.length;i++){
			var sourceCounter = sourceCounters[i];
			if(Counters.find({"source_id":sourceCounter._id}).count()>0){
				var counter = Counters.findOne({"source_id":sourceCounter._id});
				if(sourceCounter.sequence > counter.sequence){
					console.log("Updating Trivia for: "+sourceCounter.chat_id);
					console.log("=================================");
					console.log(" ");
					var url = "http://45.55.76.36:3555/sevabot/trivia?query={\"chat_id\":\""+encodeURIComponent(sourceCounter.chat_id)+"\",\"trivia_id\":{\"$gt\":"+counter.sequence+"}}";
					var newSourceTrivia = HTTP.call("GET", url).data;
					for(var i = 0; i < newSourceTrivia.length;i++){
						var sourceTrivium = newSourceTrivia[i];
						Trivia.insert({
							source_id: sourceTrivium._id,
							info: sourceTrivium.info,
							chat_id: sourceTrivium.chat_id,
							full_name: sourceTrivium.full_name,
							date: sourceTrivium.date,
							trivia_id: sourceTrivium.trivia_id
						});
					}
					Counters.update(
					counter._id,
					{ $set: { sequence: sourceCounter.sequence} }
					);
				}
				else{
					//console.log(sourceCounter.chat_id);
					//console.log("sourceCounter: "+sourceCounter.sequence+" == counter: "+counter.sequence);
				}
			}
			else{
				console.log("Retrieving Trivia for: "+sourceCounter.chat_id);
				console.log("=================================");
				var url = "http://45.55.76.36:3555/sevabot/trivia?query=%7B%22chat_id%22%3A%22"+encodeURIComponent(sourceCounter.chat_id)+"%22%7D";
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
	},10000);
}
