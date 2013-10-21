/*global window, document, setTimeout, Wiki, $, _, Backbone, JST, shortcut */
(function () {
	"use strict";

	Wiki.TemplateView = Backbone.View.extend({
		templateData: function () {
			if (this.model) {
				return this.model.attributes;
			}

			if (this.collection) {
				return this.collection.toJSON();
			}

			return {};
		},

		render: function () {
			if (_.isFunction(this.beforeRender)) {
				this.beforeRender();
			}

			this.$el.html(this.template(this.templateData()));

			if (_.isFunction(this.afterRender)) {
				this.afterRender();
			}

			return this;
		}
	});

	Wiki.View = Wiki.TemplateView.extend({

		// Adds a subview to the current view, which will
		// ensure its removal when this view is removed,
		// or when view.removeSubviews is called
		addSubview: function (view) {
			if (!(view instanceof Backbone.View)) {
				throw new Error("Subview must be a Backbone.View");
			}
			this.subviews = this.subviews || [];
			this.subviews.push(view);
			return view;
		},

		// Removes any subviews associated with this view
		// by `addSubview`, which will in-turn remove any
		// children of those views, and so on.
		removeSubviews: function () {
			var children = this.subviews;

			if (!children) {
				return this;
			}

			_(children).invoke("remove");

			this.subviews = [];
			return this;
		},

		// Extends the view's remove, by calling `removeSubviews`
		// if any subviews exist.
		remove: function () {
			if (this.subviews) {
				this.removeSubviews();
			}
			return Backbone.View.prototype.remove.apply(this, arguments);
		}
	});

	Wiki.Views.Utils = {

		// Getting URL vars
		getUrlVariables: function () {
			var vars = [],
				hash,
				hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&'),
				i;

			for (i = 0; i < hashes.length; i += 1) {
				hash = hashes[i].split('=');
				vars.push(hash[0]);
				vars[hash[0]] = hash[1];
			}
			return vars;
		}
	};

	// ## Modals
	Wiki.Views.Modal = Wiki.View.extend({
		el: '#modal-container',
		templateName: 'modal',

		template: _.template(
			'<article class="modal{{#if options.type}}-{{options.type}}{{/if}} {{#if options.style}}{{#each options.style}}modal-style-{{this}} {{/each}}{{/if}}{{options.animation}} js-modal">\
				<section class="modal-content">\
					{{#if content.title}}<header class="modal-header"><h1>{{content.title}}</h1></header>{{/if}}\
					{{#if options.close}}<a class="close" href="#"><span class="hidden">Close</span></a>{{/if}}\
					<section class="modal-body">\
					</section>\
					{{#if options.confirm}}\
					<footer class="modal-footer">\
						<button class="js-button-accept {{#if options.confirm.accept.buttonClass}}{{options.confirm.accept.buttonClass}}{{else}}button-add{{/if}}">{{options.confirm.accept.text}}</button>\
						<button class="js-button-reject {{#if options.confirm.reject.buttonClass}}{{options.confirm.reject.buttonClass}}{{else}}button-delete{{/if}}">{{options.confirm.reject.text}}</button>\
					</footer>\
					{{/if}}\
				</section>\
			</article>'
		),

		className: 'js-bb-modal',
		// Render and manages modal dismissal
		initialize: function () {
			this.render();
			var self = this;
			if (this.model.options.close) {
				shortcut.add("ESC", function () {
					self.removeElement();
				});
				$(document).on('click', '.modal-background', function () {
					self.removeElement();
				});
			} else {
				shortcut.remove("ESC");
				$(document).off('click', '.modal-background');
			}

			if (this.model.options.confirm) {
				// Initiate functions for buttons here so models don't get tied up.
				this.acceptModal = function () {
					this.model.options.confirm.accept.func.call(this);
					self.removeElement();
				};
				this.rejectModal = function () {
					this.model.options.confirm.reject.func.call(this);
					self.removeElement();
				};
			}
		},
		templateData: function () {
			return this.model;
		},
		events: {
			'click .close': 'removeElement',
			'click .js-button-accept': 'acceptModal',
			'click .js-button-reject': 'rejectModal'
		},
		afterRender: function () {
			this.$el.fadeIn(50);
			$(".modal-background").fadeIn(10, function () {
				$(this).addClass("in");
			});
			if (this.model.options.confirm) {
				this.$('.close').remove();
			}
			this.$(".modal-body").html(this.addSubview(new Wiki.Views.Modal.ContentView({model: this.model})).render().el);

//            if (document.body.style.webkitFilter !== undefined) { // Detect webkit filters
//                $("body").addClass("blur"); // Removed due to poor performance in Chrome
//            }

			if (_.isFunction(this.model.options.afterRender)) {
				this.model.options.afterRender.call(this);
			}
			if (this.model.options.animation) {
				this.animate(this.$el.children(".js-modal"));
			}
		},
		// #### remove
		// Removes Backbone attachments from modals
		remove: function () {
			this.undelegateEvents();
			this.$el.empty();
			this.stopListening();
			return this;
		},
		// #### removeElement
		// Visually removes the modal from the user interface
		removeElement: function (e) {
			if (e) {
				e.preventDefault();
				e.stopPropagation();
			}

			var self = this,
				$jsModal = $('.js-modal'),
				removeModalDelay = $jsModal.transitionDuration(),
				removeBackgroundDelay = self.$el.transitionDuration();

			$jsModal.removeClass('in');

			if (!this.model.options.animation) {
				removeModalDelay = removeBackgroundDelay = 0;
			}

			setTimeout(function () {

				if (document.body.style.filter !== undefined) {
					$("body").removeClass("blur");
				}
				$(".modal-background").removeClass('in');

				setTimeout(function () {
					self.remove();
					self.$el.hide();
					$(".modal-background").hide();
				}, removeBackgroundDelay);
			}, removeModalDelay);

		},
		// #### animate
		// Animates the animation
		animate: function (target) {
			setTimeout(function () {
				target.addClass('in');
			}, target.transitionDuration());
		}
	});

	// ## Modal Content
	Wiki.Views.Modal.ContentView = Wiki.View.extend({

		template: function (data) {
			return JST['modals/' + this.model.content.template](data);
		},
		templateData: function () {
			return this.model;
		}

	});
}());
