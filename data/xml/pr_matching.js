const es = require('elasticsearch');
const fs = require('fs');
const client = new es.Client({
	host: 'localhost:9200'
});

console.log("hello, connected to clients");

var reqs = {};
reqs[0] = [];
var i = 0;
var x = 0;
var j = 0;

function runSearches() {
	if (i == j) {
		return;
	} else {
		client.msearch({
			maxConcurrentSearches:10,
			body:reqs[j]
		}, function(err, responses) {
			if (err) {
				console.log("err");
			}	
			console.log('finished pass: ' + j.toString());
			j = j + 1;
			runSearches();
		});
	}
}

function getReqs(entry_lines) {
  entry_lines.forEach(function(line) {
	let line_split = line.split(" | ");
	let search_query = {
		search: {
			index: 'sdn',
			q: 'primary_display_name:'+line_split[0]
		}
	}
	let q = { query: { query_string: { query: line_split[0]}}};
	let search_index = { index: 'sdn', type: 'entry' }
	if (x < 400) {
		reqs[i].push(search_index);
		reqs[i].push(q);
		x = x + 1;
	} else {
		i = i + 1;
		reqs[i] = [];
		x = 0;
	}
  });
  runSearches();
}

var entry_lines = [];
fs.readFile("../press_releases/matchdata.txt", 'utf8', function(err, data) {
	entry_lines = data.split("\n");
	getReqs(entry_lines);
});
console.log('asdf');

entries = {};

//console.log(entries);
//
//var reqs = {};
//reqs[0] = [];
//var i = 0;
//var x = 0;
//Object.keys(entries).forEach(function(key) {
//	let search_query = {
//		search: {
//			index: 'sdn',
//			q: 'primary_display_name:'+key
//		}
//	}
//	let q = { query: { query_string: { query: key}}};
//	let search_index = { index: 'sdn', type: 'entry' }
//	if (x < 400) {
//		reqs[i].push(search_index);
//		reqs[i].push(q);
//		x = x + 1;
//	} else {
//		i = i + 1;
//		reqs[i] = [];
//		x = 0;
//	}
//});

//var j = 0;
//function runSearches() {
//	if (i == j) {
//		return;
//	} else {
//		client.msearch({
///			maxConcurrentSearches:10,
//			body:reqs[j]
//		}, function(err, responses) {
//			if (err) {
//				console.log("err");
//			}
//			console.log('finished pass: ' + j.toString());
//			j = j + 1;
//			runSearches();
//		});
//	}
//}
console.log("running searches");
//runSearches();

//client.msearch({
//	maxConcurrentSearches:10,
//	body: reqs
//}, function(err, response) {
//	if (err) {
//		console.log(err);
//	}
//	console.log(response);
//});



//Object.keys(entries).forEach(function(key) {
	//console.log('primary_display_name:'+key)
//	client.search({
//		index: 'sdn',
//		q: 'primary_display_name:'+key
//	}, function(error, response) {
//		console.log(key)
//		console.log(response)
//		response.hits.hits.forEach(function(hit) {
//			if (key == hit._source.primary_display_name) {
//				console.log('match: ' + hit.source.primary_display_name);
//			}
//		})
//	})
//});


//var key = 'YASSIN, Sheik Ahmed Ismail'
//client.search({
//	index: 'sdn',
//	q: 'primary_display_name:' + key
//}, function(error, response) {
//	response.hits.hits.forEach(function(hit) {
//		if (key === hit._source.primary_display_name) {
//			console.log('match');
//		}
//	})
//});
