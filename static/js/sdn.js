'use strict';

$(document).ready(() => {
    window.card = get_template('#card-template');
    window.searchRow = get_template('#search-row-template');

    $('.search-button').click(event => {
        search(event, addr + '/elasticsearch', collect_query_info(), display_query, '#search-results');
    });

    $('.next-page').click(event => {
        window.lastQuery.from += window.lastQuery.size;
        search(event, addr + '/elasticsearch', window.lastQuery, display_query, '#search-results', true);
    });

    var id = 0;
    let fields = construct_fields(['nationality', 'pob', 'dob', 'passport', 'all fields']);
    append_search_row(id, fields);
    id++;

    $(document).on('change', '.search-row-select', event => {
        var needNewRow = true;
        var dupeSelections = false;
        var currentSelections = [];

        $.each($('.search-row-select'), (index, value) => {
            if (value.value == empty_select) {
                needNewRow = false;
            }
            else {
                currentSelections.push(value.value);
            }
        });

        if (new Set(currentSelections).size !== currentSelections.length) {
            console.log('Duplicate filter detected');
            $('.search-row-error-alert').html('<div class="alert alert-danger">Multiple of the same filter selected!</div>');
        }
        else {
            $('.search-row-error-alert').empty();
        }

        console.log(currentSelections);

        if (needNewRow) {
            append_search_row(id, fields);
            id++;
        }
    });


});

let append_search_row = (id, fields) => $('.search-rows').append(searchRow({'id': id, 'fields': fields}));
let generate_card = (data) => window.card(data);
let get_search_row_ids = () => $('.search-row').map((index, elem) => elem.id);
let get_name_input = () => $('#name-input').val().trim();
let get_type_select = () => $('#type-select').val();
let get_program_select = () => $('#program-select').val();
let get_row_select = (id) => $('#' + id + '-select').val();
let get_row_input = (id) => $('#' + id + '-input').val().trim();
let append_to_results = (elem) => $('#search-results').append(elem);
const empty_type_field = 'All types';
const empty_program_field = 'All programs';
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

    let program = get_program_select()
    if (program !== empty_program_field) {
        query['program'] = program;
    }

    $.each(get_search_row_ids(), (index, row_id) => {
        let select = get_row_select(row_id);
        let input = get_row_input(row_id);
        if (select != empty_select && input !== null && input !== "") {
            query[select] = input;
        }
    });

    query.size = 50;
    query.from = 0;

    window.lastQuery = query;

    if (!$.isEmptyObject(query)) {
        return query;
    }
    else {
        return null;
    }
}


function process_entry(res) {
    let data = {};

    let extract = (name, fields) => {
        data[name] = {};
        $.each(fields, (key, value) => {
            if (res[key] != null && res[key].length != 0) {
                let formatted_key = fields[key];
                data[name][formatted_key] = res[key];
            } else if (res[key] == null && fields[key] == 'Type') {        // TODO hacky solution to display entity types. Fix in DB.  We can't search for entities either.
                data[name]['Type'] = 'entity';
            }
        });
    };

    let main_fields = construct_fields(['ent_num', 'sdn_name', 'sdn_type', 'program']);
    let personal_fields = construct_fields(['nationality', 'dob', 'pob', 'gender', 'title']);
    let id_fields = construct_fields(['passport', 'tax_id_no', 'website', 'email', 'phone']);
    let notes_fields = construct_fields(['notes', 'additional_sanctions_info']);
    let context_fields = construct_fields(['linked_to', 'press_releases']);
    extract('main', main_fields);
    extract('personal', personal_fields);
    extract('identification', id_fields);
    extract('notes', notes_fields);
    extract('context', context_fields)

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
    append_to_results(c);

    update_results_header(res.length);
}


function construct_fields(fields) {
    let api_to_ui = {
        'ent_num': 'id',
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
        'linked_to': 'Linked To',
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
