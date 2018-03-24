'use strict';

$(document).ready(() => {
    window.pr_card = get_template('#pr-card-template');
    window.searchRoute = window.addr + '/search/press-releases';

    $('#press-release-button').click(event => {
        if (event) { event.preventDefault(); }
        send_search(collect_pr_query(), 'OVERWRITE');
    });

    $('.next-page').click(event => {
        if (event) { event.preventDefault(); }
        window.lastQuery.from += window.lastQuery.size;
        send_search(window.lastQuery, 'APPEND');
    });
});

let get_search_input = () => $('#press-release-input').val().trim();
let send_search      = (query, mode, divToUse) => {
    search(window.searchRoute, query, mode, window.pr_card, divToUse);
}
const FILTER_SUMMARY_LENGTH = 24;

/*
 * EVERYTHING BELOW THIS POINT SHOULD NOT REFERENCE THE DOM, SPECIFIC IDs/CLASSES, etc.
 * CREATE A HELPER FUNCTION ABOVE FOR ONE EASY PLACE TO MAINTAIN DOM REFERENCES.
 */


function collect_pr_query() {
    let input = get_search_input();
    if (input === '') {
        return null;
    }
    return {'query': input};
}

function api_to_ui(api_field_name) {
    let dict = {
        'query': 'Query',
    }
    return dict[api_field_name];
}
