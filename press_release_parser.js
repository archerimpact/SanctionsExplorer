'use strict';

const fs = require('fs');
const mongoose = require('mongoose');
const mongoosastic = require('mongoosastic');

const prSchema = mongoose.Schema({
	title:String,
	link:String,
	date:String,
	content:String
});

prSchema.plugin(mongoosastic);

let PR = mongoose.model('PR', prSchema);

fs.readFile('press_release_json.txt', 'utf8', (err, data) => {
	let json = JSON.parse(data);
	shipToDB(json);
});

function shipToDB(json_data) {
	console.log("# keys: " + Object.keys(json_data).length);

	for (var i = 0; i < json_data.length; i++) {
		console.log('Shipping document ' + i);

		const pr = new PR(json_data[i]);
		pr.save((err, data) => {
			if (err) {
				console.log('Saving error for ' + i + ': ' + err);
			}
			console.log('Document ' + i + ' successfully saved');
			
			pr.on('es-indexed', (indexErr, res) => {
				if (indexErr) {
					console.log('Indexing error: ' + indexErr);
				}
				console.log('Document ' + i + ' indexed');
			})
		});
	}
}
