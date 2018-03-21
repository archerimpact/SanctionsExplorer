import requests
import urllib
import json
import util
log = util.log('matcher')

def write_pr_matches(outfile):
    data = {}
    entries = get_names_from_elastic()

    for elem in entries:
        sdn_id = elem['_id']
        name = elem['_source']['primary_display_name']
        data[sdn_id] = []

        result = query_pr_content(name)
        for entry in result['hits']['hits']:
            pr_elem = {
                'pr_id': entry['_id'],
                'link': entry['_source']['link'],
                'date': entry['_source']['date'],
                'title': entry['_source']['title'],
            }
            data[sdn_id].append(pr_elem)

    util.write_json(outfile, data)


def write_ofac_id_matches(outfile):
    data = {}        # { sdn_id : ofac_website_id }
    entries = get_names_from_elastic()
    for entry in entries:
        sdn_id = entry['_id']
        name = entry['_source']['primary_display_name']

        # TODO do some matching
        ofac_website_id = 0

        data[sdn_id] = ofac_website_id

    util.write_json(outfile, data)


def get_names_from_elastic():
    scandata = {'_source': ['primary_display_name'], 'size': '10000'}
    scan = requests.get('http://localhost:9200/sdn/_search', json=scandata)
    if scan.status_code != 200:
        log('Failed to obtain all SDN primary names', 'error')

    log('Successfully obtained all SDN primary names', 'debug')
    return scan.json()['hits']['hits']


def query_pr_content(query):
    url_template = 'http://localhost:9200/pr/pr/_search'
    headers = {'Content-Type': 'application/json'}
    data = {'query': {'match_phrase': {'content' :{'query': query, 'slop': '3'}}}}

    response = requests.get(url_template, json=data)
    if response.status_code == 200:
        return response.json()
    else:
        log('Failed to query a PR in Elastic (error ' + response.status_code + ')', 'error')
