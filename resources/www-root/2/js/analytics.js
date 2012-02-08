/*jslint white:false*/
/*global document*/

var ANALYTICS = (function(a){

    var genUUID = function(){
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8); // sorry, crockles
            return v.toString(16);
        });
    },
    clientId = genUUID();

    console.log("Analytics started w/ uuid of " + clientId);

    a.logfn = function(app){
	return function(msg){
	    a.event(app, msg);
	};
    };

    a.event = function(app, msg){
	var msgs = {cid:clientId, msgs: [msg]},
	s = document.createElement('script');
	s.src = "/analytics/"+app+"?cb=ANALYTICS.k&msg="+JSON.stringify(msgs);
	document.getElementsByTagName('HEAD')[0].appendChild(s);
    };

    a.k = function(msg){
	console.log("Got jsonp callback: "+msg);
    };

    return a;
}(ANALYTICS || {}));