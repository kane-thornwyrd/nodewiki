var path = require("path");

var allowedExts = [
	'.md',
	'.mdown',
	'.markdown',
	'.mkd',
	'.mkdn',
	'.txt'
];

// checks if a given file name is allowed (this is usually for reading or writing)
function checkExtension (fileName) {
	var ext = path.extname(fileName);
	return allowedExts.indexOf(ext) > -1;
}

exports.checkExtension = checkExtension;
