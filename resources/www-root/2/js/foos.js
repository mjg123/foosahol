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

    model.saveResult = function( result ){
        console.log(result);
	XHR.post("/results", {ok: console.log, body: JSON.stringify(result)});
    };

    return model;
}());

var UI = (function(model){
    'use strict';
    var ui = {},
    d = function(e){return document.getElementById(e);},
    m = function(e){return document.createElement(e);},
    pages = ['loading-page','choose-players-page'],

    chosenPlayers = [],
    initialComment = d('meta').value,

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
            playerElem.onclick = null;
        };
        elem.appendChild( playerElem );
    },

    showScore = function(score){
        d('score').value = score[0] + " / " + score[1];
        d('score').onclick = function(){
            model.saveResult(
                { "team1": {
                    "colour": "red",
                    "score": score[0],
                    "attacker": d('t1a').innerHTML,
                    "defender": d('t1d').innerHTML },
                  "team2": {
                      "colour": "blue",
                      "score": score[1],
                      "attacker": d('t2a').innerHTML,
                      "defender": d('t2d').innerHTML },
                  "meta": {
                      "comments" : (d('meta').value === initialComment ? "" : d('meta').value),
                      "rhino" : d('rhinobox').checked
                  }
                }
            );
	    d('scoresubmit').style.display = "none";
	    d('meta').value = initialComment;
	    d('rhinobox').checked = false;
        };
        d('scoresubmit').style.display = "block";
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

    ui.addTeamPlayers = function (inplayers) {
        var players = _(inplayers).shuffle();

        d('t1a').innerHTML = players[0];
        d('t1d').innerHTML = players[1];
        d('t2a').innerHTML = players[2];
        d('t2d').innerHTML = players[3];

        d('teamshuffle').onclick = function(){
            ui.addTeamPlayers(players);
        };

    };

    ui.addScoreHandlers = function(){
        d('t1swap').onclick = function(){
            var tmp = d('t1a').innerHTML;
            d('t1a').innerHTML = d('t1d').innerHTML;
            d('t1d').innerHTML = tmp;
        };

        d('t2swap').onclick = function(){
            var tmp = d('t2a').innerHTML;
            d('t2a').innerHTML = d('t2d').innerHTML;
            d('t2d').innerHTML = tmp;
        };

        _(_.range(10)).chain().each(function(n){
            d('t1score'+n).onclick = function(){ showScore([n,10]); };
            d('t2score'+n).onclick = function(){ showScore([10,n]); };
        });

    };

    return ui;
}(MODEL));

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
        ui.addScoreHandlers();
        model.load(modelLoaded);
    };

    return app;
}(MODEL,UI));

(function(){
    'use strict';
    //    UI.showPage("game-in-progress");
    APP.start();
}());
