const dirname = require('path').dirname;
const resolve = require('path').resolve;
const glob = require('glob');
const getStdin = require('get-stdin');

module.exports = input => {
	if (input.length === 0) {
		return Promise.resolve(
			[{
				content: getStdin.buffer(),
				directory: process.cwd(),
				path: process.cwd(),
				piped: true
			}]
		);
	}

	return new Promise(resolve => {
		glob(
			input[0],
			{},
			(er, paths) => {
				resolve(paths);
			}
		);
	}).then(paths => {
		return paths.map(path => {
			return {
				content: null,
				directory: dirname(resolve(process.cwd(), path)),
				path: resolve(process.cwd(), path),
				piped: false
			};
		});
	});
};
