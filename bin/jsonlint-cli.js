#!/usr/bin/env node
const merge = require('lodash').merge;

const cli = require('../lib/cli');
const listFiles = require('../lib/list-files');
const fetchSchema = require('../lib/fetch-schema');
const getConfiguration = require('../lib/get-configuration');
const getInput = require('../lib/get-input');
const resolveKeys = require('../lib/resolve-keys');
const lint = require('../lib/lint');
const format = require('../lib/format');
const print = require('../lib/print');
const filter = require('../lib/filter');
const pkg = require('../package');

// Main program
function main(options) {
	return listFiles(options.input)
		// Load file configurations
		.then(getConfiguration)
		// Filter files according to ignore config
		.then(filter)
		// Load file contents
		.then(getInput)
		// Fetch json schemas
		.then(fetchSchema)
		// Wait for resolution of async tasks
		.then(resolveKeys)
		.then(inputs => {
			// Merge cli options on file configuration
			return inputs.map(input => {
				input.configuration = merge({}, input.configuration, options.flags);
				return input;
			});
		})
		.then(inputs => {
			// Lint and validate files
			return inputs.map(input => {
				input.content.path = input.path;
				input.data = lint(input.content, input.configuration, input.schema);
				return input;
			});
		})
		.then(inputs => {
			// Format results
			return inputs.map(input => {
				input.formatted = format(input.data, input.configuration);
				return input;
			});
		})
		.then(inputs => {
			// Print results
			inputs.forEach(print);
			return inputs;
		});
}

// Start the engines
main(cli)
	.catch(error =>
		setTimeout(() => {
			if (error.type === pkg.name) {
				console.error(error.message);
				process.exit(1);
			}
			throw error;
		})
	);

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
	if (reason.type === pkg.name) {
		process.exit(1);
	}
	console.log('Unhandled Rejection at: Promise ', promise, ' reason: ', reason);
	throw reason;
});
