var fs = require('fs');
var path = require('path');

module.exports = function(bin) {
	var HOME = process.env.HOME || process.env.USERPROFILE;
	var CONFIG = path.join(HOME, '.tabalot');

	if (!fs.existsSync(CONFIG)) {
		var PROFILE = fs.existsSync(path.join(HOME, '.bash_profile')) ?
			path.join(HOME, '.bash_profile') :
			path.join(HOME, '.bashrc');

		fs.mkdirSync(CONFIG);
		fs.writeFileSync(path.join(CONFIG, 'rc'), fs.readFileSync(path.join(__dirname, 'rc')));
		fs.appendFileSync(PROFILE, '\n# Inserted by tabalot\n[ -f ~/.tabalot/rc ] && . ~/.tabalot/rc\n');
	}

	if (!bin) return;

	try {
		var data = fs.readFileSync(path.join(CONFIG, 'completions')).toString('utf-8').split('\n');
		if (data.indexOf(bin) > -1) return
	} catch (err) {
		// do nothing
	}

	fs.appendFileSync(path.join(CONFIG, 'completions'), bin+'\n');
};
