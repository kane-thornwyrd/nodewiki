(function () {
	"use strict";

	Wiki.Router = Backbone.Router.extend({

		routes: {
			'': 'wiki',
			'w(/:name)/edit': 'edit',
			'w(/:name)': 'view'
		},

		wiki: function () {
			$('body').removeClass('editor').addClass('manage');
			$('.content-view-container').removeClass('hidden');
			$('.entry-container, #publish-bar').addClass('hidden');

			if (!Wiki.Home) {
				Wiki.Home = new Wiki.Views.Home({ el: '#main', collection: Wiki.Entries });
			}
		},

		// settings: function (pane) {
		// 	if (!pane) {
		// 		// Redirect to settings/general if no pane supplied
		// 		this.navigate('/settings/general/', {
		// 			trigger: true,
		// 			replace: true
		// 		});
		// 		return;
		// 	}

		// 	// only update the currentView if we don't already have a Settings view
		// 	if (!Ghost.currentView || !(Ghost.currentView instanceof Ghost.Views.Settings)) {
		// 		Ghost.currentView = new Ghost.Views.Settings({ el: '#main', pane: pane });
		// 	}
		// },

		view: function (name) {
			$('body').removeClass('editor').addClass('manage');
			$('.content-view-container').removeClass('hidden');
			$('.entry-container, #publish-bar').addClass('hidden');

			function open () {
				var model = Wiki.Entries.getByName(name);
				
				if (Wiki.Home instanceof Wiki.Views.Home) {
					Backbone.trigger('wiki:activeItem', model.cid);
				} else {
					Wiki.Home = new Wiki.Views.Home({ el: '#main', collection: Wiki.Entries, restore: model });
				}
			}

			if (Wiki.Entries.length > 0) {
				open();
			} else {
				this.listenToOnce(Wiki.Socket, 'socket:files', open);
			}
		},

		edit: function (name) {
			var model = Wiki.Entries.getByName(name);

			if (!model) {
				model = new Wiki.Models.Entry();
				model.set('name', name);

				model.fetch().then(function () {
					$('body').removeClass('manage').addClass('editor');
					$('.entry-container, #publish-bar').removeClass('hidden');
					$('.content-view-container').addClass('hidden');
					Wiki.currentView = new Wiki.Views.Editor({ el: '#main', model: model });
				});
			} else if (!Wiki.currentView) {
				$('body').removeClass('manage').addClass('editor');
				$('.entry-container, #publish-bar').removeClass('hidden');
				$('.content-view-container').addClass('hidden');
				Wiki.currentView = new Wiki.Views.Editor({ el: '#main', model: model });
			} else {
				// temporary hack, need to cleanup the existing editor before creating another
				window.location.reload();
			}
		}

	});
})();
