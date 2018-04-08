'use strict'

const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');
const es = require('elasticsearch');
const client = new es.Client({
    host:'localhost:9200'
});
const util = require(path.join(__dirname, 'data', 'util.js'));
const log = util.log('webserver');

const email_file    = path.join(__dirname, 'submissions', 'email.txt');
const feedback_file = path.join(__dirname, 'submissions', 'feedback.txt');

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

app.get('/feedback', (req, res) => {
    res.sendFile(__dirname + '/views/feedback.html');
});

app.get('/press-releases', (req, res) => {
    res.sendFile(__dirname + '/views/press-releases.html');
});

app.get('/submit/email', async function(req, res) {
    const email = req.query.email;
    if (!email) {
        return res.status(400).end();
    }

    await fs.appendFile(email_file, JSON.stringify(email) + ',\n', err => {
        if (err) {
            log('Could not write to email file: ' + err, 'error');
            return res.status(400).end();
        }
    });
    log('New email submission!', 'error');
    return res.status(200).end();
});

app.get('/submit/feedback', async function(req, res) {
    const text = req.query.text;
    const type = req.query.feedback_type;
    const email = req.query.email;

    const submission = {
        text: text,
        type: type,
        email: email,
    };

    await fs.appendFile(feedback_file, JSON.stringify(submission) + ',\n', err => {
        if (err) {
            log('Could not write to feedback file: ' + err, 'error');
            return res.status(400).end();
        }
    });
    log('New feedback submission!', 'error');
    return res.status(200).end();
})


app.get('/search/press-releases', async function(req, res) {
    let text = req.query.query;
    console.log(JSON.stringify(text));
    let search_query = {
        bool: {
            must: [
                {
                    match: {
                        content: {
                            query: text,
                            operator: 'and',
                            fuzziness: 'AUTO',
                        },
                    },
                },
            ],
            should: [
                {
                    match_phrase: {
                        content: {
                            query: text,
                            slop: 3,
                            boost: 1000,
                        },
                    },
                },
                {
                    match_phrase: {
                        title: {
                            query: text,
                            slop: 3,
                            boost: 1000,
                        },
                    },
                },
            ],
        },
    };
    respond_with_search(req, res, search_query, 'pr');
});


app.get('/search/sdn', async function(req, res) {
    console.log(JSON.stringify(req.query));
    const fuzziness = {
        'programs': '0',
        'doc_id_numbers': '0',
        'birthdate': '0',
        'fixed_ref': 'NONE',
        'party_sub_type': '0',
        'sanction_dates': 'NONE',
    };

    const operators = {
        'programs': 'or',
        'sanction_dates': 'or',
    };

    let search_query;

    let create_match_phrase = (field, query_str, is_fuzzy, boost) => {
        let json = { match: {} };
        let op = operators[field] || 'and';
        json.match[field] = {
            query: query_str,
            operator: op,
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
        if (k == 'all_fields') {
            // Prioritize primary names over all names (both over other fields)
            let all_should     = create_match_phrase('all_display_names',    req.query[k], false, 2000);
            let primary_should = create_match_phrase('primary_display_name', req.query[k], false, 4000);
            search_query.bool.should.push(all_should);
            search_query.bool.should.push(primary_should);
        }

        if (k == 'all_display_names') {
            // Boost exact matches in primary names.
            let primary_should = create_match_phrase('primary_display_name', req.query[k], false, 2000);
            search_query.bool.should.push(primary_should);
        }

        if (k == 'sanction_dates') {
            // Expand year ranges (e.g. 2011-2017) into concatenated list of years to boolean-OR search for
            let q = req.query[k];
            let year_range = q.match(/^[0-9]{4}\-[0-9]{4}$/);
            if (year_range) {
                let [begin, end] = q.split('-');
                let concat_years = '';
                for (let y = parseInt(begin); y <= parseInt(end); y++) {
                    concat_years += ' ' + y;
                }
                console.log(concat_years);
                req.query[k] = concat_years;        // overwrite range with concatenated list
            }
        }

        if (get_keywords().includes(k)) {
            // There must be a fuzzy match.  Boost exact matches.
            let must_phrase   = create_match_phrase(k, req.query[k], true);
            let should_phrase = create_match_phrase(k, req.query[k], false, 1000);
            search_query.bool.must.push(must_phrase);
            search_query.bool.should.push(should_phrase);
        }
    });
    //console.log('=====> ' + JSON.stringify(search_query));

    respond_with_search(req, res, search_query, 'sdn');
});


async function respond_with_search(req, res, search_query, index) {
    let size = req.query.size ? req.query.size : 50;
    let from = req.query.from ? req.query.from : 0;

    let full_query = {
        index: index,
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
}


async function search_ES(query, res) {
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
        'all_fields',
        'sanction_dates',
        'document_countries'
    ];
}
