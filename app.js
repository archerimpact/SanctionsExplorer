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
    console.log(JSON.stringify(query));
    try {
        const results = await client.search(query);
        let response = [];
        for (let i in results.hits.hits) {
            response.push(results.hits.hits[i]['_source']);
        }
        res.json({
            'response': response,
            'num_results': results.hits.total
        });
    } catch (error) {
        console.log(error)
        res.status(400).end();
    }
}


app.get('/search/sdn', function(req, res) {
    const keywords =  [
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
    ];
    const fuzziness = {
        'programs': '0',
        'doc_id_numbers': '0',
        'birthdate': '0',
        'fixed_ref': 'NONE',
        'party_sub_type': '0'
    };

    let es_query = { size: 50, from: 0 };
    let search_query = { bool: { must:[] } };

    let create_match_phrase = (field, query_str) => {
        let json = { match: {} };
        let fuzz_setting = 'AUTO';
        if (fuzziness[field] != null) {
            fuzz_setting = fuzziness[field];
        }
        json.match[field] = {
            'query': query_str,
            'operator': 'and',
        };
        if (fuzziness[field] != 'NONE') {
            json.match[field].fuzziness = fuzz_setting;
        }
        return json;
    };

    if (req.query.size) {
        es_query.size = req.query.size;
    }

    if(req.query.from){
        es_query.from = req.query.from;
    }

   for (let i = 0; i < keywords.length; i++) {
        if (req.query[keywords[i]] != null) {
            let match_phrase = create_match_phrase(keywords[i], req.query[keywords[i]])
            search_query.bool.must.push(match_phrase)
        }
    }

    es_query.query = search_query;
    let full_query = {
        index: 'sdn',
        body: es_query,
    };

    search_ES(full_query, res);
});
/*
app.get('/search/sdn/all_fields', function(req, res){
	let search_query = {
		"multi_match":{
			"query":"",
			"fields":["programs",
				  "doc_id_numbers",
				  "linked_profile_ids",
				  "linked_profile_names",
				  "location",
				  "title",
				  "birthdate",
				  "place_of_birth",
				  "additional_sanctions_information_-_",
				  "nationality_country",
				  "citizenship_country",
				  "website",
				  "email_address",
				  "swift/bic",
				  "ifca_determination_-_",
				  "aircraft_construction_number_(also_called_l/n_or_s/n_or_f/n)",
				  "aircraft_manufacturer's_serial_number_(msn)",
				  "aircraft_manufacture_date",
				  "aircraft_model",
				  "aircraft_operator",
				  "bik_(ru)",
				  "un/locode",
				  "aircraft_tail_number",
				  "previous_aircraft_tail_number",
				  "micex_code",
				  "nationality_of_registration",
				  "d-u-n-s_number"]
		}
	};

	if(req.query.search_term == null){
		res.status(400).send("No input provided");
	}
	else{
		search_query.multi_match.query = req.query.search_term;
	}

	let es_query = {};
	es_query.query = search_query;
	es_query.size =50;
	es_query.from =0;

	if (req.query.size) {
		es_query.size = req.query.size;
	}

	if(req.query.from){
		es_query.from = req.query.from;
	}

	let full_query = {
		index:'sdn',
		body: es_query,
	};

	search_ES(full_query, res);
});
*/
