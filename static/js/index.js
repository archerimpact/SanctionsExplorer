'use strict';

$(document).ready(() => {
		window.card = doT.template($('#card-template').html());
		window.searchRow = doT.template($('#search-row-template').html());

		$('.search-button').click((event) => {
				event.preventDefault();
				let params = collect_query_info();
				console.log(params);
				$.get('http://localhost:8081/search', params).done(data => {
					console.log(data);
					query(data);
				});
		});

		var id = 0;
		// let fields = ['Type', 'DOB', 'POB'];
		let fields = {'program': 'Program', 'dob': 'Date of Birth', 'pob': 'Place of Birth', 'nationality': 'Nationality'};
		$('.search-rows').append(searchRow({'id': id++, 'fields': fields}));

		$(document).on('change', '.search-row-select', event => {
				var needNewRow = true;
				$.each($('.search-row-select'), (index, value) => {
						if (value.value == 'Select field') {
								needNewRow = false;
								return false;
						}
				});

				if (needNewRow) {
						$('.search-rows').append(searchRow({'id': id++, 'fields': fields}));
				}
		});

		$('#collapse-all').click(() => $('.card .collapse').collapse('hide'));
		$('#expand-all').click(() => $('.card .collapse').collapse('show'));

});

function append_card(data) {
		console.log('appended');
		$('#search-results').append(card(data));
}

function collect_query_info() {
		let query = {};

		let name = $('#name-input').val();
		if (name !== null && name != "") {
				query['sdn_name'] = name;
		}

		if ($('#type-select').val() !== 'Select type') {
				query['sdn_type'] = $('#type-select').val();
		}

		var i = 0;
		while ($('#search-row-' + i)[0] != null) {
				let select = $('#search-row-' + i + '-select').val();
				let input = $('#search-row-' + i + '-input').val();
				if (select != 'Select field') {
					query[select] = input;
				}
				i++;
		}
		return query;
}

function process_entry(res) {
		let data = {};

		let extract = (name, fields) => {
			data[name] = {};
			$.each(fields, (key, value) => {
					if (res[key] != null && res[key].length != 0) {
							let formatted_key = fields[key];
							data[name][formatted_key] = res[key];
					}
			});
		};

		let main_fields = {'_id':'id', 'sdn_name':'Name', 'sdn_type':'Type', 'program':'Program'};
		let personal_fields = {'nationality':'Nationality', 'dob':'Date of Birth', 'pob':'Place of Birth', 'gender':'Gender', 'title':'Title'};
		let id_fields = {'passport':'Passport Number'};
		let notes_fields = {'notes':'Notes', 'additional_sanctions_info':'Additional Sanctions Info'};
		extract('main', main_fields);
		extract('personal', personal_fields);
		extract('identification', id_fields);
		extract('notes', notes_fields);

		data['categories'] = ['personal', 'identification', 'notes'];

		return data;
}

function query(res) {
		// make API call
		/*
		res = [{"_id":"5a73c4842f123a4e336d0d6e","ent_num":"12025","sdn_name":"MEJIA GUTIERREZ, Ignacio","sdn_type":"individual","program":"SDNTK","title":null,"call_sign":null,"vess_type":null,"tonnage":null,"grt":null,"vess_flag":null,"vess_owner":null,"remarks":"DOB 23 Apr 1946; POB Ziracuetrio, Michoacan, Mexico; nationality Mexico; citizen Mexico; C.U.R.P. MEGI460423HMNJTG04 (Mexico).","__v":0,"identification_number":[],"national_id_number":[],"aircraft_operator":[],"aircraft_model":[],"additional_sanctions_info":[],"citizen":["Mexico"],"registration_id":[],"email":[],"tax_id_no":[],"swift_bic":[],"website":[],"rfc":[],"nit":[],"passport":[],"pob":["Ziracuetrio, Michoacan, Mexico"],"dob":["23 Apr 1946"],"nationality":["Mexico"],"linked_to":[]},{"_id":"5a73c4842f123a4e336d0d73","ent_num":"12055","sdn_name":"ISLAMIC REVOLUTIONARY GUARD CORPS AIR FORCE","sdn_type":null,"program":"SDGT] [NPWMD] [IRGC] [IFSR","title":null,"call_sign":null,"vess_type":null,"tonnage":null,"grt":null,"vess_flag":null,"vess_owner":null,"remarks":"Additional Sanctions Information - Subject to Secondary Sanctions.","__v":0,"identification_number":[],"national_id_number":[],"aircraft_operator":[],"aircraft_model":[],"additional_sanctions_info":["Subject to Secondary Sanctions."],"citizen":[],"registration_id":[],"email":[],"tax_id_no":[],"swift_bic":[],"website":[],"rfc":[],"nit":[],"passport":[],"pob":[],"dob":[],"nationality":[],"linked_to":[]},{"_id":"5a73c4842f123a4e336d0d78","ent_num":"12060","sdn_name":"VAHIDI, Ahmad","sdn_type":"individual","program":"NPWMD] [IFSR","title":"Brigadier General","call_sign":null,"vess_type":null,"tonnage":null,"grt":null,"vess_flag":null,"vess_owner":null,"remarks":"DOB 1958; POB Shiraz, Iran; nationality Iran; Additional Sanctions Information - Subject to Secondary Sanctions; Brigadier General.","__v":0,"identification_number":[],"national_id_number":[],"aircraft_operator":[],"aircraft_model":[],"additional_sanctions_info":["Subject to Secondary Sanctions"],"citizen":[],"registration_id":[],"email":[],"tax_id_no":[],"swift_bic":[],"website":[],"rfc":[],"nit":[],"passport":[],"pob":["Shiraz, Iran"],"dob":["1958"],"nationality":["Iran"],"linked_to":[]}, {"_id":"5a73c4842f123a4e336d0d7d","ent_num":"12075","sdn_name":"OSTAIZA AMAY, Jefferson Omar","sdn_type":"individual","program":"SDNTK","title":null,"call_sign":null,"vess_type":null,"tonnage":null,"grt":null,"vess_flag":null,"vess_owner":null,"remarks":"DOB 16 Nov 1973; POB Santo Domingo, Ecuador; citizen Ecuador; Cedula No. 1712394947 (Ecuador); Passport 1712394947 (Ecuador).","cedula_no":"1712394947 (Ecuador)","__v":0,"identification_number":[],"national_id_number":[],"aircraft_operator":[],"aircraft_model":[],"additional_sanctions_info":[],"citizen":["Ecuador"],"registration_id":[],"email":[],"tax_id_no":[],"swift_bic":[],"website":[],"rfc":[],"nit":[],"passport":["1712394947 (Ecuador)."],"pob":["Santo Domingo, Ecuador"],"dob":["16 Nov 1973"],"nationality":[],"linked_to":[]},{"_id":"5a73c4842f123a4e336d0d82","ent_num":"12085","sdn_name":"AUTOTRANSPORTES JYM S.A. DE C.V.","sdn_type":null,"program":"SDNTK","title":null,"call_sign":null,"vess_type":null,"tonnage":null,"grt":null,"vess_flag":null,"vess_owner":null,"remarks":"R.F.C. AJY-960612-HPO (Mexico).","__v":0,"identification_number":[],"national_id_number":[],"aircraft_operator":[],"aircraft_model":[],"additional_sanctions_info":[],"citizen":[],"registration_id":[],"email":[],"tax_id_no":[],"swift_bic":[],"website":[],"rfc":["AJY-960612-HPO (Mexico)."],"nit":[],"passport":[],"pob":[],"dob":[],"nationality":[],"linked_to":[]},{"_id":"5a73c4842f123a4e336d0d87","ent_num":"12090","sdn_name":"CASTRO JARAMILLO, Monica Maria","sdn_type":"individual","program":"SDNT","title":null,"call_sign":null,"vess_type":null,"tonnage":null,"grt":null,"vess_flag":null,"vess_owner":null,"remarks":"DOB 27 Oct 1971; Cedula No. 43574795 (Colombia); Passport AK476053 (Colombia).","cedula_no":"43574795 (Colombia)","__v":0,"identification_number":[],"national_id_number":[],"aircraft_operator":[],"aircraft_model":[],"additional_sanctions_info":[],"citizen":[],"registration_id":[],"email":[],"tax_id_no":[],"swift_bic":[],"website":[],"rfc":[],"nit":[],"passport":["AK476053 (Colombia)."],"pob":[],"dob":["27 Oct 1971"],"nationality":[],"linked_to":[]}];
		*/
		let result = [];
		for (var i = 0; i < res.length; i++) {
				result.push(process_entry(res[i]));
		}

		$('#search-results').empty();

		$.each(result, (index, value) => {
				// pre processing
				append_card(value);
		});
}
