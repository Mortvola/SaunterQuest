'use strict';

// let url = element.attr('data-url');
// let prop = element.attr('data-prop');

$().ready(()
    => {
    $.fn.extend(
        {
            editable (url, prop)
                {
                    if (url === undefined || prop === undefined)
                    {
                        return this;
                    }
                    
                    return this.each(function ()
                    {
                        let element = $(this);
                        let value = element.text ();
                        let pencil = {};
                        
                        // Add the editable class so that we can
                        // find any elements that were made editable throug
                        // the .editable method.
                        element.addClass('editable');
                        
                        let cancelEdit = function ()
                        {
                            let grid = element.data('grid');
                            
                            if (grid !== undefined)
                            {
                                grid.remove ();
                                element.data('grid', undefined);
                                
                                element.show ();
                                $(document).off('click', undefined, cancelEdit);
                            }
                        };

                        $.extend(this, {cancelEdit: cancelEdit});
                        
                        let startEdit = function (event)
                        {
                            event.stopPropagation ();
                            
                            element.hide ();

                            let grid = $("<div></div>")
                                .css('width', 'max-content')
                                .css('max-width', element.parent().width ())
                                .css('display', 'inline-grid')
                                .css('grid-template-columns', 'minmax(0, 1fr) min-content min-content');
                            
                            let edit = $("<input type='text' style='width:100%;border-width:2px; border-style:solid'/>")
                                .on ('click', function (event) { event.stopPropagation (); });
                            
                            let save = $("<button class='btn btn-sm' type='button'>" + 
                                "<i class='fas fa-check-square'></i>" +
                                "</button>")
                                .css('padding-right', '4px');
                            
                            let cancel = $("<button class='btn btn-sm' type='button'>" + 
                                "<i class='fas fa-window-close'></i>" +
                                "</button>")
                                .css('padding-left', '4px');
        
                            grid.insertAfter(element);
                            grid.append(edit);
                            grid.append(save);
                            grid.append(cancel);
       
                            element.data('grid', grid);
                            
                            edit.val(value);
                            edit.focus ();
                            
                            // If a click occurs outside the element then cancel the edit
                            $(document).on('click', cancelEdit);
                            
                            // Close all other editable elements that might be in an edit state
                            $('.editable').not(element).each (function () { this.cancelEdit (); });
                            
                            save.on ('click', function ()
                                {
                                    value = edit.val();
        
                                    $.ajax({
                                        url: url,
                                        type: "PUT",
                                        contentType: "application/json",
                                        data: JSON.stringify({[prop]: value})
                                    })
                                    .done (function()
                                    {
                                        element.text(value);
                                        element.append(pencil);
                                        element.show ();
                                        grid.remove ();
                                        
                                        pencil.on('click', startEdit);
                                        
                                    });
                                });
        
                            cancel.on('click', function ()
                                {
                                    cancelEdit ();
                                });
                        };
                        
                        pencil = $("<a class='btn btn-sm'><i class='fas fa-pencil-alt'></i></a>")
                            .on('click', startEdit)
                            .appendTo(element);
                    });
                },
        }
);

    $('.editable').each(function () {
        $(this).editable($(this).attr('data-url'), $(this).attr('data-prop'));
    });
});
