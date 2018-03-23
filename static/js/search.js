'use strict';

$(document).ready(() => {
    // Set heights of divs to ensure proper scrolling behavior
    let resize_col = () => $('.page-col').innerHeight($(window).height() - $('nav').outerHeight() - 1);
    resize_col();
    $(window).on('resize', resize_col);

    $('#collapse-all').click(() => $('.card .collapse').collapse('hide'));
    $('#expand-all').click(() => $('.card .collapse').collapse('show'));

    window.addr = 'https://sdn.archerimpact.com';//window.location.protocol + '//' + window.location.host;
    window.requesting = null;
});


let get_template = (idstr) => $(idstr).html() ? doT.template($(idstr).html()) : null;
let append_to_results = (elem, divToUse) => $(divToUse).append(elem);
let clear_search_results = () => {
    $('#fuzzy-results').empty();
    $('#exact-results').empty();
    $('.results-header').hide();
}
let display_search_results = (show) => show ? $('#search-results').show() : $('#search-results').hide();
let update_results_header = (num) => {
    if (num != null) {
        $('#results-header').text('Results (' + num + ')')
        if (num > 50) {
            if ($('#too-many-results').length === 0) {
                $('#search-results').prepend('<div class="alert alert-warning search-error-alert d-print-none" id="too-many-results">Your search returned a lot of results. Try adding additional filters to narrow it down.</div>');
            }

            if (window.lastQuery.from + window.lastQuery.size >= num) {
                $('.next-page').hide();
            }
            else {
                $('.next-page').show();
            }
        }
    }
    else {
        $('#results-header').text('Results');
        $('.next-page').hide();
    }
}
let display_loading_bar = (show) => show ? $('.loader').show() : $('.loader').hide();
let change_next_page_text = (text) => $('.next-page').text(text);
let truncate_string = (str, length) => (str && str.length <= length) ? str : str = str.substring(0, length).trim() + '..';
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
//let disable_search_buttons = (disable) => disable ? $('.btn-sm').addClass('disabled') : $('.btn-sm').removeClass('disabled');

const error_alert = '<div class="alert alert-danger search-error-alert">There was an error. Please try again.</div>';


function search(url, params, mode, card_generator,  divToUse) {
    // mode should be 'OVERWRITE', 'APPEND', or 'MODAL'.
    if (requesting != null) {
        window.requesting.abort();
    }

    if (params === null) {
        return;
    }

    let newReq = $.get(url, params);
    window.requesting = newReq;

    if (mode == 'OVERWRITE' || mode == 'APPEND') {
        change_next_page_text('Loading...');
    }

    // disable_search_buttons(true);
    if (mode == 'OVERWRITE') {
        update_filters_for_print(params);
        display_loading_bar(true);
        update_results_header(null);
        clear_search_results();
    }

    newReq.done(data => {
        console.log(data);
        if (mode == 'OVERWRITE') {
            clear_search_results();
        }
        let num_results = display_query(data, divToUse, card_generator);
        if (mode == 'OVERWRITE' || mode == 'APPEND') {
            update_results_header(num_results);
        }
    })
    .fail((e) => {
        if (e.statusText != 'abort') {
            $(divToUse).append(error_alert);
        }
    })
    .always(() => {
        if (mode == 'OVERWRITE') {
            display_loading_bar(false);
            display_search_results(true);
        }

        if (mode == 'OVERWRITE' || mode == 'APPEND') {
            change_next_page_text('Next Page');
        }
        // disable_search_buttons(false);
        window.requesting = null;
    });
}

function display_query(res, divToUse, card_generator) {
    let exact = document.createDocumentFragment();
    let fuzzy = document.createDocumentFragment();
    $.each(res.response, (index, value) => {
        let e = document.createElement("div");
        e.innerHTML = card_generator(value[0]);
        if (value[1] > 200) {
            exact.appendChild(e);
        }
        else {
            fuzzy.appendChild(e);
        }
    });

    if (divToUse) {
        append_to_results(exact, divToUse);
    }
    else {
        if (exact.children.length > 0) {
            append_to_results(exact, '#exact-results');
            $('.exact-header').show();
        }
        if (fuzzy.children.length > 0) {
            append_to_results(fuzzy, '#fuzzy-results');
            $('.fuzzy-header').show();
        }
    }
    return res['num_results'];
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
