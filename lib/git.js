var child_process = require("child_process");

function join(arr, encoding) {
  var result, index = 0, length;
  length = arr.reduce(function(l, b) {
    return l + b.length;
  }, 0);
  result = new Buffer(length);
  arr.forEach(function(b) {
    b.copy(result, index);
    index += b.length;
  });
  if (encoding) {
    return result.toString(encoding);
  }
  return result;
}

function gitExec (args, directory, callback, encoding) {
	var git;

	try {
		git = child_process.spawn('C:\\Program Files (x86)\\SparkleShare\\msysgit\\bin\\git.exe', args, {cwd: directory})
	} catch (e) {
		callback(e, null);
	}

	var stdout = [], stderr = [];

	git.stdout.on('data', function (text) {
		stdout[stdout.length] = text;
	});

	git.stderr.on('data', function (text) {
		stderr[stderr.length] = text;
	});

	var exitCode;
	git.on('exit', function (code) {
		exitCode = code;
	});

	git.addListener('close', function () {
		if (exitCode > 0) {
			var err = new Error("git command failed");
			err.exitCode = exitCode;
			callback(err);
		} else {
			callback(null, join(stdout, encoding || 'utf8'));
		}
	});

	git.stdin.end();
}

function commit (file, directory) {

	// create new git process which adds the file needed to be commited
	var git = child_process.spawn('git', ['add', file.name], {cwd: directory})

	git.stdout.on('data', function (data) {
		console.log('git: ' + data);
	});

	git.stderr.on('data', function (data) {
		console.log('git err: ' + data);
	});

	git.on('exit', function (code) {
		gitCommit = child_process.spawn('git', ['commit', '-m', 'nodewiki auto commit', file.name], {cwd: directory});

		gitCommit.stdout.on('data', function (data) {
			console.log('git: ' + data);
		});

		gitCommit.stderr.on('data', function (data) {
			console.log('git err: ' + data);
		});
	});

}

function push (directory, remote, branch) {
	var args = ['push'];

	if (remote && branch) {
		args.push(remote);
		args.push(branch);
	}

	// create new git process which adds the file needed to be commited
	var git = child_process.spawn('git', args, {cwd: directory});

	git.stdout.on('data', function(data){
		console.log('git: ' + data);
	});

	git.stderr.on('data', function(data){
		console.log('git err: ' + data);
	});

}

function log (directory, file, callback) {
	return gitExec(
		['log', '--pretty="format:%ai|%s"', file],
		directory,
		function (error, result) {
			if (error) {
				callback(error, null);
				return;
			}

			var results = [];

			result.split(/\n/).forEach(function (line) {
				// on come versions of git, they use --pretty=XY as a synonon for --pretty="format:XY"
				// so we clean that up here
				line = line.replace(/^\"|\"$/g, '').replace(/^format\:/, '');

				// we do not use split in case the commit message has a pipe symbol (|) in it
				var offset = line.indexOf('|');
				results.push({
					date: line.substr(0, offset),
					message: line.substr(offset+1)
				});
			});

			callback(error, results);
		}
	);
}

function revisions (directory, file, callback) {
	return log(directory, file, function (error, log) {
		callback(error, log ? log.length : null);
	});
}

exports.commit = commit;
exports.push = push;
exports.log = log;
exports.revisions = revisions;
