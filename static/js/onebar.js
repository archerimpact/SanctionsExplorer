'use strict';

$(document).ready(() => {

    let redirect = path => window.location.href = window.location.protocol + '//' + window.location.host + '/sdn' + path;
    let submit = () => $('#one-search-input').trigger('submit');

    $('#one-search-input').on('submit', function(event) {
        event.preventDefault();
        let input = $('#one-search-input').val();
        if (input) {
            redirect('/?searchall=' + input);     // TODO escape things properly.
        }
        else {
            redirect('/');
        }
    });

    $('#one-search-input').keydown(function(event) {
        if (event.keyCode == 13) {
            event.preventDefault();
            submit();
        }
    });

    $('#search-button').click(event => {
        submit();
    });

    $('#advanced-button').click(event => {
        redirect('/');
    });

});
