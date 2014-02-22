var fs = require("fs");
var allowedExtensions = require("./allowedExtensions");
var git = require("./git");
var withMeta = require('./meta').withMeta;

// get contents of current directory
function getFiles (directory, cb) {
	withMeta(directory, function(meta){
		try {
			var currentFiles = fs.readdirSync(directory);
			var dir = [];
			currentFiles.forEach(function (fileName) {

				// ignore hidden files
				if (fileName.charAt(0) == '.') {
					return;
				}

				var stat = fs.statSync(directory + fileName);

				if (stat.isDirectory()) {
					dir.push({
						id: directory + fileName,
						name: fileName + '/',
						type: 'folder'
					});
				} else if (allowedExtensions.isMarkdown(fileName)) {
					dir.push({
						id: directory + fileName,
						name: fileName,
						type: 'md'
					});
				// } else {
				//   dir.push({
				//     name: fileName,
				//     folder: false,
				//     markdown: false
				//   });
				}

			});

			// "alphabetical" sorting, doesn't quite work - puts capital letters
			// ahead of lowercase letters but other then that its ok
			dir.sort(function (a, b) {
				return a.name - b.name;
			});

			// after the alphebetical sorting, the folders get serpated from the files
			dir.sort(function (a, b) {
				if (a.type == 'folder' && b.type != 'folder') return -1;
				if (a.type != 'folder' && b.type == 'folder') return 1;
				return 0;
			});

			cb(dir);
		} catch (err) {
			console.log('error with getDir() on getDir.js: ' + err);
			cb([]);
		}
	});
}

function getDetails (directory, files, cb) {
	try {
		var dir = [], i = 0, m = files.length;

		function isComplete() {
			if (i >= files.length) {
				cb(false, dir);
			}
		}

		files.forEach(function (file) {
			if (file.type == 'md') {
				git.revisions(directory, file.name, function (err, num) {
					if (!err) {
						dir.push({
							id: file.id,
							revisions: num
						});
					}

					i++;
					isComplete();
				});
			} else {
				i++;
			}
		});
	} catch (err) {
		console.log('error with getDir.js::getDetails(): ' + err);
		cb(true, []);
	}
}

exports.getDir = getFiles;
exports.getDetails = getDetails;
