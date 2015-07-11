(function($, _) {

    var timelineSelectors = {
        container: ".timeline-container",
        state: ".state",
        allCanvas: ".timeline-container .canvas",
        canvas: ".canvas",
        editor: ".timeline-editor",
        uploader: ".uploader",
        uploaderAdd: ".assets .add",
        preview: ".preview"
    };

    var timelineInjectElements = {
        debugState: '<div class="state"></div>',
        toolbar: '<div class="toolbar"><button class="add button">+ Image</button></div>',
        canvas: '<canvas class="canvas"></canvas>'
    };


    function timeline_selectContainer(event) {
        event.preventDefault();
        event.stopPropagation();

        var $containers = $(timelineSelectors.container);
        timeline_setContainerState($containers, "debug enabled");

        var $target = $(event.target);
        var $container;
        if ($target.is(timelineSelectors.container)) $container = $target;
        else $container = $target.parents().filter(timelineSelectors.container);

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
            var $toolbar = $(timelineInjectElements.toolbar);
            var $canvas = $(timelineInjectElements.canvas);
            $container.append($canvas).append($state).append($toolbar);
            pub.options.$currentContainer = $container;
            timeline_setContainerState($container, "debug enabled");
        });

        $containers.on("click", timeline_selectContainer);
        $containers.find(".button.add").on("click", timeline_lauchUploader);

        var $canvas = $(timelineSelectors.allCanvas);
        $canvas.on("mousedown", function(event) {
            event.preventDefault();
            event.stopPropagation();
            timeline_selectContainer(event);

            canvas_click(event);
        });
        $canvas.on("mouseup", function(event) {
            event.preventDefault();
            event.stopPropagation();
        });

        $(window).resize(function() {
            $canvas.each(function(index, item) {
                var $item = $(item);
                $item.attr({
                    width: $item.width(),
                    height: $item.height()
                });
            });
        }).resize();

    }


    var clickPoints = [];
    function canvas_click(event) {

        if (event.ctrlKey && event.shiftKey) return makeAnimation($("img"), clickPoints, { duration: 5 });

        var $currentContainer = pub.$currentContainer;
        var currentCanvas = $currentContainer.find(timelineSelectors.canvas)[0];
        if (currentCanvas.getContext) {
            var ctx = currentCanvas.getContext('2d');
        

            if (event.shiftKey) {
                clickPoints.push({
                    x: event.clientX, 
                    y: event.clientY
                });
                canvas_renderPoints(ctx, clickPoints);
            }

        }
    }

    function canvas_renderPoints(ctx, points) {
        var line=new Path2D();
        for (var i = 0, l = points.length; i < l; i++) {
            var point = points[i];
            
            if (i == 0) {
                line.moveTo(point.x, point.y);
            } else {
                line.lineTo(point.x, point.y);
            }
            ctx.stroke(line);
        }
        console.log(points);
        pathStats(points);
        makeAnimation($("img"), points, { duration: 5 });
    }

    function pathStats(points) {
        var totalLength = 0;
        for (var i = 0, l = points.length; i < l; i++) {
            var point = points[i];
            
            if (i == 0) {
            } else {
                var a = Math.pow(points[i].x - points[i-1].x,2);
                var b = Math.pow(points[i].y - points[i-1].y,2);
                var c = Math.sqrt(a + b);
                points[i].distance = c;
                totalLength += c;
            }
        }
        points.distance = totalLength;
    }


    function makeAnimation($img, points, options) {
        if ($img.length === 0) return;

        var duration = options.duration;
        var interval = duration / points.distance;

        var anim;
        var deg = 0;

        TweenMax.killAll();
        var tl = new TimelineMax({repeat:2, repeatDelay:1, easing: "ease-in"});

        var currentTime = 0;

        for (var i = 0, l = points.length; i < l; i++) {
            var point = points[i];
                
            var x = point.x - ($img.width() / 2);
            var y = point.y - ($img.height() / 2)


            if (i == 0) {
                anim = tl.to( $img[0], 0, { top: y, left: x, rotation: "0deg", ease: "linear" }, "start");
                anim.to($img[0], duration, {rotation: "360deg", ease:"linear"}, "start");
            } else {
                anim.to($img[0], (interval * point.distance), { top: y, left: x, ease: "linear" }, currentTime);
                currentTime +=  (interval * point.distance);
            }
        }

        tl.play();

    }


    function timeline_lauchUploader(event) {
        var newWindow = window.open("uploader.html", "_blank");
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



    function timeline_initializeUploader() {
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

        $(timelineSelectors.uploaderAdd).off("click").on("click", function() {

            var $newImage = $("<img>", pub.options.parentWindow.document);
            $newImage.attr({
                "type": $preview.attr("type"),
                "src": $preview.attr("src")
            });

            pub.options.parentTimeline.$currentContainer.append($newImage);
            window.close();
        });
    }

    $.timeline.uploaderReady = function(parentWindow, parentTimeline) {
        options = pub.options = $.extend(true, pub.defaults, {
            parentWindow: parentWindow,
            parentTimeline: parentTimeline,
            debug: true,
            $currentContainer: $(timelineSelectors.editor)
        });

        timeline_initializeUploader()
    };



})(jQuery, _);