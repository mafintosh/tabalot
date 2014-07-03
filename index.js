var minimist = require('minimist');

var cmds = {};
var options = {};
var positionals = {};
var aliases = {};
var wildcards = {};

var toFunction = function(values) {
	if (typeof values === 'function') return values;

	if (values === '@file') return require('./helpers').file;
	if (values === '@dir')  return require('./helpers').dir;
	if (values === '@host') return require('./helpers').host;

	return function(callback) {
		callback(null, values);
	};
};

var clone = function(obj) {
	var c = {};
	Object.keys(obj || {}).forEach(function(key) {
		c[key] = obj[key];
	});
	return c;
};

var normalize = function(cmd, argv) {
	var aka = aliases[cmd] || aliases.__main__ || aliases['*'] || {};
	Object.keys(argv).forEach(function(arg) {
		if (!aka[arg]) return;
		var opt = aka[arg];
		argv[opt] = argv[opt] ? [].concat(argv[opt], argv[arg]) : argv[arg];
		delete argv[arg];
	});
	return argv;
};

var opt = function(name) {
	return '--'+name;
};

var deopt = function(opt) {
	return opt.replace(/^-+/g, '');
};

var tab = function(name) {
	var index = name ? 1 : 0;

	name = name || '__main__';
	var opts = options[name] = clone(options['*']);
	var pos = positionals[name] = clone(positionals['*']);
	var alias = aliases[name] = clone(aliases['*']);

	var onpositional = function(values) {
		if (name === '*') return pos[index++] = toFunction(values);
		if (name in cmds) pos[index++] = toFunction(cmds[name]);
		cmds[name] = values;
	};

	var onwildcard = function(values) {
		wildcards[name] = toFunction(values);
	}

	var onoption = function(name, shorts, values) {
		shorts.forEach(function(s) {
			alias[s] = name;
		});
		opts[name] = toFunction(values);
	};


	var parse = function(a, b) {
		if (a === '*') {
			onwildcard(b);
			return parse;
		}
		if (typeof a !== 'string' || a[0] !== '-') {
			onpositional(a);
			return parse;
		}
		var shorts = Array.prototype.slice.call(arguments, 1);
		var values = (shorts[shorts.length - 1] || '')[0] === '-' ? undefined : shorts.pop();
		onoption(deopt(a), shorts.map(deopt), values);
		return parse;
	};

	return parse;
};

var call = function(fn, word, opts, callback) {
	if (fn.length === 3) return fn(word, opts, callback);
	if (fn.length === 2) return fn(word, callback);
	fn(callback);
};

var complete = function(index, words) {
	var ch = (words[index] || '')[0];

	words = words.map(function(word) {
		if (word[0] === '"') return word.replace(/(^")|("$)/g, '').replace(/\\"/g, '"');
		if (word[0] === "'") return word.replace(/(^')|('$)/g, '').replace(/\\'/g, "'");
		return word.replace(/\\(.)/g, '$1');
	});

	var cur = words[index] || '';
	var prev = words[index-1] || '';
	var _ = minimist(words.slice(0, index+1))._;
	var cmd = _[0];
	var argv = normalize(cmd, minimist(words));

	var callback = function(err, values, opts) {
		if (err) return process.exit(1);
		if (!opts) opts = {};

		values = [].concat(values || []).map(String);

		if (opts.filter !== false) {
			values = values.filter(function(value) {
				return value.slice(0, cur.length) === cur;
			});
		}

		values = values.map(function(word) {
			if (ch === '"') return word.replace(/"/g, '\\"')+'"';
			if (ch === "'") return word.replace(/'/g, "\\'")+"'";
			return word.replace(/([ ;!"'$()\[\]^{}&*?\\<>,`|])/g, '\\$1');
		});

		process.stdout.write(values.join('\n'), function() {
			process.exit(opts.exitCode || 0);
		});
	};

	if (cur.slice(0, 2) === '--' || cur === '-') {
		var names = Object.keys(options[cmd] || options.__main__ || options['*'] || {});
		return callback(null, names.map(opt));
	}

	var aka = aliases[cmd] || aliases.__main__ || aliases['*'] || {};

	if (cur[0] === '-') {
		var alias = aka[deopt(cur)];
		return alias ? callback(null, [opt(alias)], {filter:false}) : callback();
	}

	if (prev[0] === '-') {
		var name = deopt(prev);
		var fn = (options[cmd] || options.__main__ || options['*'] || {})[aka[name] || name];
		if (fn) return call(fn, cur, argv, callback);
		return callback();
	}

	index = _.length-1;
	var pos = (positionals[cmd] || positionals.__main__ || {})[index] || wildcards[cmd] || wildcards.__main__;
	if (pos) return call(pos, cur, argv, callback);

	if (prev[0] === '-' || cur[0] === '-') return callback();
	if (_.length > 1) return callback();

	var words = Object.keys(cmds).filter(function(cmd) {
		return cmd !== '__main__' && cmd !== '*';
	});

	return callback(null, words);
};

var parseCompletion = function(argv) {
	for (var i = 0; i < argv.length; i++) {
		if (argv[i] === 'completion' && argv[i+1] === '--' && (argv[i-1] || '')[0] !== '-') {
			return argv.slice(i+2).concat(argv.slice(0, i));
		}
	}
	return null;
};

tab.completion = require('./completion');

tab.parse = function(argv, opts) {
	if (argv && !Array.isArray(argv)) return tab.parse(null, argv);
	argv = argv || process.argv.slice(2);

	var completion = parseCompletion(argv);
	if (completion) {
		complete(Number(completion.shift()), completion);
		return true;
	}

	argv = minimist(argv, opts || {});
	if (argv._[0] === 'completion') tab('completion')('--save', '-s')('--bin', '-b')('--dir', '-d')(tab.completion);

	var apply = function(cmd) {
		var offset = cmd ? 1 : 0;

		if (!cmd) cmd = '__main__';
		if (!cmds[cmd]) return false;

		process.nextTick(function() {
			var arity = Object.keys(positionals[cmd]).length;
			var args = [];

			for (var i = 0; i < arity; i++) {
				args[i] = argv._[i+offset];
			}

			args.push(normalize(cmd, argv));
			cmds[cmd].apply(null, args);
		});
		return true;
	};

	return apply(argv._[0]) || apply();
};

module.exports = tab;
