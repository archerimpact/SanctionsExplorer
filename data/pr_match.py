import requests
import urllib
import json

def write_matches(outfile):
	url_template = 'http://localhost:9200/pr/pr/_search'
	headers = {'Content-Type': 'application/json'}
	data = {'query': {'match_phrase': {'content' :{'query': '', 'slop': '3'}}}}

	jsondata = {}

	scandata = {'_source': ['primary_display_name'], 'size': '10000'}
	scan = requests.get('http://localhost:9200/sdn/_search', json=scandata)
	if scan.status_code != 200:
		print('ERROR: Failed to obtain all SDN primary names.')

	print('DEBUG: Successfully obtained all SDN primary names.')

	for elem in scan.json()['hits']['hits']:
		val = elem['_source']['primary_display_name']
		sdnid = elem['_id']
		jsondata[sdnid] = []
		data['query']['match_phrase']['content']['query'] = val;
		result = requests.get(url_template, json=data)
		if result.status_code == 200:
			for entry in result.json()['hits']['hits']:
				pr_elem = {
					'pr_id': entry['_id'],
					'link': entry['_source']['link'],
					'date': entry['_source']['date'],
					'title': entry['_source']['title'],
				}
				jsondata[sdnid].append(pr_elem)
		else:
			print('fail')

	with open(outfile, 'w') as f:
		data = json.dumps(jsondata)
		f.write(data)
		f.close()
