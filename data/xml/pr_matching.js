const es = require('elasticsearch')
const XLSX = require('xlsx')
const sdn_client = new es.Client({
	host: 'localhost:9200/sdn/'
});
const pr_client = new es.Client({
	host: 'localhost:9200/pr/'
});
const client = new es.Client({
	host: 'localhost:9200'
});

console.log("hello, connected to clients");

var workbook = XLSX.readFile('../press_releases/prelim_matches.xlsx');
var sheet_name_list = workbook.SheetNames;
var xlData = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);
console.log(xlData);

console.log("sample sdn query");

client.search({
	index: 'sdn',
	q: 'primary_display_name:NASSER ARANA, Carlos Alberto'
}, function(error, response) {
	response.hits.hits.forEach(function(hit) {
		if ("NASSER ARANA, Carlos Alberto" === hit._source.primary_display_name) {
			console.log('match found!');
		}
	});
})
