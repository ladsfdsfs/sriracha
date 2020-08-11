var Row = require('../row');
var Discord = require('discord.js');
var info = require('../config/globalinfo.json');
var log = require('./log');
var pFetch = require('./page');
var misc = require('./misc');
var del = require('./delete');
var sheets = require('../sheetops');

/**
 * Secondhand function to accept flag object.
 * @param {Discord.Message} message
 * @param {Number} list
 * @param {*} flags
 */
async function flagAdd(message, flags) {
	if (!flags.hasOwnProperty('l')) {
		message.channel.send('Please provide a link with the `-l` flag!');
	}

	flags.l = flags.l.replace('http://', 'https://');
	let row = new Row(flags);
	let list = flags?.s ?? 1;

	return add(message, list, row);
}

/**
 * Main function that takes a row.
 * @param {Discord.Message} message
 * @param {Number} list
 * @param {Row} row
 */
async function add(message, list, row) {
	if (list <= 0 || list > info.sheetNames.length) {
		message.channel.send('Cannot add to a nonexistent sheet!');
		return false;
	}

	if (list == 4) {
		for (let x = 0; x < 3; x++) {
			try {
				row.page = await pFetch(row.link);
				if (row.page == -1) continue;
				break;
			} catch (e) {
				await new Promise((resolve, reject) => setTimeout(resolve, 500));
			}
		}
		if (row.page == -1) {
			message.channel.send('Failed to get page numbers! Please set it manually with `-pg`.');
		}
	}

	try {
		let newRow = await sheets.append(info.sheetNames[list], row.toArray());
		await message.channel.send(`Successfully added \`${list}#${newRow - 1}\`!`);

		if (list == 4) {
			await misc.update();
			//update public server
			let embed = misc.embed(row, -1, -1, message);
			embed.setFooter('Wholesome God List');

			log.updatePublicServer(embed);

			const upRows = await sheets.get('SITEDATA2');

			if (upRows.length > 10) {
				await del(message, 8, 1);
			}

			await sheets.append('SITEDATA2', [row.title, row.link, row.author, row.tier, Date.now()]);
			message.channel.send('Updated public server / website!');
		}

		return true;
	} catch (e) {
		log.logError(message, e);
		return false;
	}
}

module.exports.add = add;
module.exports.fAdd = flagAdd;
