var HOME = process.env.HOME || process.env.USERPROFILE;

var expand = function(word) {
	return word.replace(/^~/, HOME);
};

exports.file = function(word, callback) {
	var fs = require('fs');
	var path = require('path');
	var dir = path.dirname(word+'.');

	if (word === '~') return callback(null, ['~/'], {exitCode:15});

	fs.readdir(expand(dir), function(err, files) {
		if (err) return callback(err);

		files = files.map(function(file) {
			return path.join(dir, file);
		});

		callback(null, files, {exitCode:15});
	});
};

exports.dir = function(word, callback) {
	var fs = require('fs');
	var path = require('path');
	var dir = path.dirname(word+'.');

	if (word === '~') return callback(null, ['~/'], {exitCode:15});

	fs.readdir(expand(dir), function(err, files) {
		if (err) return callback(err);

		files = files
			.map(function(file) {
				return path.join(dir, file);
			})
			.filter(function(file) {
				return fs.statSync(expand(file)).isDirectory();
			});

		if (files.length) return callback(null, files, {exitCode:15});
		if (fs.existsSync(expand(word)) && fs.statSync(expand(word)).isDirectory()) return callback(null, [word]);

		callback();
	});
};

exports.host = function(word, callback) {
	var fs = require('fs');
	var path = require('path');
	var prefix = word.indexOf('@') > -1 ? word.split('@')[0]+'@' : '';

	fs.readFile(path.join(HOME, '.ssh', 'known_hosts'), 'utf-8', function(err, hosts) {
		if (err) return callback(err);

		hosts = hosts.trim().split('\n').map(function(host) {
			return prefix + host.split(/[ ,]/)[0];
		});

		callback(null, hosts);
	});
};