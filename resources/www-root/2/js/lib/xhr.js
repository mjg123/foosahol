/*globals XMLHttpRequest*/

var XHR = (function(){
    'use strict';

    var xhr = {};

    xhr.makeXhr = function(){
        try { return new XMLHttpRequest(); } catch(e) {}
        console.log("XMLHttpRequest not supported");
        return null;
    };

    xhr.get = function( url, settings ){
        var xhr = this.makeXhr();

        xhr.open("GET", url, true);
        xhr.onreadystatechange = function(){
            if ( xhr.readyState === 4 ){
                settings.ok( JSON.parse(xhr.responseText), xhr.status );
            }
        };
        xhr.send(null);

    };

    xhr.post = function( url, settings ){
	var xhr = this.makeXhr();
	xhr.open("POST", url, true);
        xhr.onreadystatechange = function(){
            if ( xhr.readyState === 4 ){
                settings.ok( JSON.parse(xhr.responseText), xhr.status );
            }
        };
	xhr.send(settings.body);
    };

    return xhr;

}());
