import csv

with open('sdn.csv', 'r') as csvfile:
	reader = csv.reader(csvfile)
	log = []
	for row in reader:
		log.append(row)



comments = [i[11] if len(i) == 12 and i[11] != '-0- ' else None for i in log]
comments = [c for c in comments if c is not None]

keywords = {'DOB', 'a.k.a.', 'POB', 'Passport', 'SSN', 'NIT', 'Cedula No.', 'D.N.I', 'Linked To:', 'R.F.C.', 'nationality', 'National ID No.', 'Additional Sanctions Information -', 'citizen', 'UK Company Number', 'Website:', 'Website', 'Aircraft Construction', 'Vessel Registration Identification', 'Gender', 'SWIFT/BIC', 'Tax ID No.', 'Email Address', 'Telephone:', 'Phone No.', 'Registration ID', 'Company Number'}
semicomments = [c.split('; ') for c in comments]
print(semicomments)

attrs = []

for s in semicomments:
	words = s[0].split(' ')
	if words[0] not in [key.split(' ')[0] for key in keywords]:
		attrs.append(' '.join(words))



#'U.S.A Passport'
# alt.
# US FEIN
# V.A.T Number
# Driver's License No.
# ICTY indictee