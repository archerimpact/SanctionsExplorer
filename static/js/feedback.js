'use strict';

window.addr        = window.location.protocol + '//' + window.location.host;
const EMAIL_URL    = window.addr + '/submit/email';
const FEEDBACK_URL = window.addr + '/submit/feedback';

$(document).ready(() => {
    // Email form
    $('#email-submit-button').on('click submit', event => {
        if (event) { event.preventDefault(); }

        let input = $('#email-update-input').val().trim();
        if (input.length > 0) {
            $('#email-update-input').removeClass('is-invalid');
            $('#email-error-text').text('');

            let req = $.get(EMAIL_URL, {email: input});

            req.done(data => {
                $('#email-update-form').html('<p class="text-center">Thanks!</p>');
            })
            .fail(e => {
                $('#email-update-input').addClass('is-invalid');
                $('#email-error-text').text('An error occurred; please try again. If this persists, please contact us directly.');
                console.log(e);
            });
        }
    });

    $('#email-update-input').on('keydown', event => {
        if (event.keyCode == 13) {
            event.preventDefault();
            $('#email-submit-button').submit();
        }
    });


    // Feedback form
    $('#feedback-submit-button').on('click submit', event => {
        console.log(event);
        if (event) { event.preventDefault(); }
        console.log('fb!');
        const text = $('#feedback-textarea').val().trim();
        const email = $('#email-input').val().trim();
        const feedback_type = $('#issue-select').val();

        if (text.length > 0) {
            $('#feedback-error-text').text('');
            let req = $.get(FEEDBACK_URL, {
                text: text,
                email: email,
                feedback_type: feedback_type,
            });
            req.done(data => {
                $('#feedback-form').html('<p>Thanks for submitting feedback! We\'ll be in touch shortly if you provided your email and we require additional information.</p>');
            })
            .fail(() => {
                $('#feedback-error-text').text('An error occurred; please try again. If this persists, please contact us directly.');
            });
        }
    });

});
