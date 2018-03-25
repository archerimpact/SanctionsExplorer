'use strict';

$(document).ready(() => {
    $('.no-js').hide();         // if the user has JS enabled, do not show the hideous error alert

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
});
