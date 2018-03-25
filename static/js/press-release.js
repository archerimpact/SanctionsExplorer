'use strict';

const SEARCH_URL = window.addr + '/search/press-releases';
const FILTER_SUMMARY_LENGTH = 24;

$(document).ready(() => {
    window.pr_card = get_template('#pr-card-template');

    $('#press-release-button').click(event => {
        if (event) { event.preventDefault(); }
        send_search(collect_pr_query());
    });

    $('.next-page').click(event => {
        if (event) { event.preventDefault(); }
        window.lastQuery.from += window.lastQuery.size;
        send_search(window.lastQuery, 'APPEND');
    });
});

let get_input   = () => $('#press-release-input').val().trim();
let send_search = (query, mode, divToUse) => {
    search(SEARCH_URL, query, mode, window.pr_card, divToUse);
}
let api_to_ui   = (field) => {
    let dict = {
        query: 'Query',
    }
    return dict[field];
}

/*
 * EVERYTHING BELOW THIS POINT SHOULD NOT REFERENCE THE DOM, SPECIFIC IDs/CLASSES, etc.
 * CREATE A HELPER FUNCTION ABOVE FOR ONE EASY PLACE TO MAINTAIN DOM REFERENCES.
 */


function collect_pr_query() {
    let input = get_input();
    if (input === '') {
        return null;
    }
    return {
        query: input
    };
}
