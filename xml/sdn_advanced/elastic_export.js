const fs = require('fs');
const es = require('elasticsearch');
const client = new es.Client({
    host: 'localhost:9200',
    // log: 'trace'
});

var data = JSON.parse(fs.readFileSync('v8.json', 'utf8'));

let requests = [];

for (var i = 5913; i < 5914; i++) {
    // Augment the data with these fields
    data[i].identity_id = data[i].identity.id
    data[i].primary_display_name = data[i].identity.primary.display_name;
    data[i].programs = [];
    data[i].all_display_names = [];
    data[i].doc_id_numbers = [];
    data[i].linked_profile_ids = [];
    data[i].linked_profile_names = [];

    programs = new Set();
    data[i].sanctions_entries.forEach(entry => {
        entry.program.forEach(program => {
            programs.add(program);
        });
    });
    data[i].programs = Array.from(programs);

    data[i].linked_profiles.forEach(p => {
        data[i].linked_profile_ids.push(p.linked_id);
        data[i].linked_profile_names.push(p.linked_name.display_name);
    });

    data[i].identity.aliases.forEach(alias => {
        data[i].all_display_names.push(alias.display_name);
    });

    Object.keys(data[i].features).forEach(f_key => {
        let formatted_key = f_key.split(' ').map(w => w.toLowerCase()).join('_');    // e.g. 'Citizenship Country' -> 'citizenship_country'
        data[i][formatted_key] = data[i].features[f_key];
    });

    data[i].documents.forEach(doc => {
        data[i].doc_id_numbers.push(doc.id_number);
    });

    let es_index_statement = {
        index: {
            _index: 'sdn',
            _type: 'entry',
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
}

if (errors > 0) {
    // restart and try again. Log and notify.
}
