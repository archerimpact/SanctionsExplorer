from feedparser import parse
from filecmp import cmp
from urllib.request import urlretrieve
from sdn_parser import parse_to_file
from os import remove
from Naked.toolshed.shell import execute_js

RSS_FEED_URL = 'https://www.treasury.gov/resource-center/sanctions/OFAC-Enforcement/Documents/ofac.xml'
SDN_XML_URL      = 'https://www.treasury.gov/ofac/downloads/sanctions/1.0/sdn_advanced.xml'
NEW_RSS_FILE = 'update_files/rss_new.txt'
OLD_RSS_FILE = 'update_files/rss_old.txt'
XML_OUTFILE  = 'update_files/sdn_advanced.xml'
SDN_JSON     = 'update_files/latest.json'

def serialize_feed(filename):
	feed = parse(RSS_FEED_URL)
	with open(filename, 'w') as f:
		for item in feed['items']:
			f.write(str(item['published']) + '\n')

def parse_error(msg):
	# force another attempt next time
	remove(OLD_RSS_FILE)
	error(msg)

def error(msg):
	# send Twilio text
	print(msg)
	quit()


#### SDN XML ####
serialize_feed(NEW_RSS_FILE)
try:
	unchanged = cmp(OLD_RSS_FILE, NEW_RSS_FILE)
except:
	unchanged = False

serialize_feed(OLD_RSS_FILE)

if unchanged:
	quit()

print('Downloading new sanctions data...')
try:
	urlretrieve(SDN_XML_URL, XML_OUTFILE)
	print('Downloaded!')
	print('Parsing...')
	parse_to_file(SDN_JSON)
	print('Parsed!')
except Exception as e:
	parse_error(e)

# By now, we have the new SDN in JSON format.

success = execute_js('export_sdn.js')
if not success:
	error('Failed while attempting to export the SDN to Elastic')

#### Press Releases ####
# 3. Scrape latest press releases, placing into entries.json or some other intermediate file
# 4. Call export_prs.js, which consumes entries.json and imports into Elastic
# 5. Call the PR matching program, which downloads a list of names from Elastic,
#    matches with `content` entries in entries.json, and writes the result to the Elastic SDN index.
