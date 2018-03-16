const fs = require('fs');
const es = require('elasticsearch');
const client = new es.Client({
	host: 'localhost:9200'
});

fs.readFile('entries.json', "utf8", function(err, data) {
	if (err) throw err;
	let obj = JSON.parse(data);
	let keys = Object.keys(obj);
	for( var entry in obj) {
		//console.log(obj[entry]);
		client.update({
			index: 'sdn',
			type: 'entry',
			id: entry,
			body: {
				doc: {
					pr_data: obj[entry]
				}
			}
		}, function(err, response) {
			console.log("update");
		});
		//console.log(obj[entry]);
	}
});
