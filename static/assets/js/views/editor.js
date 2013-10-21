// # Article Editor

/*global window, document, setTimeout, navigator, $, _, Backbone, Wiki, Showdown, CodeMirror, shortcut, Countable, JST */
(function () {
	"use strict";

	/*jslint regexp: true, bitwise: true */
	var PublishBar,
		ActionsWidget,
		UploadManager,
		MarkerManager,
		MarkdownShortcuts = [
			{'key': 'Ctrl+B', 'style': 'bold'},
			{'key': 'Meta+B', 'style': 'bold'},
			{'key': 'Ctrl+I', 'style': 'italic'},
			{'key': 'Meta+I', 'style': 'italic'},
			{'key': 'Ctrl+Alt+U', 'style': 'strike'},
			{'key': 'Ctrl+Shift+K', 'style': 'code'},
			{'key': 'Meta+K', 'style': 'code'},
			{'key': 'Ctrl+Alt+1', 'style': 'h1'},
			{'key': 'Ctrl+Alt+2', 'style': 'h2'},
			{'key': 'Ctrl+Alt+3', 'style': 'h3'},
			{'key': 'Ctrl+Alt+4', 'style': 'h4'},
			{'key': 'Ctrl+Alt+5', 'style': 'h5'},
			{'key': 'Ctrl+Alt+6', 'style': 'h6'},
			{'key': 'Ctrl+Shift+L', 'style': 'link'},
			{'key': 'Ctrl+Shift+I', 'style': 'image'},
			{'key': 'Ctrl+Q', 'style': 'blockquote'},
			{'key': 'Ctrl+Shift+1', 'style': 'currentDate'},
			{'key': 'Ctrl+U', 'style': 'uppercase'},
			{'key': 'Ctrl+Shift+U', 'style': 'lowercase'},
			{'key': 'Ctrl+Alt+Shift+U', 'style': 'titlecase'},
			{'key': 'Ctrl+Alt+W', 'style': 'selectword'},
			{'key': 'Ctrl+L', 'style': 'list'},
			{'key': 'Ctrl+Alt+C', 'style': 'copyHTML'},
			{'key': 'Meta+Alt+C', 'style': 'copyHTML'}
		],
		imageMarkdownRegex = /^(?:\{<(.*?)>\})?!(?:\[([^\n\]]*)\])(?:\(([^\n\]]*)\))?$/gim,
		markerRegex = /\{<([\w\W]*?)>\}/;
	/*jslint regexp: false, bitwise: false */

	// The publish bar associated with a post, which has the TagWidget and
	// Save button and options and such.
	// ----------------------------------------
	PublishBar = Wiki.View.extend({

		initialize: function () {
			this.addSubview(new ActionsWidget({el: this.$('#entry-actions'), model: this.model})).render();
		},

		render: function () { return this; }

	});

	// The Publish, Queue, Publish Now buttons
	// ----------------------------------------
	ActionsWidget = Wiki.View.extend({

		events: {
			'click .js-publish-button': 'handleSaveButton'
		},


		initialize: function () {
			_.bindAll(this, 'updateEntry');

			shortcut.add("Ctrl+S", this.updateEntry);
			shortcut.add("Meta+S", this.updateEntry);

			// this.listenTo(this.model, 'change:id', function (m) {
			//     Backbone.history.navigate('/editor/' + m.id + '/');
			// });
		},

		handleSaveButton: function (e) {
			if (e) { e.preventDefault(); }

			this.updateEntry();
		},

		updateEntry: function () {
			var self = this,
				model = this.model;

			model.trigger('willSave');

			this.saveEntry().then(function () {
				self.reportSaveSuccess();
				// Refresh publish button and all relevant controls with updated status.
				self.render();
			}, function (xhr) {
				// Set the model status back to previous
				// model.set({ status: prevStatus });
				// Show a notification about the error
				self.reportSaveError(model);
			});
		},

		saveEntry: function () {
			return this.model.save({
				title: $('#entry-title').val(),
				// TODO: The content_raw getter here isn't great, shouldn't rely on currentView.
				markdown: Wiki.currentView.getEditorValue()
			});
		},

		reportSaveSuccess: function () {
			Wiki.Notifications.clearEverything();
			Wiki.Notifications.addItem({
				type: 'success',
				message: 'Your changes have been saved.',
				status: 'passive'
			});
		},

		reportSaveError: function (model) {
			var message = 'Your changes could not be saved.';

			if (model.validationError) {
				// Grab a validation error
				message += " " + model.validationError;
			}

			Wiki.Notifications.clearEverything();
			Wiki.Notifications.addItem({
				type: 'error',
				message: message,
				status: 'passive'
			});
		},

		render: function () { return this; }

	});

	// The entire /editor page's route
	// ----------------------------------------
	Wiki.Views.Editor = Wiki.View.extend({

		initialize: function () {

			// Add the container view for the Publish Bar
			this.addSubview(new PublishBar({el: "#publish-bar", model: this.model})).render();

			this.$('#entry-title').val(this.model.get('name')).focus();
			this.$('#entry-markdown').text(this.model.get('markdown'));

			this.listenTo(this.model, 'change:name', this.renderName);

			this.initMarkdown();
			this.renderPreview();

			$('.entry-content header, .entry-preview header').on('click', function () {
				$('.entry-content, .entry-preview').removeClass('active');
				$(this).closest('section').addClass('active');
			});

			$('.entry-title .icon-fullscreen').on('click', function (e) {
				e.preventDefault();
				$('body').toggleClass('fullscreen');
			});

			this.$('.CodeMirror-scroll').on('scroll', this.syncScroll);

			this.$('.CodeMirror-scroll').scrollClass({target: '.entry-markdown', offset: 10});
			this.$('.entry-preview-content').scrollClass({target: '.entry-preview', offset: 10});


			// Zen writing mode shortcut
			shortcut.add("Alt+Shift+Z", function () {
				$('body').toggleClass('zen');
			});

			$('.entry-markdown header, .entry-preview header').click(function (e) {
				$('.entry-markdown, .entry-preview').removeClass('active');
				$(e.target).closest('section').addClass('active');
			});

		},

		events: {
			'blur #entry-title': 'trimTitle',
			'orientationchange': 'orientationChange'
		},

		syncScroll: _.throttle(function (e) {
			var $codeViewport = $(e.target),
				$previewViewport = $('.entry-preview-content'),
				$codeContent = $('.CodeMirror-sizer'),
				$previewContent = $('.rendered-markdown'),

				// calc position
				codeHeight = $codeContent.height() - $codeViewport.height(),
				previewHeight = $previewContent.height() - $previewViewport.height(),
				ratio = previewHeight / codeHeight,
				previewPostition = $codeViewport.scrollTop() * ratio;

			// apply new scroll
			$previewViewport.scrollTop(previewPostition);
		}, 10),

		trimTitle: function () {
			var $title = $('#entry-title'),
				rawTitle = $title.val(),
				trimmedTitle = $.trim(rawTitle);

			if (rawTitle !== trimmedTitle) {
				$title.val(trimmedTitle);
			}
		},

		renderName: function () {
			this.$('#entry-title').val(this.model.get('title'));
		},

		// This is a hack to remove iOS6 white space on orientation change bug
		// See: http://cl.ly/RGx9
		orientationChange: function () {
			if (/iPhone/.test(navigator.userAgent) && !/Opera Mini/.test(navigator.userAgent)) {
				var focusedElement = document.activeElement,
					s = document.documentElement.style;
				focusedElement.blur();
				s.display = 'none';
				setTimeout(function () { s.display = 'block'; focusedElement.focus(); }, 0);
			}
		},

		// This updates the editor preview panel.
		// Currently gets called on every key press.
		// Also trigger word count update
		renderPreview: function () {
			var self = this,
				preview = document.getElementsByClassName('rendered-markdown')[0];
			preview.innerHTML = this.converter.makeHtml(this.editor.getValue());

			if (window.Countable) {
				Countable.once(preview, function (counter) {
					self.$('.entry-word-count').text($.pluralize(counter.words, 'word'));
					self.$('.entry-character-count').text($.pluralize(counter.characters, 'character'));
					self.$('.entry-paragraph-count').text($.pluralize(counter.paragraphs, 'paragraph'));
				});
			}
		},

		// Markdown converter & markdown shortcut initialization.
		initMarkdown: function () {
			var self = this;

			this.converter = new Showdown.converter({extensions: ['ghostdown']});
			this.editor = CodeMirror.fromTextArea(document.getElementById('entry-markdown'), {
				mode: 'gfm',
				tabMode: 'indent',
				tabindex: "2",
				lineWrapping: true,
				dragDrop: false
			});
			this.uploadMgr = new UploadManager(this.editor);

			// Inject modal for HTML to be viewed in
			shortcut.add("Ctrl+Alt+C", function () {
				self.showHTML();
			});
			shortcut.add("Ctrl+Alt+C", function () {
				self.showHTML();
			});

			_.each(MarkdownShortcuts, function (combo) {
				shortcut.add(combo.key, function () {
					return self.editor.addMarkdown({style: combo.style});
				});
			});

			this.enableEditor();
		},

		options: {
			markers: {}
		},

		getEditorValue: function () {
			return this.uploadMgr.getEditorValue();
		},

		enableEditor: function () {
			var self = this;
			this.editor.setOption("readOnly", false);
			this.editor.on('change', function () {
				self.renderPreview();
			});
		},

		disableEditor: function () {
			var self = this;
			this.editor.setOption("readOnly", "nocursor");
			this.editor.off('change', function () {
				self.renderPreview();
			});
		},

		showHTML: function () {
			this.addSubview(new Wiki.Views.Modal({
				model: {
					options: {
						close: true,
						type: "info",
						style: ["wide"],
						animation: 'fade'
					},
					content: {
						template: 'copyToHTML',
						title: 'Copied HTML'
					}
				}
			}));
		},

		render: function () { return this; }
	});

	MarkerManager = function (editor) {
		var markers = {},
			uploadPrefix = 'image_upload',
			uploadId = 1;

		function addMarker(line, ln) {
			var marker,
				magicId = '{<' + uploadId + '>}';
			editor.setLine(ln, magicId + line.text);
			marker = editor.markText(
				{line: ln, ch: 0},
				{line: ln, ch: (magicId.length)},
				{collapsed: true}
			);

			markers[uploadPrefix + '_' + uploadId] = marker;
			uploadId += 1;
		}

		function getMarkerRegexForId(id) {
			id = id.replace('image_upload_', '');
			return new RegExp('\\{<' + id + '>\\}', 'gmi');
		}

		function stripMarkerFromLine(line) {
			var markerText = line.text.match(markerRegex),
				ln = editor.getLineNumber(line);

			if (markerText) {
				editor.replaceRange('', {line: ln, ch: markerText.index}, {line: ln, ch: markerText.index + markerText[0].length});
			}
		}

		function findAndStripMarker(id) {
			editor.eachLine(function (line) {
				var markerText = getMarkerRegexForId(id).exec(line.text),
					ln;

				if (markerText) {
					ln = editor.getLineNumber(line);
					editor.replaceRange('', {line: ln, ch: markerText.index}, {line: ln, ch: markerText.index + markerText[0].length});
				}
			});
		}

		function removeMarker(id, marker, line) {
			delete markers[id];
			marker.clear();

			if (line) {
				stripMarkerFromLine(line);
			} else {
				findAndStripMarker(id);
			}
		}

		function checkMarkers() {
			_.each(markers, function (marker, id) {
				var line;
				marker = markers[id];
				if (marker.find()) {
					line = editor.getLineHandle(marker.find().from.line);
					if (!line.text.match(imageMarkdownRegex)) {
						removeMarker(id, marker, line);
					}
				} else {
					removeMarker(id, marker);
				}
			});
		}

		function initMarkers(line) {
			var isImage = line.text.match(imageMarkdownRegex),
				hasMarker = line.text.match(markerRegex);

			if (isImage && !hasMarker) {
				addMarker(line, editor.getLineNumber(line));
			}
		}

		// public api
		_.extend(this, {
			markers: markers,
			checkMarkers: checkMarkers,
			addMarker: addMarker,
			stripMarkerFromLine: stripMarkerFromLine,
			getMarkerRegexForId: getMarkerRegexForId
		});

		// Initialise
		editor.eachLine(initMarkers);
	};

	UploadManager = function (editor) {
		var markerMgr = new MarkerManager(editor);

		function findLine(result_id) {
			// try to find the right line to replace
			if (markerMgr.markers.hasOwnProperty(result_id) && markerMgr.markers[result_id].find()) {
				return editor.getLineHandle(markerMgr.markers[result_id].find().from.line);
			}

			return false;
		}

		function checkLine(ln, mode) {
			var line = editor.getLineHandle(ln),
				isImage = line.text.match(imageMarkdownRegex),
				hasMarker;

			// We care if it is an image
			if (isImage) {
				hasMarker = line.text.match(markerRegex);

				if (hasMarker && mode === 'paste') {
					// this could be a duplicate, and won't be a real marker
					markerMgr.stripMarkerFromLine(line);
				}

				if (!hasMarker) {
					markerMgr.addMarker(line, ln);
				}
			}
			// TODO: hasMarker but no image?
		}

		function handleUpload(e, result_src) {
			/*jslint regexp: true, bitwise: true */
			var line = findLine($(e.currentTarget).attr('id')),
				lineNumber = editor.getLineNumber(line),
				match = line.text.match(/\([^\n]*\)?/),
				replacement = '(http://)';
			/*jslint regexp: false, bitwise: false */

			if (match) {
				// simple case, we have the parenthesis
				editor.setSelection({line: lineNumber, ch: match.index + 1}, {line: lineNumber, ch: match.index + match[0].length - 1});
			} else {
				match = line.text.match(/\]/);
				if (match) {
					editor.replaceRange(
						replacement,
						{line: lineNumber, ch: match.index + 1},
						{line: lineNumber, ch: match.index + 1}
					);
					editor.setSelection(
						{line: lineNumber, ch: match.index + 2},
						{line: lineNumber, ch: match.index + replacement.length }
					);
				}
			}
			editor.replaceSelection(result_src);
		}

		function getEditorValue() {
			var value = editor.getValue();

			_.each(markerMgr.markers, function (marker, id) {
				value = value.replace(markerMgr.getMarkerRegexForId(id), '');
			});

			return value;
		}

		// Public API
		_.extend(this, {
			getEditorValue: getEditorValue,
			handleUpload: handleUpload
		});

		// initialise
		editor.on('change', function (cm, changeObj) {
			var linesChanged = _.range(changeObj.from.line, changeObj.from.line + changeObj.text.length);

			_.each(linesChanged, function (ln) {
				checkLine(ln, changeObj.origin);
			});

			// Is this a line which may have had a marker on it?
			markerMgr.checkMarkers();
		});
	};

}());
