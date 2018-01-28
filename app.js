var express = require('express'),
    app = express();


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



loadData = ()=>{
	json_data = []


	my_headers = ['ent_num', 'sdn_name', 'sdn_type', 'program', 'title', 'call_sign', 'vess_type', 'tonnage', 'grt', 'vess_flag', 'vess_owner', 'remarks']
	// remarks_headers = new Set(['DOB', 'a.k.a.', 'POB', 'Passport', 'SSN', 'NIT', 'Cedula No.', 'D.N.I', 'Linked To:', 'R.F.C.', 'nationality', 'National ID No.', 'Additional Sanctions Information -', 'citizen', 'UK Company Number', 'Website:', 'Website', 'Aircraft Construction', 'Vessel Registration Identification', 'Gender', 'SWIFT/BIC', 'Tax ID No.', 'Email Address', 'Telephone:', 'Phone No.', 'Registration ID', 'Company Number'])

	fs.createReadStream('sdn.csv')
	.pipe(csv({headers:my_headers}))
  	.on('data', function (data) {
    	for (var attr in data){
    		if(data[attr] == "-0- "){
    			data[attr] = null;
    		}
    	}
    	if(data.remarks != null){
    		remarks_separated = data.remarks.split(";")
    		for (var i =0; i<remarks_separated.length-1; i++){
    			remark = remarks_separated[i]
    			if(remark[0] == ' '){
    				remark = remark.substr(1);
    			}
    			var field_name = remark.substr(0, remark.indexOf(' '))
    			var field_value = remark.substr(remark.indexOf(' ') + 1);
    			data[field_name] = field_value
    		}
    	}
    	json_data.push(data)
  });
}

loadData()



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