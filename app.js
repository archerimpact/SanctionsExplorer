'use strict'

const express = require('express');
const app = express();

const csv = require('csv-parser');
const fs = require('fs'); 
const mongoose = require('mongoose');

app.get('/', function(req, res) {
    res.send('home');
});

app.get('/search', function(req, res) {
   res.send('search'); 
});

app.get('/view', function(req, res) {
   res.send('view'); 
});

// app.listen(process.env.PORT, process.env.IP, function() {
//     console.log("Server has started");
// });



let loadData = () => {
	let json_data = [];
	let csv_headers = ['ent_num', 'sdn_name', 'sdn_type', 'program', 'title', 'call_sign', 'vess_type', 'tonnage', 'grt', 'vess_flag', 'vess_owner', 'remarks']
	// remarks_headers = new Set(['DOB', 'a.k.a.', 'POB', 'Passport', 'SSN', 'NIT', 'Cedula No.', 'D.N.I', 'Linked To:', 'R.F.C.', 'nationality', 'National ID No.', 'Additional Sanctions Information -', 'citizen', 'UK Company Number', 'Website:', 'Website', 'Aircraft Construction', 'Vessel Registration Identification', 'Gender', 'SWIFT/BIC', 'Tax ID No.', 'Email Address', 'Telephone:', 'Phone No.', 'Registration ID', 'Company Number'])
    let remarks_matcher = /(Linked To:|nationality|DOB|a\.k\.a\.|POB|Passport|NIT|Cedula\sNo\.|SSN|D\.N\.I\.|R\.F\.C\.|Website:|Website|Vessel Registration Identification|Gender|SWIFT\/BIC|Tax ID No\.|Email Address|Telephone:|Phone No\.|Registration ID|Company Number|Aircraft Construction Number|citizen|Additional Sanctions Information \-|Aircraft Manufacture Date|Aircraft Model|Aircraft Operator|Position:|National ID No\.|Identification Number|Previous Aircraft Tail Number)\s(.*)/
    // HANDLE ALT SOMEHOW


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
        		let remarks_separated = data.remarks.split(";");

        		for (var i = 0; i < remarks_separated.length; i++) {
        			let remark = remarks_separated[i];
        			let result = remarks_matcher.exec(remark);

                    if (result !== null) {
                        let field_name = result[1];
                        let field_value = result[2];
            			data[field_name] = field_value;
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
        	}

        	json_data.push(data);
        })
        .on('end', () => {
            shipToDB(json_data);
        });
}

loadData();


function shipToDB(json_data) {
    console.log(json_data[450]);
    console.log(Object.keys(json_data).length);
}

// var sanction_schema = new Schema({
// 	csv_id:Number, 
// 	name:String,
// 	type:String,
// 	program:String,
// 	ship_info:{
// 		ship_id:String,
// 		alt_ship_id:String,
// 		ship_type:String
// 		ship_num:Number,
// 		ship_reg:String,
// 		ship_company:String,
// 		vessel_reg_info:String
// 	},
// 	individual_info:{
// 		DOB:String,
// 		aka:String,
// 		POB:String,
// 		Passport:String,
// 		SSN:String,
// 		NIT:String,
// 		Ced_no:String,
// 		DNI:String,
// 		Linked_to:String,
// 		RFC:String,
// 		nationality:String,
// 		nat_id_no:String,
// 		gender:String,
// 		email_addr:String,
// 		phone_num:String,

// 	},
// 	aircraft_construction:String
// 	tax_id_no:String,
// 	additional_info:String,
// 	company_no:String,

// });