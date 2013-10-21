Wiki.Views.Socket = Backbone.View.extend({

	initialize: function(data) {
		_.bindAll(this, 'socketFiles', 'socketOpen', 'socketDir', 'saveFileReply', 'socketMkdir');

		this.socket = io.connect();

		this.socket.on('files', this.socketFiles);
		this.socket.on('openReply', this.socketOpen);
		this.socket.on('dirReply', this.socketDir);
		this.socket.on('saveFileReply', this.saveFileReply);
		this.socket.on('mkdirReply', this.socketMkdir);

		this.socket.on('connect', function () {
			// kick things off by starting the router
			Backbone.history.start({
				pushState: true,
				hashChange: false,
				root: '/'
			});
		});
	},

	// build entries list
	socketFiles: function (files) {
		this.collection.add(files);
		this.trigger('socket:files');
	},

	// open a file by a model
	fetch: function (model, deferred) {
		// check to make sure we are not already loading an entry
		if (this._model) return;

		this._model = model;
		this._deferred = deferred;

		if (this.folder) {
			this.socket.emit('dir', {name: model.get('name')});
		} else {
			this.socket.emit('open', {name: model.get('name')});
		}
	},

	// on reply to the open request made via Wiki.Socket.fetch
	socketOpen: function (data) {
		var model = this._model;
		var deferred = this._deferred;
		delete this._model;
		delete this._deferred;

		if (data.error.error == true){
			Wiki.Notifications.addItem({
				type: 'error',
				message: 'error reading file: ' + data.error.reason,
				status: 'passive'
			});
			deferred.reject(model);
		} else {
			model.set('html', data.fileContents);
			model.set('markdown', data.rawMd);
			deferred.resolve(model);
		}
	},

	// on response from opening a folder via Wiki.Socket.fetch
	socketDir: function (data) {
		var model = this._model;
		delete this._model;

		model.children.add(data.files);
	},

	saveFileReply: function (data) {
		if (data.error.error == true){
			Wiki.Notifications.addItem({
				type: 'error',
				message: 'there was an error: ' + data.error.reason,
				status: 'passive'
			});
		} else {
			$('#markdown_content').html(data.fileContents);
			rawMd = data.rawMd;
			fileName = data.fileName;
			editingAllowed = true;
			$('#notification').html('Saved');
			$('#notification').slideDown('fast', function(){
				window.setTimeout(function(){$('#notification').slideUp()}, 2000);
			});

			$('#content_header').html(fileName);
			if (creatingNewFile == true){
				creatingNewFile = false;
				tempFile = '';
				socket.emit('refreshNav');
			}
		}
	},

	// mkdir: function (name) {
	// 	socket.emit('mkdir', name);
	// },

	socketMkdir: function (err) {
		Wiki.Notifications.addItem({
			type: 'error',
			message: 'There was an error making the folder, error code: ' + err.code,
			status: 'passive'
		});
	}

});
