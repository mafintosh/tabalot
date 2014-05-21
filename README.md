# tabalot

Tab complete all the things!

	npm install tabalot

tabalot is a node module that lets you build command line apps with
rich built in tab completion support

## Getting started

Lets make a sample app and link it with npm.
Write the example below to a file called `app.js`

``` js
#!/usr/bin/env node
var tab = require('tabalot');

tab('hello')
	(function() {
		console.log('world');
	})

tab.parse();
```

You need to add a `package.json` file as well.
The one below will make `app.js` executable as `tabtest`

``` js
{
	"name": "tabtest",
	"bin": {
		"tabtest": "./app.js" // we need a bin name
	}
}
```

To try the app locally just use npm to link it

	npm link # will add the app to your path

And install the tab completion

	tabtest completion --save # installs the completion to your bash_completion.d folder

The app is now installed and ready to be tab completed.
Open a shell and try the following

	tabtest <tab>
	tabtest hello <enter>
	world

It is as simple as that.

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

	tabtest <tab>
	tabtest hello --<tab><tab>       # prints --world --debug
	tabtest hello --world <tab><tab> # prints world verden welt
	tabtest hello --world v<tab>
	tabtest hello --world verden <enter>

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

	tabtest <tab>
	tabtest hello <tab><tab> # prints world verden welt
	tabtest hello v<tab>
	tabtest hello verden <enter>

The above program will output

	verden

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

## Catch-all route

If you omit the command name from tab that route will be called and tab completed
if no one else matches

``` js
tab()
	('--world', '-w', ['world', 'welt'])
	(function() {
		console.log('I was called by doing tabtest --world world');
	})
```

## Completion helpers

Tabalot ships with support for a couple of typical completions.
Use these by passing @name as the completer.

``` js
tab('hello')
	('--file', '@file') // completes a file or directory
	('--dir', '@dir')   // completes a directory
	('--host', '@host') // completes a hostname (by looking at known_hosts)
```

# License

MIT
