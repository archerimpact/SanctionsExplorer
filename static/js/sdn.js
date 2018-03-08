'use strict';

$(document).ready(() => {
    window.card = get_template('#card-template');
    window.searchRow = get_template('#search-row-template');

    $('.search-button').click(event => {
        search(event, addr + '/search/sdn', collect_query_info(), display_query, '#search-results');
    });

    $('.next-page').click(event => {
        window.lastQuery.from += window.lastQuery.size;
        search(event, addr + '/search/sdn', window.lastQuery, display_query, '#search-results', true);
    });

    var id = 0;
    let fields = construct_fields(['nationality_country', 'title', 'citizenship_country', 'place_of_birth', 'birthdate', 'doc_id_numbers']);
    append_search_row(id, fields);
    id++;

    $(document).on('change', '.search-row-select', event => {
        var needNewRow = true;
        var dupeSelections = false;
        var currentSelections = [];

        $.each($('.search-row-select'), (index, value) => {
            if (value.value == empty_select) {
                needNewRow = false;
                let id_num = value.id.match('([0-9]+)')[1];     // this row's id
                $('#search-row-' + id_num + '-input').val('');
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
        query['all_display_names'] = name;
    }

    let type = get_type_select()
    if (type !== empty_type_field) {
        query['party_sub_type'] = type;
    }

    let program = get_program_select()
    if (program !== empty_program_field) {
        query['programs'] = program;
    }

    $.each(get_search_row_ids(), (index, row_id) => {
        let select = get_row_select(row_id);
        let input = get_row_input(row_id);
        if (select != empty_select && input !== null && input !== "") {
            query[select] = input;
        }
    });

    if (!$.isEmptyObject(query)) {
        query.size = 50;
        query.from = 0;

        window.lastQuery = query;
        return query;
    }
    else {
        return null;
    }
}


function display_query(res) {
    let c = document.createDocumentFragment();
    $.each(res.response, (index, value) => {
        let e = document.createElement("div");
        e.innerHTML = generate_card(value);
        c.appendChild(e);
    });
    append_to_results(c);
    update_results_header(res['num_results']);
}


function construct_fields(fields) {
    let api_to_ui = {
        'identity_id':                          'ID',
        'primary_display_name':                 'Primary Display Name',
        'all_display_names':                    'Names',
        'doc_id_numbers':                       'ID Numbers',
        'programs':                             'Programs',
        'location':                             'Location',
        'title':                                'Title',
        'birthdate':                            'Birthdate',
        'place_of_birth':                       'Place of Birth',
        'nationality_country':                  'Nationality',
        'citizenship_country':                  'Citizenship',
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
