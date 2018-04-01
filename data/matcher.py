import requests
import urllib
import json
import util
import re
from fuzzywuzzy import process
from difflib import get_close_matches

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
    ofac_name_to_id = {} # {ofac_name : ofac_website_id}
    
    with open('update_files/ofac_id_to_name.txt') as f:
        for line in f:
            ofac_id, name = line.split('|')
            name = name.lower()
            ofac_name_to_id[name] = ofac_id
    ofac_names = ofac_name_to_id.keys()

    entries = get_names_from_elastic()
    i = 0
    for entry in entries:
        sdn_id = entry['_id']
        name = entry['_source']['primary_display_name'].lower()
        
        try:
            best_match = get_close_matches(name, ofac_names, n=1, cutoff=0.9)[0]
        except:
            i += 1
            # names might need to be reversed
            match = re.search(r'[A-Z]+,\s+[a-z]+', name)
            if match:
                last, first = match.group(0).partition(',')
                name = first + ' ' + last
                try:
                    best_match = get_close_matches(name, ofac_names, n=1, cutoff=0.9)[0]
                except:
                    print(name)
                    continue
        
        
        # print(name, ';', best_match)
        ofac_website_id = ofac_name_to_id[best_match]
        data[sdn_id] = ofac_website_id
    print(i)
    util.write_json(outfile, data)


def get_names_from_elastic():
    scandata = {'_source': ['primary_display_name'], 'size': '10000'}
    scan = requests.get('http://localhost:9200/sdn/_search', json=scandata)
    if scan.status_code != 200:
        log('Failed to obtain all SDN primary names', 'error')

    log('Successfully obtained all SDN primary names', 'info')
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
