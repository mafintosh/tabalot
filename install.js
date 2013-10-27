var fs = require('fs');
var path = require('path');

var HOME = process.env.HOME || process.env.USERPROFILE;
var CONFIG = path.join(HOME, '.tabalot');
var PACKAGE = require(path.join(process.cwd(), 'package.json'));
var BIN = Object.keys(PACKAGE.bin || {}).reduce(function(result, key) {
	return result || path.join(process.cwd(), PACKAGE.bin[key]) === path.join(process.cwd(), process.env._) ? key : '';
}, '');

var PROFILE = fs.existsSync(path.join(HOME, '.bashrc')) ?
	path.join(HOME, '.bashrc') :
	path.join(HOME, '.bash_profile');

if (!fs.existsSync(CONFIG)) {
	fs.mkdirSync(CONFIG);
	fs.writeFileSync(path.join(CONFIG, 'bashrc'), fs.readFileSync(path.join(__dirname, 'bashrc')));
}

var SOURCING = fs.readFileSync(PROFILE, 'utf-8').indexOf('. ~/.tabalot/bashrc') > -1;

if (!BIN) return;

var data = '';

try {
	data = fs.readFileSync(path.join(CONFIG, 'bin'), 'utf-8').split('\n');
} catch (err) {
	// do nothing
}

if (data.indexOf(BIN) < 0) fs.appendFileSync(path.join(CONFIG, 'bin'), BIN+'\n');

if (SOURCING) {
	console.log(
		'Enable tab completion for '+BIN+' by\n'+
		'restarting your terminal or\n\n. ~/.tabalot/bashrc\n'
	);
} else {
	console.log(
		'Enable tab completion for '+BIN+' by\n'+
		'adding the following to '+PROFILE.replace(HOME, '~')+'\n\n'+
		'[ -f ~/.tabalot/bashrc ] && . ~/.tabalot/bashrc\n'
	);
}