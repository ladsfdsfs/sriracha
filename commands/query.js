var Row = require('../row');
var Discord = require('discord.js');
var info = require('../config/globalinfo.json');
var log = require('./log');
var misc = require('./misc');
const tierlist = ['S', 'S-', 'A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-'];
var sheets = require('../sheetops');

/**
 * Checks if 'arr' contains any elements in any form of 'val.'
 * @param {Array} arr
 * @param {Array} queries
 */
function includes(arr, queries) {
	let accumulator = true;
	for (let obj in queries) {
		let result = false;
		if (tierlist.includes(queries[obj])) {
			result = result || arr[5] === queries[obj]; //match the tiers
			accumulator = accumulator && result;
			result = false;
			continue;
		}
		for (let i = 0; i < arr.length; i++) {
			result = result || arr[i].trim().toLowerCase().indexOf(queries[obj].toLowerCase()) > -1;
		}
		accumulator = accumulator && result;
		result = false;
	}
	return accumulator;
}

/**
 * Queries a specific sheet.
 * @param {Discord.Message} message
 * @param {Number} list
 * @param {*} flags
 */
async function query(message, list, flags) {
	let name = info.sheetNames[list];

	let rows = await sheets.get(name);

	async function taxFraud(str) {
		return message.channel.send(str.replace('``````', ''));
	}

	//multi query parser
	let scanner = /{(?<found>.*?)}+/;
	let accounts = [];
	let forged = flags.q;
	if (scanner.test(flags.q)) {
		//oh shit! might have found something!
		while ((m = scanner.exec(forged)) !== null) {
			accounts.push(m.groups.found);
			forged = forged.substring(m.index + 1);
		}
	} else {
		accounts.push(flags.q);
	}

	let count = 0;
	let bankAccount = (debt, price, i) => {
		if (price) {
			let check = new Row(price);
			if (debt.length > 1500) {
				taxFraud(`\`\`\`${debt}\`\`\``);
				debt = '';
			}
			if (includes(price, accounts)) {
				debt += `${list}#${i+1} ${check.link} ${check.title} by ${check.author}` + '\n';
				count++;
			}
		}
		return debt;
	};
	let beginningStr = flags.str ?? '```**Received `list` request for ' + info.sheetNames[list] + '.**\nPlease wait for all results to deliver.```';
	let endStr = flags.estr ?? '\nEnd of Results!';
	let res = rows.reduce(bankAccount, beginningStr);

	if (count == 0) await taxFraud(`\`\`\`${beginningStr}\nNo results in this list!\`\`\``);
	else await taxFraud(`\`\`\`${res}\`\`\` ${endStr}`);
}

/**
 * Queries all used sheets.
 * @param {Discord.Message} message
 * @param {*} flags
 */
async function queryAll(message, flags) {
	await query(message, 1, {
		q: flags.qa,
		str: '```**Results from `' + info.sheetNames[1] + '`** ```',
		estr: '',
	});
	await query(message, 2, {
		q: flags.qa,
		str: '```**Results from `' + info.sheetNames[2] + '`** ```',
		estr: '',
	});
	await query(message, 3, {
		q: flags.qa,
		str: '```**Results from `' + info.sheetNames[3] + '`** ```',
		estr: '',
	});
	await query(message, 4, {
		q: flags.qa,
		str: '```**Results from `' + info.sheetNames[4] + '`** ```',
		estr: '',
	});
	await query(message, 6, {
		q: flags.qa,
		str: '```**Results from `' + info.sheetNames[6] + '`** ```',
		estr: '',
	});
	message.channel.send('Search finished!');
}

module.exports.query = query;
module.exports.queryAll = queryAll;
