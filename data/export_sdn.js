const fs = require('fs');
const path = require('path');
const exporter = require(path.join(__dirname, 'elastic_export.js'));

const sdn    = JSON.parse(fs.readFileSync(path.join(__dirname, '/update_files/sdn.json'), 'utf8'));
const nonsdn = JSON.parse(fs.readFileSync(path.join(__dirname, '/update_files/non_sdn.json'), 'utf8'));

const transform = entry => {
    // Augment the entry with these fields
    entry.identity_id = entry.identity.id
    entry.primary_display_name = entry.identity.primary.display_name;
    entry.programs = [];
    entry.all_display_names = [];
    entry.doc_id_numbers = [];
    entry.linked_profile_ids = [];
    entry.linked_profile_names = [];
    entry.countries = [];

    programs  = new Set();
    countries = new Set();
    lists     = new Set();

    entry.sanctions_entries.forEach(entry => {
        lists.add(list_to_acronym(entry.list));
        entry.program.forEach(program => {
            if (program) {
                programs.add(program);
                let program_country = program_to_country(program);
                if (program_country != null) {
                    countries.add(program_country);
                }
            }
        });
    });
    entry.programs = Array.from(programs).sort();

    entry.sdn_display = '';
    if (lists.delete('Non-SDN')) {
        if (lists.delete('SDN')) {
            entry.sdn_display += '[SDN] ';
            entry.is_sdn = lists.has('SDN');    // denote that this is an SDN entry for future purposes (might be useful)
        }
        entry.sdn_display += '[Non-SDN';
        if (lists.size) {
            entry.sdn_display += ': ' + Array.from(lists).sort().join(', ');
        }
        entry.sdn_display += ']';
    }

    entry.linked_profiles.forEach(p => {
        entry.linked_profile_ids.push(p.linked_id);
        entry.linked_profile_names.push(p.linked_name.display_name);
    });

    entry.all_display_names.push(entry.primary_display_name);
    entry.identity.aliases.forEach(alias => {
        entry.all_display_names.push(alias.display_name);
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

    Object.keys(entry.features).forEach(f_key => {
        let formatted_key = f_key.split(' ').map(w => w.toLowerCase()).join('_');    // e.g. 'Citizenship Country' -> 'citizenship_country'

        let combined_info = [];

        entry.features[f_key].forEach(entry => {
            if (entry.details) {
                combined_info.push(entry.details);
            }

            if (entry.date) {
                combined_info.push(entry.date);
            }

            if (entry.location) {
                combined_info.push(entry.location['COMBINED']);

                if (entry.location["COUNTRY"]) {
                    countries.add(entry.location["COUNTRY"]);
                }
            }
        });

        entry[formatted_key] = combined_info;
    });

    entry.documents.forEach(doc => {
        // for searchability
        entry.doc_id_numbers.push(doc.id_number);
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

        entry.document_headers = headers
    });

    entry.countries = Array.from(countries);

    return entry;
}

let program_to_country = program => {
    const dict = {
        'BALKANS': 'Balkans',
        'BELARUS': 'Belarus',
        'BURUNDI': 'Burundi',
        'CAR': 'Central African Republic',
        'CUBA': 'Cuba',
        'DARFUR': 'Darfur',
        'DPRK': 'North Korea',
        'DPRK2': 'North Korea',
        'DPRK3': 'North Korea',
        'DPRK4': 'North Korea',
        'DRCONGO': 'Congo',
        'FSE-SY': 'Syria',
        'HRIT-IR': 'Iran',
        'HRIT-SY': 'Syria',
        'IFSR': 'Iran',
        'IRAN': 'Iran',
        'IRAN-TRA': 'Iran',
        'IRAQ': 'Iraq',
        'IRAQ2': 'Iraq',
        'IRGC': 'Iran',
        'ISA': 'Iran',
        'LEBANON': 'Lebanon',
        'LIBYA2': 'Lybia',
        'LIBYA3': 'Lybia',
        'MAGNIT': 'Russia',
        'NS-PLC': 'Palestine',
        'SOMALIA': 'Somalia',
        'SOUTH SUDAN': 'South Sudan',
        'SYRIA': 'Syria',
        'UKRAINE-EO13660': 'Ukraine',
        'UKRAINE-EO13661': 'Ukraine',
        'UKRAINE-EO13662': 'Ukraine',
        'UKRAINE-EO13685': 'Ukraine',
        'VENEZUELA': 'Venezuela',
        'YEMEN': 'Yemen',
        'ZIMBABWE': 'Zimbabwe',
    };

    return dict[program];
}
let list_to_acronym = l => {
    if (l.endsWith(' List')) {
        l = l.slice(0, -1 * ' List'.length);
    }

    const dict = {
        'Sectoral Sanctions Identifications': 'SSI',
        'Non-SDN Palestinian Legislative Council': 'NSPLC',
        'Executive Order 13599': 'EO13599',
        'Part 561': '561List',
        'Consolidated': 'Non-SDN'
    }

    return dict[l] || l;
}

async function load_sdn() {
    await exporter.delete_index('sdn');
    await exporter.create_index('sdn');
    await exporter.bulk_add(sdn,    transform, 'sdn', 'entry', 0);
    let count = await exporter.indexing_stats('sdn');
    console.log('DEBUG: ' + count + ' documents indexing.');
    await exporter.bulk_add(nonsdn, transform, 'sdn', 'entry', 100000);     // TODO maybe pick a different indexing scheme.
    let count_new = await exporter.indexing_stats('sdn');
    console.log('DEBUG: ' + count_new + ' documents indexing.');
}

load_sdn();
