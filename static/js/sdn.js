'use strict';

$(document).ready(() => {
    window.card = get_template('#card-template');
    window.searchRow = get_template('#search-row-template');
    window.searchRoute = window.addr + '/search/sdn';

    $('.search-button').click(event => {
        let query = collect_query_info()
        send_search(query);
        update_filters_for_print(query);
    });

    $('.next-page').click(event => {
        window.lastQuery.from += window.lastQuery.size;
        send_search(window.lastQuery, 'APPEND');
    });

    var id = 0;
    let fields = construct_fields(['countries', 'nationality_country', 'title', 'citizenship_country', 'place_of_birth', 'birthdate', 'doc_id_numbers', 'location']);
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

    if (getParameterByName('searchall')) {
        send_search({
            'all_fields': getParameterByName('searchall'),
        });
        history.pushState(null, null, '/sdn');
    }

    if (getParameterByName('id')) {
        send_search({
            'fixed_ref': parseInt(getParameterByName('id')),
        });
        history.pushState(null, null, '/sdn');
    }

    $(document).on('click', '.collapse-link', event => {
        if (event) {
            event.preventDefault();
        }
        let id = $(event.target).attr('data-id');
        console.log(id);
        var inModal = false;
        $(event.target).parents().each((i,v) => {
            if ($(v).hasClass('modal')) {
                inModal = true;
                return false;   // break
            }
        });
        if (inModal) {
            $('#links-modal .card-body-' + id).collapse('toggle');
        } else {
            $('#search-results .card-body-' + id).collapse('toggle');
        }
    });

    $(document).on('click', '.activate-modal', event => {
        if (event) {
            event.preventDefault();
        }
        let id = $(event.target).attr('data-id');
        $('#links-modal').modal('show');
        if ($('#links-modal .card-body-' + id).length == 0) {
            if (!$(event.target).text().includes('Link Explorer')) {
                temporarily_change_text(event.target, 'Added to Link Explorer!');
            }
            let query = {
                'fixed_ref': parseInt(id)
            };
            query = add_elastic_params(query);
            console.log(query);
            search(event, window.searchRoute, query, display_query, '#entity-modal-body', 'MODAL');
        }
        else if (!$(event.target).text().includes('Link Explorer')) {
            temporarily_change_text(event.target, 'Already in Link Explorer!');
        }
    });

    $(document).on('click', '#clear-modal-body', event => {
        $('#links-modal .modal-body').empty();
    });

    $(document).on('click', '#results-link-explorer-icon', event => {
        $('#links-modal').modal('show');
    });

    $(document).on('click', '#results-plus-icon', event => {
        $('#search-results .collapse').collapse('show');
    });

    $(document).on('click', '#results-minus-icon', event => {
        $('#search-results .collapse').collapse('hide');
    });

    $(document).on('click', '#results-print-icon', event => {
        print();
    });

    $(document).on('click', '#search-info-icon', event => {
        $('#search-info-modal').modal('show');
    });

    $(document).on('click', '#modal-plus-icon', event => {
        $('#entity-modal-body .collapse').collapse('show');
    });

    $(document).on('click', '#modal-minus-icon', event => {
        $('#entity-modal-body .collapse').collapse('hide');
    });

    // enable tooltips
    $('[data-toggle="tooltip"]').tooltip();

});

let temporarily_change_text = (selector, text) => {
    let original = $(selector).text();
    $(selector).text(text);
    $(selector).addClass('link-in-explorer');
    setTimeout(() => {
        $(selector).text(original);
        $(selector).removeClass('link-in-explorer');
    }, 2000);
};
let append_search_row = (id, fields) => $('.search-rows').append(searchRow({'id': id, 'fields': fields}));
let generate_card = (data) => window.card(data);
let get_search_row_ids = () => $('.search-row').map((index, elem) => elem.id);
let get_name_input = () => $('#name-input').val().trim();
let get_type_select = () => $('#type-select').val();
let get_program_select = () => $('#program-select').val();
let get_row_select = (id) => $('#' + id + '-select').val();
let get_row_input = (id) => $('#' + id + '-input').val().trim();
let append_to_results = (elem, divToUse) => $(divToUse).append(elem);
let truncate_string = (str, length) => (str.length <= length) ? str : str = str.substring(0, length) + '..';
let construct_filter_box = (field, value, visibility) => '<span class="filter-box badge badge-primary ' + visibility + '" data-toggle="tooltip" data-placement="bottom" title="' + field + '">' + value + '</span>';
let update_filters_for_print = (data) => {
    $('.filter-box').remove();
    let filter_elem = '';
    $.each(data, (k,v) => {
        let key = api_to_ui(k);
        if (key) {
            filter_elem += construct_filter_box(key, v, 'd-none d-print-block');
            filter_elem += construct_filter_box(key, truncate_string(v, 12), 'd-block d-print-none');
        }
    });
    $(filter_elem).insertAfter('#results-header');
    $('[data-toggle="tooltip"]').tooltip();
}
let send_search = (query, mode) => {
    if (!mode) {
        mode = 'OVERWRITE';
        query = add_elastic_params(query);
    }
    search(event, window.searchRoute, query, display_query, '#search-results', mode);
};
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

    return query;
}

function add_elastic_params(query) {
    if (Object.keys(query).length > 0) {
        query.size = 50;
        query.from = 0;

        window.lastQuery = query;
        return query;
    }
    else {
        return null;
    }
}


function display_query(res, divToUse) {
    let c = document.createDocumentFragment();
    $.each(res.response, (index, value) => {
        let e = document.createElement("div");
        e.innerHTML = generate_card(value);
        c.appendChild(e);
    });
    append_to_results(c, divToUse);
    return res['num_results']
}


function construct_fields(fields) {
    let retval = {};
    for (var f in fields) {
        let fieldname = fields[f]
        if (api_to_ui(fieldname)) {
            retval[fieldname] = api_to_ui(fieldname);
        }
    }
    return retval;
}

function api_to_ui(api_field_name) {
    let dict = {
        'identity_id':                          'ID',
        'primary_display_name':                 'Primary Display Name',
        'all_display_names':                    'Name',
        'doc_id_numbers':                       'ID Numbers',
        'programs':                             'Programs',
        'location':                             'Location',
        'title':                                'Title',
        'birthdate':                            'Birthdate',
        'place_of_birth':                       'Place of Birth',
        'nationality_country':                  'Nationality',
        'citizenship_country':                  'Citizenship',
        'countries':                            'Related to Country',
        'party_sub_type':                       'SDN Type',
        'location':                             'Location',
    };
    return dict[api_field_name];
}

// From https://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript/901144#901144
function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}
