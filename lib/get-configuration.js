const path = require('path');
const rcNodeBack = require('cli-rc');
const denodeify = require('denodeify');
const entries = require('core-js/fn/object/entries');
const merge = require('lodash').merge;

const rc = denodeify(rcNodeBack);

const loaders = [
	{
		name: '.jsonlintrc',
		process: config => config
	},
	{
		name: '.jsonlintignore',
		type: 'ini',
		process: config => {
			return {
				ignore: entries(config)
					.filter(item => item[1])
					.map(item => item[0])
			};
		}
	}
];

function getPaths(directory) {
	return directory
		.split(path.sep)
		.map((_, index) => {
			const args = [directory].concat(Array(index).fill('..'));
			return path.resolve.apply(null, args);
		});
}

function load(directory) {
	return Promise.all(
		loaders
			.map(load => {
				const paths = getPaths(directory);
				const loader = merge({}, load, {
					path: [directory],
					prepend: paths
				});
				return rc(loader)
					.then(result => {
						// Make validate relative file paths
						// relative to the directory they are placed in.
						if (typeof result.validate === 'string' &&
							(result.validate.substr(0, 2) === './' ||
								result.validate.substr(0, 3) === '../')
						) {
							result.validate = path.join(directory, result.validate);
						}

						return result;
					})
					.then(loader.process);
			})
	).then(configurations => {
		return configurations
			.reverse()
			.reduce((registry, config) => {
				return merge({}, registry, config);
			}, {});
	});
}

module.exports = inputs => {
	return inputs
		.map(input => {
			input.configuration = load(input.directory);
			return input;
		});
};
