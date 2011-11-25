/*globals console,_,XMLHttpRequest,document,window*/

// TODO: modularise this
// INFO: http://ajaxpatterns.org/XMLHttpRequest_Call#Creating_XMLHttpRequest_Objects

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

        /*
          abortTimeout = setTimeout(function(){
          xhr.abort();
          xhr.onreadystatechange = 0;
          console.log("timeout");
          }, 5000);
        */

        xhr.open("GET", url, true);
        xhr.onreadystatechange = function(){
            if ( xhr.readyState === 4 ){
                //              clearTimeout(abortTimeout);
                settings.ok( JSON.parse(xhr.responseText), xhr.status );
            }
        };
        xhr.send(null);

    };

    return xhr;

}());

var MODEL = (function(){
    'use strict';

    var model={},
    results;


    model.load = function( cb ){
        XHR.get( "/results", { ok: function(r,s){
            results = r.results;
            cb();
        }});
    };

    model.getAllPlayers = function(){
        return _(results).chain()
            .map( function(g){
                return [g.team1.attacker, g.team1.defender, g.team2.attacker, g.team2.defender];
            }).flatten().uniq().value();
    };

    return model;
}());

var UI = (function(){
    'use strict';
    var ui = {},
    d = function(e){return document.getElementById(e);},
    m = function(e){return document.createElement(e);},
    pages = ['loading-page','choose-players-page'],

    chosenPlayers = [],

    choosePlayer = function(name){
        if (chosenPlayers.length === 4){
            return;
        }
        chosenPlayers.push(name);
        var choiceElem = d('player-choice-' + chosenPlayers.length);
        choiceElem.innerHTML = name;
        choiceElem.className = "player";
    },

    createPlayerElem = function(name){
        var playerElem = m('div');
        playerElem.id = "player-"+name;
        playerElem.className = "player";
        playerElem.innerHTML = name;
        return playerElem;
    },

    addNewKidPlayer = function(){
        var newKidElem = createPlayerElem("The new kid");
        newKidElem.onclick = function(){
            var newName = window.prompt("What's the kid's name?");
            if (newName !== null){
                choosePlayer(newName);
            }
        };
        d('players').appendChild(newKidElem);
    },

    addPlayer = function(name){
        var elem = d('players'),
        playerElem = createPlayerElem(name);

        playerElem.onclick = function(){
            playerElem.className = "player empty";
            choosePlayer(name);
            console.log(name);
            playerElem.onclick = null;
        };
        elem.appendChild( playerElem );
    },

    makeOption = function(name){
        var opt = m('option');
        opt.value = name;
        opt.innerHTML = name;
        return opt;
    };

    ui.choosePlayers = function(players, cb){
        _(players).each( function(p){ addPlayer(p); } );
        addNewKidPlayer();
        d('chosen-players').onclick = function(){
            if( chosenPlayers.length === 4 ){
                cb(chosenPlayers);
            }
        };
    };

    ui.showPage = function(page){
        _(pages).each( function(p){ d(p).style.display = "none"; } );
        d(page).style.display = "block";
    };

    // Game screen

    ui.addTeamPlayers = function (players) {
        var players = _(players).shuffle(),
        count=0;

        _(players).each(function(n){
            d('t1a').appendChild(makeOption(n));
            d('t1d').appendChild(makeOption(n));
            d('t2a').appendChild(makeOption(n));
            d('t2d').appendChild(makeOption(n));
        });

        d('t1a').selectedIndex = 0;
        d('t1d').selectedIndex = 1;
        d('t2a').selectedIndex = 2;
        d('t2d').selectedIndex = 3;
    };

    ui.addScoreHandlers = function(){
	_(_.range(10)).chain().each(function(n){
	    d('t1score'+n).onclick = function(){ console.log([10,n]); };
	    d('t2score'+n).onclick = function(){ console.log([n,10]); };
	});
    };

    return ui;
}());

var APP = (function(model,ui){
    'use strict';

    var app = {},

    playersChosen = function(players){
        ui.showPage("game-in-progress");
        ui.addTeamPlayers(players);
    },

    modelLoaded = function(){
        ui.showPage("choose-players-page");
        ui.choosePlayers(model.getAllPlayers(), playersChosen);
    };

    app.start = function(){
        ui.showPage("loading-page");
        model.load(modelLoaded);
    };

    return app;
}(MODEL,UI));

(function(){
    'use strict';
    //UI.showPage("game-in-progress");
    //UI.addScoreHandlers();
    APP.start();
}());
