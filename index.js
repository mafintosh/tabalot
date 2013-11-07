var minimist = require('minimist');

var cmds = {};
var options = {};
var positionals = {};
var aliases = {};

var toFunction = function(values) {
	if (typeof values === 'function') return values;

	if (values === '@file') return require('./helpers').file;
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

var normalize = function(argv) {
	Object.keys(argv).forEach(function(arg) {
		if (!aliases[arg]) return;
		var opt = aliases[arg];
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

	var onpositional = function(values) {
		if (name === '*') return pos[index++] = toFunction(values);
		if (name in cmds) pos[index++] = toFunction(cmds[name]);
		cmds[name] = values;
	};

	var onoption = function(name, shorts, values) {
		shorts.forEach(function(s) {
			aliases[s] = name;
		});
		opts[name] = toFunction(values);
	};

	var parse = function(a) {
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
	var cur = words[index] || '';
	var prev = words[index-1] || '';
	var argv = normalize(minimist(words));
	var _ = minimist(words.slice(0, index+1))._;
	var cmd = _[0];

	var callback = function(err, values, opts) {
		if (err) return process.exit(1);
		if (!opts) opts = {};

		values = [].concat(values || []).map(String);

		if (opts.filter !== false) {
			values = values.filter(function(value) {
				return value.slice(0, cur.length) === cur;
			});
		}

		process.stdout.write(values.join('\n'), function() {
			process.exit(opts.exitCode || 0);
		});
	};

	if (cur.slice(0, 2) === '--' || cur === '-') {
		var names = Object.keys(options[cmd] || options.__main__ || options['*'] || {});
		return callback(null, names.map(opt));
	}

	if (cur[0] === '-') {
		var alias = aliases[deopt(cur)];
		return alias ? callback(null, [opt(alias)], {filter:false}) : callback();
	}

	if (prev[0] === '-') {
		var name = deopt(prev);
		var fn = (options[cmd] || options.__main__ || options['*'] || {})[aliases[name] || name];
		if (fn) return call(fn, cur, argv, callback);
		return callback();
	}

	index = _.length-1;
	var pos = (positionals[cmd] || positionals.__main__ || {})[index];
	if (pos) return call(pos, cur, argv, callback);

	if (prev[0] === '-' || cur[0] === '-') return callback();
	if (_.length > 1) return callback();

	var words = Object.keys(cmds).filter(function(cmd) {
		return cmd !== '__main__' && cmd !== '*';
	});

	return callback(null, words);
};

tab.parse = function(argv) {
	argv = argv || process.argv.slice(2);

	if (argv[0] === 'completion' && argv[1] === '--') {
		complete(Number(argv[2]), argv.slice(3));
		return true;
	}
	if (argv[0] === 'completion') {
		require('./completion')(tab);
	}

	argv = normalize(minimist(argv));

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

			args.push(argv);
			cmds[cmd].apply(null, args);
		});
		return true;
	};

	return apply(argv._[0]) || apply();
};

module.exports = tab;