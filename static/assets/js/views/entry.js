/*global Wiki, $, _, Backbone */
(function () {
	"use strict";

	Wiki.Views.Entry = Wiki.View.extend({

		tagName: 'li',

		events: {
			'click a': 'setActiveItem'
		},

		active: false,

		initialize: function () {
			this.listenTo(Backbone, 'wiki:activeItem', this.checkActive);
			this.listenTo(this.model, 'destroy', this.removeItem);
			this.listenTo(this.model, 'change:revisions', this.render);
			// this.listenTo(this.model, 'change:mtime', this.render);
		},

		removeItem: function () {
			var self = this;
			$.when(this.$el.slideUp()).then(function () {
				self.remove();
			});
		},

		// If the current item isn't active, we trigger the event to
		// notify a change in which item we're viewing.
		setActiveItem: function (e) {
			e.preventDefault();

			if (this.model.isFolder()) {
				// 
				return;
			}

			if (this.active !== true) {
				Backbone.trigger('wiki:activeItem', this.model.cid);
				Wiki.Router.navigate('/w/' + this.model.get('name'), { trigger: false });
				this.render();
			}
		},

		// Checks whether this item is active and doesn't match the current id.
		checkActive: function (cid) {
			if (this.model.cid !== cid) {
				if (this.active) {
					this.active = false;
					this.$el.removeClass('active');
				}
			} else {
				this.active = true;
				this.$el.addClass('active');
			}
		},

		showPreview: function (e) {
			var item = $(e.currentTarget);
			this.$('.content-list-content li').removeClass('active');
			item.addClass('active');
			Backbone.trigger('wiki:activeItem', item.data('id'));
		},

		template: _.template(
			'<a class="permalink<% if (typeof featured !== \'undefined\') { %> featured<% } %>" href="/w/<%= name %>">' +
				'<h3 class="entry-title"><%= name %></h3>' +
				'<% if (revisions != null) { %>' +
					'<section class="entry-meta">' +
						'<% if (typeof mtime !== \'undefined\') { %><time datetime="<%= mtime %>" class="date">Updated <%= mtime_h %></time><% } %>' +
						'<span title="revisions" class="views"><%= revisions %></span>' +
					'</section>' +
				'<% } %>' +
			'</a>'
		)
	});

})();