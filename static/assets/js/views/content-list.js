/*global Wiki, $, _, Backbone */
(function () {
	"use strict";

	Wiki.Views.ContentList = Wiki.View.extend({

		el: '.js-content-list',

		initialize: function (options) {
			this.listenTo(this.collection, 'remove', this.showNext);
			this.listenTo(this.collection, 'add', this.addOne);

			this.options = options;
		},

		showNext: function () {
			var cid;
			if (this.options.restore) {
				cid = this.options.restore.cid;
			}

			if (!cid) {
				cid = this.collection.at(0) ? this.collection.at(0).cid : false;
			}

			if (cid) {
				Backbone.trigger('wiki:activeItem', cid);
			}
		},

		reportLoadError: function (response) {
			var message = 'A problem was encountered while loading more posts';

			if (response) {
				// Get message from response
				message += '; ' + Wiki.Views.Utils.getRequestErrorMessage(response);
			} else {
				message += '.';
			}

			Wiki.Notifications.addItem({
				type: 'error',
				message: message,
				status: 'passive'
			});
		},

		render: function () {
			this.collection.each(function (model) {
				this.$('ol').append(this.addSubview(new Wiki.Views.Entry({model: model})).render().el);
			}, this);

			this.showNext();
		},

		addOne: function (model) {
			this.$('ol').append(this.addSubview(new Wiki.Views.Entry({model: model})).render().el);
		}

	});

})();