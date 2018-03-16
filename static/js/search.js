'use strict';

$(document).ready(() => {
    // Set heights of divs to ensure proper scrolling behavior
    let resize_col = () => $('.page-col').innerHeight($(window).height() - $('nav').outerHeight() - 1);
    resize_col();
    $(window).on('resize', resize_col);

    $('#collapse-all').click(() => $('.card .collapse').collapse('hide'));
    $('#expand-all').click(() => $('.card .collapse').collapse('show'));

    window.addr = window.location.protocol + '//' + window.location.host;
    window.requesting = null;
});


let get_template = (idstr) => $(idstr).html() ? doT.template($(idstr).html()) : null;
let clear_search_results = () => $('#search-results').empty();
let display_search_results = (show) => show ? $('#search-results').show() : $('#search-results').hide();
let disable_search_buttons = (disable) => disable ? $('.btn-sm').addClass('disabled') : $('.btn-sm').removeClass('disabled');
let update_results_header = (num) => {
    if (num !== null) {
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
const error_alert = '<div class="alert alert-danger search-error-alert">There was an error. Please try again.</div>';


function search(event, url, params, display_func, divToUse, mode) {
    // mode should be 'OVERWRITE', 'APPEND', or 'MODAL'.
    if (event) {
        event.preventDefault();
    }

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
        let num_results = display_func(data, divToUse);
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
