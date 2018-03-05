const mongoosastic = require("mongoosastic");
const mongoose = require("mongoose");
const fs = require('fs')
// mongoose.connect('mongodb://localhost/xmlofacasaurus');


module.exports.IdentitySchema = mongoose.Schema({
	id:Number,
	aliases:[{
		alias_type:String,
		is_primary:Boolean,
		is_low_quality:Boolean,
		entity_name:[String],
		date_period:String,
		display_name:String
	}],
	primary:{
		alias_type:String,
		is_primary:Boolean,
		is_low_quality:Boolean,
		entity_name:[String],
		date_period:String,
		display_name:String
	}
});

module.exports.SanctionsEntrySchema = mongoose.Schema({
	list:String,
	entry_events:[String],
	program:[String]
});

module.exports.DocumentSchema = mongoose.Schema({
	type:String,
	issued_by:String,
	issued_in:String,
	validity:String,
	issuing_authority:String,
	id_number:String
});

module.exports.FeatureSchema = mongoose.Schema({
	feature_type:String,
	reliability:String,
	comment:String,
	locations:[{
		address1:String,
		address2:String,
		address3:String,
		city:String,
		postal_code:String,
		country:String,
		combined:String,
		state_province:String,
		region:String
	}],
	details:String,
	dates:[String]
});

module.exports.LinkedToSchema = mongoose.Schema({
	to_id:String,
	to_name:{
		alias_type:String,
		is_primary:String,
		documented_name:{
			entity_name:[String],
			first_name:[String],
			middle_name:[String]
		},	
		display_name:String
	},
	relation_type:String,
	relation_quality:String,
	is_former:String,
	is_reverse:String
});

module.exports.XMLEntrySchema = mongoose.Schema({
	identity:this.IdentitySchema,
	features:[this.FeatureSchema],
	sanctions_entries:[this.SanctionsEntrySchema],
	documents:[this.DocumentSchema],
	linked_profiles:[this.LinkedToSchema],
	party_comment:String,
	fixed_ref:Number,
	party_sub_type:String,
	//Start Identity Fields
	identity_id:{type:Number, es_indexed:true},
	primary_display_name:{type:String, es_indexed:true},
	all_display_names:{type:[String], es_indexed:true},
	//Start sanctions entries fields
	programs:{type:[String], es_indexed:true},
	//Start Linked Profiles fields
	linked_profile_names:{type:[String], es_indexed:true},
	linked_profile_ids:{type:[String], es_indexed:true},
	//Start Documents Field
	doc_id_numbers:{type:[String], es_indexed:true},
	//Start Features Fields
	birthdate:{type:String, es_indexed:true},
	place_of_birth:{type:[String], es_indexed:true},
	location:{type:[String], es_indexed:true},
	website:{type:[String], es_indexed:true},
	title:{type:[String], es_indexed:true},
	additional_information:{type:[String], es_indexed:true},
	vessel_call_sign:{type:[String], es_indexed:true},
	vessel_flag:{type:[String], es_indexed:true},
	vessel_owner:{type:[String], es_indexed:true},
	vessel_tonnage:{type:[String], es_indexed:true},
	vessel_gross_tonnage:{type:[String], es_indexed:true},
	vessel_type:{type:[String], es_indexed:true},
	nationality_country:{type:[String], es_indexed:true},
	citizenship_country:{type:[String], es_indexed:true},
	gender:{type:[String], es_indexed:true},
	website:{type:[String], es_indexed:true},
	email_address:{type:[String], es_indexed:true},
	swift_bic:{type:[String], es_indexed:true},
	ifca_determination:{type:[String], es_indexed:true},
	aircraft_construction_number:{type:[String], es_indexed:true},
	aircraft_msn:{type:[String], es_indexed:true},
	aircraft_manufacture_date:{type:[String], es_indexed:true},
	aircraft_model:{type:[String], es_indexed:true},
	aircraft_operator:{type:[String], es_indexed:true},
	bik:{type:[String], es_indexed:true},
	un_locode:{type:[String], es_indexed:true},
	aircraft_tail_number:{type:[String], es_indexed:true},
	previous_aircraft_tail_number:{type:[String], es_indexed:true},
	micex_code:{type:[String], es_indexed:true},
	nationality_of_registration:{type:[String], es_indexed:true},
	duns_number:{type:[String], es_indexed:true}
});

this.XMLEntrySchema.plugin(mongoosastic);
let XMLEntry = mongoose.model('XMLEntry', this.XMLEntrySchema);

module.exports.XMLEntry = XMLEntry;


var data = JSON.parse(fs.readFileSync('../xml/sdn_advanced/v7.json', 'utf8'));
//var data = JSON.parse(fs.readFileSync('../xml/sdn_advanced/v5.json', 'utf8'));

var feature_keys = new Set();

function print_vals(){
for(var i =0; i< data.length; i++){
	entry = data[i]
	// console.log(i)
	if(entry.features){
		for (key in entry.features){
			for (var j = 0; j < entry.features[key].length; j++){
				for (key2 in entry.features[key][j]){
					feature_keys.add(key2)
					if(key2 == "details"){
						// console.log(entry.features[key][j][key2])
					}
				}
			}
		}

		// console.log(entry.linked_profiles);
	}
}
}

//console.log(feature_keys)

function load_data(data){
	all_data = []

	for(var i = 0; i<data.length; i++){
		console.log("Doing data "+i)

		entry = data[i]
		// Do identities
		full_json = {}

		identity = {}

		full_json.identity_id = entry.identity.id;
		
		identity.aliases = entry.identity.aliases;
		identity.primary = entry.identity.primary;
		identity.id = entry.identity.id;

		full_json.primary_display_name =  entry.identity.primary.display_name;
		full_json.all_display_names = [entry.identity.primary.display_name];
		full_json.identity_id = entry.identity.id;

		for(var j = 0; j< entry.identity.aliases.length; j++){
			full_json.all_display_names.push(entry.identity.aliases[j].display_name);
		}

		full_json.identity = identity;


		//Do party_comment

		full_json.party_comment = entry.party_comment;

		//Do fixed_ref

		full_json.fixed_ref = entry.fixed_ref;

		//Do party_sub_type

		full_json.party_sub_type = entry.party_sub_type;

		//Do sanctions entries

		full_json.sanctions_entries = entry.sanctions_entries;

		full_json.programs = []

		for(var j = 0; j< entry.sanctions_entries.length; j++){
			for(var k = 0; k < entry.sanctions_entries[j].program.length; k++){
				full_json.programs.push(entry.sanctions_entries[j].program[k])
			}
		}

		
		//Do documents

		full_json.documents = entry.documents;

		full_json.doc_id_numbers = []

		for(var j = 0; j < entry.documents.length; j++){
			full_json.doc_id_numbers.push(entry.documents[j].id_number);
		}


		//Do linked profiles

		full_json.linked_profiles = entry.linked_profiles
		full_json.linked_profile_ids = []
		full_json.linked_profile_names = []

		for(var j = 0; j < entry.linked_profiles.length; j++){
			full_json.linked_profile_ids.push(entry.linked_profiles[j].to_id);
			full_json.linked_profile_names.push(entry.linked_profiles[j].to_name.display_name)
		}

		// Do features

		full_json.features = []

		var feature_names = ['Location',
		  'Title',
		  'Birthdate',
		  'Place of Birth',
		  'Additional Sanctions Information - ',
		  'Vessel Call Sign',
		  'Vessel Flag',
		  'Vessel Owner',
		  'Vessel Tonnage',
		  'Vessel Gross Registered Tonnage',
		  'VESSEL TYPE',
		  'Nationality Country',
		  'Citizenship Country',
		  'Gender',
		  'Website',
		  'Email Address',
		  'SWIFT/BIC',
		  'IFCA Determination - ',
		  'Aircraft Construction Number (also called L/N or S/N or F/N)',
		  'Aircraft Manufacturer’s Serial Number (MSN)',
		  'Aircraft Manufacture Date',
		  'Aircraft Model',
		  'Aircraft Operator',
		  'BIK (RU)',
		  'UN/LOCODE',
		  'Aircraft Tail Number',
		  'Previous Aircraft Tail Number',
		  'MICEX Code',
		  'Nationality of Registration',
		  'D-U-N-S Number']

		var feature_schema_names = ["location",
		"title", 
		"birthdate",
		"place_of_birth",
		"additional_information",
		"vessel_call_sign",
		"vessel_flag",
		"vessel_owner",
		"vessel_tonnage",
		"vessel_gross_tonnage",
		"vessel_type",
		"nationality_country",
		"citizenship_country",
		"gender",
		"website",
		"email_address",
		"swift_bic",
		"ifca_determination",
		"aircraft_construction_number",
		"aircraft_msn",
		"aircraft_manufacture_date",
		"aircraft_model",
		"aircraft_operator",
		"bik",
		"un_locode",
		"aircraft_tail_number",
		"previous_aircraft_tail_number",
		"micex_code",
		"nationality_of_registration",
		"duns_number"
		]

		// console.log(entry.features)


		for(feature_key in entry.features){
			// console.log(feature_key)
			for (var j = 0; j< entry.features[feature_key].length; j++){
				feature = {}
				var idx = feature_names.indexOf(feature_key)
				if(idx<0){
					console.log(key + " NOT FOUND");
					continue;
				}
				else{
					if(!(full_json[feature_schema_names[idx]])){
						full_json[feature_schema_names[idx]] = []
					}
				}
				//Match with correct field
				feature.feature_type = feature_key;
				feature.reliability = entry.features[feature_key][j].reliability;
				feature.comment = entry.features[feature_key][j].comment;

				// console.log(entry.features[feature_key][j])

				if(entry.features[feature_key][j].locations){
					feature.locations = entry.features[feature_key][j].locations;
					for(var k = 0; k< entry.features[feature_key][j].locations.length; k++){
						full_json[feature_schema_names[idx]].push(entry.features[feature_key][j].locations[k].combined)
					}
				}
				else{
					feature.locations = null;
				}
				if(entry.features[feature_key][j].details){
					feature.details = entry.features[feature_key][j].details;
					full_json[feature_schema_names[idx]].push(entry.features[feature_key][j].details)
				}
				else{
					feature.details = null;
				}
				if(entry.features[feature_key][j].dates){
					feature.dates = entry.features[feature_key][j].dates;
					for(var k = 0; k< entry.features[feature_key][j].dates.length; k++){
						full_json[feature_schema_names[idx]].push(entry.features[feature_key][j].dates[k].combined)
					}
				}
				else{
					feature.dates = null;
				}

				full_json.features.push(feature);
			}

		}
		// console.log(full_json)
		let new_entry = new XMLEntry(full_json);
		// new_entry.save((err)=>{
		// 	if(err){
		// 		console.log(err);
		// 	}
		// })
		// console.log(new_entry)
	}

}

function sync(model) {
    let stream = model.synchronize();
    var count = 0;

    stream.on('data', (err, doc) => count++);
    stream.on('close', () => console.log('Indexed ' + count + ' document'));
    stream.on('error', (err) => console.log(err));
}

load_data(data);

//sync(XMLEntry);

// console.log(feature_keys)

