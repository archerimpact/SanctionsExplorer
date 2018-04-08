import sqlite3
from bs4 import BeautifulSoup
import requests
import re
from urllib.parse import urljoin
import os
import json

import util
log = util.log('pr_scraper')

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

def sanitize(text):
	newText = ""

	while (text.find("<") != -1):
		sectionStart = text.find("<")
		newText += text[:sectionStart]
		if len(newText) > 0 and newText[-1] == ":":
			newText += "\n"
		text = text[sectionStart:]
		sectionEnd = text.find(">")
		text = text[sectionEnd + 1:]

	return newText


def parseHtml2001(pr_result):
	pr_content = pr_result.content.decode("utf-8")
	div_loc = pr_content.find("<div class=\"content\">")
	if pr_content.find("<div class=\"content-slim\">") != -1:
		div_loc = pr_content.find("<div class=\"content-slim\">")
	if div_loc == -1:
		div_loc = pr_content.find("<div id=\"centerblock\">")
	div_open = 1
	content = pr_content[div_loc + 4:]
	while (div_open != 0):
		if content.find("<div") != -1 and content.find("</div") != -1:
			if(content.find("<div") < content.find("</div")):
				div_open += 1
				content = content[content.find("<div") + 4:]
			else:
				div_open -= 1
				content = content[content.find("</div") + 5:]
		else:
			if(content.find("</div") != -1):
				div_open -= 1
				content = content[content.find("</div") + 5]
			else:
				break

	end = pr_content.find(content)
	body = pr_content[div_loc:end + 1]

	temp = body[:]
	p_text = ""

	end = temp.find("<div class=\"image center\">")
	if end != -1:
		temp = temp[:end]
	end = temp.find("<div class=\"leftcontent\">")
	if end != -1:
		temp = temp[:end]
	end = temp.find("<div class=\"field field--name-field-news-use-featured-image field--type-boolean field--label-above\">")
	if end != -1:
		temp = temp[:end]

	p_text = sanitize(temp)
	p_text = p_text.replace("Page Content", "\n")
	p_text = p_text.replace("&#160;\n", "")
	p_text = p_text.replace("&#39;", "'")
	p_text = p_text.replace("&lsquo;", "'")
	p_text = p_text.replace("&rsquo;", "'")
	p_text = p_text.replace("&ldquo;", "\"")
	p_text = p_text.replace("&rdquo;", "\"")
	p_text = p_text.replace("&nbsp;", "")
	p_text = p_text.replace(".The following ", ".\nThe following ")
	p_text = p_text.replace("\n\n\n\n", "\n")
	p_text = p_text.replace("].\n", "].")
	p_text = p_text.replace("].", "].\n")
	p_text = p_text.replace("&amp;", "&")
	p_text = p_text.replace("&ndash;", "-")

	return p_text.replace("&quot;", "\"")

def scrape_urls(urls):
	tup_list = []

	skips = 0
	i = 0
	for url in urls:
		# print (url)
		result = requests.get(url)
		if result.status_code == 200:
			content = result.content
			soup = BeautifulSoup(content, 'html.parser')
			table_rows = soup.findAll('tr')
			for row in table_rows:
				links = row.findAll('a')
				tableCheck = row.findAll('table')
				if (len(tableCheck) > 0):
					continue
				pr_links = [link for link in links if is_press_release(link.text)]
				date_links = [link for link in links if is_date(link.text)]
				if len(date_links) > 0:
					curr_date = re.search(r'\d{2}\/\d{2}\/\d{4}', date_links[0].text).group(0)
					cell = row.findAll('td')[-1]
					name = remove_link(cell.get_text())
					related = []
					for pr_link in pr_links:
						pr_url = pr_link.get('href')
						related.append(str(pr_url))
						if is_relative_url(pr_url):
							pr_url = urljoin(url, pr_url)

						if pr_url.find("2001-2009.state.gov") != -1 or pr_url == "https://www.treasury.gov/press-center/press-releases/Documents/1102_abo_ghaith.pdf":
							skips += 1
							continue
						pr_result = requests.get(pr_url)
						if pr_result.status_code == 200:
							html = parseHtml2001(pr_result)
							pr_content = extract_text(pr_result.content)
							pr_content = ""
							tup_list.append( (curr_date, name, pr_url, pr_content, html, 'pr', []) )
					for d_link in date_links:
						d_url = d_link.get('href')
						if is_relative_url(d_url):
							d_url = urljoin(url, d_url)
						d_result = requests.get(d_url)
						if d_result.status_code == 200:
							d_content = extract_text(d_result.content)
							d_content = d_content.replace("\n", "")
							d_content = ""
							html = parseHtml2001(d_result)
							tup_list.append( (curr_date, name, d_url, d_content, html, 'd', related) )

	jsondata = []
	for tup in tup_list:
		entry = {}
		entry['date'], entry['title'], entry['link'], entry['nothing'], entry['content'], entry['d'], entry['related'] = tup
		jsondata.append(entry)

	return jsondata


def scrape_and_write_prs(outfile, all_years=False):
	CURR_YEAR = 2018

	url_template_one = 'https://www.treasury.gov/resource-center/sanctions/OFAC-Enforcement/Pages/ofac-actions-{}.aspx'
	url_template_two = 'https://www.treasury.gov/resource-center/sanctions/OFAC-Enforcement/Pages/{}.aspx'
	url_current      = 'https://www.treasury.gov/resource-center/sanctions/OFAC-Enforcement/Pages/OFAC-Recent-Actions.aspx'

	urls = []
	urls.append(url_current)

	if all_years:
		for year in [2001, 2002]:
			urls.append(url_template_two.format(year))
		for year in range(2003, CURR_YEAR):
			urls.append(url_template_one.format(year))

	scraped_data = scrape_urls(urls)
	old_data = util.read_json(outfile)
	old_data = list(filter(lambda e: str(CURR_YEAR) not in e['date'], old_data))
	old_data.extend(scraped_data)

	if util.write_json(outfile, old_data):
		log('Successfully wrote PRs to the outfile', 'info')

def scrape_all_years(outfile):
	scrape_and_write_prs(outfile, all_years=True)

def scrape_2018(outfile):
	scrape_and_write_prs(outfile, all_years=False)
