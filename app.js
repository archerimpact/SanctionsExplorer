'use strict'

const express = require('express');
const app = express();

const csv = require('csv-parser');
const fs = require('fs');
const mongoose = require('mongoose');

mongoose.connect('mongodb://archer:ilovearcher@ds217898.mlab.com:17898/archer-ofacasaurus', {connectTimeoutMS:5000});

app.use(express.static(__dirname + '/static'));
app.use('/static', express.static(__dirname + '/static'));
app.listen(8081, "localhost", function() {
    console.log("Server has started");
});

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/views/index.html');
});

app.get('/search', function(req, res) {
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

   // console.log(search_query);

   Entry.find(search_query, function(err, result){
   	if(err){
   		res.status(400).end();
   	}
   	else{
   		res.json(result);
   	}
   });
});

app.get('/view', function(req, res) {
   res.send('view');
});

const Entry = mongoose.model('Entry', {
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



let loadData = () => {
	let json_data = [];
	let csv_headers = ['ent_num', 'sdn_name', 'sdn_type', 'program', 'title', 'call_sign', 'vess_type', 'tonnage', 'grt', 'vess_flag', 'vess_owner', 'remarks']
	// remarks_headers = new Set(['DOB', 'a.k.a.', 'POB', 'Passport', 'SSN', 'NIT', 'Cedula No.', 'D.N.I', 'Linked To:', 'R.F.C.', 'nationality', 'National ID No.', 'Additional Sanctions Information -', 'citizen', 'UK Company Number', 'Website:', 'Website', 'Aircraft Construction', 'Vessel Registration Identification', 'Gender', 'SWIFT/BIC', 'Tax ID No.', 'Email Address', 'Telephone:', 'Phone No.', 'Registration ID', 'Company Number'])
    let remarks_matcher = /(Linked To:|nationality|DOB|a\.k\.a\.|POB|Passport|NIT|Cedula\sNo\.|SSN|D\.N\.I\.|R\.F\.C\.|Website:|Website|Vessel Registration Identification|Gender|SWIFT\/BIC|Tax ID No\.|Email Address|Telephone:|Phone No\.|Registration ID|Company Number|Aircraft Construction Number|citizen|Additional Sanctions Information \-|Aircraft Manufacture Date|Aircraft Model|Aircraft Operator|Position:|National ID No\.|Identification Number|Previous Aircraft Tail Number)\s(.*)/
    // HANDLE ALT SOMEHOW

    var field_names = ["linked_to","nationality","dob","aka","pob","passport","nit","cedula_no", "cedula_no","ssn","dni","rfc","website", "website", "vessel_registration_number","gender", "swift_bic","tax_id_no","email", "phone", "phone", "registration_id","company_number","aircraft_construction_number","citizen","additional_sanctions_info","aircraft_manufacture_date","aircraft_model","aircraft_operator","position","national_id_number","identification_number","previous_aircraft_tail_number"]
    var remarks_names = ["Linked To:", "nationality", "DOB", "a\.k\.a\.","POB","Passport", "NIT", "Cedula No.","Cedula\sNo\.\s ", "SSN", "D\.N\.I\.", "R\.F\.C\.", "Website:", "Website", "Vessel Registration Identification", "Gender", "SWIFT\/BIC", "Tax ID No\.", "Email Address", "Telephone:", "Phone No\.", "Registration ID", "Company Number", "Aircraft Construction Number", "citizen", "Additional Sanctions Information \-", "Aircraft Manufacture Date", "Aircraft Model", "Aircraft Operator", "Position:", "National ID No\.", "Identification Number", "Previous Aircraft Tail Number"]

    var list_fields = new Set(["linked_to", 'passport','dob','pob','citizen','rfc','nationality','identification_number','additional_sanctions_info','registration_id','national_id_number','website','email','tax_id_no','aircraft_model','aircraft_operator','nit','swift_bic']);

    var field_set = new Set()

    var alt_set = new Set();

    var remarks_to_fields = {}
    for (var i = 0; i<field_names.length; i++){
    	remarks_to_fields[remarks_names[i]] = field_names[i]
    }
    // console.log(remarks_to_fields)

	fs.createReadStream('sdn.csv')
    	.pipe(csv({
            headers: csv_headers
        }))
        .on('data', data => {
            for (var attr in data) {
        		if (data[attr] == "-0- ") {
        			data[attr] = null;
        		}
        	}

        	if (data.remarks != null) {
        		// console.log(data.remarks)
        		let remarks_separated = data.remarks.split(";");


        		for (var i = 0; i < remarks_separated.length; i++) {

        			var is_alt = false;

        			let remark = remarks_separated[i]

        			if(remarks_separated[i].substring(0,4) === " alt"){
        				is_alt = true
        				let remark = remarks_separated[i].substring(6, remarks_separated[i].length);
        				// console.log(remark)
        			}

        			// let remark = remarks_separated[i];
        			let result = remarks_matcher.exec(remark);

                    if (result !== null) {

                        let field_name = remarks_to_fields[result[1]];
                        let field_value = result[2];

                        field_set.add(field_name)

                        if(is_alt){
                        	// console.log("ALT");
                        	alt_set.add(field_name);
                        }


                        if(list_fields.has(field_name)){
                        	// console.log(field_name)
                        	// console.log("Array add for "+field_name);
                        	if(data[field_name] == null){
                        		data[field_name] = [field_value]
                        	}
                        	else{
                        		data[field_name].push(field_value)
                        	}
                        }
                        else{
							data[field_name] = field_value;
						}

                    }
                    else {
                        if (data.hasOwnProperty('notes')) {
                            data['notes'] += '; ' + remark;
                        }
                        else {
                            data['notes'] = remark;
                        }
                    }
        		}
        		// console.log(data)
        	}
        	json_data.push(data);
        })
        .on('end', () => {
        	// console.log(json_data[10])
            shipToDB(json_data);
        });
}

// loadData();


function shipToDB(json_data) {
	// NOTE: mongo times out when trying to save all documents at once


    console.log(json_data[450]);
    console.log(Object.keys(json_data).length);

    for(var i = 0; i< json_data.length; i++){
    	const entry = new Entry(json_data[i])
    	entry.save(function(err, data){
    		if(err){
    			console.log(err)
    		}
    	});
    }

}
