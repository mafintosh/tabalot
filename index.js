var minimist = require('minimist');

var cmds = {};
var options = {};
var positionals = {};
var aliases = {};

var toFunction = function(values) {
	if (typeof values === 'function') return values;

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

	var filter = function(err, values) {
		if (err) return finish(err);
		values = [].concat(values || []).map(String).filter(function(value) {
			return value.slice(0, cur.length) === cur;
		});
		finish(null, values);

	};
	var finish = function(err, values) {
		if (err) return process.exit(1);
		console.log(values.join('\n'));
		process.exit(0);
	};

	if (cur.slice(0, 2) === '--' || cur === '-') {
		var names = Object.keys(options[cmd] || options.__main__ || options['*'] || {});
		return filter(null, names.map(opt));
	}

	if (aliases[cur]) return finish(null, [aliases[cur]]);
	if (aliases[prev]) prev = aliases[prev];

	if (prev.slice(0, 2) === '--') {
		var name = unopt(prev);
		var fn = (options[cmd] || options.__main__ || options['*'] || {})[name];
		if (fn) return call(fn, cur, argv, filter);
		return filter();
	}

	index = _.length-1;
	var pos = (positionals[cmd] || positionals.__main__ || {})[index];
	if (pos) return call(pos, cur, argv, filter);

	if (prev[0] === '-' || cur[0] === '-') return filter();
	if (_.length > 1) return filter();

	var words = Object.keys(cmds).filter(function(cmd) {
		return cmd !== '__main__' && cmd !== '*';
	});

	return filter(null, words);
};

tab.parse = function(argv) {
	argv = argv || process.argv.slice(2);

	if (argv[0] === '--tabalot' && argv.length === 1) {
		return require('./install');
	}
	if (argv[0] === '--tabalot') {
		return complete(Number(argv[1]), argv.slice(2));
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