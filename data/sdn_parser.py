from lxml import etree
import json
from copy import deepcopy

xml_namespace = {"ofac" : "{http://www.un.org/sanctions/1.0}"}

# Notes
# in __str__, only wrap the values that explicitly need to be converted to strings with str().  This is done to make it easier to tell which items are not being explicitly converted to strings in case of JSON serializability issues.

## We know the main sections are:
## Date of Issue
## Reference Value Sets
## Locations
## ID Registration Documents
## Distinct Parties
## Profile Relationships
## Sanctions Entries
## Sanctions Entry Links (currently unused, so will not parse)


def years_match(from_date, to_date):
	return from_date.year == to_date.year

def months_match(from_date, to_date):
	return from_date.month == to_date.month

def months_span_year(from_date, to_date):
	return from_date.month == '1' and to_date.month == '12'

def days_span_month(from_date, to_date):
	from_starts = from_date.day == '1'
	to_ends = to_date.day == '31' or to_date.day == '30'	# crude, but works for now.  TODO make a proper mapping of month -> num_days
	feb = to_date.month == '2' and (to_date.day == '28' or to_date.day == '29')

	return from_starts and (to_ends or feb)


## Defining Classes
class Date:

	def __init__(self, date_xml, y=None):
		if y is None:
			self.year = date_xml[0].text
			self.month = date_xml[1].text
			self.day = date_xml[2].text
		else:
			self.year = str(y) if y is not None else None
			self.month = None
			self.day = None

		if (not self.year) or (self.year and self.month and not self.day):
			print('ERROR: Invalid date found.')


	def __str__(self):
		ret = " "
		if self.year is not None:
			ret += (self.year)

		if self.month and len(self.month) == 1:
			ret += ('-0' + self.month)
		elif self.month:
			ret += ('-' + self.month)

		if self.day and len(self.day) == 1:
			ret += ('-0' + self.day)
		elif self.day:
			ret += ('-' + self.day)

		return ret


class DateBoundary:
	def parse_date(self, xml, tag):
		elem = xml_approx_find(xml, tag)
		if elem is not None:
			return Date(elem)
		else:
			return None

	# under the current XML structure, we are guaranteed a condensable DateBoundary.
	def condense_boundary(self, from_date, to_date):
		if str(from_date) == str(to_date):
			return from_date

		elif years_match(from_date, to_date) and months_span_year(from_date, to_date) and days_span_month(from_date, to_date):
			   # these dates span one year, so we will use the year they span
			   return Date(None, y=from_date.year)

		else:
			print('ERROR: DateBoundary was not condensable: ' + str(from_date) + ', ' + str(to_date))
			return None


	def __init__(self, xml):
		self.date_from = self.parse_date(xml, "From")
		self.date_to = self.parse_date(xml, "To")
		self.year_fixed  = json.loads(xml.get("YearFixed"))
		self.month_fixed = json.loads(xml.get("MonthFixed"))
		self.day_fixed   = json.loads(xml.get("DayFixed"))
		#self.is_approximate = xml.get("Approximate")		# We sacrifice this data for schema simplicity.  This is okay, because the OFAC doc says this is to be avoided/phased out.
		self.condensed_date = self.condense_boundary(self.date_from, self.date_to)

		if self.year_fixed or self.month_fixed or self.day_fixed:
			print('FUTURE_WARNING: OFAC is beginning to use year_/month_/day_fixed fields.')

		# if str(self.date_from) != str(self.date_to):
			# print(str(self.date_from) + ' to ' + str(self.date_to) + ' condensed to ' + str(self.condense_boundary(self.date_from, self.date_to)))

	def __str__(self):
		return str(self.condensed_date)


# class Duration:
# 	## Not currently in use by the xml so may add this later if they do start using it
# 	def __init__(self, xml):
# 		self.years = None
# 		self.months = None
# 		self.days = None
# 		self.is_approximate = None

class DatePeriod:
	def parse_date_boundary(self, xml, tag):
		elem = xml_approx_find(xml, tag)
		if elem is not None:
			return DateBoundary(elem)
		else:
			return None

	def condense_and_stringify(self, from_boundary, to_boundary):
		if str(from_boundary) == str(to_boundary):
			return str(from_boundary)

		elif years_match(from_boundary, to_boundary) and months_span_year(from_boundary, to_boundary) and days_span_month(from_boundary, to_boundary):
			   # these dates span one year, so we will use the year they span
			   return str(from_boundary.year)

		elif years_match(from_boundary, to_boundary) and months_match(from_boundary, to_boundary) and days_span_month(from_boundary, to_boundary):
			   # these dates span one month, so we will use the year they span
			   return str(from_boundary.year)

		elif (not years_match(from_boundary, to_boundary)) and months_span_year(from_boundary, to_boundary) and days_span_month(from_boundary, to_boundary):
			   # these dates span some number of years
			   return str(from_boundary.year) + ' to ' + str(to_boundary.year)

		elif from_boundary.year is not None and to_boundary.year is not None and \
			 from_boundary.month is None and to_boundary.month is None and \
			 from_boundary.day is None and to_boundary.day is None:
			# these dates also span some number of years (the underlying objects were constructed with only a year)
			return str(from_boundary.year) + ' to ' + str(to_boundary.year)

		else:
			print('WARNING: A DatePeriod did not condense nicely: ' + str(from_boundary) + ' to ' + str(to_boundary))
			return str(from_boundary) + ' to ' + str(to_boundary)


	def __init__(self, xml):
		self.year_fixed = xml.get("YearFixed")
		self.month_fixed = xml.get("MonthFixed")
		self.day_fixed = xml.get("DayFixed")
		self.start_boundary = self.parse_date_boundary(xml, "Start") 	# a DateBoundary Object
		self.end_boundary   = self.parse_date_boundary(xml, "End") 		# a DateBoundary Object
		#self.duration_minimum = None 			# a Duration Object, not currently used in xml
		#self.duration_maximum =  None 			# a Duration Object, not currently used in xml

		if self.year_fixed != 'false' or self.month_fixed != 'false' or self.day_fixed != 'false':
			print('FUTURE_WARNING: OFAC is beginning to use year_/month_/day_fixed fields.')

	def __str__(self):
		return self.condense_and_stringify(self.start_boundary.condensed_date, self.end_boundary.condensed_date)

class AliasType:
	def __init__(self, alias_type_xml):
		"""text holds the type of alias (f.k.a, a.k.a, etc)"""
		self.id = alias_type_xml.get('ID')
		self.text = alias_type_xml.text

class AreaCode:
	def __init__(self, area_code_xml):
		""" country_id refers to a country class
		description holds the full name of the country, if available
		text holds a short form version of the full name
		seems to be the same values as Country below"""
		self.id = area_code_xml.get('ID')
		self.country_id = area_code_xml.get('CountryID')
		self.description = area_code_xml.get('Description')
		self.text = area_code_xml.text

	def __str__(self):
		area = ''
		if self.text:
			area += str(self.text)
		if self.description:
			area += ' (' + str(self.description) + ')'

		return area.strip()

class Country:
	def __init__(self, country_xml):
		""" iso2 has a 2 letter country code,
		text holds the full name of the country"""
		self.id = country_xml.get('ID')
		self.iso2 = country_xml.get('ISO2')
		self.text = country_xml.text

	def __str__(self):
		return self.text

class DetailReference:
	def __init__(self, detail_xml):
		"""text holds a detail about the object.
		examples include bulk carrier, male, female, etc)"""
		self.id = detail_xml.get('ID')
		self.text = detail_xml.text

	def __str__(self):
		return self.text

class DetailType:
	def __init__(self, detail_xml):
		"""text holds what type of detail it is, possible values are
		date, lookup, text, country, location"""
		self.id = detail_xml.get('ID')
		self.text = detail_xml.text

class FeatureType:
	def __init__(self, feature_xml):
		"""text describes what the feature is, possible values include vessel call sign,
		vessel type, email, website, location, title, aircraft model, gender, etc"""
		self.id = feature_xml.get('ID')
		self.text = feature_xml.text

class IDRegDocDateType:
	def __init__(self, date_type_xml):
		"""text holds what type of date is being referred to in an ID doc,
		possible values are issue date and expiration date"""
		self.id = date_type_xml.get('ID')
		self.text = date_type_xml.text

	def __str__(self):
		return self.text

class IDRegDocType:
	def __init__(self, doc_type_xml):
		"""text holds what type of id document is being referred to,
		possible values include passport, immigration number, cedula number, etc"""
		self.id = doc_type_xml.get('ID')
		self.text = doc_type_xml.text

	def __str__(self):
		return self.text

class LegalBasis:
	def __init__(self, legal_basis_xml):
		"""the legal basis for an action. short_ref is currently always equal to text,
		which holds the EO or law under which the sanction was made
		example value: magnitsky"""
		self.id = legal_basis_xml.get('ID')
		self.text = legal_basis_xml.text

class List:
	def __init__(self, list_xml):
		"""text holds which list the person is on. Example values: SDN, consolidated list"""
		self.id = list_xml.get('ID')
		self.text = list_xml.text

class LocPart:
	def __init__(self, xml):
		self.is_primary = xml.get("Primary")
		self.text = xml_approx_find(xml, "Value").text

	def __str__(self):
		return self.text

class LocPartType:
	def __init__(self, loc_part_xml):
		"""text holds what part of the location this is,
		example values include region, city, Address1, etc"""
		self.id = loc_part_xml.get('ID')
		self.text = loc_part_xml.text

	def __str__(self):
		return self.text

class NamePartType:
	def __init__(self, name_part_xml):
		"""text holds what part of the name this is,
		example values include last name, first name, aircraft name, vessel name, etc"""
		self.id = name_part_xml.get('ID')
		self.text = name_part_xml.text

class PartySubType:
	party_lookup = {"4" : "Transport", "2" : "Entity", "1" : "Individual"}
	def __init__(self, party_subtype_xml):
		"""possible values of text are vessel, aircraft, unknown person or unknown entity"""
		self.id = party_subtype_xml.get('ID')
		self.type = self.party_lookup[party_subtype_xml.get('PartyTypeID')]
		self.text = party_subtype_xml.text

		if self.text == 'Unknown':
			self.text = self.type

	def __str__(self):
		return self.text

class PartyType:
	def __init__(self, xml):
		"""possible values of text include Individual, entity, Transport, Location"""
		self.id = xml.get('ID')
		self.text = xml.text

class RelationQuality:
	def __init__(self, xml):
		"""text is either high, on OFAC's list or unknown"""
		self.id = xml.get('ID')
		self.text = xml.text

	def __str__(self):
		return self.text

class RelationType:
	def __init__(self, xml):
		"""text is associate of, family member of, etc)"""
		self.id = xml.get('ID')
		self.text = xml.text

	def __str__(self):
		return self.text

class Reliability:
	def __init__(self, xml):
		"""text holds how reliable (confirmed, false, reported, unknown)"""
		self.id = xml.get('ID')
		self.text = xml.text

class SanctionsProgram:
	def __init__(self, xml):
		"""text holds the acronym of the sanction program event is under"""
		self.id = xml.get('ID')
		self.text = xml.text

class SanctionsType:
	def __init__(self, xml):
		"""text has block or program"""
		self.id = xml.get('ID')
		self.text = xml.text

class Script:
	def __init__(self, xml):
		"""text has what script the value is written in"""
		self.id = xml.get('ID')
		self.text = xml.text

class Validity:
	def __init__(self, xml):
		"""text holds valid or fradulent"""
		self.id = xml.get('ID')
		self.text = xml.text

	def __str__(self):
		return self.text

class Location:
	def parse_location_parts(self, xml):
		retdict = dict()
		parts = xml_approx_findall(xml, "LocationPart")
		if parts is not None:
			for p in parts:
				type_id = p.get("LocPartTypeID")
				type_obj = loc_part_types[type_id]
				loc_part_obj = LocPart(xml_approx_find(p, "LocationPartValue"))
				retdict[str(type_obj)] = str(loc_part_obj)
		return retdict

	def parse_feature_version_ids(self, xml):
		elems = xml_approx_findall(xml, "FeatureVersionReference")
		if elems is not None:
			return [e.get("FeatureVersionID") for e in elems]
		else:
			return []

	def parse_reg_doc_ids(self, xml):
		elems = xml_approx_findall(xml, "IDRegDocumentReference")
		if elems is not None:
			return [e.get("IDRegDocumentID") for e in elems]
		else:
			return []

	def parse_country(self, xml):
		country_id = xml_approx_find(xml, "LocationCountry")
		if country_id is not None:
			return countries[country_id.get("CountryID")]
		else:
			return None

	def parse_area_code(self, xml):
		area_code = xml_approx_find(xml, "LocationAreaCode")
		if area_code is not None:
			return area_codes[area_code.get("AreaCodeID")]
		else:
			return None

	def __init__(self, xml):
		"""
		we can evaluate ID, comment, country, and location parts on instantiation.
		feature_versions reference a person associated with this place so evaluation will have to be deferred
		similarly with IDRegDocumentReferences as those have not been parsed yet
		locpartvaluetype is always main and locpartstatus is always unknown so we do not parse these.
		"""
		self.id = xml.get('ID')
		# self.comment = self.parse_comment(xml), this is always empty, not going to get.
		self.country = self.parse_country(xml) # country object, lol assumes it exists, will break everything if it doesn't
		self.location_parts = self.parse_location_parts(xml) # dict map (str locparttype, str locpart)
		self.feature_version_ids = self.parse_feature_version_ids(xml) # list of feature versions ids that must be evaluated later
		self.id_reg_doc_ids =  self.parse_reg_doc_ids(xml) # list of reg_doc_ids that must be evaluated later
		self.area_code = str(self.parse_area_code(xml))

		# Checks that there are not conflicting country entries in this location
		if (self.country is not None) and (self.country != 'None') and (str(self.location_parts.get('COUNTRY')) != 'None'):
			print('WARNING: ' + str(self.country) + ' and ' + self.location_parts['COUNTRY'] + ' are listed as countries for the same location.')

		if str(self.country) != 'None':
			self.location_parts['COUNTRY'] = str(self.country)


	def __str__(self):
		d = dict()

		for entry in self.location_parts:
			if entry == 'Unknown':
				d['COUNTRY'] = self.location_parts[entry]
			else:
				d[entry] = self.location_parts[entry]

		# Construct a renderable/searchable location string
		renderable = ''
		order = ['ADDRESS1', 'ADDRESS2', 'ADDRESS3', 'CITY', 'STATE/PROVINCE', 'REGION', 'POSTAL CODE', 'COUNTRY', 'Unknown']		# note: if the key is 'Unknown', it will be the only key in the dict

		# Checks whether OFAC has added any new fields
		if len(set(self.location_parts.keys() - set(order))) > 0:
			print('FUTURE_WARNING: OFAC has added a new location part type.')
			print(self.location_parts.keys())

		for field in order:
			if self.location_parts.get(field) is not None:
				if len(renderable) > 0:
					renderable += ', '
				renderable += self.location_parts[field]

		if len(renderable) is 0:
			# area code only used as a last case resort -- this value should always be '(undetermined)'
			d['AREA CODE'] = str(self.area_code)
			d['COMBINED'] = str(self.area_code)
		else:
			d['COMBINED'] = renderable

		return json.dumps(d)


class IDRegDocument:
	def parse_comment(self, xml):
		elem = xml_approx_find(xml, "Comment")
		if elem is not None and elem.text is not None:
			return elem.text
		else:
			return elem

	def parse_id_num(self, xml):
		id_num = xml_approx_find(xml, "IDRegistrationNo")
		if id_num is not None:
			return id_num.text
		else:
			return None

	def parse_attribute(self, attribute_name, xml, python_list_name):
		attr = xml.get(attribute_name)
		if attr is None:
			return None
		else:
			return python_list_name[attr]

	def parse_dates(self, xml):
		ret = dict()
		dates = xml_approx_findall(xml, "DocumentDate")
		if dates is not None:
			for d in dates:
				date_type = id_reg_doc_date_types[d.get("IDRegDocDateTypeID")].text
				date_period = xml_approx_find(d, "DatePeriod")
				date_period_obj = DatePeriod(date_period)
				if date_type in ret:
					print("ERROR: " + str(ret))
				ret[date_type] = str(date_period_obj)
		return ret

	def parse_feature_version_ids(self, xml):
		elems = xml_approx_findall(xml, "FeatureVersionReference")
		if elems is not None:
			return [e.get("FeatureVersionID") for e in elems]
		else:
			return []

	def parse_issuing_auth(self, xml):
		auth = xml_approx_find(xml, "IssuingAuthority")
		if auth is not None and auth.text is not None and len(auth.text) > 0:
			return auth.text
		else:
			return None

	def parse_documented_name_ids(self, xml):
		elems = xml_approx_findall(xml, "DocumentedNameReference")
		if elems is not None:
			return [e.get("DocumentedNameID") for e in elems]
		else:
			return []

	def parse_relationship_ids(self, xml):
		elems = xml_approx_findall(xml, "ProfileRelationshipReference")
		if elems is not None:
			return [e.get("ProfileRelationshipID") for e in elems]
		else:
			return []

	def __init__(self, xml):
		"""defer parsing of IdentityID, FeatureVersionReference, DocumentedName,
		ProfileRelationship, documentMentions because these are not parse yet"""
		self.comment = self.parse_comment(xml)
		self.id = xml.get('ID')
		self.type = id_reg_doc_types[xml.get('IDRegDocTypeID')]
		self.identityID = xml.get('IdentityID')
		self.identity = None # Fill in after identities are parse
		self.issued_by = self.parse_attribute("IssuedBy-CountryID", xml, countries)
		self.issued_in = self.parse_attribute("IssuedIn-LocationID", xml, locations)
		self.validity = self.parse_attribute("ValidityID", xml, validities)
		self.issuing_authority = self.parse_issuing_auth(xml)
		self.id_number = self.parse_id_num(xml)
		self.relevant_dates = self.parse_dates(xml)
		self.document_mentions = None # Not currently used
		# self.feature_version_ids = self.parse_feature_version_ids(xml)
		# self.feature_versions = []
		# self.documented_name_ids = self.parse_documented_name_ids(xml)
		# self.documented_names = []
		# self.profile_relationship_ids = self.parse_relationship_ids(xml)
		# self.profile_relationships = []

	def __str__(self):
		d = dict()
		# d['comment']
		d['type'] = str(self.type)
		# d['identity'] = self.identity     	# not necessary since each IDRegDoc obj is owned by an identity
		d['issued_by'] = str(self.issued_by)
		d['issued_in'] = str(self.issued_in)
		d['validity'] = str(self.validity)
		d['issuing_authority'] = str(self.issuing_authority)
		d['id_number'] = self.id_number
		d['relevant_dates'] = self.relevant_dates
		return json.dumps(d)


class VersionDetail:
	def __init__(self, xml):
		self.detail_type = None
		self.detail_reference = None
		self.text = None

class Feature:
	def parse_date(self, version_xml):
		date = xml_approx_find(version_xml, "DatePeriod")
		if date is not None:
			return DatePeriod(date)
		else:
			return None

	def parse_details(self, version_xml):
		version_details = xml_approx_findall(version_xml, "VersionDetail")
		if version_details is not None:
			for v in version_details:
				if v.text is None:
					det_ref_id = v.get("DetailReferenceID")
					if det_ref_id is not None:
						return str(detail_references[v.get("DetailReferenceID")].text)
				else:
					return v.text
		else:
			#print('VD string was None')		# TODO make sure we're actually getting everything?
			pass


	def parse_location(self, version_xml):
		ret = []
		loc = xml_approx_find(version_xml, "VersionLocation")
		if loc is not None:
			return locations[loc.get("LocationID")]
		else:
			return None

	def parse_reliability(self, version_xml):
		r = version_xml.get("ReliabilityID")
		return reliabilities[r].text if r is not None else None

	def __init__(self, feature_xml):
		self.feature_version = xml_approx_find(feature_xml, "FeatureVersion")
		self.comment = xml_approx_find(self.feature_version, "Comment").text # should get
		self.feature_type = feature_types[feature_xml.get("FeatureTypeID")].text
		self.relevant_date = self.parse_date(self.feature_version)
		self.feature_location = self.parse_location(self.feature_version)
		self.details = self.parse_details(self.feature_version)
		self.reliability = self.parse_reliability(self.feature_version)

	def __str__(self):
		"""
		IMPORTANT NOTE: THIS DOES NOT SERIALIZE THE FEATURE TYPE.
		That is done when we construct the features dictionary in DistinctParty's __str__().

		ANOTHER IMPORTANT NOTE: This will have the fields:
		- 'reliability'
		- 'comment'
		- choose ONE from 'locations', 'dates', 'details'
		"""
		d = dict()
		d['feature_type'] = self.feature_type
		d['reliability'] = self.reliability
		d['comment'] = self.comment 		# there's only a few of these, and they're probably being phased out because they're horrible.

		# only ONE of feature_lications, relevant_dates, or details will be populated.
		if self.feature_location:
			d['location'] = json.loads(str(self.feature_location))
		elif self.relevant_date:
			d['date'] = str(self.relevant_date)
		elif self.details:
			d['details'] = self.details
		else:
			print('WARNING: There was a feature without a location, date, or details.')

		return json.dumps(d)


class Alias:
	def parse_comment(self, xml):
		elem = xml_approx_find(xml, "Comment")
		if elem is not None and elem.text is not None:
			print('DEBUG: ' + elem.text)
			return elem.text
		else:
			return elem

	def parse_date_period(self, xml):
		elem = xml_approx_find(xml, "DatePeriod")
		if elem is not None:
			print('Date period wasnt none')
			return DatePeriod(elem)
		else:
			return elem

	def parse_documented_names(self, xml, name_part_groups_dict):
		ret = []
		elems = xml_approx_findall(xml, "DocumentedName")

		# This is now handled with the outer 'for elem in elems' loop.
		# if len(elems) > 1:
		# 	print ("more than one documented name per alias", self.fixed_ref)

		for elem in elems:
			parts = xml_approx_findall(elem, "DocumentedNamePart")
			one_name = dict()
			for p in parts:
				value = xml_approx_find(p, "NamePartValue")
				if value is not None:
					group_id = value.get("NamePartGroupID")
					language = scripts[value.get("ScriptID")].text
					np_type = name_part_groups_dict[group_id]
					name = value.text
					one_name[np_type] = [name, language]
					# if language != 'Latin':
					# 	print(one_name[np_type])
			ret.append(one_name)

		if len(ret) <= 1:
			return ret
		else:
			# there were some non-English names -- probably 1 -- present
			main_name_index = 0

			for i in range(len(ret)):
				r = ret[i]
				all_english = True
				for k,v in r.items():
					if v[1] != 'Latin':
						all_english = False
						break
				if all_english:
					main_name_index = i

			main_name = ret.pop(main_name_index)

			retdict = {
				'main_name': main_name,
				'non_english_names': ret,
			}

			return retdict


	def construct_name_string(self, name_dict):
		unknown_keys = set(name_dict.keys()) - set(['Entity Name', 'Aircraft Name', 'Vessel Name', 'First Name', 'Middle Name', 'Last Name', 'Maiden Name', 'Nickname', 'Patronymic', 'Matronymic'])
		if len(unknown_keys) > 0:
			print('ERROR: OFAC has added an unknown key(s): ' + str(unknown_keys))

		if 'Entity Name' in name_dict:
			return name_dict['Entity Name'][0]
		elif 'Aircraft Name' in name_dict:
			return name_dict['Aircraft Name'][0]
		elif 'Vessel Name' in name_dict:
			return name_dict['Vessel Name'][0]
		else:
			# it's an individual
			name = ''

			if 'Patronymic' in name_dict and 'Last Name' in name_dict:
				# Russian-esque name.  This doesn't always display in the exact order that the OFAC website does, but 99% of entries don't even have Patronymic/Matronymic.

				if 'Middle Name' in name_dict:
					if name_dict.get('Last Name') is not None:
						name += name_dict['Last Name'][0].upper()
					if name_dict.get('Patronymic') is not None:
						name += ' ' + name_dict['Patronymic'][0].upper()
					if name_dict.get('First Name') is not None:
						name += ', ' + name_dict['First Name'][0]
					if name_dict.get('Middle Name') is not None:
						name += ' ' + name_dict['Middle Name'][0]
				else:
					if name_dict.get('Last Name') is not None:
						name += name_dict['Last Name'][0].upper()
					if name_dict.get('First Name') is not None:
						name += ', ' + name_dict['First Name'][0]
					if name_dict.get('Patronymic') is not None:
						name += ' ' + name_dict['Patronymic'][0]

			else:
				# any other names, include Spanish names with (P|M)atronymic

				name = ''
				if name_dict.get('Last Name') is not None:
					name += name_dict['Last Name'][0].upper()
				if name_dict.get('Patronymic') is not None:
					name += ' '  + name_dict['Patronymic'][0].upper()
				if name_dict.get('Matronymic') is not None:
					name += ' ' + name_dict['Matronymic'][0].upper()
				if name_dict.get('First Name') is not None:
					name += ', ' + name_dict['First Name'][0]
				if name_dict.get('Middle Name') is not None:
					name += ' ' + name_dict['Middle Name'][0]

			if name_dict.get('Nickname') is not None:
				name += ' ("' + name_dict['Nickname'][0] + '")'
			if name_dict.get('Maiden Name') is not None:
				name += ' (maiden name: ' + name_dict['Maiden Name'][0] + ')'
			name = name.strip()
			# should only apply in the case where the name is just a nickname
			if name.startswith('(') and name.endswith(')'):
				name = name[1:-1]

			return name


	def __init__(self, xml, name_part_groups_dict):
		# self.comment = This field is never used in this part
		self.fixed_ref = xml.get("FixedRef")
		self.alias_type = alias_types[xml.get("AliasTypeID")].text
		self.is_primary = json.loads(xml.get("Primary"))
		self.is_low_quality = json.loads(xml.get("LowQuality"))
		self.date_period = self.parse_date_period(xml)
		self.documented_name = self.parse_documented_names(xml, name_part_groups_dict) 		# A list of (nameparttype, namepart) tups
		self.non_english_names = []

		if type(self.documented_name) == type([]):
			# there was only one name, so extract it
			self.documented_name = self.documented_name[0]
		elif type(self.documented_name) == type(dict()):
			# we got a dictionary
			self.non_english_names = self.documented_name['non_english_names']
			self.documented_name = self.documented_name['main_name']		# NOTE: This must come after we set non_english_names, since we're overwriting the variable main_name


	def __str__(self):
		d = dict()
		# d['comment'] = self.comment
		# d['non_english_names'] = self.non_english_names		# these are moved into their own separate aliases
		d['alias_type'] = self.alias_type
		d['is_primary'] = self.is_primary
		d['is_low_quality'] = self.is_low_quality
		d['documented_name'] = self.documented_name
		d['date_period'] = self.date_period
		d['display_name'] = self.construct_name_string(self.documented_name)

		return json.dumps(d)


class Identity:
	## Contains information related to name parts
	def parse_comment(self, xml):
		elem = xml_approx_find(xml, "Comment")
		if elem is not None and elem.text is not None:
			return elem.text
		else:
			return elem

	def parse_name_part_groups(self, identity_xml):
		ret = {}
		group_block = xml_approx_find(identity_xml, "NamePartGroups")
		elems = xml_approx_findall(group_block, "MasterNamePartGroup")
		for e in elems:
			np_group = xml_approx_find(e, "NamePartGroup")
			ret[np_group.get("ID")] = name_part_types[np_group.get("NamePartTypeID")].text
		return ret

	def parse_aliases(self, identity_xml, name_part_groups):
		elems = xml_approx_findall(identity_xml, "Alias")
		if elems is not None:
			return [Alias(e, name_part_groups) for e in elems]
		else:
			return []

	def __init__(self, xml):
		self.id = xml.get("ID")
		#self.primary = xml.get("Primary")			# OFAC doc states only one identity per distinct party, so this is always true.
		#self.false = xml.get("False") 				# not sure what this is actually
		# self.comment = self.parse_comment(xml) 	# This field is never used here
		self.name_part_groups = self.parse_name_part_groups(xml) 			# mapping from ID : NamePartTypeID
		self.id_reg_doc_ids = None		# don't need to tie these to Identity since they're tied to DistinctParty
		self.id_reg_docs = []			# don't need to tie these to Identity since they're tied to DistinctParty

		self.all_names = self.parse_aliases(xml, self.name_part_groups) 		# consists of one primary and some number of aliases
		self.aliases = []
		self.primary = None

		foreign_name_aliases = []

		for a in self.all_names:
			if a.non_english_names != []:
				# they have some other names!
				for foreign in a.non_english_names:
					newAlias = deepcopy(a)
					newAlias.documented_name = foreign
					newAlias.is_primary = False 			# their English name will remain primary if applicable
					newAlias.alias_type = 'A.K.A.'			# their non-English name will be an A.K.A.
					foreign_name_aliases.append(newAlias)
					a.non_english_names = "Removed!"

			if a.alias_type == 'Name':
				self.primary = a

				if not a.is_primary:
					print('ERROR: There was a name that isn\'t marked as primary.')
			else:
				self.aliases.append(a)

		# now add all of the aliases we just extracted
		for f in foreign_name_aliases:
			self.aliases.append(f)


	def __str__(self):
		d = dict()
		d['id'] = int(self.id)
		d['aliases'] = list_to_json_list(self.aliases)
		d['primary'] = json.loads(str(self.primary))

		return json.dumps(d)


class SanctionEntry:
	def parse_entry_events(self, sanction_entry_xml):
		ret = []
		events = xml_approx_findall(sanction_entry_xml, "EntryEvent")
		if events is not None:
			for event in events:
				c = xml_approx_find(event, "Comment")
				if c is not None:
					comment = c.text
				else:
					comment = None
				date = Date(xml_approx_find(event, "Date"))
				legal_basis = legal_bases[event.get("LegalBasisID")].text
				# ret.append( (date, comment, legal_basis) )		comment is always null.
				ret.append( (date, legal_basis) )
		return ret


	def parse_sanctions_measures(self, sanction_entry_xml):
		ret = []
		measures = xml_approx_findall(sanction_entry_xml, "SanctionsMeasure")
		if measures is not None:
			for m in measures:
				sanctions_type = sanctions_types[m.get("SanctionsTypeID")].text
				c = xml_approx_find(m, "Comment")
				if c is not None:
					comment = c.text
				else:
					comment = None

				if sanctions_type != 'Block':		# currently, sanctions block doesn't contain anything but a date.
					ret.append(comment)

				if sanctions_type == 'Block' and comment is not None:
					print('FUTURE_WARNING: Sanctions Block now contains a comment (' + comment + ')')

		return ret


	def __init__(self, xml):
		self.id = xml.get("ID")
		self.profile_id = xml.get("ProfileID")
		self.list = lists[xml.get("ListID")].text
		self.entry_events = self.parse_entry_events(xml)
		self.sanctions_measures = self.parse_sanctions_measures(xml)

	def __str__(self):
		d = dict()
		d['list'] = self.list

		events = []

		for e in self.entry_events:
			events.append([str(i) for i in e])

		d['entry_events'] = events
		d['program'] = self.sanctions_measures
		return json.dumps(d)

class ProfileLink:
	def profile_id_to_name(self, p_id):
		for p in list(distinct_parties.values()):
			if p.fixed_ref == p_id:
				return str(p.identity.primary)


	def parse_comment(self, xml):
		elem = xml_approx_find(xml, "Comment")
		if elem is not None and elem.text is not None:
			# print(elem.text)
			return elem.text
		else:
			return elem

	def __init__(self, xml, is_reverse):
		## comment, date period and idregdocument are currently not used so not grabbing them.
		## stored in the from_profile so only storing information about the to profile
		# self.comment = self.parse_comment(xml) One entry has a comment here
		self.id = xml.get("ID")
		if is_reverse:
			self.linked_profile_id = xml.get("From-ProfileID")
			self.is_reverse = True
		else:
			self.linked_profile_id = xml.get("To-ProfileID")			# we'll keep this as a string for now.  We'll serialize it as a number in the __str__ method.  TODO come back and look at this.
			self.is_reverse = False

		self.linked_name = self.profile_id_to_name(self.linked_profile_id)

		self.relation_type = relation_types[xml.get("RelationTypeID")]
		self.relation_quality = relation_qualities[xml.get("RelationQualityID")]
		self.is_former = json.loads(xml.get("Former"))
		# self.sanctions_entry_id = xml.get("SanctionsEntryID")
		# self.sanctions_entry = None # deferred

	def get_owner_id(self, xml):
		return xml.get("From-ProfileID")

	def __str__(self):
		d = dict()
		d['linked_id'] = int(str(self.linked_profile_id))
		d['linked_name'] = json.loads(self.linked_name)
		d['relation_type'] = str(self.relation_type)
		d['relation_quality'] = str(self.relation_quality)
		d['is_former'] = self.is_former
		d['is_reverse'] = self.is_reverse
		return json.dumps(d)

class DistinctParty:
	def parse_comment(self, xml):
		elem = xml_approx_find(xml, "Comment")
		if elem is not None and elem.text is not None:
			return [x.strip() for x in list(filter(None, elem.text.split(';')))]		# they use ;-separated comments.  filter to remove emtpy string, strip whitespaces on either side.  is this what Pythonic means?
		else:
			return None

	def add_link(self, link_obj):
		self.linked_profiles.append(link_obj)

	def parse_features(self, xml):
		elems = xml_approx_findall(xml, "Feature")
		if elems is not None:
			return [Feature(e) for e in elems]
		else:
			return []

	def parse_sanctions_entry_ids(self, xml):
		elems = xml_approx_findall(xml, "SanctionsEntryReference")
		if elems is not None:
			return [e.get("SanctionsEntryID") for e in elems]
		else:
			return []

	## Each distinct party has one profile and one identity obj
	def __init__(self, xml):
		self.party_comment = self.parse_comment(xml) 							# should get, has remarks
		self.fixed_ref = xml.get("FixedRef")   									# fixed ID for this party
		self.profile = xml_approx_find(xml, "Profile")							# OFAC doc says one profile
		# self.profile_comment = self.parse_comment(self.profile) 				# This field is never used
		self.party_sub_type = party_sub_types[self.profile.get("PartySubTypeID")].text 		# read subtypeid from profile and fetch value
		self.identity = Identity(xml_approx_find(self.profile, "Identity"))		# OFAC doc says one identity
		self.features =  self.parse_features(self.profile)						# any number of features
		self.sanctions_entry_reference_ids = self.parse_sanctions_entry_ids(self.profile)
		self.sanctions_entries = []
		self.external_references = None # not currently used by the file
		self.linked_profiles = []
		self.documents = []

	def __str__(self):
		d = dict()
		d['identity'] = json.loads(str(self.identity))
		d['party_comment'] = self.party_comment
		d['fixed_ref'] = int(self.fixed_ref)
		d['party_sub_type'] = str(self.party_sub_type)
		d['sanctions_entries'] = list_to_json_list(self.sanctions_entries)
		d['documents'] = list_to_json_list(self.documents)
		d['linked_profiles'] = list_to_json_list(self.linked_profiles)
		d['features'] = dict()		# list_to_json_list(self.features)

		for f in self.features:
			if d['features'].get(f.feature_type) is None:
				d['features'][f.feature_type] = []

			d['features'][f.feature_type].append(json.loads(str(f)))

		return json.dumps(d)


## Defining lookup lists
## each one has ID : associated object of appropriate class
alias_types = {}
area_codes = {}
countries = {}
detail_references = {}
detail_types = {}
feature_types = {}
id_reg_doc_date_types = {}
id_reg_doc_types = {}
legal_bases = {}
lists = {}
loc_part_types = {}
name_part_types = {}
party_sub_types = {}
party_types = {}
relation_qualities = {}
relation_types = {}
reliabilities = {}
sanctions_programs = {}
sanctions_types = {}
scripts = {}
validities = {}

locations = {}
id_docs = {} ## id doc ids : id doc objs
distinct_parties = {}



## xml to python list names
list_translation = {
	"AliasTypeValues" : [alias_types, AliasType],
	"AreaCodeValues" : [area_codes, AreaCode],
	"CountryValues" : [countries, Country],
	"DetailReferenceValues" : [detail_references, DetailReference],
	"DetailTypeValues" : [detail_types, DetailType],
	"FeatureTypeValues" : [feature_types, FeatureType],
	"IDRegDocDateTypeValues" : [id_reg_doc_date_types, IDRegDocDateType],
	"IDRegDocTypeValues" : [id_reg_doc_types, IDRegDocType],
	"LegalBasisValues" : [legal_bases, LegalBasis],
	"ListValues" : [lists, List],
	"LocPartTypeValues" : [loc_part_types, LocPartType],
	"NamePartTypeValues" : [name_part_types, NamePartType],
	"PartySubTypeValues" : [party_sub_types, PartySubType],
	"PartyTypeValues" : [party_types, PartyType],
	"RelationQualityValues" : [relation_qualities, RelationQuality],
	"RelationTypeValues" : [relation_types, RelationType],
	"ReliabilityValues" : [reliabilities, Reliability],
	"SanctionsProgramValues" : [sanctions_programs, SanctionsProgram],
	"SanctionsTypeValues" : [sanctions_types, SanctionsType],
	"ScriptValues" : [scripts, Script],
	"ValidityValues" : [validities, Validity]
}

## defining functions
def xml_approx_find(xml_elem, child_tag_name):
	"""uses a slow linear search to get around the nasty namespace problem :("""
	for child in xml_elem:
		if child_tag_name in child.tag:
			return child
	return None

def xml_approx_findall(xml_elem, child_tag_name):
	good_children = []
	for child in xml_elem:
		if child_tag_name in child.tag:
			good_children.append(child)
	if len(good_children) > 0:
		return good_children
	else:
		return None

def make_lookup_lists(reference_value_sets_xml):
	"""for each of the 21 lists, gets the lists xml and
	then make a class object for each element and
	add it to the appropriate list with key = id"""

	def parse_list(xml_list_name, python_list_name, class_name):
		for child in xml_approx_find(reference_value_sets_xml, xml_list_name):
			obj = class_name(child)
			python_list_name[obj.id] = obj

	for key, value in list_translation.items():
		parse_list(key, value[0], value[1])

def make_location_list(location_xml):
	for loc in location_xml:
		obj = Location(loc)
		locations[obj.id] = obj

def make_id_doc_list(id_xml):
	for i in id_xml:
		obj = IDRegDocument(i)
		id_docs[obj.id] = obj

def make_distinct_party_list(party_xml):
	for p in party_xml:
		obj = DistinctParty(p)
		distinct_parties[obj.fixed_ref] = obj

def add_profile_links(link_xml):
	for l in link_xml:
		obj = ProfileLink(l, is_reverse=False)

		obj2 = ProfileLink(l, is_reverse=True)

		distinct_p = distinct_parties[obj2.linked_profile_id]
		reverse_p = distinct_parties[obj.linked_profile_id]
		distinct_p.add_link(obj)
		reverse_p.add_link(obj2)


def resolve_documents_to_parties():
	for id_doc in list(id_docs.values()):
		identity_id = id_doc.identityID
		for dp in list(distinct_parties.values()):
			if dp.identity.id == identity_id:
				dp.documents.append(id_doc)


def add_sanctions_entries(sanction_xml):
	for sanction in sanction_xml:
		obj = SanctionEntry(sanction)
		pid = obj.profile_id
		dp = distinct_parties[pid]
		dp.sanctions_entries.append(obj)

		# for dp in list(distinct_parties.values()):
		# 	if dp.fixed_ref == pid:
		# 		dp.sanctions_entries.append(obj)


def list_to_json_list(lst):
	"""
	Used for __str__ methods.
	"""
	if lst is not None:
		return [json.loads(str(l)) for l in lst]
	else:
		return []

def write_json(filename):
	parties = list(distinct_parties.values())

	with open(filename, 'w') as f:
		data = json.dumps([json.loads(str(i)) for i in parties])
		f.write(data)
		f.close()

def parse_to_file(infile, outfile):
	## First parse the file and get root
	tree = etree.parse(infile)
	root = tree.getroot()

	date_of_issue = Date(root[0])
	print("DEBUG: Making top-level reference lists...")
	make_lookup_lists(root[1])
	make_location_list(root[2])
	make_id_doc_list(root[3])
	make_distinct_party_list(root[4])
	print("DEBUG: Resolving documents to parties...")
	resolve_documents_to_parties()
	print("DEBUG: Linking profiles...")
	add_profile_links(root[5])
	print("DEBUG: Parsing sanctions entries...")
	add_sanctions_entries(root[6])
	write_json(outfile)

if __name__ == '__main__':
	parse_to_file('latest.json')
