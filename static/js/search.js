'use strict';

const EXACT_MATCH_THRESHOLD = 200;
window.addr = 'https://sdn.archerimpact.com';//window.location.protocol + '//' + window.location.host;
window.requesting = null;

$(document).ready(() => {
    // Set heights of divs to ensure proper scrolling behavior
    let resize_col = () => $('.page-col').innerHeight($(window).height() - $('nav').outerHeight() - 1);
    resize_col();
    $(window).on('resize', resize_col);
});


let get_template           = (idstr) => $(idstr).html() ? doT.template($(idstr).html()) : null;
let append_to_results      = (elem, divToUse) => $(divToUse).append(elem);
let append_to_exact        = (elem) => append_to_results(elem, '#exact-results');
let append_to_fuzzy        = (elem) => append_to_results(elem, '#fuzzy-results');
let show_exact_header      = () => $('.exact-header').show();
let show_fuzzy_header      = () => $('.fuzzy-header').show();
let clear_search_results   = () => {
    $('.search-results').empty();
    $('.results-header').hide();
}
let display_loading_bar    = (show) => show ? $('.loader').show() : $('.loader').hide();
let change_next_page_text  = (text) => $('.next-page').text(text);
let truncate_string        = (str, length) => (str && str.length <= length) ? str : str = str.substring(0, length).trim() + '..';
let sanitize               = (str) => xssFilters.inHTMLData(str);
let construct_filter_box   = (field, value, visibility) => '<span class="filter-box badge badge-primary ' + sanitize(visibility) + '" data-toggle="tooltip" data-placement="bottom" title="' + sanitize(field) + '">' + sanitize(value) + '</span>';
let update_results_header  = (num) => {
    if (num != null) {
        $('#results-header').text('Results (' + num + ')');
        if (window.lastQuery.from + window.lastQuery.size >= num) {
            $('.next-page').hide();
        }
        else {
            $('.next-page').show();
        }
    }
    else {
        $('#results-header').text('Results');
        $('.next-page').hide();
    }
}
let update_filter_summary  = (data) => {
    $('.filter-box').remove();
    let filter_elem = '';
    $.each(data, (k,v) => {
        let key = api_to_ui(k);
        if (key) {
            filter_elem += construct_filter_box(key, v, 'd-none d-print-block');
            filter_elem += construct_filter_box(key, truncate_string(v, FILTER_SUMMARY_LENGTH), 'd-block d-print-none');
        }
    });
    $(filter_elem).insertAfter('#results-header');
    $('[data-toggle="tooltip"]').tooltip();
}
let display_error          = (e) => {
    $('#error-display').append('<div class="alert alert-danger search-error-alert">An error occured; please try again. If this persists, please contact us.</div>');
}

/*
 * EVERYTHING BELOW THIS POINT SHOULD NOT REFERENCE THE DOM, SPECIFIC IDs/CLASSES, etc.
 * CREATE A HELPER FUNCTION ABOVE FOR ONE EASY PLACE TO MAINTAIN DOM REFERENCES.
 */

function search(url, params, mode, card_generator,  divToUse) {
    // mode should be 'OVERWRITE', 'APPEND', or 'MODAL'
    mode = mode || 'OVERWRITE';

    if (requesting !== null) {
        window.requesting.abort();
    }

    if (params === null) {
        return;
    }

    if (mode == 'OVERWRITE') {
        params = add_elastic_params(params);
    }

    window.lastQuery = params;
    let newReq = $.get(url, params);
    window.requesting = newReq;

    if (mode == 'OVERWRITE' || mode == 'APPEND') {
        change_next_page_text('Loading...');
    }

    if (mode == 'OVERWRITE') {
        update_filter_summary(params);
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
    .fail(e => {
        if (e.statusText != 'abort') {
            display_error();
        }
    })
    .always(() => {
        if (mode == 'OVERWRITE') {
            display_loading_bar(false);
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
        if (value[1] > EXACT_MATCH_THRESHOLD) {
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
            append_to_exact(exact);
            show_exact_header();
        }
        if (fuzzy.children.length > 0) {
            append_to_fuzzy(fuzzy);
            show_fuzzy_header();
        }
    }
    return res['num_results'];
}

function add_elastic_params(query) {
    if (Object.keys(query).length > 0) {
        query.size = 50;
        query.from = 0;
        return query;
    }
    else {
        return null;
    }
}

// From https://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript/901144#901144
function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    let regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return xssFilters.inHTMLData(decodeURIComponent(results[2].replace(/\+/g, " ")));
}
