/*global window, document, Wiki, $, _, Backbone, JST */
(function () {
	"use strict";

	// Base view
	// ----------
	Wiki.Views.Home = Wiki.View.extend({
		initialize: function (options) {
			this.addSubview(new Wiki.Views.PreviewContainer({ collection: this.collection })).render();
			this.addSubview(new Wiki.Views.ContentList({ collection: this.collection, restore: options.restore })).render();
		}
	});


	// Content preview
	// ----------------
	Wiki.Views.PreviewContainer = Wiki.View.extend({

		el: '.js-content-preview',

		activeId: null,

		events: {
			'click .post-controls .post-edit' : 'edit'
		},

		initialize: function (options) {
			this.listenTo(Backbone, 'wiki:activeItem', this.setActivePreview);
		},

		setActivePreview: function (id) {
			if (this.activeId !== id) {
				this.activeId = id;
				this.render();
			}
		},

		edit: function (e) {
			e.preventDefault();
			Wiki.Router.navigate(this.model.getEditUri(), { trigger: true });
		},

		template: _.template(
			'<header class="floatingheader">\
				<button class="button-back" href="#">Back</button>' +
				// <a class="featured unfeatured" href="#">
				// 	<span class="hidden">Star</span>
				// </a>
				// <span class="status"><%= status %></span>
				// <span class="normal">by</span>
				// <span class="author"><%= author %></span>
				'<section class="post-controls">\
					<a class="post-edit" href="#"><span class="hidden">Edit</span></a>\
					<a class="post-settings hidden" href="#" data-toggle=".post-settings-menu"><span class="hidden">Settings</span></a>\
					<ul class="post-settings-menu menu-drop-right overlay" style="display: none">\
						<li><a href="#" class="refresh">Refresh</a></li>' +
						// '<li><a href="#" class="rename">Rename</a></li>' +
						'<li><a href="#" class="delete">Delete</a></li>\
					</ul>\
				</section>\
			</header>\
			<section class="content-preview-content">\
				<div class="wrapper"><h1><%= name %></h1><%= html %></div>\
			</section>'
		),

		render: function () {
			if (this.activeId) {
				this.model = this.collection.get(this.activeId);
				if (!this.model.get('html')) {
					this.model.fetch().then(_.bind(this.render, this));
				}
				this.$el.html(this.template(this.templateData()));
			}

			// links open in new windows
			this.$('.wrapper').on('click', 'a', function (e) {
				$(e.currentTarget).attr('target', '_blank');
			});

			if (this.model && this.model !== 'undefined') {
				this.addSubview(new Wiki.View.SettingsPanel({el: $('.post-controls'), model: this.model})).render();
			}

			return this;
		}

	});

}());
