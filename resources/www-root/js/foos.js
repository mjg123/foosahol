/*globals _,Backbone,document,console,Math,JSON*/

var STATE = (function(){
    'use strict';

    return {
        init: function(){

            var state={}, game={"team1":{}, "team2":{}},
            opposites={"red":"blue", "blue":"red", "black":"yellow", "yellow":"black"};

            _.extend(state, Backbone.Events);

            state.bind("colour:team1", function(col){
                game.team1.colour = col;
                game.team2.colour = opposites[col];
                document.getElementById('team2colour').value = opposites[col];
            });

            state.bind("colour:team2", function(col){
                game.team2.colour = col;
                game.team1.colour = opposites[col];
                document.getElementById('team1colour').value = opposites[col];
            });

            state.get = function(){
                game.team1.attacker = document.getElementById('t1a').value;
                game.team1.defender = document.getElementById('t1d').value;
                game.team2.attacker = document.getElementById('t2a').value;
                game.team2.defender = document.getElementById('t2d').value;
                return game;
            };

            return state;
        }
    };
}());

var FOOS = (function(){
    'use strict';

    var foos={}, state=STATE.init(),
    players = ["Tranny", "Pross", "Beard", "Pop3"],
    colours = ["red", "blue", "yellow", "black"],

    d = function(e){return document.getElementById(e);},

    shuffle = function(array){ // doesn't belong here :(
        var tmp, current, top = array.length;
        if(top) {
            while(--top) {
                current = Math.floor(Math.random() * (top + 1));
                tmp = array[current];
                array[current] = array[top];
                array[top] = tmp;
            }
        }
        return array;
    },

    add_option = function(sel, name){
        var newOption = document.createElement('option');
        newOption.value = name;
        newOption.text = name;
        sel.appendChild(newOption);
    },

    set_values = function(){
        _.map(players, function(p){add_option(d('t1a'), p);});
        _.map(players, function(p){add_option(d('t1d'), p);});
        _.map(players, function(p){add_option(d('t2a'), p);});
        _.map(players, function(p){add_option(d('t2d'), p);});

	players = shuffle(players);

        d('t1a').value = players[0];
        d('t1d').value = players[1];
        d('t2a').value = players[2];
        d('t2d').value = players[3];

	d('team1colour').value = colours[ Math.floor(Math.random() * colours.length) ];
	state.trigger("colour:team1", d('team1colour').value);
    },

    attach_handlers = function(){
        d('team1colour').onchange = function(e){ state.trigger("colour:team1", e.target.value); };
        d('team2colour').onchange = function(e){ state.trigger("colour:team2", e.target.value); };

        d('t1a').onchange = function(e){ state.trigger("player:t1a", e.target.value); };
        d('t1d').onchange = function(e){ state.trigger("player:t1d", e.target.value); };
        d('t2a').onchange = function(e){ state.trigger("player:t2a", e.target.value); };
        d('t2d').onchange = function(e){ state.trigger("player:t1d", e.target.value); };

	d('t1s').onclick = function(){ var t=d('t1a').value; d('t1a').value=d('t1d').value; d('t1d').value=t;};
	d('t2s').onclick = function(){ var t=d('t2a').value; d('t2a').value=d('t2d').value; d('t2d').value=t;};
    };

    foos.init = function(){
        attach_handlers();
        set_values();
    };

    foos.dbg = function(){
        console.log(JSON.stringify(state.get()));
    };

    return foos;
}());

(function(){
    'use strict';
    document.body.onload = function(){
        FOOS.init();
    };
}());