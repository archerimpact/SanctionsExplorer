'use strict';

const SEARCH_URL    = window.addr + '/search/sdn';
const ROW_FIELDS    = [
    'countries',
    'nationality_country',
    'citizenship_country',
    'place_of_birth',
    'doc_id_numbers',
    'location',
    'title',
    'sanction_dates',
    'aircraft_tags',
    'vessel_tags',
    'document_countries',
];
// TODO add descriptions
const PROGRAMS      = {
    'All programs': 'Do not filter by program',
    '561List': '',
    'BALKANS': '',
    'BELARUS': '',
    'BURUNDI': '',
    'CAATSA': 'Countering America\'s Adversaries Through Sanctions Act (Iran, Russia, NK)',
    'CAR': '',
    'CUBA': '',
    'CYBER2': '',
    'DARFUR': '',
    'DPRK': '',
    'DPRK2': '',
    'DPRK3': '',
    'DPRK4': '',
    'DRCONGO': '',
    'FSE-SY': '',
    'FTO': '',
    'GLOMAG': '',
    'HRIT-IR': '',
    'HRIT-SY': '',
    'IFSR': '',
    'IRAN': '',
    'IRAN-HR': '',
    'IRAN-TRA': '',
    'IRAQ2': '',
    'IRAQ3': '',
    'IRGC': '',
    'ISA': '',
    'LEBANON': '',
    'LIBYA2': '',
    'LIBYA3': '',
    'MAGNIT': '',
    'NPWMD': '',
    'NS-PLC': '',
    'SDGT': '',
    'SDNT': '',
    'SDNTK': '',
    'SDT': '',
    'SOMALIA': '',
    'SOUTH SUDAN': '',
    'SYRIA': '',
    'TCO': '',
    'UKRAINE-EO13660': '',
    'UKRAINE-EO13661': '',
    'UKRAINE-EO13662': '',
    'UKRAINE-EO13685': '',
    'VENEZUELA': '',
    'YEMEN': '',
    'ZIMBABWE': '',
}
const EMPTY_TYPE    = 'All types';
const EMPTY_PROGRAM = 'All programs';
const EMPTY_SELECT  = 'select-field';
const FILTER_SUMMARY_LENGTH = 12;       // used for truncation in search.js

$(document).ready(() => {
    window.card = get_template('#card-template');
    window.searchRow = get_template('#search-row-template');
    window.searchRowID = 0;
    append_search_row();

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

    // TODO fix this.  Hackiest solution in the world.
    // For some reason, the z-index needs to be updated every time the page is scrolled...
    $('.right-col').on('scroll', () => {
        let curr = parseInt($('.sticky-header').css('z-index'));
        console.log(curr);
        if (curr > 100) {
            $('.sticky-header').css('z-index', 100);
        }
        else {
            $('.sticky-header').css('z-index', curr+1);
        }
    });

    $(document).on('change', '.search-row-select', event => {
        let needNewRow = true;
        let dupeSelections = false;
        let currentSelections = [];

        $.each($('.search-row-select'), (index, value) => {
            if (value.value == EMPTY_SELECT) {
                needNewRow = false;
                let id_num = extract_number(value.id);     // this row's id
                $('#search-row-' + id_num + '-input').val('');
            }
            else {
                currentSelections.push(value.value);
            }
        });

        if (new Set(currentSelections).size !== currentSelections.length) {
            show_filter_error();
        }
        else {
            hide_filter_error();
        }

        let eventID   = extract_number(event.target.id);
        let selection = $('#search-row-' + eventID + '-select').val();
        $('#search-row-' + eventID + '-input').attr('placeholder', api_to_placeholder(selection));

        if (needNewRow) {
            append_search_row();
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

    $.each(Object.keys(PROGRAMS), (i, p) => {
        $('#program-select').append($('<option />').val(p).text(p));
    });

    $(document).on('mouseenter', 'option', event => {
        $('#program-header').text(event.target.value);
        $('#program-description').text(PROGRAMS[event.target.value] || '');
    });

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
    $(document).on('click', '#download-icon',      event => export_results());
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
let append_search_row    = () => {
    $('.search-rows').append(window.searchRow({
        'id':     window.searchRowID++,
        'fields': construct_fields(ROW_FIELDS),
    }));
}
let clear_search_rows    = () => $('.search-rows').empty();
let get_search_row_ids   = () => $('.search-row').map((index, elem) => elem.id);
let extract_number       = (str) => str.match('([0-9]+)')[1];
let get_all_fields_input = () => $('#all-fields-input').val().trim();
let get_name_input       = () => $('#name-input').val().trim();
let get_type_select      = () => $('#type-select').val();
let get_program_select   = () => $('#program-select').val().join(' ').replace(EMPTY_PROGRAM, '').trim();
let get_row              = (id) => [$('#' + id + '-select').val(), $('#' + id + '-input').val().trim()];
let send_search          = (query, mode, divToUse) => {
    if (Object.keys(query).length == 0) {
        return null;
    }
    if (!mode || mode == 'OVERWRITE') {
        // only really applies on mobile -- scroll to results so users aren't confused why nothing happened.
        document.getElementById('results-header').scrollIntoView();
    }
    search(SEARCH_URL, query, mode, window.card, divToUse);
};
let show_filter_error    = () => {
    $('.search-row-error-alert').html('<div class="alert alert-danger">Multiple of the same filter selected!</div>');
}
let hide_filter_error    = () => {
    $('.search-row-error-alert').empty();
}
let clear_filters        = () => {
    hide_filter_error();
    window.searchRowID = 0;
    clear_search_rows();
    append_search_row();
    $('#all-fields-input').val('');
    $('#name-input').val('');
    $('#type-select').prop('selectedIndex', 0);
    $('#program-select').prop('selectedIndex', 0);

};
let api_to_ui            = (field) => {
    let dict = {
        'identity_id':          'ID',
        'primary_display_name': 'Primary Display Name',
        'all_display_names':    'Name',
        'doc_id_numbers':       'ID Numbers',
        'programs':             'Programs',
        'title':                'Title/Position',
        'birthdate':            'Birthdate',
        'place_of_birth':       'Place of Birth',
        'nationality_country':  'Nationality',
        'citizenship_country':  'Citizenship',
        'countries':            'Related to Country',
        'party_sub_type':       'SDN Type',
        'location':             'Location/Address',
        'sanction_dates':       'Sanction Dates',
        'aircraft_tags':        'Aircraft Info',
        'vessel_tags':          'Vessel Info',
        'all_fields':           'All Fields',
        'document_countries':'Documents From Country'
    };
    return dict[field];
}
let api_to_placeholder   = (field) => {
    let dict = {
        'doc_id_numbers':       'e.g. "Cedula", "AB269600"',
        'location':             'e.g. PO Box, London, Switzerland',
        'title':                'e.g. President, Commander',
        'place_of_birth':       'e.g. Uganda, Russia',
        'nationality_country':  'e.g. Uganda, Russia',
        'citizenship_country':  'e.g. Uganda, Russia',
        'countries':            'e.g. Uganda, Russia',
        'document_countries':  'e.g. Uganda, Russia',
        'sanction_dates':       'e.g. 2011-2015, 1999',
        'aircraft_tags':        'e.g. B727, YAS-AIR',
        'vessel_tags':          'e.g. IMO #, "Oil Tanker"',
        'select-field':         '',      // unselected
    }
    return dict[field];
}
let export_results       = () => {
    let csv = [];
    csv.push(['name', 'type', 'programs']);

    $.each($('.card'), (i, card) => {
        let [header, body] = card.children;
        let title    = $(header).children('a.collapse-link')[0];
        let id       = $(title).attr('data-id');
        let name     = title.innerText;
        let type     = $(header).children('small.card-sdn-type')[0].innerText.replace('(', '').replace(')', '');
        let programs = $(header).children('.float-right')[0].innerText;

        body = $(body).children('.card-body')[0];
        $.each($(body).children('.detail-group'), (i, g) => {
            let detail_type = $(g).children('h5')[0].innerText;
            // TODO grab appropriate details.
        });

        let csv_entry = [name, type, programs];
        let row_string = '"' + csv_entry.map(str => str.trim()).join('","') + '"';
        csv.push(row_string);
    });

    if (csv.length > 1) {
        let csv_text = csv.join('\r\n');
        download_file('sanctions-explorer.csv', csv_text);
    }
}
let download_file        = (filename, contents) => {
    // Adapted from http://buildwebthings.com/create-csv-export-client-side-javascript/
    let blob = new Blob([contents], { type: 'text/csv;charset=utf-8;' });

    if (navigator.msSaveBlob) { // IE 10+
        navigator.msSaveBlob(blob, filename);
    } else {
        let link = document.createElement("a");
        if (link.download !== undefined) { // feature detection
            // Browsers that support HTML5 download attribute
            let url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", filename);
            link.style = "visibility:hidden";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
}


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
    if (type !== EMPTY_TYPE) {
        query['party_sub_type'] = type;
    }

    let program = get_program_select()
    if (program != '') {
        query['programs'] = program;
    }

    $.each(get_search_row_ids(), (index, row_id) => {
        let [select, input] = get_row(row_id);
        if (select != EMPTY_SELECT && input !== null && input !== "") {
            query[select] = input;
        }
    });
    console.log(query);
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
