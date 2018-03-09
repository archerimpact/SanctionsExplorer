'use strict';

$(document).ready(() => {

    $('#one-search-input').on('submit', event => {
        event.preventDefault();
        let input = $('#one-search-input').val();
        window.location.href = window.location.protocol + '//' + window.location.host + '/sdn/?searchall=' + input;     // TODO escape things properly.
    });

    $('#one-search-input').keydown(function(event) {
        if (event.keyCode == 13) {
            event.preventDefault();
            $('#one-search-input').submit();
        }
    });


});
