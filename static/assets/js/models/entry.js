/*global window, document, Wiki, $, _, Backbone */
(function () {
	'use strict';

	Wiki.Models.Entry = Backbone.Model.extend({

		// Default attributes for the todo item.
		defaults: function () {
			return {
				name: "empty...",
				type: 'txt',
				dir: '/',
				html: null,
				mtime: null,
				mtime_h: null,
				revisions: null,
				markdown: null,
				status: 'draft'
				// author: ''
			};
		},

		initialize: function() {
			if (this.isFolder()) {
				this.children = new Wiki.Collections.Entries();
			} else {
				this.set('mtime_h', this.getModifiedTime());
			}
		},

		getEditUri: function () {
			if (this.isMarkdown()) {
				return '/w/' + this.get('name') + '/edit'
			} else {
				return '#';
			}
		},

		getModifiedTime: function () {
			var mtime = this.get('mtime');
			if (mtime) {
				return moment(mtime).fromNow();
			} else {
				return null;
			}
		},

		isFolder: function () {
			return this.get('type') === 'folder';
		},

		isMarkdown: function () {
			return this.get('type') === 'md';
		},

		meta: function (meta) {
			this.set('revisions', meta.revisions);
		},

		fetch: function () {
			var deferred = new jQuery.Deferred();
			Wiki.Socket.fetch(this, deferred);
			return deferred;
		},

		save: function (data) {
			// _.each(this.model.blacklist, function (item) {
			// 	this.model.unset(item);
			// }, this);

			var deferred = new jQuery.Deferred();
			this.set(data);
			Wiki.Socket.save(this, deferred);
			return deferred;
		}

	});

})();
