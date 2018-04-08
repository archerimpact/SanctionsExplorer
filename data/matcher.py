import requests
import urllib
import json
import util
import re
from difflib import get_close_matches
import string
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
            other_dates = query_pr_date(entry['_source']['date'])
            for date_entry in other_dates['hits']['hits']:
                if (date_entry['_id'] != entry['_id']):
                    new_elem = {
                        'pr_id': date_entry['_id'],
                        'link': date_entry['_source']['link'],
                        'date': date_entry['_source']['date'],
                        'title': date_entry['_source']['title'],
                    }
                    data[sdn_id].append(new_elem)

    util.write_json(outfile, data)


def write_ofac_id_matches(infile, outfile):
    table = str.maketrans(dict.fromkeys(string.punctuation + '\n'))

    data = {}            # { sdn_id : ofac_website_id }
    ofac_name_to_id = {} # {ofac_name : ofac_website_id}

    with open(infile) as f:
        for line in f:
            ofac_id, name = line.split('|')
            name = name.lower().translate(table).strip()
            ofac_name_to_id[name] = ofac_id
    ofac_names = ofac_name_to_id.keys()

    entries = get_names_from_elastic()

    num_not_found = 0
    for entry in entries:
        sdn_id = entry['_id']
        name = entry['_source']['primary_display_name'].lower().translate(table).strip()

        try:
            best_match = get_close_matches(name, ofac_names, n=1, cutoff=1.0)[0]
            ofac_website_id = ofac_name_to_id[best_match]
            data[sdn_id] = ofac_website_id
        except:
            # Try to transpose the words in a name and search for them
            found = False
            new = name
            for _ in range(name.count(' ')):
                first, space, last = new.partition(' ')
                new = last + ' ' + first
                try:
                    best_match = get_close_matches(new, ofac_names, n=1, cutoff=1.0)[0]
                    ofac_website_id = ofac_name_to_id[best_match]
                    data[sdn_id] = ofac_website_id
                    found = True
                    break
                except:
                    pass
            if not found:
                num_not_found += 1
    log(f'{num_not_found} IDs were unable to be matched to their OFAC website counterpart', 'warning')

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

def query_pr_date(query):
    url_template = 'http://localhost:9200/pr/pr/_search'
    headers = {'Content-Type': 'application/json'}
    data = {'query': {'match_phrase': {'date' :{'query': query, 'slop': '3'}}}}

    response = requests.get(url_template, json=data)
    if response.status_code == 200:
        return response.json()
    else:
        log('Failed to query a PR in Elastic (error ' + response.status_code + ')', 'error')
