#!/usr/bin/env node

var tab = require('../index');

tab()
	('--debug', '-d')
	(function(opts) {
		console.log('I am called if no one else matches');
	})

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
		console.log(opts);
	})

tab.parse() || tab.help();
