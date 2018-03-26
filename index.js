
const fs = require('fs');
const pathPkg = require('path');
const flowRemoveTypes = require('flow-remove-types');

async function readdir (path) {
	return new Promise(function (resolve, reject) {
		fs.readdir(path, function (err, items) {
			if (err) return reject(err);
			resolve(items);
		});
	});
}

async function lstat (path) {
	return new Promise(function (resolve, reject) {
		fs.lstat(path, function (err, items) {
			if (err) return reject(err);
			resolve(items);
		});
	});
}

const EXCLUSIONS = ['.git', 'node_modules', '.idea'];
const FLOW_PATTERN = /\.fl$/;
function* walk (path) {
	const items = yield readdir(path);
	for (const i in items) {
		const name = items[i];
		const fullName = pathPkg.resolve(path, name);
		const stats = yield lstat(fullName);
		if (stats.isDirectory()) {
			if (!EXCLUSIONS.includes(name)) {
				yield* walk(fullName);
			}
		}
		else if (stats.isFile()) {
			if (FLOW_PATTERN.test(name)) {
				yield fullName;
			}
		}
		else if (stats.isSymbolicLink() || stats.isFIFO() || stats.isSocket() || stats.isBlockDevice() || stats.isCharacterDevice()) {
			// do nothing
		}
		else {
			console.trace('Unexpected path type for:', name);
		}
	}
}

async function iterate (gen, handle) {
	let crossValue;
	while (true) {
		const {value, done} = gen.next(crossValue);
		if (done) break;
		if (value instanceof Promise) {
			crossValue = await value;
		}
		else {
			await handle(value);
		}
	}
}

async function compileFlowFile (path) {
	const outputFilePath = path + '.js';
	const input = fs.readFileSync(path, 'utf8');

	let output;
	if (input.indexOf('// @flow') === -1) {
		output = flowRemoveTypes('// @flow\n' + input).toString().substr(9);
	}
	else {
		output = flowRemoveTypes(input).toString();
	}

	fs.writeFileSync(outputFilePath, output);
}

async function compile (path) {
	console.log('start');
	let count = 0;
	const gen = walk(path);
	await iterate(gen, async (filePath) => {
		console.log(`${count++}> ${filePath}`);
		await compileFlowFile(filePath);
	});
	console.log(`found ${count} *.fl files`);
	console.log('complete');
}

if (module.parent) {
	module.exports = {
		compile,
	};
} else {
	compile(process.argv[2] || '.');
}
