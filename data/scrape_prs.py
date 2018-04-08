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

def extract_table(raw_html):
	toParse = str(raw_html)
	start = toParse.find("<table")
	end = toParse.find("</table>") + len("</table>")
	return toParse


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
				#print (div_open)
				break

	end = pr_content.find(content)
	body = pr_content[div_loc:end + 1]

	temp = body[:]
	# temp = temp.replace("<div></div>", "\n")
	# temp = temp.replace("<p></p>", "\n")

	p_text = ""

	# titleStart = temp.find("<h2>")
	# titleEnd = temp.find("</h2>")
	# if titleStart != -1 and titleEnd != -1:
	# 	titleText = temp[titleStart + 4: titleEnd]
	# 	p_text += sanitize(titleText)

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

	# while(len(temp) > 0):
	# 	endBracket = temp.find(">")
	# 	temp = temp[endBracket + 1:]
	# 	nextStart = temp.find("<")
	# 	toAdd = temp[:nextStart]
	# 	p_text += toAdd
	# 	temp = temp[nextStart:]

	# while (temp.find("<p") != -1):
	# 	toAdd = temp[temp.find("<p"):]
	# 	toAdd = toAdd[toAdd.find(">") + 1:toAdd.find("</p>")]
	# 	print(toAdd)
	# 	p_text += toAdd
	# 	temp = temp[temp.find("</p>") + 4:]
	# 	p_text += "\n"
	# 	if (len(p_text) > 2 and p_text[-2] == ":"):
	# 		stop = temp.find("<p>")
	# 		if stop == -1:
	# 			stop = temp.find("</div>")
	# 		p_text += temp[:stop]

	# print ("******\n")

	# if p_text == "":
	# 	while (temp.find("<div") != -1):
	# 		toAdd = temp[temp.find("<div"):]
	# 		toAdd = toAdd[toAdd.find(">") + 1:toAdd.find("</div>")]
	# 		p_text += toAdd
	# 		temp = temp[temp.find("</div>") + 4:]
	# 		p_text += "\n"

	# if p_text == "":
	# 	p_text = temp[:-5]

	# p_text = p_text.replace("<br>", "\n")
	# p_text = p_text.replace("<br />", "\n")

	# while (p_text.find("<") != -1):
	# 	p_text = p_text[:p_text.find("<")] + p_text[p_text.find(">") + 1:]

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
			tableText = extract_table(content)
			soup = BeautifulSoup(tableText, 'html.parser')
			table_rows = soup.findAll('tr')
			for row in table_rows:
				links = row.findAll('a')
				pr_links = [link for link in links if is_press_release(link.text)]
				date_links = [link for link in links if is_date(link.text)]
				if len(date_links) > 0:
					curr_date = re.search(r'\d{2}\/\d{2}\/\d{4}', date_links[0].text).group(0)
					cell = row.findAll('td')[-1]
					if (cell.find("<table") != -1):
						continue
					name = remove_link(cell.get_text())
					print(curr_date)
					print(name)
					for pr_link in pr_links:
						pr_url = pr_link.get('href')
						if is_relative_url(pr_url):
							pr_url = urljoin(url, pr_url)
						# print(pr_url)

						if pr_url.find("2001-2009.state.gov") != -1 or pr_url == "https://www.treasury.gov/press-center/press-releases/Documents/1102_abo_ghaith.pdf":
							skips += 1
							# print("skip " + str(skips))
							continue
						pr_result = requests.get(pr_url)
						if pr_result.status_code == 200:
							#print(pr_result.content)
							# soup = BeautifulSoup(d_result.content)
							# html = str(soup.find("div", {"id": "t-content-main-content"}))
							html = parseHtml2001(pr_result)
							pr_content = extract_text(pr_result.content)
							pr_content = ""
							tup_list.append( (curr_date, name, pr_url, pr_content, html, 'pr') )
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
							#print(d_content)
							# soup = BeautifulSoup(d_result.content)
							# html = str(soup.find("div", {"id": "t-content-main-content"}))
							tup_list.append( (curr_date, name, d_url, d_content, html, 'd') )

	jsondata = []
	for tup in tup_list:
		entry = {}
		entry['date'], entry['title'], entry['link'], entry['nothing'], entry['content'], entry['d'] = tup
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
