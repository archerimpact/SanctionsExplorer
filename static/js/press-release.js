'use strict';

$(document).ready(() => {
    window.pr_card = get_template('#pr-card-template');

    $('#press-release-button').click(event => {
        search(event, addr + '/search/press-releases', collect_pr_query(), display_pr_query, '#search-results', 'OVERWRITE');
    });

    $('.next-page').click(event => {
        window.lastQuery.from += window.lastQuery.size;
        search(event, addr + '/search/press-releases', window.lastQuery, display_pr_query, '#search-results', 'APPEND');
    });
});

let generate_pr_card = (data) => window.pr_card(data);
let get_search_input = () => $('#press-release-input').val().trim();
let append_to_results = (elem) => $('#search-results').append(elem);
let construct_filter_box = (value) => '<span class="filter-box badge badge-primary">' + value + '</span>';
let update_filters_for_print = (data) => {
    $('.filter-box').remove();
    let filter_elem = construct_filter_box(data.query);
    $('#print-view-filters').html(filter_elem);
};

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

function display_pr_query(res) {
    let data = res.response;
    $.each(data, (index, value) => {
        append_to_results(generate_pr_card(value));
    });

    return res['num_results'];
}
