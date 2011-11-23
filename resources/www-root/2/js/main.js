// define our libs
require.config({
    paths: {
        jQuery: 'lib/jquery-1.7.min',
        Underscore: 'lib/underscore-min',
        Backbone: 'lib/backbone-min'
    }
});

// start the app
require(['app', 'lib/underscore-min'],
        function(App){
            'use strict';
	    console.log(_);
            App.init();
        }
       );