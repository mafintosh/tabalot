var fs = require('fs');
var path = require('path');

var HOME = process.env.HOME || process.env.USERPROFILE;

var PROFILE = [
	path.join(HOME, '.bashrc'),
	path.join(HOME, '.bash_profile')
].filter(fs.existsSync)[0] || path.join(HOME, '.bash_profile');

var BASH_COMPLETION_DIR = [
	'/usr/local/etc/bash_completion.d',
	'/etc/bash_completion.d',
	path.join(HOME, 'bash_completion.d'),
	path.join(HOME, '.bash_completion.d')
].filter(fs.existsSync)[0];

var TEMPLATE = fs.readFileSync(path.join(__dirname, 'template.sh'), 'utf-8');

var detectBin = function() {
	return (process.env._ || process.env.SUDO_COMMAND || '').split('/').pop().split(' ')[0];
};

module.exports = function(tab) {
	tab('completion')('--save', '-s')('--bin', '-b')('--dir', '-d')(function(opts) {
		var bin = opts.bin || detectBin();
		var completionDir = opts.dir || BASH_COMPLETION_DIR;

		if (!bin) {
			console.error('Could not detect bin name. Use --bin to specify it');
			process.exit(1);
		}

		var completion = TEMPLATE
			.replace(/\{cmd\}/g, bin)
			.replace(/\{completionDir\}/g, completionDir || '$BASH_COMPLETION_DIR')
			.replace(/\{profile\}/g, PROFILE.replace(HOME, '~'));

		if (opts.save) {
			if (!completionDir) {
				console.error('Could not locate bash_completion.d\nUse "'+bin+' completion" and do a manual install');
				process.exit(2);
			}
			try {
				fs.writeFileSync(path.join(completionDir, bin), completion);
			} catch (err) {
				if (err.code === 'EACCES') {
					console.error('Permission denied: could not write to '+path.join(completionDir, bin));
					process.exit(1);
				}
				throw err;
			}
			try {
				fs.writeSync(1, '# Completion for '+bin+' was installed.\n# To enable it now restart your terminal or\n\n. '+path.join(completionDir, bin)+'\n\n');
			} catch (err) {
				if (err.code !== 'EPIPE') throw err;
			}
			process.exit(0);
		}

		try {
			fs.writeSync(1, completion+'\n');
		} catch (err) {
			if (err.code !== 'EPIPE') throw err;
		}

		process.exit(0);
	});
};