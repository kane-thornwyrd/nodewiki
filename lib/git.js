var child_process = require("child_process");

function commit(file, directory){

  // create new git process which adds the file needed to be commited
  var git = child_process.spawn('git', ['add', file.name], {cwd: directory})

  git.stdout.on('data', function(data){
    console.log('git: ' + data);
  });

  git.stderr.on('data', function(data){
    console.log('git err: ' + data);
  });

  git.on('exit', function(code){
    gitCommit = child_process.spawn('git', ['commit', '-m', 'nodewiki auto commit', file.name], {cwd: directory});

    gitCommit.stdout.on('data', function(data){
      console.log('git: ' + data);
    });

    gitCommit.stderr.on('data', function(data){
      console.log('git err: ' + data);
    });

  });

}

function push(directory, remote, branch){
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

exports.commit = commit;
exports.push = push;
