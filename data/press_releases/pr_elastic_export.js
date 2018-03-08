const fs = require('fs');
const es = require('elasticsearch');
const client = new es.Client({
    host: 'localhost:9200',
    // log: 'trace'
});

var data = JSON.parse(fs.readFileSync('press_release.json', 'utf8'));

let requests = [];

for (var i = 0; i < data.length; i++) {
    let es_index_statement = {
        index: {
            _index: 'pr',
            _type: 'pr',
            _id: i
        }
    };
    requests.push(es_index_statement);
    requests.push(data[i]);
}


let errors = 0
client.bulk({
    body: requests
}, (err, response) => {
    if (err) {
        errors += 0;
        console.log(err);
    }
});

if (errors > 0) {
    // restart and try again. Log and notify.
    console.log(errors + ' errors occured during the press release export.');
}
