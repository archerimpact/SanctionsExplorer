with open('sdn.csv', 'r') as csvfile:
	reader = csv.reader(csvfile)
	log = []
	for row in reader:
		log.append(row)
	