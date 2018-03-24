import argparse
import requests
from bs4 import BeautifulSoup
import requests
import pickle
from time import sleep

base_url = "http://sanctionssearch.ofac.treas.gov/Details.aspx?id={}"


individual_type = "ctl00_MainContent_lblType"
vessel_type = "ctl00_MainContent_lblTypeVessel"
entity_aircraft_type = "ctl00_MainContent_lblTypeOther"


first_name_id = "ctl00_MainContent_lblFirstName"
last_name_id = "ctl00_MainContent_lblLastName"
vessel_name_id = "ctl00_MainContent_lblVesselName"
entity_aircraft_name_id = "ctl00_MainContent_lblNameOther"


error_text = "An error has occured."


tup_list = []

def is_type(soup, match_string):
	match = soup.find(id=match_string)
	return match is not None

def parse_name(soup, match_strings):
	ret = []
	for ms in match_strings:
		match = soup.find(id=ms)
		if match is not None:
			ret.append(match.text)
	return " ".join(ret)

def is_error(soup):
	return error_text in soup.findall('h4')[0].text



# gets tups from start -> end and puts them in tup list
def scrape(start_num, end_num):
	# f = open('temp_test.txt', 'w')
	i = start_num
	while (i < end_num):
		url = base_url.format(i)
		result = None
		while result is None:
			try:
				temp = requests.get(url)
				if temp.status_code == 200:
					result = temp
			except Exception as e:
				# print('waiting')
				sleep(5)

		if result.status_code == 200:
			c = result.content
			soup = BeautifulSoup(c, 'lxml')
			
			if is_type(soup, individual_type):
				tup = (parse_name(soup, [first_name_id, last_name_id]), i, "individual")
				tup_list.append(tup)
				# f.write(str(tup[0]) + ' ' + str(i) + ' ' + str(tup[2]) + '\n')
			elif is_type(soup, vessel_type):
				tup = (parse_name(soup, [vessel_name_id]), i, "vessel")
				tup_list.append(tup)
				# f.write(str(tup[0]) + ' ' + str(i) + ' ' + str(tup[2]) + '\n')
			elif is_type(soup, entity_aircraft_type):
				tup = (parse_name(soup, [entity_aircraft_name_id]), i, "entity/aircraft")
				tup_list.append(tup)
				# f.write(str(tup[0]) + ' ' + str(i) + ' ' + str(tup[2]) + '\n')
			else:
				return
		i += 1
		print(i)
	# f.close()

def write_ofac_ids(filename):
	inf = open('update_files/ofac_names.txt', 'rb')
	old_tups = pickle.load(inf)
	inf.close()
	
	num_tups = len(old_tups)
	scrape(num_tups, float('inf'))
	if len(tup_list) == 0:
		exit()
		
	old_tups.extend(tup_list)
	
	print("before scrape", num_tups)
	print("after scrape", len(old_tups))

	outf = open('update_files/ofac_names.txt', 'wb')
	pickle.dump(old_tups, outf)
	outf.close()

	with open(filename, 'w') as f:
		for t in old_tups:
			f.write(str(t[1]) + '|' + t[0] + '\n')





