const fs = require('fs');
const path = require('path');
const exporter = require(path.join(__dirname, 'elastic_export.js'));
const entries = JSON.parse(fs.readFileSync(path.join(__dirname, 'update_files/ofac_matches.json'), 'utf8'));

let operations = [];
Object.keys(entries).forEach(id => {
	operations.push({
		id: id,
		body: {
			doc: {
				ofac_id: entries[id],
			}
		}
	});
});

exporter.bulk_update(operations, 'sdn', 'entry');
