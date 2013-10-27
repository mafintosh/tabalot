#!/usr/bin/env node

var tab = require('../index');

tab('hello')(['first', 'argument', 'here'])
	('--tab', '-t', ['a', 'b', 'c'])
	('--debug', '-d')
	('--test', ['foo', 'bar', 'baz'])
	('--random', function(callback) {
		callback(null, Math.random());
	})
	(function(first, opts) {
		console.log('I was called with this positional argument:');
		console.log(first);
		console.log('and these options');
		console.log(options);
	})

tab.parse() || tab.help();
