var minimist = require('minimist');

var cmds = {};
var options = {};
var positionals = {};
var aliases = {};
var all = [];

var noop = function() {};

var unopt = function(opt) {
	return opt.replace(/-/g, '');
};

var opt = function(name) {
	return '--'+name;
};

var normalize = function(argv) {
	Object.keys(argv).forEach(function(arg) {
		if (!aliases['-'+arg]) return;
		argv[unopt(aliases['-'+arg])] = argv[arg];
		delete argv[arg];
	});
	return argv;
};

var toFunction = function(values) {
	if (typeof values === 'function') return values;
	return function(callback) {
		callback(null, values);
	};
};

var tab = function(name) {
	if (typeof name === 'function') return tab()(name);

	var index = name ? 1 : 0;

	name = name || '__main__';
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

	all.forEach(function(args) {
		opt.apply(null, args);
	});

	return opt;
};

tab.all = function() {
	all.push(arguments);
	return tab.all;
};

tab.complete = function(index, words, callback) {
	var cur = words[index] || '';
	var prev = words[index-1] || '';
	var argv = normalize(minimist(words.slice(0, index+1)));
	var _ = argv._;
	var cmd = _[0];

	var finish = function(err, values) {
		if (err) return;
		values = [].concat(values || []).filter(function(value) {
			return (''+value).slice(0, cur.length) === cur;
		});
		callback(null, values);
	};

	if (cur.slice(0, 2) === '--' || cur === '-') {
		var names = Object.keys(options[cmd] || options.__main__ ||  {});
		return finish(null, names.map(opt));
	}

	if (aliases[cur]) return callback(null, [aliases[cur]]);
	if (aliases[prev]) prev = aliases[prev];

	if (prev.slice(0, 2) === '--') {
		var name = unopt(prev);
		var fn = (options[cmd] || options.__main__ || {})[name];
		return fn ? fn.call(argv, finish) : finish();
	}

	if (prev[0] === '-' || cur[0] === '-') return finish();

	index = _.length-1;

	var pos = (positionals[cmd] || positionals.__main__ || {})[index];
	if (pos) return pos.call(argv, finish);

	if (_.length < 2) {
		delete cmds.__main__;
		return finish(null, Object.keys(cmds));
	}

	finish();
};

tab.help = function() {
	console.log('Unknown command');
};

tab.install = function() {
	require('./install'); // deferred require for faster tab completion load
};

tab.parse = function(argv) {
	argv = argv || process.argv.slice(2);

	if (argv[0] === '--tabalot') {
		if (argv.length === 1) {
			tab.install();
			process.exit(0);
		}
		tab.complete(Number(argv[1]), argv.slice(2), function(err, words) {
			console.log((words || []).join('\n'))
			process.exit(0);
		});
		return;
	}

	argv = normalize(minimist(argv));

	var apply = function(cmd) {
		process.nextTick(function() {
			var arity = Object.keys(positionals[cmd]).length;
			var args = [];

			for (var i = 0; i < arity; i++) {
				args[i] = argv._[i];
			}

			delete argv._;
			args.push(argv);
			cmds[cmd].apply(null, args);
		});
		return true;
	};

	var cmd = argv._[0];

	if (!cmds[cmd]) {
		if (cmds.__main__) return apply('__main__');
		return false;
	}

	argv._.shift();
	return apply(cmd);
};

module.exports = tab;
