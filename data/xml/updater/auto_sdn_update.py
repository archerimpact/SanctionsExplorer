import feedparser, filecmp, urllib.request

sanctions_url = "https://www.treasury.gov/resource-center/sanctions/OFAC-Enforcement/Documents/ofac.xml"

feed = feedparser.parse(sanctions_url)

# print(feed["items"][0].keys())

with open('rss_new.txt', "w") as f:
	for item in feed["items"]:
		f.write(str(item["published"])+"\n")


comparison = filecmp.cmp('rss_old.txt', 'rss_new.txt')

if(not comparison):
	print("New sanctions data found")
	url = "https://www.treasury.gov/ofac/downloads/sanctions/1.0/sdn_advanced.xml"
	filename = "sdn_advanced.xml"

	urllib.request.urlretrieve(url, filename)

with open('rss_old.txt', "w") as f:
	for item in feed["items"]:
		f.write(str(item["published"])+"\n")



