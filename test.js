const mongoose = require('mongoose');
const mongoosastic = require('mongoosastic');
mongoose.connect('mongodb://localhost/test');

const testSchema = mongoose.Schema({
	first_name: {type:String, es_indexed:true}
});

testSchema.plugin(mongoosastic);

let test = mongoose.model('test', testSchema);

test.search({
	query_string:{
		query:"John"
	}
}, function(err, results){
	console.log(err);
	console.log(results);
});

var new_test = new test({
	first_name: "Nik"
});
new_test.save(function(err){
	console.log(err)
});

