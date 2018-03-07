'use strict';

$(document).ready(() => {
    window.card = get_template('#card-template');
    window.searchRow = get_template('#search-row-template');

    $('.search-button').click(event => {
        search(event, addr + '/v2/search/sdn', collect_query_info(), display_query, '#search-results');
    });

    $('.next-page').click(event => {
        window.lastQuery.from += window.lastQuery.size;
        search(event, addr + '/search/sdn', window.lastQuery, display_query, '#search-results', true);
    });

    var id = 0;
    let fields = construct_fields(['nationality_country', 'title', 'citizenship_country', 'place_of_birth', 'birthdate', 'doc_id_numbers', 'all fields']);
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
    /*
    // FOR TESTING PURPOSES.
    res = {"document_headers": ["issued_in", "issued_by", "issuing_authority", "Expiration Date"], "identity":{"id":14947,"aliases":[{"alias_type":"A.K.A.","is_primary":false,"is_low_quality":false,"documented_name":{"Last Name":["Tyurin","Latin"],"First Name":["Vladimir","Latin"],"Middle Name":["Anatolievich","Latin"]},"display_name":"TYURIN, Vladimir Anatolievich","strength":"strong"},{"alias_type":"A.K.A.","is_primary":false,"is_low_quality":false,"documented_name":{"Last Name":["Tiourine","Latin"],"First Name":["Vladimir","Latin"]},"display_name":"TIOURINE, Vladimir","strength":"strong"},{"alias_type":"A.K.A.","is_primary":false,"is_low_quality":false,"documented_name":{"Last Name":["Tiurin","Latin"],"First Name":["Vladimir","Latin"]},"display_name":"TIURIN, Vladimir","strength":"strong"},{"alias_type":"A.K.A.","is_primary":false,"is_low_quality":false,"documented_name":{"Last Name":["Turin","Latin"],"First Name":["Vladimir","Latin"]},"display_name":"TURIN, Vladimir","strength":"strong"},{"alias_type":"A.K.A.","is_primary":false,"is_low_quality":false,"documented_name":{"Last Name":["Tyurine","Latin"],"First Name":["Vladimir","Latin"]},"display_name":"TYURINE, Vladimir","strength":"strong"},{"alias_type":"A.K.A.","is_primary":false,"is_low_quality":false,"documented_name":{"Last Name":["Tiurine","Latin"],"First Name":["Vladimir","Latin"]},"display_name":"TIURINE, Vladimir","strength":"strong"},{"alias_type":"A.K.A.","is_primary":false,"is_low_quality":false,"documented_name":{"Last Name":["Tiorine","Latin"],"First Name":["Vladimir","Latin"]},"display_name":"TIORINE, Vladimir","strength":"strong"},{"alias_type":"A.K.A.","is_primary":false,"is_low_quality":false,"documented_name":{"Last Name":["Tjrurin","Latin"],"First Name":["Vladimir","Latin"]},"display_name":"TJRURIN, Vladimir","strength":"strong"},{"alias_type":"A.K.A.","is_primary":false,"is_low_quality":false,"documented_name":{"Last Name":["Turiyan","Latin"],"First Name":["Vladimir","Latin"]},"display_name":"TURIYAN, Vladimir","strength":"strong"},{"alias_type":"A.K.A.","is_primary":false,"is_low_quality":false,"documented_name":{"Last Name":["Tyurin","Latin"],"First Name":["Volodya","Latin"]},"display_name":"TYURIN, Volodya","strength":"strong"},{"alias_type":"A.K.A.","is_primary":false,"is_low_quality":false,"documented_name":{"Last Name":["Tyurine","Latin"],"First Name":["Anatoly","Latin"]},"display_name":"TYURINE, Anatoly","strength":"strong"},{"alias_type":"A.K.A.","is_primary":false,"is_low_quality":false,"documented_name":{"Last Name":["Tyurin","Latin"],"First Name":["Anatoly","Latin"]},"display_name":"TYURIN, Anatoly","strength":"strong"},{"alias_type":"A.K.A.","is_primary":false,"is_low_quality":false,"documented_name":{"Last Name":["Turin","Latin"],"First Name":["Anatolievich","Latin"]},"display_name":"TURIN, Anatolievich","strength":"strong"},{"alias_type":"A.K.A.","is_primary":false,"is_low_quality":false,"documented_name":{"Last Name":["Tjurin","Latin"],"First Name":["Wladimir","Latin"]},"display_name":"TJURIN, Wladimir","strength":"strong"},{"alias_type":"A.K.A.","is_primary":false,"is_low_quality":false,"documented_name":{"Last Name":["Gromov","Latin"],"First Name":["Vladimir","Latin"],"Middle Name":["Pavlovich","Latin"]},"display_name":"GROMOV, Vladimir Pavlovich","strength":"strong"},{"alias_type":"A.K.A.","is_primary":false,"is_low_quality":false,"documented_name":{"Last Name":["Pugachev","Latin"],"First Name":["Aleksei","Latin"],"Middle Name":["Vladimirovich","Latin"]},"display_name":"PUGACHEV, Aleksei Vladimirovich","strength":"strong"},{"alias_type":"A.K.A.","is_primary":false,"is_low_quality":false,"documented_name":{"Last Name":["Pugachev","Latin"],"First Name":["Alexei","Latin"],"Middle Name":["Pavlovich","Latin"]},"display_name":"PUGACHEV, Alexei Pavlovich","strength":"strong"},{"alias_type":"A.K.A.","is_primary":false,"is_low_quality":false,"documented_name":{"Last Name":["Pugachev","Latin"],"First Name":["Alexey","Latin"]},"display_name":"PUGACHEV, Alexey","strength":"strong"},{"alias_type":"A.K.A.","is_primary":false,"is_low_quality":true,"documented_name":{"Last Name":["Tyurik","Latin"]},"display_name":"TYURIK","strength":"weak"},{"alias_type":"A.K.A.","is_primary":false,"is_low_quality":true,"documented_name":{"Last Name":["Tiurik","Latin"]},"display_name":"TIURIK","strength":"weak"},{"alias_type":"A.K.A.","is_primary":false,"is_low_quality":true,"documented_name":{"Last Name":["Tyurya","Latin"]},"display_name":"TYURYA","strength":"weak"},{"alias_type":"A.K.A.","is_primary":false,"is_low_quality":false,"documented_name":{"Last Name":["ТЮРИН","Cyrillic"],"First Name":["ВЛАДИМИР","Cyrillic"],"Middle Name":["АНАТОЛЬЕВИЧ","Cyrillic"]},"display_name":"ТЮРИН, ВЛАДИМИР АНАТОЛЬЕВИЧ","strength":"strong"},{"alias_type":"A.K.A.","is_primary":false,"is_low_quality":false,"documented_name":{"Last Name":["ГРОМОВ","Cyrillic"],"First Name":["ВЛАДИМИР","Cyrillic"],"Middle Name":["ПАВЛОВИЧ","Cyrillic"]},"display_name":"ГРОМОВ, ВЛАДИМИР ПАВЛОВИЧ","strength":"strong"},{"alias_type":"A.K.A.","is_primary":false,"is_low_quality":false,"documented_name":{"Last Name":["ПУГАЧЕВ","Cyrillic"],"First Name":["АЛЕКСЕЙ","Cyrillic"],"Middle Name":["ВЛАДИМИРОВИЧ","Cyrillic"]},"display_name":"ПУГАЧЕВ, АЛЕКСЕЙ ВЛАДИМИРОВИЧ","strength":"strong"},{"alias_type":"A.K.A.","is_primary":false,"is_low_quality":true,"documented_name":{"Last Name":["ТЮРИК","Cyrillic"]},"display_name":"ТЮРИК","strength":"weak"}],"primary":{"alias_type":"Name","is_primary":true,"is_low_quality":false,"documented_name":{"Last Name":["Tyurin","Latin"],"First Name":["Vladimir","Latin"],"Middle Name":["Anatolyevich","Latin"]},"date_period":null,"display_name":"TYURIN, Vladimir Anatolyevich"}},"party_comment":null,"fixed_ref":23243,"party_sub_type":"Individual","sanctions_entries":[{"list":"SDN List","entry_events":[["2017-12-22","Executive Order 13581 (TCO)"]],"program":["TCO"]}],"documents":[{"type":"Passport","issued_by":"Belgium","issued_in":null,"validity":"Fraudulent","issuing_authority":null,"id_number":"EA804478","relevant_dates":{},"display":{"info":"Fraudulent Passport","issue":"Issued by Belgium"}},{"type":"Passport","issued_by":"Russia","issued_in":null,"validity":"Fraudulent","issuing_authority":"Singapore","id_number":"432062125","relevant_dates":{},"display":{"info":"Fraudulent Passport","issue":"Issued by Russia"}},{"type":"Passport","issued_by":"Russia","issued_in":"Moscow","validity":"Fraudulent","issuing_authority":"Russian Government","id_number":"410579055","relevant_dates":{},"display":{"info":"Fraudulent Passport","issue":"Issued by Russia"}},{"type":"Passport","issued_by":"Russia","issued_in":null,"validity":"Fraudulent","issuing_authority":null,"id_number":"4511264874","Expiration Date":"2018-07-18","relevant_dates":{},"display":{"info":"Fraudulent Passport","issue":"Issued by Russia"}}],"linked_profiles":[{"linked_id":23223,"linked_name":{"alias_type":"Name","is_primary":true,"is_low_quality":false,"documented_name":{"Entity Name":["Thieves-in-Law","Latin"]},"date_period":null,"display_name":"Thieves-in-Law"},"relation_type":"Acting for or on behalf of","relation_quality":"Unknown","is_former":false,"is_reverse":false}],"features":{"Birthdate":[{"feature_type":"Birthdate","reliability":"Unknown","comment":null,"dates":["1958-11-25"]},{"feature_type":"Birthdate","reliability":"Unknown","comment":null,"dates":["1958-12-20"]}],"Place of Birth":[{"feature_type":"Place of Birth","reliability":"Unknown","comment":null,"details":"Tirlyan, Beloretskiy Rayon, Bashkiria, Russia"},{"feature_type":"Place of Birth","reliability":"Verified by me","comment":"yucky","details":"Irkutsk, Russia"},{"feature_type":"Place of Birth","reliability":"Unknown","comment":"yucccc","details":"Bratsk, Russia"}],"Citizenship Country":[{"feature_type":"Citizenship Country","reliability":"Unknown","comment":null,"locations":[{"COUNTRY":"Russia","COMBINED":"Russia"}]},{"feature_type":"Citizenship Country","reliability":"Unknown","comment":null,"locations":[{"COUNTRY":"Kazakhstan","COMBINED":"Kazakhstan"}]}],"Gender":[{"feature_type":"Gender","reliability":"Reported","comment":null,"details":"Male"}],"Location":[{"feature_type":"Location","reliability":"Unknown","comment":null,"locations":[{"CITY":"Moscow","COUNTRY":"Russia","COMBINED":"Moscow, Russia"}]}]},"identity_id":14947,"primary_display_name":"TYURIN, Vladimir Anatolyevich","programs":["TCO"],"all_display_names":["TYURIN, Vladimir Anatolievich","TIOURINE, Vladimir","TIURIN, Vladimir","TURIN, Vladimir","TYURINE, Vladimir","TIURINE, Vladimir","TIORINE, Vladimir","TJRURIN, Vladimir","TURIYAN, Vladimir","TYURIN, Volodya","TYURINE, Anatoly","TYURIN, Anatoly","TURIN, Anatolievich","TJURIN, Wladimir","GROMOV, Vladimir Pavlovich","PUGACHEV, Aleksei Vladimirovich","PUGACHEV, Alexei Pavlovich","PUGACHEV, Alexey","TYURIK","TIURIK","TYURYA","ТЮРИН, ВЛАДИМИР АНАТОЛЬЕВИЧ","ГРОМОВ, ВЛАДИМИР ПАВЛОВИЧ","ПУГАЧЕВ, АЛЕКСЕЙ ВЛАДИМИРОВИЧ","ТЮРИК"],"doc_id_numbers":["EA804478","432062125","410579055","4511264874"],"linked_profile_ids":[23223],"linked_profile_names":["Thieves-in-Law"],"birthdate":[{"feature_type":"Birthdate","reliability":"Unknown","comment":null,"dates":["1958-11-25"]},{"feature_type":"Birthdate","reliability":"Unknown","comment":null,"dates":["1958-12-20"]}],"place_of_birth":[{"feature_type":"Place of Birth","reliability":"Unknown","comment":null,"details":"Tirlyan, Beloretskiy Rayon, Bashkiria, Russia"},{"feature_type":"Place of Birth","reliability":"Unknown","comment":null,"details":"Irkutsk, Russia"},{"feature_type":"Place of Birth","reliability":"Unknown","comment":null,"details":"Bratsk, Russia"}],"citizenship_country":[{"feature_type":"Citizenship Country","reliability":"Unknown","comment":null,"locations":[{"COUNTRY":"Russia","COMBINED":"Russia"}]},{"feature_type":"Citizenship Country","reliability":"Unknown","comment":null,"locations":[{"COUNTRY":"Kazakhstan","COMBINED":"Kazakhstan"}]}],"gender":[{"feature_type":"Gender","reliability":"Reported","comment":null,"details":"Male"}],"location":[{"feature_type":"Location","reliability":"Unknown","comment":null,"locations":[{"CITY":"Moscow","COUNTRY":"Russia","COMBINED":"Moscow, Russia"}]}]};
    console.log(res);
    */
    return res;
}


function display_query(res) {
    let data = res.response;
    let result = [];
    for (var i = 0; i < data.length; i++) {
        result.push(process_entry(data[i]));
    }

    let c = document.createDocumentFragment();
    $.each(result, (index, value) => {
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
        'additional_sanctions_information_-_':  'Additional Sanctions Information',
        'nationality_country':                  'Nationality',
        'citizenship_country':                  'Citizenship',
        'gender':                               'Gender',
        'website':                              'Website',
        'email_address':                        'Email',
        'swift/bic':                            'SWIFT/BIC',
        'ifca_determination_-_':                'IFCA Determination',
        'bik_(ru)':                             'BIK (RU)',
        'un/locode':                            'UN/LOCODE',
        'micex_code':                           'MICES Code',
        'nationality_of_registration':          'Nationality of Registration',
        'd-u-n-s_number':                       'DUNS Number',
        'vessel_call_sign':                     'Vessel Call Sign',
        'vessel_flag':                          'Vessel Flag',
        'vessel_owner':                         'Vessel Owner',
        'vessel_tonnage':                       'Vessel Tonnage',
        'vessel_gross_registered_tonnage':      'Vessel Gross Registered Tonnage',
        'vessel_type':                          'Vessel Type',
        'aircraft_manufacture_date':            'Aircraft Manufacture Date',
        'aircraft_model':                       'Aircraft Model',
        'aircraft_operator':                    'Aircraft Operator',
        'aircraft_tail_number':                 'Aircraft Tail Number',
        'previous_aircraft_tail_number':        'Previous Aircraft Tail Number',
        'aircraft_construction_number_(also_called_l/n_or_s/n_or_f/n)':         'Aircraft Construction Number',
        'aircraft_manufacturer\'s_serial_number_(msn)':                         'Aircraft Manufacturer\'s Serial Number',
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
