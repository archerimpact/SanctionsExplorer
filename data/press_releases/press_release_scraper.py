import sqlite3
from bs4 import BeautifulSoup
import requests
import datetime
import re
import urlparse

conn = sqlite3.connect('press_releases.db')
c = conn.cursor()

c.execute('''CREATE TABLE press_releases
             (pr_date text, name text, link text, content text, type text)''')

now = datetime.datetime.now()
current_year = now.year

url_template_one = "https://www.treasury.gov/resource-center/sanctions/OFAC-Enforcement/Pages/ofac-actions-{}.aspx"
url_template_two = "https://www.treasury.gov/resource-center/sanctions/OFAC-Enforcement/Pages/{}.aspx"
url_current = "https://www.treasury.gov/resource-center/sanctions/OFAC-Enforcement/Pages/OFAC-Recent-Actions.aspx"


# create tups of form (date, link, content, type)
tup_list = []


urls = []
urls.append(url_current)

for year in [2001, 2002]:
	urls.append(url_template_two.format(year))
for year in range(2003, current_year):
	urls.append(url_template_one.format(year))

def is_press_release(text):
	return text == 'Press Release' or text == 'Press Release 1' or text == "Press Release 2"

def is_date(text):
	return re.search(r'\d{2}\/\d{2}\/\d{4}', text) is not None

def is_relative_url(text):
	return text[0] == '/'

def extract_text(html):
	soup = BeautifulSoup(html, 'html.parser')
	for script in soup(["script", "style"]):
		script.extract()
	text = soup.get_text()
	lines = (line.strip() for line in text.splitlines())
	chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
	text = '\n'.join(chunk for chunk in chunks if chunk)
	return text

def remove_link(text):
	pr_index = text.find('[')
	if pr_index == -1:
		return text.strip()
	else:
		return text[:pr_index - 2].strip()

i = 0
for url in urls:
	print (url)
	result = requests.get(url)
	if result.status_code == 200:
		content = result.content
		soup = BeautifulSoup(content, 'html.parser')
		table_rows = soup.findAll('tr')
		for row in table_rows:
			links = row.findAll('a')
			pr_links = [link for link in links if is_press_release(link.text)]
			date_links = [link for link in links if is_date(link.text)]
			if len(date_links) > 0:
				curr_date = re.search(r'\d{2}\/\d{2}\/\d{4}', date_links[0].text).group(0)
				cell = row.findAll('td')[-1]
				name = remove_link(cell.get_text())
				for pr_link in pr_links:
					pr_url = pr_link.get('href')
					if is_relative_url(pr_url):
						pr_url = urlparse.urljoin(url, pr_url)
					pr_result = requests.get(pr_url)
					if pr_result.status_code == 200:
						pr_content = extract_text(pr_result.content)
						tup_list.append( (curr_date, name, pr_url, pr_content, 'pr') )
				for d_link in date_links:
					d_url = d_link.get('href')
					if is_relative_url(d_url):
						d_url = urlparse.urljoin(url, d_url)
					d_result = requests.get(d_url)
					if d_result.status_code == 200:
						d_content = extract_text(d_result.content)
						tup_list.append( (curr_date, name, d_url, d_content, 'd') )

c.executemany('INSERT INTO press_releases VALUES (?,?,?,?,?)', tup_list)
conn.commit()
conn.close()
