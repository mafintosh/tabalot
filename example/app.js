#!/usr/bin/env node

var tab = require('../index');

tab('hello')()()
	('--tab', '-t', ['a', 'b', 'c'])
	('--abe', '-a')
	('--test', ['abe', 'fest', process.env._])
	('--random', function(callback) {
		callback(null, Math.random());
	})
	(function(a, b, opts) {
		require('./install')
	})

tab.parse() || tab.help();
