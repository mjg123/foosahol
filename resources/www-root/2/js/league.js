/*globals _,document,alert*/

var LEAGUE = (function(){
    'use strict';

    var league = {},
    data = {},

    isTeam1 = function(n,g){
	return g.team1.attacker === n || g.team1.defender === n;
    },

    isTeam2 = function(n,g){
	return g.team2.attacker === n || g.team2.defender === n;
    },

    played = function(n,g){
	return isTeam1(n,g) || isTeam2(n,g);
    },

    won = function(n,g){
	if (isTeam1(n,g)) { return g.team1.score === 10; }
	if (isTeam2(n,g)) { return g.team2.score === 10; }
	return false;
    },

    lost = function(n,g){
	if (isTeam1(n,g)) { return g.team1.score !== 10; }
	if (isTeam2(n,g)) { return g.team2.score !== 10; }
	return false;
    },

    goalsFor = function(n,g){
	if (isTeam1(n,g)) { return g.team1.score; }
	if (isTeam2(n,g)) { return g.team2.score; }
	return 0;
    },

    goalsAgainst = function(n,g){
	if (isTeam1(n,g)) { return g.team2.score; }
	if (isTeam2(n,g)) { return g.team1.score; }
	return 0;
    };

    league.setData = function(_data){
        data = _data;
    };

    league.getPeople = function(){
        var names =  _(data.results).chain()
            .map( function(g){ return [g.team1.attacker, g.team1.defender, g.team2.attacker, g.team2.defender]; } )
            .flatten().uniq().value(),

        players = {};

        _(names).each( function(n) {
            var r = { P:0,W:0,L:0,GF:0,GA:0,GDPG:0,form:[] };
            r.name = n;

            _(data.results).chain().sortBy( function(g){ return g.meta.timestamp; } ).each( function(g){
		if ( played(n,g) ){
                    r.P += 1;
		    r.GF += goalsFor(n,g);
		    r.GA += goalsAgainst(n,g);
		    if ( won(n,g) ){ r.W++; r.form.push('W'); }
		    if ( lost(n,g) ){ r.L++; r.form.push('L'); }
		}

            });

	    if ( r.P > 0 ){
		r.WR = r.W*100 / r.P;
		r.LR = r.L*100 / r.P;
		r.GDPG = (r.GF - r.GA) / r.P;
	    }

	    players[n] = r;
        });

        return players;
    };

    return league;

}());

var UI = (function(league){
    'use strict';

    var ui = {},
    d = function(i){ return document.getElementById(i); },
    m = function(tag,c){ 
	var elem = document.createElement(tag);
	if (c){
	    _(c).chain().keys().each( function(key){
		elem[key] = c[key];
	    });
	}
	return elem;
    };

    ui.showTable = function(){
        console.log("OK");
        _(league.getPeople()).chain().sortBy( function(p){ return -p.WR; } ).each(function(person){
	    var row = m('tr', {onclick: (function(){ return function(){alert(person.name);}; }())});	    
	    row.appendChild( m('td', {innerHTML: person.name}) );
	    row.appendChild( m('td', {innerHTML: person.P}) );
	    row.appendChild( m('td', {innerHTML: person.W}) );
	    row.appendChild( m('td', {innerHTML: person.L}) );
	    row.appendChild( m('td', {innerHTML: person.WR}) );
	    row.appendChild( m('td', {innerHTML: person.LR}) );
	    row.appendChild( m('td', {innerHTML: person.GF}) );
	    row.appendChild( m('td', {innerHTML: person.GA}) );
	    row.appendChild( m('td', {innerHTML: person.GDPG}) );
	    row.appendChild( m('td', {innerHTML: JSON.stringify(person)}) );
	    d('leaguetable').appendChild(row);
        });
    };

    return ui;
}(LEAGUE));


(function(xhr,league,ui){
    'use strict';

    xhr.get("/results", {ok: function(d){
        league.setData(d);
        ui.showTable();
    }});

}(XHR,LEAGUE,UI));