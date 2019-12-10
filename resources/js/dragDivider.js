"use strict"

function positionThings (deltaY, element, elementStartY, thing1, thing1StartHeight, thing2, thing2StartY, thing2StartHeight)
{
    let thing1Height = thing1StartHeight + deltaY;
    
    if (thing1Height < 0)
    {
        deltaY -= thing1Height;
    }

    if (deltaY != 0)
    {
        let thing2Height = thing2StartHeight - deltaY;
        
        if (thing2Height < 0)
        {
            deltaY += thing2Height;
        }

        if (deltaY != 0)
        {
            element.offset({top: elementStartY + deltaY});
            
            thing1.outerHeight (thing1StartHeight + deltaY);
            
            thing2.offset({top: thing2StartY + deltaY});
            thing2.outerHeight (thing2StartHeight - deltaY);
        }
    }
}


$().ready (function ()
    {
        $('.drag-divider').on('touchstart mousedown', function (event)
            {
                let value = $(this).css('--drag-divider');

                if (value !== undefined && value.trim () === 'true')
                {
                    event.preventDefault ();
    
                    let element = $(this);
                    let thing1 = $('#' + element.attr('data-div-thing1'));
                    let thing2 = $('#' + element.attr('data-div-thing2'));
    
                    let elementStartY = element.offset().top;
                    let thing1StartHeight = thing1.outerHeight();
                    let thing2StartY = thing2.offset().top;
                    let thing2StartHeight = thing2.outerHeight();
                    
                    let mouseStartY = event.pageY;
                    
                    let dividerMove = function(event)
                    {
                        event.preventDefault ();
    
                        let deltaY = (event.pageY - mouseStartY);
                        
                        positionThings (deltaY, element, elementStartY, thing1, thing1StartHeight, thing2, thing2StartY, thing2StartHeight);
                        
                        let pct = thing1.outerHeight () / (thing1.outerHeight () + thing2.outerHeight ());
                        element.data('pct', pct);
                    };
                    
                    let dividerMoveEnd = function (event)
                    {
                        event.preventDefault ();
                        
                        $(document).off('touchmove mousemove', undefined, dividerMove);
                        $(document).off('touchend mouseup', undefined, dividerMoveEnd);
                    }
                    
                    $(document).on('touchmove mousemove', dividerMove);
                    $(document).on('touchend mouseup', dividerMoveEnd);
                }
            });

        $(window).resize (function (event)
            {
                $('.drag-divider').each (function ()
                    {
                        let element = $(this);
                        let thing1 = $('#' + element.attr('data-div-thing1'));
                        let thing2 = $('#' + element.attr('data-div-thing2'));

                        // Reset the positions and heights
                        thing1.css({height: '', position: ''});
                        element.css({top: '', position: ''});
                        thing2.css({height: '', top: '', position: ''});

                        let value = $(this).css('--drag-divider');

                        if (value !== undefined && value.trim () === 'true')
                        {
                            // Compute the new deltaY using the stored percentage
                            let totalHeight = thing1.outerHeight () + thing2.outerHeight ();
                            let thing1Height = totalHeight * parseFloat(element.data('pct'));
                            let deltaY = thing1Height - thing1.outerHeight ();
                            
                            let elementStartY = element.offset().top;
                            let thing1StartHeight = thing1.outerHeight();
                            let thing2StartY = thing2.offset().top;
                            let thing2StartHeight = thing2.outerHeight();
    
                            positionThings (deltaY, element, elementStartY, thing1, thing1StartHeight, thing2, thing2StartY, thing2StartHeight);
                        }
                    });
            })

    });
