(function($, _) {

    var timelineSelectors = {
        container: ".timeline-container",
        state: ".timeline-state",
        editor: ".timeline-editor",
        uploader: ".timeline-uploader",
        preview: ".timeline-preview"
    };

    var timelineInjectElements = {
        debugState: '<div class="timeline-state"></div>'
    };


    function timeline_selectContainer(event) {
        var $containers = $(timelineSelectors.container);
        timeline_setContainerState($containers, "debug enabled");

        var $container = $(event.target);
        pub.$currentContainer = $container
        timeline_setContainerState($container, "selected");
    }

    function timeline_setContainerState($container, state) {
        $container.find(timelineSelectors.state).html(state);
    }


    function timeline_initializeDebug() {
        var $containers = $(timelineSelectors.container);
        $containers.addClass("debug");

        $containers.each(function(index, container) {
            var $container = $(container);
            var $state = $(timelineInjectElements.debugState);
            $container.append($state);
            pub.options.$currentContainer = $container;
            timeline_setContainerState($container, "debug enabled");
        });

        $containers.on("click", timeline_selectContainer);
        $containers.on("dblclick", timeline_lauchEditor);

    }

    function timeline_lauchEditor() {
        var newWindow = window.open("editor.html", "_blank");
        newWindow.parentWindow = window;
        newWindow.parentTimeline = $.timeline;
    }



    var pub = $.timeline = {
        defaults: {
            debug: true
        },
        options: null,
        $currentContainer: null
    };


    $.timeline.ready = function(options) {
        options = pub.options = $.extend(true, {}, pub.defaults, options);

        if (options.debug) {
            timeline_initializeDebug();
        }

    };



    function timeline_initializeEditor() {
        var $uploader = $(timelineSelectors.uploader);
    
        $uploader.on("change", function(event) {
            var file = event.target.files[0]; 

            if (file) {
                var reader = new FileReader();
                reader.onload = function(event) { 
                    var contents = event.target.result;
                    file.contents = contents;
                    timeline_contentUploaded(file);
                }
                reader.readAsDataURL(file);
            } else { 
                alert("Failed to load file");
            }
        });

    }

    function timeline_contentUploaded(file) {
        var $preview = $(timelineSelectors.preview);

        switch (file.type){
        case "image/png": case "image/gif": case "image/jpeg":
            break;
        default:
            alert("Unsupported image type");
        }

        $preview.attr({
            "type": file.type,
            "src": file.contents
        });


        var $newImage = $("<img>", pub.options.parentWindow.document);
        $newImage.attr({
            "type": file.type,
            "src": file.contents
        });

        pub.options.parentTimeline.$currentContainer.append($newImage);
    }

    $.timeline.editorReady = function(parentWindow, parentTimeline) {
        options = pub.options = $.extend(true, pub.defaults, {
            parentWindow: parentWindow,
            parentTimeline: parentTimeline,
            debug: true,
            $currentContainer: $(timelineSelectors.editor)
        });

        timeline_initializeEditor()
    };



})(jQuery, _);