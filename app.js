'use strict'

const express = require('express');
const app = express();
const fs = require('fs');
const es = require('elasticsearch');
const client = new es.Client({
    host:'localhost:9200'
});

app.use(express.static(__dirname + '/static'));
app.use('/static', express.static(__dirname + '/static'));

app.listen(8080, '127.0.0.1', () => {
    console.log('Server has started');
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/onebar.html');
});

app.get('/sdn', (req, res) => {
    res.sendFile(__dirname + '/views/sdn.html');
});

app.get('/about', (req, res) => {
    res.sendFile(__dirname + '/views/about.html');
});

app.get('/press-releases', (req, res) => {
    res.sendFile(__dirname + '/views/press-releases.html');
});


app.get('/search/press-releases', function(req, res) {
    let text = req.query.query;
    console.log(text);
    let es_query = { size: 50, from: 0 };

    if (req.query.size) {
        es_query.size = req.query.size;
    }

    if(req.query.from) {
        es_query.from = req.query.from;
    }

    let search_query = {
        'match_phrase': {
            'content': {
                'query': text,
                'slop': 3,
            }
        }
    };

    es_query.query = search_query;
    let full_query = {
        index: 'pr',
        body: es_query,
    };

    search_ES(full_query, res);
});


async function search_ES(query, res) {
    //console.log(JSON.stringify(query));
    try {
        const results = await client.search(query);
        let response = [];
        for (let i in results.hits.hits) {
            let score = results.hits.hits[i]['_score'];
            let source = results.hits.hits[i]['_source'];
            response.push([source, score]);
        }
        return {
            'response': response,
            'num_results': results.hits.total,
        };
    } catch (error) {
        console.log(error);
        return null;
    }
}


app.get('/search/sdn', async function(req, res) {
    console.log(JSON.stringify(req.query));
    const fuzziness = {
        'programs': '0',
        'doc_id_numbers': '0',
        'birthdate': '0',
        'fixed_ref': 'NONE',
        'party_sub_type': '0'
    };

    let search_query;

    if (Object.keys(req.query).includes('all_fields')) {
        search_query = {
            'multi_match': {
                query: req.query['all_fields'],
                type: 'best_fields',
                fuzziness: '1',
                operator: 'and',
                fields: get_searchall_keywords(),
            }
        };
    }
    else {
        let create_match_phrase = (field, query_str, is_fuzzy, boost) => {
            let json = { match: {} };
            json.match[field] = {
                'query': query_str,
                'operator': 'and',
            };

            let fuzz_setting = 'AUTO';
            if (is_fuzzy) {
                if (fuzziness[field] != 'NONE') {
                    let fuzz_setting = fuzziness[field] || 'AUTO';
                    json.match[field].fuzziness = fuzz_setting;
                }
            }

            if (boost != null) {
                json.match[field].boost = boost;
            }

            return json;
        };

        search_query = {
            bool: {
                must: [],
                should: [],
            },
        };

        Object.keys(req.query).forEach(k => {
            if (get_keywords().includes(k)) {
                let must_phrase = create_match_phrase(k, req.query[k], true);
                search_query.bool.must.push(must_phrase);

                let should_phrase = create_match_phrase(k, req.query[k], false, 1000);
                search_query.bool.should.push(should_phrase);
            }

            // if (k == "all_display_names") {
            //     let boosted_primary_phrase = create_match_phrase("primary_display_name", req.query[k]);
            //     boosted_primary_phrase.match["primary_display_name"].boost = 2;
            //     search_query.bool.must.push(boosted_primary_phrase)
            // }
        });
        console.log('=====> ' + JSON.stringify(search_query));
    }

    let size = req.query.size ? req.query.size : 50;
    let from = req.query.from ? req.query.from : 0;

    let full_query = {
        index: 'sdn',
        body: {
            size: size,
            from: from,
            query: search_query,
        }
    };

    let result = await search_ES(full_query, res);
    if (result) {
        return res.json(result);
    }
    else {
        return res.status(400).end();
    }
});


function get_keywords() {
    return [
        'title',
        'countries',
        'birthdate',
        'place_of_birth',
        'location',
        'website',
        'additional_sanctions_information_-_',
        'vessel_call_sign',
        'vessel_flag',
        'vessel_owner',
        'vessel_tonnage',
        'vessel_gross_tonnage',
        'vessel_type',
        'nationality_country',
        'citizenship_country',
        'gender',
        'website',
        'email_address',
        'swift/bic',
        'ifca_determination_-_',
        'aircraft_construction_number_(also_called_l/n_or_s/n_or_f/n',
        'aircraft_manufacturer\'s_serial_number_(msn)',
        'aircraft_manufacture_date',
        'aircraft_model',
        'aircraft_operator',
        'bik_(ru)',
        'un/locode',
        'aircraft_tail_number',
        'previous_aircraft_tail_number',
        'micex_code',
        'nationality_of_registration',
        'd-u-n-s_number',
        'identity_id',
        'primary_display_name',
        'all_display_names',
        'programs',
        'linked_profile_names',
        'linked_profile_ids',
        'doc_id_numbers',
        'fixed_ref',
        'party_sub_type',
        'aircraft_tags',
        'vessel_tags',
    ];
}

function get_searchall_keywords() {
    let exclude_fields = [
        'primary_display_name',
        'all_display_names',
        'vessel_tonnage',
        'vessel_gross_tonnage',
        'un/locode',
        'identity_id',
        'linked_profile_ids',
        'fixed_ref',
    ];

    let modified = get_keywords().filter(k => !exclude_fields.includes(k));

    let add_fields = [
        'primary_display_name^4',
        'all_display_names^2',
    ]
    modified.push(...add_fields);

    return modified;

}
