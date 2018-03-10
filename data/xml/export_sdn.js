const fs = require('fs');
const path = require('path');
const exporter = require(path.join(__dirname, 'elastic_export.js'));

var entries = JSON.parse(fs.readFileSync(path.join(__dirname, 'latest.json'), 'utf8'));

let transform = data => {
    // Augment the data with these fields
    data.identity_id = data.identity.id
    data.primary_display_name = data.identity.primary.display_name;
    data.programs = [];
    data.all_display_names = [];
    data.doc_id_numbers = [];
    data.linked_profile_ids = [];
    data.linked_profile_names = [];

    programs = new Set();
    data.sanctions_entries.forEach(entry => {
        entry.program.forEach(program => {
            programs.add(program);
        });
    });
    data.programs = Array.from(programs);

    data.linked_profiles.forEach(p => {
        data.linked_profile_ids.push(p.linked_id);
        data.linked_profile_names.push(p.linked_name.display_name);
    });

    data.all_display_names.push(data.primary_display_name);
    data.identity.aliases.forEach(alias => {
        data.all_display_names.push(alias.display_name);
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

    Object.keys(data.features).forEach(f_key => {
        let formatted_key = f_key.split(' ').map(w => w.toLowerCase()).join('_');    // e.g. 'Citizenship Country' -> 'citizenship_country'

        let combined_info = [];

        data.features[f_key].forEach(entry => {
            if (entry.details) {
                combined_info.push(entry.details);
            }

            if (entry.date) {
                combined_info.push(entry.date);
            }

            if (entry.location) {
                combined_info.push(entry.location['COMBINED']);
            }
        });

        data[formatted_key] = combined_info;
    });

    data.documents.forEach(doc => {
        // for searchability
        data.doc_id_numbers.push(doc.id_number);
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

        data.document_headers = headers
    });
    return data;
}

exporter.reload_index(entries, transform, 'sdn', 'entries');
