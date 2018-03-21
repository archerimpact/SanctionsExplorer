from feedparser import parse
from filecmp import cmp
from urllib.request import urlretrieve
from subprocess import run
from os import path
from sys import argv
import importlib

import sdn_parser
import pr_scraper
import matcher
import ofac_mapping

RSS_FEED_URL    = 'https://www.treasury.gov/resource-center/sanctions/OFAC-Enforcement/Documents/ofac.xml'
SDN_URL         = 'https://www.treasury.gov/ofac/downloads/sanctions/1.0/sdn_advanced.xml'
NONSDN_URL      = 'https://www.treasury.gov/ofac/downloads/sanctions/1.0/cons_advanced.xml'
DIR             = path.dirname(path.realpath(__file__))
NEW_RSS_FILE    = DIR + '/update_files/rss_new.txt'
OLD_RSS_FILE    = DIR + '/update_files/rss_old.txt'

SDN_XML_FILE    = DIR + '/update_files/sdn_advanced.xml'
NONSDN_XML_FILE = DIR + '/update_files/non_sdn_advanced.xml'

SDN_JSON        = DIR + '/update_files/sdn.json'
NONSDN_JSON     = DIR + '/update_files/non_sdn.json'
PR_JSON_2018    = DIR + '/update_files/press_releases.json'
PR_MATCHES      = DIR + '/update_files/pr_matches.json'
OFAC_MATCHES    = DIR + '/update_files/ofac_id_matches.json'

EXPORT_SDN      = DIR + '/export_sdn.js'
EXPORT_PRS      = DIR + '/export_prs.js'
EXPORT_MATCHES  = DIR + '/export_pr_matches.js'


def error(msg):
	# send Twilio text
	print('<Updater> ERROR: ' + str(msg))
	quit()

def debug(msg):
	print('<Updater> DEBUG: ' + str(msg))

def serialize_feed(feed, filename):
	try:
		with open(filename, 'w') as f:
			for item in feed['items']:
				f.write(str(item['published']) + '\n')
	except Exception as e:
		error(e)

def run_nodejs(filename, task):
	try:
		run(['node', filename])
	except Exception as e:
		error('Failed to ' + task + ': ' + str(e))

def download_and_parse(url, xml, json):
	try:
		debug('Downloading ' + url + '...')
		urlretrieve(url, xml)
		debug('Parsing ' + xml + '...')
		sdn_parser.parse_to_file(xml, json)
	except Exception as e:
		error('While parsing ' + str(e) + ', ')


feed = parse(RSS_FEED_URL)
serialize_feed(feed, NEW_RSS_FILE)

force_update = len(argv) > 1 and (argv[1] == '--force' or argv[1] == '-f')

try:
	unchanged = cmp(OLD_RSS_FILE, NEW_RSS_FILE)
except:
	unchanged = False

if unchanged and not force_update:
	quit()

download_and_parse(SDN_URL, SDN_XML_FILE, SDN_JSON)
sdn_parser = importlib.reload(sdn_parser)                       # TODO this is horrible and hacky and needs to be removed
download_and_parse(NONSDN_URL, NONSDN_XML_FILE, NONSDN_JSON)

debug('Exporting SDN to Elastic...')
run_nodejs(EXPORT_SDN, 'export SDN and non-SDN to Elastic')

# Scrape latest press releases, placing into an intermediate JSON file
debug('Scraping press releases from 2018...')
pr_scraper.scrape_2018(PR_JSON_2018)

# Call export_prs.js, which imports the JSON into Elastic
debug('Exporting press releases to Elastic...')
run_nodejs(EXPORT_PRS, 'export PRs to Elastic')

# Call the PR matching program, which downloads a list of names from Elastic,
#    matches with press release content, creates an intermediate JSON file,
#    and writes the result to the Elastic SDN index.
debug('Matching SDN entities with press release data...')
matcher.write_pr_matches(PR_MATCHES)

debug('Exporting matches to Elastic...')
run_nodejs(EXPORT_MATCHES, 'export PR matches to Elastic')

# Match with IDs on the OFAC website
#ofac_mapping.write_ofac_ids(OFAC_MATCHES_FILE)

#debug('Matching SDN entities with their IDs on the OFAC website...')
#matcher.write_ofac_id_matches(OFAC_MATCHES_FILE)

# If we've successfully made it this far, we write this for next time.
serialize_feed(feed, OLD_RSS_FILE)
