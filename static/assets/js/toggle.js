// # Toggle Support

/*global document, $, Wiki */
(function () {
    'use strict';

    Wiki.hideToggles = function () {
        $('[data-toggle]').each(function () {
            var toggle = $(this).data('toggle');
            $(this).parent().children(toggle + ':visible').fadeOut();
        });

        // Toggle active classes on menu headers
        $('[data-toggle].active').removeClass('active');
    };

    $(document).ready(function () {
        $('body').on('click', '[data-toggle]', function (e) {
            e.preventDefault();
            e.stopPropagation();
            var $this = $(this),
                toggle = $this.data('toggle'),
                isAlreadyActive = $this.is('.active');

            // Close all the other open toggle menus
            Wiki.hideToggles();

            if (!isAlreadyActive) {
                $this.toggleClass('active');
                $(this).parent().children(toggle).toggleClass('open').fadeToggle(200);
            }
        });
    });

}());
