'use strict'

const express = require('express');
const app = express();
const mongoose = require('mongoose');
const mongoosastic = require('mongoosastic');
// mongoose.connect('mongodb://localhost/ofacasaurus');

app.use(express.static(__dirname + '/static'));
app.use('/static', express.static(__dirname + '/static'));

app.listen(8080, "127.0.0.1", () => {
    console.log("Server has started");
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/sdn.html');
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
    console.log(JSON.stringify(req.query));

    let es_query = {size: 50, from: 0};

    if (req.query.size) {
        es_query.size = req.query.size;
    }

    if(req.query.from){
        es_query.from = req.query.from;
    }

    let search_query = {
  //      'query': {
            'match': {
                'content': text,
            }
    //    },
//        size: 50,
    }

    es_query.query = search_query

    search_ES(es_query, PR, res);
});


app.get('/search/sdn', function(req, res) {
    const keywords = ["id", "ent_num", "sdn_name", "sdn_type", "program", "title", "call_sign", "vess_type", "tonnage", "grt", "vess_flag", "vess_owner", "remarks", "linked_to", "nationality", "dob", "aka", "pob", "passport", "nit", "cedula_no", "ssn", "dni", "rfc", "website", "vessel_registration_number", "gender", "swift_bic", "tax_id_no", "email", "phone", "registration_id", "company_number", "aircraft_construction_number", "citizen", "additional_sanctions_info", "aircraft_manufacture_date", "aircraft_model", "aircraft_operator", "position", "national_id_number", "identification_number", "previous_aircraft_tail_number"];
    const fuzziness = {"program": "0", "passport": "0", "cedula_no": "0", "dob": "0"};

    var es_query = {size: 50, from: 0};
    var search_query = {bool:{must:[]}};
    console.log(req.query)
    let create_match_phrase = (field, query_str) => {
        let json = { 'match': {} };
        var fuzz_setting = "AUTO";
        if (fuzziness[field] != null) {
            console.log('custom fuzz of ' + fuzziness[field]);
            fuzz_setting = fuzziness[field];
        }
        json.match[field] = {
            'query': query_str,
            'fuzziness': fuzz_setting,
            'operator': 'and',
        };
        return json;
    };

    if (req.query.size) {
        es_query.size = req.query.size;
    }

    if(req.query.from){
        es_query.from = req.query.from;
    }

   for (var i = 0; i < keywords.length; i++) {
        if (req.query[keywords[i]] != null) {
            let match_phrase = create_match_phrase(keywords[i], req.query[keywords[i]])
            search_query.bool.must.push(match_phrase)
        }
    }

    es_query.query = search_query;
    search_ES(es_query, Entry, res);
});

app.get('/elasticsearch/all', function(req, res){
    var keywords = ["id", "ent_num", "sdn_name","sdn_type","program","title","call_sign","vess_type","tonnage","grt","vess_flag","vess_owner","remarks","linked_to","nationality","dob","aka","pob","passport","nit","cedula_no","ssn","dni","rfc","website","vessel_registration_number","gender","swift_bic","tax_id_no","email","phone","registration_id","company_number","aircraft_construction_number","citizen","additional_sanctions_info","aircraft_manufacture_date","aircraft_model","aircraft_operator","position","national_id_number","identification_number","previous_aircraft_tail_number"]
    if(req.query.query){
        var search_query = {}
        search_query.multi_match = {}
        search_query.multi_match.query = req.query.query;
        search_query.fields = keywords;

        Entry.search(search_query, function(err, results){
            console.log(results);

            if(err){
                res.status(400).end();
            }
            else{
                res.json(results.hits.hits);
            }
        })

    }
    else{
        res.status(400).send("No parameter provided for search");
    }
})


function search_ES(query, model, res) {
    if (Object.keys(query['query']).length !== 0) {
//        console.log(query);
        model.esSearch(query, (err, results) => {
            if (err) {
                res.status(400).end();
            }
            else {
                let response = [];
                for (var i in results.hits.hits) {
//                    console.log(results.hits.hits[i]['_source']['sdn_name'] + ': ' + results.hits.hits[i]['_score']);
                    response.push(results.hits.hits[i]['_source']);
                }

//                console.log(JSON.stringify(results.hits));
                res.json({'response': response, 'num_results': results.hits.total});
            }
        });
    }
}

const entrySchema = mongoose.Schema({
    ent_num:String,
    sdn_name:String,
    sdn_type:String,
    program:String,
    title:String,
    call_sign:String,
    vess_type:String,
    tonnage:String,
    grt:String,
    vess_flag:String,
    vess_owner:String,
    remarks:String,
    linked_to:[String],
    nationality:[String],
    dob:[String],
    aka:String,
    pob:[String],
    passport:[String],
    nit:[String],
    cedula_no:String,
    ssn:String,
    dni:String,
    rfc:[String],
    website:[String],
    vessel_registration_number:String,
    gender:String,
    swift_bic:[String],
    tax_id_no:[String],
    email:[String],
    phone:String,
    registration_id:[String],
    company_number:String,
    aircraft_construction_number:String,
    citizen:[String],
    additional_sanctions_info:[String],
    aircraft_manufacture_date:String,
    aircraft_model:[String],
    aircraft_operator:[String],
    position:String,
    national_id_number:[String],
    identification_number:[String],
    previous_aircraft_tail_number:String
});

const prSchema = mongoose.Schema({
    title:String,
    link:String,
    date:String,
    content:String
});

entrySchema.plugin(mongoosastic);
prSchema.plugin(mongoosastic);

let Entry = mongoose.model('Entry', entrySchema);
let PR = mongoose.model('PR', prSchema);

function update_docs(){
	console.log("Starting update");
	Entry.find({}, function(err, entries){
	   console.log("FOUND");
           console.log(err);
	   console.log(entries.length);
           for(var i = 0; i< entries.length; i++){
	   	var curr_entry = entries[i];
		if(curr_entry.sdn_type == null){
			console.log("Found null");
			curr_entry.sdn_type = "entity"
                }
		curr_entry.program = "["+curr_entry.program + "]"
		curr_entry.save();
	   }
	});
	Entry.synchronize();
}

//update_docs();



/*
 ******* LEGACY SEARCH FUNCTIONS *******

const sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database('press_releases.db');
mongoose.connect('mongodb://archer:ilovearcher@ds217898.mlab.com:17898/archer-ofacasaurus', {connectTimeoutMS:5000});

app.get('/search/press-release-sqlite', function(req, res) {
    let text = req.query.query;
    console.log(text);
    // TODO don't let them inject SQL lol
    db.all('SELECT name,pr_date,link FROM press_releases WHERE content LIKE "%' + text + '%";', (err, rows) => {
        res.json({'dates': rows});
    });
});

app.get('/search/sdn-mongo', function(req, res) {
   // res.send('search');
   var keywords = ["id", "ent_num", "sdn_name","sdn_type","program","title","call_sign","vess_type","tonnage","grt","vess_flag","vess_owner","remarks","linked_to","nationality","dob","aka","pob","passport","nit","cedula_no","ssn","dni","rfc","website","vessel_registration_number","gender","swift_bic","tax_id_no","email","phone","registration_id","company_number","aircraft_construction_number","citizen","additional_sanctions_info","aircraft_manufacture_date","aircraft_model","aircraft_operator","position","national_id_number","identification_number","previous_aircraft_tail_number"]
   var search_query = {}

   if(req.query.id){
       search_query["_id"] = req.query.id;
   }

    for (var i=0; i<keywords.length; i++){
        if(req.query[keywords[i]]!=null){
            console.log(keywords[i]);
            search_query[keywords[i]] = req.query[keywords[i]]
        }
   }

    if (Object.keys(search_query).length !== 0) {
        Entry.find(search_query, function(err, result){
             if (err) {
                res.status(400).end();
             }
             else {
                 res.json(result);
             }
        });
    }
});
*/
