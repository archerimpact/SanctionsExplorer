const fs = require('fs');
const es = require('elasticsearch');
const client = new es.Client({
    host: 'localhost:9200',
    // log: 'trace'
});

var data = JSON.parse(fs.readFileSync('v9.json', 'utf8'));

let requests = [];

for (var i = 0; i < data.length; i++) {
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
        if (alias.date_period !== null) {
            console.log('ERROR: OFAC has started associating date periods with aliases.  These will not be rendered.');
        }
        delete alias.date_period;

        // simply for decreasing complexity within the rendering template. TODO should probably be moved to XML parser?
        if (alias.is_low_quality) {
            alias.strength = 'weak';
        }
        else {
            alias.strength = 'strong';
        }
    });

    Object.keys(data[i].features).forEach(f_key => {
        let formatted_key = f_key.split(' ').map(w => w.toLowerCase()).join('_');    // e.g. 'Citizenship Country' -> 'citizenship_country'

        let combined_info = [];

        data[i].features[f_key].forEach(entry => {
            if (entry.details) {
                combined_info.push(entry.details);
            }

            if (entry.date) {
                combined_info.push(entry.date);
            }

            if (entry.location && entry.location['COMBINED']) {
                combined_info.push(entry.location['COMBINED']);
            }
        });

        data[i][formatted_key] = combined_info;
    });

    data[i].documents.forEach(doc => {
        // for searchability
        data[i].doc_id_numbers.push(doc.id_number);
         // for website display
        if (doc.validity != 'Valid' && doc.validity != 'Fraudulent') {
            console.log('WARNING: An invalid document status appeared (normally Valid or Fraudulent): ' + doc.validity);
        }
        headers = []

        // TODO the nullification on 'None' logic should be moved to the XML parser.
        if (doc.issued_by != 'None') {
            headers.push('issued_by');
        }
        else {
            doc.issued_by = null;
        }

        if (doc.issued_in != 'None') {
            headers.push('issued_in');
        }
        else {
            doc.issued_in = null;
        }

        if (doc.issuing_authority != 'None') {
            headers.push('issuing_authority');
        }
        else {
            doc.issuing_authority = null;
        }

        Object.keys(doc.relevant_dates).forEach(date => {
            doc[date] = doc.relevant_dates[date];
            headers.push(date);
        });

        data[i].document_headers = headers

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
    if (i == 5913) {
        console.log(data[i]);
    }
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
    console.log(errors + ' errors occured during the export.');
}
