'use strict';

$(document).ready(() => {
    //$('.no-js').hide();         // if the user has JS enabled, do not show the hideous error alert

    let redirect = path => window.location.href = window.location.protocol + '//' + window.location.host + '/sdn' + path;
    let submit   = ()   => $('#one-search-input').trigger('submit');

    $('#one-search-input').on('submit', event => {
        event.preventDefault();
        let input = $('#one-search-input').val()
        input ? redirect('/?searchall=' + input) : redirect('');
    });
    $('#one-search-input').on('keydown', event => {
        if (event.keyCode == 13) {
            event.preventDefault();
            submit();
        }
    });
    $('#search-button').click(event => submit());
    $('#advanced-button').click(event => redirect(''));



    center_page();
    $(window).resize(center_page);
});

function center_page() {
    let top_bound    = $('#info-group')[0].getBoundingClientRect().bottom;
    let bottom_bound = $('#partner-logo-group')[0].getBoundingClientRect().top;
    let elem_height  = $('#center-group').height();
    let empty_mid = (bottom_bound - top_bound) / 2;
    let mid = top_bound + empty_mid - (elem_height / 2);

    let bias = 20;

    // slightly less than 2 to make it a bit higher than center
    $('#center-group').css('top', mid - 50 + 'px');
}
