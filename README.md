# tabalot

Tab complete all the things!

	npm install tabalot

tabalot is a node module that lets you build command line apps with
rich built in tab completion support

After installing the module you need to either source your bash profile
again or do

	. ~/.tabalot/rc

This will init the completer. You only need to do this once.

## Getting started

Lets make a sample app and link it with npm.
Write the example below to a file called `my-app.js`

``` js
#!/usr/bin/env node
var tab = require('tabalot');

tab('hello')
	(function() {
		console.log('world');
	})

tab.parse()
```

You need to add a `package.json` file as well to make npm link it.
The `package.json` below will just make `my-app.js` executable as `my-app`

``` js
{
	"name": "my-app",
	"bin": {
		"my-app": "./my-app.js"
	}
}
```

Call `npm link .` to link the app. Try opening a shell and do

	my-app <tab>
	my-app hello <enter>
	world

It is as simple as that

## Completing arguments

To complete arguments we just need to pass them to tabalot

``` js
tab('hello')
	('--world', '-w', ['world', 'welt', 'verden'])
	('--debug')
	(function(opts) {
		console.log(opts);
	})
```

In the above program we just added a boolean argument `--debug`
and a `--world` argument that should complete to one of the 3 values.

Try running

	my-app <tab>
	my-app hello --<tab><tab>       # prints --world --debug
	my-app hello --world <tab><tab> # prints world verden welt
	my-app hello --world v<tab>
	my-app hello --world verden <enter>

The above program will output

	{
		world: 'verden',
		debug: false
	}

## Positional arguments

If you want to complete a positional (or nameless) argument
simply omit the name and it will be added as an argument to call function

``` js
tab('hello')
	(['world', 'verden', 'welt'])
	(function(world, opts) {
		console.log(world)
	})
```

Try running

	my-app <tab>
	my-app hello <tab><tab> # prints world verden welt
	my-app hello v<tab>
	my-app hello verden <enter>

The above program will output

	'verden'

## Dynamic completion

Instead of passing the static values `['world', 'welt', 'verden']` we can
pass an async function to the completer as well

``` js
tab('hello')
	('--world', '-w', function(callback) {
		callback(null, ['world', 'welt' 'verden']);
	})
	(function(opts) {
		console.log(opts);
	})
```

# License

MIT