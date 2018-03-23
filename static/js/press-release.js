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

let generate_pr_card = (data) => window.pr_card(data);
let get_search_input = () => $('#press-release-input').val().trim();
let send_search = (query, mode, divToUse) => {
    if (!mode) {
        mode = 'OVERWRITE';
        query = add_elastic_params(query);
    }
    search(window.searchRoute, query, mode, generate_pr_card, divToUse);
}
/*
 * EVERYTHING BELOW THIS POINT SHOULD NOT REFERENCE THE DOM, SPECIFIC IDs/CLASSES, etc.
 * CREATE A HELPER FUNCTION ABOVE FOR ONE EASY PLACE TO MAINTAIN DOM REFERENCES.
 */
function collect_pr_query() {
    let input = get_search_input();
    if (input === "") {
        return null;
    }

    let query = {'query': input};
    query.size = 50;
    query.from = 0;
    window.lastQuery = query;
    return query;
}

function api_to_ui(api_field_name) {
    let dict = {
        'query': 'Query',
    }
    return dict[api_field_name];
}
