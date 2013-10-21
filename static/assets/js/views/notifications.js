/*global window, document, setTimeout, Wiki, $, _, Backbone, JST, shortcut */
(function () {
	"use strict";

	/**
	 * This is the view to generate the markup for the individual
	 * notification. Will be included into #notifications.
	 *
	 * States can be
	 * - persistent
	 * - passive
	 *
	 * Types can be
	 * - error
	 * - success
	 * - alert
	 * -   (empty)
	 *
	 */
	Wiki.Views.Notification = Wiki.View.extend({
		template: _.template('<section class="notification notification-<%= type %> notification-<%= status %> js-notification"><%= message %> <a class="close" href="#"><span class="hidden">Close</span></a></section>'),
		className: 'js-bb-notification',
		render: function () {
			var html = this.template(this.model);
			this.$el.html(html);
			return this;
		}
	});

	/**
	 * This handles Notification groups
	 */
	Wiki.Views.NotificationCollection = Wiki.View.extend({
		el: '#notifications',
		initialize: function () {
			var self = this;
			this.render();
			Wiki.on('urlchange', function () {
				self.clearEverything();
			});
		},
		events: {
			'animationend .js-notification': 'removeItem',
			'webkitAnimationEnd .js-notification': 'removeItem',
			'oanimationend .js-notification': 'removeItem',
			'MSAnimationEnd .js-notification': 'removeItem',
			'click .js-notification.notification-passive .close': 'closePassive',
			'click .js-notification.notification-persistent .close': 'closePersistent'
		},
		render: function () {
			_.each(this.model, function (item) {
				this.renderItem(item);
			}, this);
		},
		renderItem: function (item) {
			var itemView = new Wiki.Views.Notification({ model: item }),
				height,
				$notification = $(itemView.render().el);

			this.$el.append($notification);
			height = $notification.hide().outerHeight(true);
			$notification.animate({height: height}, 250, function () {
				$(this)
					.css({height: "auto"})
					.fadeIn(250);
			});
		},
		addItem: function (item) {
			this.model.push(item);
			this.renderItem(item);
		},
		clearEverything: function () {
			this.$el.find('.js-notification.notification-passive').remove();
		},
		removeItem: function (e) {
			e.preventDefault();
			var self = e.currentTarget,
				bbSelf = this;
			if (self.className.indexOf('notification-persistent') !== -1) {
				$.ajax({
					type: "DELETE",
					headers: {
						'X-CSRF-Token': $("meta[name='csrf-param']").attr('content')
					},
					url: '/api/v0.1/notifications/' + $(self).find('.close').data('id')
				}).done(function (result) {
					bbSelf.$el.slideUp(250, function () {
						$(this).show().css({height: "auto"});
						$(self).remove();
					});
				});
			} else {
				$(self).slideUp(250, function () {
					$(this)
						.show()
						.css({height: "auto"})
						.remove();
				});
			}
		},
		closePassive: function (e) {
			$(e.currentTarget)
				.parent()
				.fadeOut(250)
				.slideUp(250, function () {
					$(this).remove();
				});
		},
		closePersistent: function (e) {
			var self = e.currentTarget,
				bbSelf = this;
			$.ajax({
				type: "DELETE",
				headers: {
					'X-CSRF-Token': $("meta[name='csrf-param']").attr('content')
				},
				url: '/api/v0.1/notifications/' + $(self).data('id')
			}).done(function (result) {
				var height = bbSelf.$('.js-notification').outerHeight(true),
					$parent = $(self).parent();
				bbSelf.$el.css({height: height});

				if ($parent.parent().hasClass('js-bb-notification')) {
					$parent.parent().fadeOut(200,  function () {
						$(this).remove();
						bbSelf.$el.slideUp(250, function () {
							$(this).show().css({height: "auto"});
						});
					});
				} else {
					$parent.fadeOut(200,  function () {
						$(this).remove();
						bbSelf.$el.slideUp(250, function () {
							$(this).show().css({height: "auto"});
						});
					});
				}
			});
		}
	});

}());
