/*globals console, document*/

define(['lib/underscore-min'],

       function(_){
	   'use strict';

	   var app = {},
	   players = ['one','two','three','four'];

	   app.init = function(){
	       console.log("init");

	       console.log(_);

	       var playersDiv = document.getElementById('players');

	       _.foreach(players, function(p){
		   var newPlayer = document.createElement("div");
		   newPlayer.innerHTML = p;
		   playersDiv.appendChild( newPlayer );
	       });

	   };

	   return app;
       }


);