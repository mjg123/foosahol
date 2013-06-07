/*globals document,_*/

var DOM = (function(){
    'use strict';

    var dom = {};

    dom.d = function(i){ return document.getElementById(i); };

    dom.m = function(tag,c){ 
	var elem = document.createElement(tag);
	if (c){
	    _(c).chain().keys().each( function(key){
		if (key === "children"){
		    _(c[key]).each( function(kid){elem.appendChild(kid);} );
		} else {
		    elem[key] = c[key];
		}
	    });
	}
	return elem;
    };

    dom.removeChildren = function(e){
	while (e.hasChildNodes()){ e.removeChild(e.firstChild); }
    };

    return dom;
}());

