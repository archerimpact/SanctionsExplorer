'use strict';

$(document).ready(() => {
    window.card = get_template('#card-template');
    window.searchRow = get_template('#search-row-template');
    window.searchRoute = window.addr + '/search/sdn';

    $('.search-button').click(event => {
        if (event) { event.preventDefault(); }
        let query = collect_query_info();
        send_search(query);
    });

    $('.next-page').click(event => {
        if (event) { event.preventDefault(); }
        window.lastQuery.from += window.lastQuery.size;
        send_search(window.lastQuery, 'APPEND');
    });

    let id = 0;
    let fields = construct_fields(['countries', 'nationality_country', 'citizenship_country', 'place_of_birth', 'doc_id_numbers', 'location', 'title', 'aircraft_tags', 'vessel_tags']);
    append_search_row(id, fields);
    id++;

    $(document).on('change', '.search-row-select', event => {
        let needNewRow = true;
        let dupeSelections = false;
        let currentSelections = [];

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

        let eventID = event.target.id.match('([0-9]+)')[1];
        let selection = $('#search-row-' + eventID + '-select').val();
        $('#search-row-' + eventID + '-input').attr('placeholder', api_to_placeholder_text(selection));

        if (needNewRow) {
            append_search_row(id, fields);
            id++;
        }
    });

    if (getParameterByName('searchall')) {
        let q = getParameterByName('searchall')
        send_search({
            'all_fields': q,
        });
        history.pushState(null, null, '/sdn');
        $('#all-fields-input').val(q);
    }

    if (getParameterByName('id')) {
        send_search({
            'fixed_ref': parseInt(getParameterByName('id')),
        });
        history.pushState(null, null, '/sdn');
    }

    $(document).on('click', '.collapse-link', event => {
        if (event) { event.preventDefault(); }
        let id = $(event.target).attr('data-id');
        let inModal = false;
        $(event.target).parents().each((i,v) => {
            if ($(v).hasClass('modal')) {
                inModal = true;
                return false;   // break
            }
        });
        if (inModal) {
            $('#links-modal .card-body-' + id).collapse('toggle');
        } else {
            $('.search-results .card-body-' + id).collapse('toggle');
        }
    });

    $(document).on('click', '.activate-modal', event => {
        if (event) { event.preventDefault(); }
        let id = $(event.target).attr('data-id');
        $('#links-modal').modal('show');
        if ($('#links-modal .card-body-' + id).length == 0) {
            if (!$(event.target).text().includes('Link Explorer')) {
                temp_change_text(event.target, 'Added to Link Explorer!');
            }
            let query = {
                'fixed_ref': parseInt(id)
            };
            send_search(query, 'MODAL', '#entity-modal-body');
        }
        else if (!$(event.target).text().includes('Link Explorer')) {
            temp_change_text(event.target, 'Already in Link Explorer!');
        }
    });

    $(document).on('click', '#clear-modal-body',   event => $('#links-modal .modal-body').empty());
    $(document).on('click', '#results-link-icon',  event => $('#links-modal').modal('show'));
    $(document).on('click', '#results-plus-icon',  event => $('.search-results .collapse').collapse('show'));
    $(document).on('click', '#results-minus-icon', event => $('.search-results .collapse').collapse('hide'));
    $(document).on('click', '#results-print-icon', event => print());
    $(document).on('click', '#trash-icon',         event => clear_filters());
    $(document).on('click', '#search-info-icon',   event => $('#search-info-modal').modal('show'));
    $(document).on('click', '#modal-plus-icon',    event => $('#entity-modal-body .collapse').collapse('show'));
    $(document).on('click', '#modal-minus-icon',   event => $('#entity-modal-body .collapse').collapse('hide'));
    $('[data-toggle="tooltip"]').tooltip();        // enable tooltips

});

let temp_change_text     = (selector, text) => {
    let original = $(selector).text();
    $(selector).text(text);
    $(selector).addClass('link-in-explorer');
    setTimeout(() => {
        $(selector).text(original);
        $(selector).removeClass('link-in-explorer');
    }, 2000);
};
let append_search_row    = (id, fields) => $('.search-rows').append(searchRow({'id': id, 'fields': fields}));
let get_search_row_ids   = () => $('.search-row').map((index, elem) => elem.id);
let get_all_fields_input = () => $('#all-fields-input').val().trim();
let get_name_input       = () => $('#name-input').val().trim();
let get_type_select      = () => $('#type-select').val();
let get_program_select   = () => $('#program-select').val();
let get_row              = (id) => [$('#' + id + '-select').val(), $('#' + id + '-input').val().trim()];
let send_search          = (query, mode, divToUse) => {
    search(window.searchRoute, query, mode, window.card, divToUse);
};
let clear_filters        = () => {
    $.each(get_search_row_ids(), (index, id) => {
        $('#' + id + '-select').prop('selectedIndex', 0);
        $('#' + id + '-input').val('');
        $('#' + id + '-input').attr('placeholder', '');
    });
    $('#all-fields-input').val('');
    $('#name-input').val('');
    $('#type-select').prop('selectedIndex', 0);
    $('#program-select').prop('selectedIndex', 0);
};
const empty_type    = 'All types';
const empty_program = 'All programs';
const empty_select  = 'Select field';
const FILTER_SUMMARY_LENGTH = 12;


/*
 * EVERYTHING BELOW THIS POINT SHOULD NOT REFERENCE THE DOM, SPECIFIC IDs/CLASSES, etc.
 * CREATE A HELPER FUNCTION ABOVE FOR ONE EASY PLACE TO MAINTAIN DOM REFERENCES.
 */


function collect_query_info() {
    let query = {};

    let all_fields = get_all_fields_input();
    if (all_fields !== null && all_fields !== '') {
        query['all_fields'] = all_fields;
    }

    let name = get_name_input();
    if (name !== null && name !== '') {
        query['all_display_names'] = name;
    }

    let type = get_type_select()
    if (type !== empty_type) {
        query['party_sub_type'] = type;
    }

    let program = get_program_select()
    if (program !== empty_program) {
        query['programs'] = program;
    }

    $.each(get_search_row_ids(), (index, row_id) => {
        let [select, input] = get_row(row_id);
        if (select != empty_select && input !== null && input !== "") {
            query[select] = input;
        }
    });

    return query;
}


function construct_fields(fields) {
    let retval = {};
    for (let f in fields) {
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
        'title':                                'Title',
        'birthdate':                            'Birthdate',
        'place_of_birth':                       'Place of Birth',
        'nationality_country':                  'Nationality',
        'citizenship_country':                  'Citizenship',
        'countries':                            'Related to Country',
        'party_sub_type':                       'SDN Type',
        'location':                             'Location/Address',
        'aircraft_tags':                        'Aircraft Info',
        'vessel_tags':                          'Vessel Info',
        'all_fields':                           'All Fields',
    };
    return dict[api_field_name];
}

function api_to_placeholder_text(api_field_name) {
    let dict = {
        'doc_id_numbers':                       'e.g. "Cedula", "AB269600"',
        'location':                             'e.g. PO Box, London, Switzerland',
        'title':                                'e.g. President, Commander',
        'place_of_birth':                       'e.g. Uganda, Russia',
        'nationality_country':                  'e.g. Uganda, Russia',
        'citizenship_country':                  'e.g. Uganda, Russia',
        'countries':                            'e.g. Uganda, Russia',
        'aircraft_tags':                        'e.g. B727, YAS-AIR',
        'vessel_tags':                          'e.g. IMO #, "Oil Tanker"',
    }
    return dict[api_field_name];
}
