'use strict';

$(document).ready(() => {
    console.log('ready');

    $('#one-search-input').on('submit', event => {
        event.preventDefault();
        let input = $('#one-search-input').val();
        console.log(input);
        window.location.href = "http://localhost:8080/sdn/?searchall=" + input;
    });

    $('#one-search-input').keydown(function(event) {
        if (event.keyCode == 13) {
            event.preventDefault();
            $('#one-search-input').submit();
        }
    });


});
