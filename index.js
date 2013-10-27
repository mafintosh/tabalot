var minimist = require('minimist');

var cmds = {};
var options = {};
var positionals = {};
var aliases = {};

var noop = function() {};

var unopt = function(opt) {
	return opt.replace(/-/g, '');
};

var opt = function(name) {
	return '--'+name;
};

var toFunction = function(values) {
	if (typeof values === 'function') return values;
	return function(callback) {
		callback(null, values);
	};
};

var tab = function(name) {
	if (typeof name === 'function') return module.exports(name.name, name);

	var index = 1;

	options[name] = {};
	positionals[name] = {};

	var onpositional = function(values) {
		if (name in cmds) positionals[name][index++] = toFunction(cmds[name]);
		cmds[name] = values;
	};

	var onoption = function(long, short, values) {
		if (typeof short !== 'string') return onoption(long, long, short);
		aliases[short] = long;
		options[name][unopt(long)] = toFunction(values);
	};

	var opt = function(a, b, c) {
		if (typeof a === 'string' && a[0] === '-') onoption(a, b, c);
		else onpositional(a);
		return opt;
	};

	return opt;
};

tab.complete = function(index, words) {
	var cur = words[index] || '';
	var prev = words[index-1] || '';
	var _ = minimist(words.slice(0, index+1))._;
	var cmd = _[0];

	var callback = function(err, values) {
		if (err) return;
		values = [].concat(values || []).filter(function(value) {
			return (''+value).slice(0, cur.length) === cur;
		});
		console.log(values.join('\n'));
	};

	if (cur.slice(0, 2) === '--') {
		var names = Object.keys(options[cmd] || {});
		return callback(null, names.map(opt));
	}

	if (aliases[cur]) return console.log(aliases[cur]);
	if (aliases[prev]) prev = aliases[prev];

	if (prev.slice(0, 2) === '--') {
		var name = unopt(prev);
		var fn = (options[cmd] || {})[name];
		return fn ? fn(callback) : callback();
	}

	if (prev[0] === '-' || cur[0] === '-') return callback();

	if (_.length < 2) return callback(null, Object.keys(cmds));

	index = _.length-1;

	if (!positionals[cmd] || !positionals[cmd][index]) return callback();

	positionals[cmd][index](callback);
};

tab.help = function() {
	console.log('Unknown command');
};

tab.parse = function(argv) {
	var bin = (process.env._ || '').split('/').pop();
	var installed = (process.env.TABALOT || '').split(':');

	if (bin && installed.indexOf(bin) < 0) {
		require('./install')(bin);
	}

	argv = argv || process.argv.slice(2);
	if (argv[0] === '--tabalot') {
		tab.complete(Number(argv[1]), argv.slice(2));
		process.exit(0);
	}
	argv = minimist(argv);
	var cmd = argv._[0];

	if (!cmds[cmd]) return false;

	argv._.shift();

	var arity = Object.keys(positionals[cmd]).length;
	var args = [];

	for (var i = 0; i < arity; i++) {
		args[i] = argv._[i];
	}

	delete argv._;
	args.push(argv);
	cmds[cmd].apply(null, args);

	return true;
};

module.exports = tab;
