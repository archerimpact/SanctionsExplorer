from urllib.request import urlretrieve
from sys import argv
from datetime import datetime

import importlib
import traceback
import subprocess
import os
import feedparser
import filecmp

import sdn_parser
import scrape_prs
import matcher
import scrape_ofac
import util
log = util.log('updater')

RSS_FEED_URL    = 'https://www.treasury.gov/resource-center/sanctions/OFAC-Enforcement/Documents/ofac.xml'
SDN_URL         = 'https://www.treasury.gov/ofac/downloads/sanctions/1.0/sdn_advanced.xml'
NONSDN_URL      = 'https://www.treasury.gov/ofac/downloads/sanctions/1.0/cons_advanced.xml'
DIR             = os.path.dirname(os.path.realpath(__file__))
NEW_RSS_FILE    = DIR + '/update_files/rss_new.txt'
OLD_RSS_FILE    = DIR + '/update_files/rss_old.txt'

SDN_XML_FILE    = DIR + '/update_files/sdn_advanced.xml'
NONSDN_XML_FILE = DIR + '/update_files/non_sdn_advanced.xml'

SDN_JSON        = DIR + '/update_files/sdn.json'
NONSDN_JSON     = DIR + '/update_files/non_sdn.json'
PR_JSON_2018    = DIR + '/update_files/press_releases.json'
PR_MATCHES      = DIR + '/update_files/pr_matches.json'
OFAC_IDS        = DIR + '/update_files/ofac_id_to_name.txt'
OFAC_MATCHES    = DIR + '/update_files/ofac_matches.json'

EXPORT_SDN      = DIR + '/export_sdn.js'
EXPORT_PRS      = DIR + '/export_prs.js'
EXPORT_MATCHES  = DIR + '/export_pr_matches.js'
EXPORT_IDS      = DIR + '/export_ids.js'


def serialize_feed(feed, filename):
    try:
        with open(filename, 'w') as f:
            for item in feed['items']:
                f.write(str(item['published']) + '\n')
    except Exception as e:
        log(str(e), 'error')
        quit()

def run_nodejs(filename, task):
    try:
        log('Attempting to ' + task + '...', 'info')
        subprocess.run(['node', filename])
    except Exception as e:
        log('Failed to ' + task + ': ', 'error')
        util.exception_thrown()
        quit()

def download_and_parse(url, xml, json):
    try:
        log('Downloading ' + url + '...', 'info')
        urlretrieve(url, xml)
    except Exception as e:
        log('While downloading:', 'error')
        util.exception_thrown()
        quit()

    try:
        log('Parsing ' + xml + '...', 'info')
        sdn_parser.parse_to_file(xml, json)
    except Exception as e:
        log('While parsing:' + str(e), 'error')
        log(sys.exc_info, 'error')
        quit()


log(f'{datetime.now()}: Beginning the update process...', 'info')
feed = feedparser.parse(RSS_FEED_URL)
serialize_feed(feed, NEW_RSS_FILE)

force_download = '--force'       in argv or '-f' in argv
update_only    = '--update-only' in argv or '-u' in argv

should_download = force_download or not update_only

try:
    unchanged = filecmp.cmp(OLD_RSS_FILE, NEW_RSS_FILE)
except:
    unchanged = False

if unchanged and not force_download and not update_only:
    quit()

if should_download:
    download_and_parse(SDN_URL, SDN_XML_FILE, SDN_JSON)
    sdn_parser = importlib.reload(sdn_parser)                       # TODO this is horrible and hacky and needs to be removed
    download_and_parse(NONSDN_URL, NONSDN_XML_FILE, NONSDN_JSON)

    log('Scraping press releases from 2018...', 'info')
    scrape_prs.scrape_2018(PR_JSON_2018)

    log('Scraping IDs from the OFAC website...', 'info')
    scrape_ofac.write_ofac_ids(OFAC_IDS)

run_nodejs(EXPORT_SDN, 'export SDN and non-SDN to Elastic')
run_nodejs(EXPORT_PRS, 'export PRs to Elastic')

log('Matching SDN entities with press release data...', 'info')
matcher.write_pr_matches(PR_MATCHES)
run_nodejs(EXPORT_MATCHES, 'export PR matches to Elastic')

log('Matching SDN entities with their IDs on the OFAC website...', 'info')
matcher.write_ofac_id_matches(OFAC_IDS, OFAC_MATCHES_FILE)
# run_nodejs(EXPORT_IDS, 'export ID matches to Elastic')

# If we've successfully made it this far, we write this for next time.
serialize_feed(feed, OLD_RSS_FILE)
