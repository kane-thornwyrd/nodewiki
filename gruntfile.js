/* globals module */

function renameFn(extOld, extNew)
{
	return function(dest, path)
	{
		return dest + "/" + path.replace(extOld, extNew);
	};
}

module.exports = function(grunt)
{
	var config = 
	{
		pkg: grunt.file.readJSON("package.json"),
		less:
		{
			development:
			{
				options: {
					paths: ["static/assets/css"],
					ieCompat: false
				},
				files: {
					"static/assets/css/screen.css": "less/screen.less"
				}
			},
			production:
			{
				options: {
					paths: ["static/assets/css"],
					yuicompress: true,
					ieCompat: false
				},
				files: {
					"static/assets/css/screen.css": "less/screen.less"
				}
			}
		},
		watch: 
		{
			less:
			{
				files: ["less/*.less"],
				tasks: ["less:development"]
			},
			options: 
			{
				spawn: false
			}
		}
	};

	// Project configuration.
	grunt.initConfig(config);

	// NPM tasks
	grunt.loadNpmTasks("grunt-contrib-less");
	grunt.loadNpmTasks("grunt-contrib-watch");
};
