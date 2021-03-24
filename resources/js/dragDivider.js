;

function positionThings(deltaY, element, elementStartY, thing1, thing1StartHeight, thing2, thing2StartY, thing2StartHeight) {
    const thing1Height = thing1StartHeight + deltaY;

    if (thing1Height < 0) {
        deltaY -= thing1Height;
    }

    if (deltaY != 0) {
        const thing2Height = thing2StartHeight - deltaY;

        if (thing2Height < 0) {
            deltaY += thing2Height;
        }

        if (deltaY != 0) {
            element.offset({ top: elementStartY + deltaY });

            thing1.outerHeight(thing1StartHeight + deltaY);

            thing2.offset({ top: thing2StartY + deltaY });
            thing2.outerHeight(thing2StartHeight - deltaY);
        }
    }
}

$().ready(()
    => {
    $('.drag-divider').on('touchstart mousedown', function (event) {
        const value = $(this).css('--drag-divider');

        if (value !== undefined && value.trim() === 'true') {
            event.preventDefault();

            const element = $(this);
            const thing1 = $(`#${  element.attr('data-div-thing1')}`);
            const thing2 = $(`#${  element.attr('data-div-thing2')}`);

            const elementStartY = element.offset().top;
            const thing1StartHeight = thing1.outerHeight();
            const thing2StartY = thing2.offset().top;
            const thing2StartHeight = thing2.outerHeight();

            const mouseStartY = event.pageY;

            const dividerMove = function (event) {
                event.preventDefault();

                const deltaY = (event.pageY - mouseStartY);

                positionThings(deltaY, element, elementStartY, thing1, thing1StartHeight, thing2, thing2StartY, thing2StartHeight);

                const pct = thing1.outerHeight() / (thing1.outerHeight() + thing2.outerHeight());
                element.data('pct', pct);
            };

            const dividerMoveEnd = function (event) {
                event.preventDefault();

                $(document).off('touchmove mousemove', undefined, dividerMove);
                $(document).off('touchend mouseup', undefined, dividerMoveEnd);
            };

            $(document).on('touchmove mousemove', dividerMove);
            $(document).on('touchend mouseup', dividerMoveEnd);
        }
    });

    $(window).resize((event)
            => {
        $('.drag-divider').each(function () {
            const element = $(this);
            const thing1 = $(`#${  element.attr('data-div-thing1')}`);
            const thing2 = $(`#${  element.attr('data-div-thing2')}`);

            // Reset the positions and heights
            thing1.css({ height: '', position: '' });
            element.css({ top: '', position: '' });
            thing2.css({ height: '', top: '', position: '' });

            const value = $(this).css('--drag-divider');

            if (value !== undefined && value.trim() === 'true') {
                // Compute the new deltaY using the stored percentage
                const totalHeight = thing1.outerHeight() + thing2.outerHeight();
                const thing1Height = totalHeight * parseFloat(element.data('pct'));
                const deltaY = thing1Height - thing1.outerHeight();

                const elementStartY = element.offset().top;
                const thing1StartHeight = thing1.outerHeight();
                const thing2StartY = thing2.offset().top;
                const thing2StartHeight = thing2.outerHeight();

                positionThings(deltaY, element, elementStartY, thing1, thing1StartHeight, thing2, thing2StartY, thing2StartHeight);
            }
        });
    });
});
