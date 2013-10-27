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
and add a tab completion link.

``` js
{
	"name": "tabtest",
	"bin": {
		"tabtest": "./app.js" // we need a bin name
	},
	"scripts": {
		"install": "./app.js --tabalot" // install the completion
	}
}
```

To try the app locally just use npm to link it

	npm link            # will add the app to your path
	. ~/.tabalot/bashrc # will source tabcompletion in the current shell
	                    # this happens automatically when you open a new shell

The app is now installed and ready to be tab completed.
Open a shell and try the following

	tabtest <tab>
	tabtest hello <enter>
	world

It is as simple as that. If you publish your package to npm it will be installable
with tab completion by using a standard `npm install -g tabtest`

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

# License

MIT