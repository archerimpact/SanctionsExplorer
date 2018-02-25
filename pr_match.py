import os
from openpyxl import load_workbook
import requests

url = "localhost:9200/prs/_search"
headers = {'Content-Type': 'application/json'}
data = {"query": { "match": {"content": {"query": "", "fuzziness": "AUTO"}}}}

wb = load_workbook(filename='sdn.xlsx')
ws = wb[wb.get_sheet_names()[0]]

for row in ws.rows:
	val = row[1].value
	print(val)
	if val != None:
		data["query"]["match"]["content"]["query"] = val
		result = requests.get(url, headers=headers, data=data)
		if result.status_code == 200:
			print(result.content)
		