/*globals window, $, _, Backbone, Validator */
(function (window) {
	'use strict';

	var Wiki = {
		Layout      : {},
		Views       : {},
		Collections : {},
		Models      : {},
		// Validate    : new Validator(),

		settings: {
			apiRoot: '/api/v0.1'
		},

		// This is a helper object to denote legacy things in the
		// middle of being transitioned.
		temporary: {},

		currentView: null,
		router: null
	};

	_.extend(Wiki, Backbone.Events);

	// Backbone.oldsync = Backbone.sync;
	// // override original sync method to make header request contain csrf token
	// Backbone.sync = function (method, model, options, error) {
	// 	options.beforeSend = function (xhr) {
	// 		xhr.setRequestHeader('X-CSRF-Token', $("meta[name='csrf-param']").attr('content'));
	// 	};
	// 	/* call the old sync method */
	// 	return Backbone.oldsync(method, model, options, error);
	// };

	Wiki.init = function () {
		// Create our global collection of **Entries**.
		Wiki.Entries = new Wiki.Collections.Entries;

		// Router handler
		Wiki.Router = new Wiki.Router();

		// This is needed so Backbone recognizes elements already rendered server side
		// as valid views, and events are bound
		Wiki.Notifications = new Wiki.Views.NotificationCollection({model: []});

		// Create the socket controller
		Wiki.Socket = new Wiki.Views.Socket({ collection: Wiki.Entries });

		// the router will be started once the socket connection has begun
	};

	// Wiki.Validate.error = function (object) {
	// 	this._errors.push(object);

	// 	return this;
	// };

	// Wiki.Validate.handleErrors = function () {
	// 	Wiki.notifications.clearEverything();
	// 	_.each(Wiki.Validate._errors, function (errorObj) {

	// 		Wiki.notifications.addItem({
	// 			type: 'error',
	// 			message: errorObj.message || errorObj,
	// 			status: 'passive'
	// 		});
	// 		if (errorObj.hasOwnProperty('el')) {
	// 			errorObj.el.addClass('input-error');
	// 		}
	// 	});
	// };

	window.Wiki = Wiki;

}(window));
