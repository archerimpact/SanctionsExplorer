'use strict';

$(document).ready(() => {
		window.card = get_card_template();
		window.pr_card = get_pr_card_template();
		window.searchRow = get_search_row_template();

		window.requesting = null;

		$('#press-release-button').click(event => {
				search(event, 'http://localhost:8081/press-release', collect_pr_query(), display_pr_query);
		});

		$('.search-button').click(event => {
				search(event, 'http://localhost:8081/search', collect_query_info(), display_query);
		});

		var id = 0;
		let fields = construct_fields(['program', 'nationality', 'pob', 'dob', 'passport', 'all fields']);
		append_search_row(id, fields);
		id++;

		$(document).on('change', '.search-row-select', event => {
				var needNewRow = true;
				$.each($('.search-row-select'), (index, value) => {
						if (value.value == empty_select) {
								needNewRow = false;
								return false;
						}
				});

				if (needNewRow) {
						append_search_row(id, fields);
						id++;
				}
		});

		$('#collapse-all').click(() => $('.card .collapse').collapse('hide'));
		$('#expand-all').click(() => $('.card .collapse').collapse('show'));
});


let get_card_template = () => doT.template($('#card-template').html());
let get_pr_card_template = () => doT.template($('#pr-card-template').html());
let get_search_row_template = () => doT.template($('#search-row-template').html());
let append_search_row = (id, fields) => $('.search-rows').append(searchRow({'id': id, 'fields': fields}));
let generate_card = (data) => window.card(data);
let generate_pr_card = (data) => window.pr_card(data);
let clear_search_results = () => $('#search-results').empty();
let display_search_results = (show) => show ? $('#search-results').show() : $('#search-results').hide();
let disable_search_buttons = (disable) => disable ? $('.btn-sm').addClass('disabled') : $('.btn-sm').removeClass('disabled');
let update_results_header = (num) => num !== null ? $('#results-header').text('Results (' + num + ')') : $('#results-header').text('Results');
let get_search_row_ids = () => $('.search-row').map((index, elem) => elem.id);
let get_name_input = () => $('#name-input').val();
let get_type_select = () => $('#type-select').val();
let get_row_select = (id) => $('#' + id + '-select').val();
let get_row_input = (id) => $('#' + id + '-input').val();
let display_loading_bar = (show) => show ? $('.loader').show() : $('.loader').hide();
const empty_type_field = 'Any type';
const empty_select = 'Select field';


/*
 * EVERYTHING BELOW THIS POINT SHOULD NOT REFERENCE THE DOM, SPECIFIC IDs/CLASSES, etc.
 * CREATE A HELPER FUNCTION ABOVE FOR ONE EASY PLACE TO MAINTAIN DOM REFERENCES.
 */


function collect_query_info() {
		let query = {};

		let name = get_name_input();
		if (name !== null && name !== "") {
				query['sdn_name'] = name;
		}

		let type = get_type_select()
		if (type !== empty_type_field) {
				query['sdn_type'] = type;
		}

		$.each(get_search_row_ids(), (index, row_id) => {
				let select = get_row_select(row_id);
				let input = get_row_input(row_id);
				if (select != empty_select && input !== null && input !== "") {
					query[select] = input;
				}
		});

		return query;
}


function collect_pr_query() {
		return {'query': $('#press-release-input').val()};
}


function search (event, url, params, display_func) {
		event.preventDefault();

		if (requesting != null) {
				requesting.abort();
		}

		let newReq = $.get(url, params);
		requesting = newReq;

		disable_search_buttons(true);
		display_loading_bar(true);
		update_results_header(null);
		clear_search_results();

		newReq.done(data => {
				clear_search_results();
				display_func(data);
		})
		.fail((e) => {
				if (e.statusText != 'abort') {
						$('#search-results').append('<p>There was an error. Please try again.</p>');
				}
		})
		.always(() => {
				display_loading_bar(false);
				display_search_results(true);
				disable_search_buttons(false);
				requesting = null;
		});
}


function process_entry(res) {
		let data = {};

		let extract = (name, fields) => {
			data[name] = {};
			$.each(fields, (key, value) => {
					if (res[key] != null && res[key].length != 0) {
							let formatted_key = fields[key];
							data[name][formatted_key] = res[key];
					} else if (res[key] == null && fields[key] == 'Type') {		// TODO hacky solution to display entity types. Fix in DB.  We can't search for entities either.
							data[name]['Type'] = 'entity';
					}
			});
		};

		let main_fields = construct_fields(['_id', 'sdn_name', 'sdn_type', 'program']);
		let personal_fields = construct_fields(['nationality', 'dob', 'pob', 'gender', 'title']);
		let id_fields = construct_fields(['passport', 'tax_id_no', 'website', 'email', 'phone']);
		let notes_fields = construct_fields(['notes', 'additional_sanctions_info']);
		extract('main', main_fields);
		extract('personal', personal_fields);
		extract('identification', id_fields);
		extract('notes', notes_fields);

		data['categories'] = ['personal', 'identification', 'notes'];

		return data;
}


function display_query(res) {
		let result = [];
		for (var i = 0; i < res.length; i++) {
				result.push(process_entry(res[i]));
		}

		let c = document.createDocumentFragment();
		$.each(result, (index, value) => {
				let e = document.createElement("div");
				e.innerHTML = generate_card(value);
				c.appendChild(e);
		});
		$('#search-results').append(c);			// TODO remove this DOM reference

		update_results_header(res.length);
}


function display_pr_query(data) {
		$.each(data.dates, (index, value) => {
				$('#search-results').append(generate_pr_card(value));
		});

		update_results_header(data.dates.length);
}


function construct_fields(fields) {
		let api_to_ui = {
				'_id': 'id',
				'sdn_name': 'Name',
				'sdn_type': 'Type',
				'program': 'Program',
				'nationality': 'Nationality',
				'dob': 'Date of Birth',
				'pob': 'Place of Birth',
				'gender': 'Gender',
				'title': 'Title',
				'passport': 'Passport Number',
				'tax_id_no': 'Tax ID Number',
				'website': 'Website',
				'phone': 'Phone',
				'email': 'Email',
				'notes': 'Notes',
				'additional_sanctions_info': 'Additional Sanctions Info',
				'all fields': 'All fields',
		};

		let retval = {};
		for (var f in fields) {
				let fieldname = fields[f]
				if (fieldname in api_to_ui) {
						retval[fieldname] = api_to_ui[fieldname];
				}
		}
		return retval;
}
