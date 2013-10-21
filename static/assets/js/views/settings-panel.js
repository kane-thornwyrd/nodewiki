// The Post Settings Menu available in the content preview screen, as well as the post editor.

/*global window, document, $, _, Backbone, Wiki, moment */

(function () {
    "use strict";

    Wiki.View.SettingsPanel = Wiki.View.extend({

        events: {
            'click .refresh': 'refresh',
            // 'click .rename': 'rename',
            'click .delete' : 'deletePost'
        },

        initialize: function () {
            this.listenTo(this.model, 'change:id', this.render);
            this.listenTo(this.model, 'change:status', this.render);
            this.listenTo(this.model, 'change:published_at', this.render);
        },

        render: function () {
            if (!this.model.neu) {
                this.$('.post-edit').attr('href', this.model.getEditUri());

                this.$('.post-settings').removeClass('hidden');
            }
        },

        refresh: function (e) {
            e.preventDefault();
            this.model.fetch();
        },

        // rename: function (e) {},

        deletePost: function (e) {
            e.preventDefault();
            var self = this;
            this.addSubview(new Wiki.Views.Modal({
                model: {
                    options: {
                        close: false,
                        confirm: {
                            accept: {
                                func: function () {
                                    self.model.destroy({
                                        wait: true
                                    }).then(function () {
                                        // Redirect to content screen if deleting post from editor.
                                        if (window.location.pathname.indexOf('editor') > -1) {
                                            window.location = '/ghost/content/';
                                        }
                                        Wiki.notifications.addItem({
                                            type: 'success',
                                            message: 'Your post has been deleted.',
                                            status: 'passive'
                                        });
                                    }, function () {
                                        Wiki.notifications.addItem({
                                            type: 'error',
                                            message: 'Your post could not be deleted. Please try again.',
                                            status: 'passive'
                                        });
                                    });
                                },
                                text: "Yes"
                            },
                            reject: {
                                func: function () {
                                    return true;
                                },
                                text: "No"
                            }
                        },
                        type: "action",
                        style: ["wide", "centered"],
                        animation: 'fade'
                    },
                    content: {
                        template: 'blank',
                        title: 'Are you sure you want to delete this post?'
                    }
                }
            }));
        }

    });

}());