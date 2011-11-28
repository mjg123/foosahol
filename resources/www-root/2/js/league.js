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
    },

    oppositeTeams = function(n1,n2,g){
        if ( isTeam1(n1,g) && isTeam2(n2,g) ){ return true; }
        if ( isTeam2(n1,g) && isTeam1(n2,g) ){ return true; }
        return false;
    },

    getTeamPeople = function(p,val){
        var max = _(p.team).pluck(val).reduce( function(m,n){ return Math.max(m,n); }, 0 );
        return _(p.team).keys().filter( function(k){ return p.team[k][val] === max; });
    },

    addStreaks = function(players){
	_(players).each( function(p){

	    var b=0,w=0,c=0, grouped=[],currentGroup=[];

	    _(p.form).each( function( res ){
		if ( currentGroup.length ===0 || currentGroup[0] === res ){
		    currentGroup.push(res);
		} else {
		    grouped.push(currentGroup);
		    currentGroup = [res];
		}
	    });
	    grouped.push(currentGroup);

	    p.streak = {};
	    p.streak.best = _(grouped).chain().filter( function(g){return g[0]==="W";} ).map( function(g){ return g.length; } ).max().value();
	    p.streak.worst = _(grouped).chain().filter( function(g){return g[0]==="L";} ).map( function(g){ return g.length; } ).max().value() * -1;
	    p.streak.current = grouped.slice(-1)[0].length * ( grouped.slice(-1)[0][0] === "W" ? 1 : -1 );

	});
    },

    addBadges = function( players, games ){

        var maxP = _(players).chain().pluck('P').max().value();
        _(players).chain().keys().filter( function(k){ return players[k].P === maxP; })
            .each( function(p){ players[p].badges.push("KEENER"); });

        var minP = _(players).chain().pluck('P').min().value();
        _(players).chain().keys().filter( function(k){ return players[k].P === minP; })
            .each( function(p){ players[p].badges.push("SLACKER"); });

	var WRorder = _(players).chain().sortBy( function(p){ return -p.hist.WR.slice(-1)[0]; } ).pluck('name').value();
	players[WRorder[0]].badges.push("GOLD MEDAL");
	players[WRorder[1]].badges.push("SILVER MEDAL");
	players[WRorder.slice(-1)[0]].badges.push("WOODEN SPOON");

	_(players).each( function(p){
	    if (p.P < 10) { p.badges.push( "NEWB" ); }

	    if (p.P >= 10) { p.badges.push( "DECENARIAN" ); }
	    if (p.W >= 10) { p.badges.push( "DEC+" ); }
	    if (p.L >= 10) { p.badges.push( "DEC-" ); }

	    if (p.P >= 100) { p.badges.push( "CENTURION" ); }
	    if (p.W >= 100) { p.badges.push( "CENT+" ); }
	    if (p.L >= 100) { p.badges.push( "CENT-" ); }

	    if (p.streak.best  === p.streak.current){ p.badges.push( "WINNING!" ); }
	    if (p.streak.worst === p.streak.current){ p.badges.push( "LOSING!" ); }

	    var curr = p.hist.WR.length-1;
	    var prev = Math.max(p.hist.WR.length-6,0);
	    p.improvement = p.hist.WR[curr] / p.hist.WR[prev];

	    p.brink = { P:0,W:0,L:0 };
	    _(games).each( function(g){
		var totalScore = g.team1.score + g.team2.score;
		if ( totalScore === 10 && won(p.name,g)  ){ p.badges.push("UNICORN"); }
		if ( totalScore === 10 && lost(p.name,g) ){ p.badges.push("UNICORNED"); }
		if ( totalScore === 11 && lost(p.name,g) ){ p.badges.push("PHEW!"); }
		if ( totalScore === 19 && won(p.name,g)  ){ p.brink.P += 1; p.brink.W += 1; }
		if ( totalScore === 19 && lost(p.name,g) ){ p.brink.P += 1; p.brink.L += 1; }
	    });
	    
	    if ( p.brink.P > 0 ){
		if ( p.brink.W > p.brink.L ){ p.badges.push( "STEADY NERVE" ); }
		if ( p.brink.W < p.brink.L ){ p.badges.push( "CRUMBLES" ); }
	    }

	});

        var maxBrink = _(players).chain().map(function(p){ return p.brink.P; }).max().value();
        _(players).chain().keys().filter( function(k){ return players[k].brink.P === maxBrink; })
            .each( function(p){ players[p].badges.push("BRINKSMAN"); });

        var maxImpr = _(players).chain().pluck('improvement').max().value();
        _(players).chain().keys().filter( function(k){ return players[k].improvement === maxImpr; })
            .each( function(p){ players[p].badges.push("IMPROVING"); });

        var minImpr = _(players).chain().pluck('improvement').min().value();
        _(players).chain().keys().filter( function(k){ return players[k].improvement === minImpr; })
            .each( function(p){ players[p].badges.push("COLLAPSING"); });


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
            var r = { P:0,W:0,L:0,GF:0,GA:0,GDPG:0,form:[],team:{},badges:[],hist:{W:[],L:[],WR:[]} };
            r.name = n;

            _(data.results).chain().sortBy( function(g){ return g.meta.timestamp; } ).each( function(g){
                if ( played(n,g) ){
                    r.P += 1;
                    r.GF += goalsFor(n,g);
                    r.GA += goalsAgainst(n,g);
                    if ( won(n,g) ){ r.W++; r.form.push('W'); }
                    if ( lost(n,g) ){ r.L++; r.form.push('L'); }

                    r.hist.WR.push( Math.ceil( r.W*100 / r.P ) );
                    r.hist.W.push( r.W );
                    r.hist.L.push( r.L );

                    _(names).chain().reject( function(on){ return n===on; } ).each(function(on){
                        r.team[on] = r.team[on] || { bff:0,enemy:0,rival:0,sidekick:0,whippingboy:0,nemesis:0,partner:0,mismatch:0 };
                        if (played(on,g)){
                            r.team[on].bff += 1;
                            if ( oppositeTeams(n,on,g) ){
                                r.team[on].rival += 1;
                                if ( won(n,g) ){
                                    r.team[on].whippingboy += 1;
                                } else {
                                    r.team[on].nemesis += 1;
                                }
                            } else {
                                r.team[on].sidekick += 1;
                                if ( won(n,g) ){
                                    r.team[on].partner += 1;
                                } else {
                                    r.team[on].mismatch += 1;
                                }
                            }
                        } else {
                            r.team[on].enemy += 1;
                        }

                    });
                }
            });

            // some stats only count when both players were present
            _(names).chain().reject( function(on){ return n===on; } ).each( function(on){
                r.team[on].whippingboy /= r.team[on].rival;
                r.team[on].nemesis     /= r.team[on].rival;
                r.team[on].partner     /= r.team[on].sidekick;
                r.team[on].mismatch    /= r.team[on].sidekick;
            });

            if ( r.P > 0 ){
                r.WR = r.W*100 / r.P;
                r.LR = r.L*100 / r.P;
                r.GDPG = (r.GF - r.GA) / r.P;

                _([ "bff", "enemy", "rival", "sidekick", "whippingboy", "nemesis", "partner", "mismatch" ]).each( function(s){
                    r[s] = getTeamPeople(r,s);
                });
            }

            players[n] = r;
        });

	addStreaks(players);
        addBadges(players, data.results);

        return players;
    };

    league.badges = {
	"KEENER": "Played the most games",
	"SLACKER": "Played the least games",
	"GOLD MEDAL": "Highest win rate",
	"SILVER MEDAL": "Second-highest win rate",
	"WOODEN SPOON": "Worst win rate",
	"NEWB": "Less than ten games",
	"DECENARIAN": "10+ games under your belt",
	"DEC+": "10+ games won",
	"DEC-": "10+ games lost",
	"CENTURION": "100+ games tucked away",
	"CENT+": "100+ games won",
	"CENT-": "100+ games lost",
	"WINNING!": "Currently on best streak",
	"LOSING!": "Currently on worst streak",
	"IMPROVING": "Best improvement in Win Rate since 5 games ago",
	"COLLAPSING": "Biggest drop in Win Rate since 5 games ago",
	"UNICORN": "The ULTIMATE result.  10-0.  Enough said.",
	"UNICORNED": "The ULTIMATE humiliation.",
	"PHEW!": "Jesus! That was close!  You almost got unicorned! (beaten 10-1)",
	"STEADY NERVE": "Wins >50% of golden-goal games",
	"CRUMBLES": "Loses >50% of golden-goal games",
	"BRINKSMAN": "Takes it to golden-goal more than anyone else",
    };

    return league;

}());

var UI = (function(league, dom){
    'use strict';

    var ui = {},
    m=dom.m, d=dom.d,
    spark = function( data ){
        return "https://chart.googleapis.com/chart?chs=100x30"+
            "&cht=lc"+
            "&chco=336699" +
            "&chls=1,1,0" +
            "&chxl=0:|"+data[data.length-1]+"|1:||2:||" +
            "&chxp=0,"+data[data.length-1] +
            "&chxt=r,x,y" +
            "&chxs=0,990000,11,0,_|1,990000,1,0,_|2,990000,1,0,_" +
            "&chm=o,990000,0,"+data.length+",4"+
            "&chd=t:"+data.join();
    };

    ui.showTable = function(){
        _(league.getPeople()).chain().sortBy( function(p){ return -p.WR; } ).each(function(person){
            var row = m('tr', {onclick: (function(){ return function(){ui.showPlayer(person);}; }()), className:"leaguerow"});
            row.appendChild( m('td', {innerHTML: person.name}) );
            row.appendChild( m('td', {innerHTML: person.P}) );
            row.appendChild( m('td', {innerHTML: person.W}) );
            row.appendChild( m('td', {innerHTML: person.L}) );
            row.appendChild( m('td', { children: [m('img', {src: spark(person.hist.WR), alt: person.WR.toFixed(0)})] }));
            row.appendChild( m('td', {innerHTML: person.GF}) );
            row.appendChild( m('td', {innerHTML: person.GA}) );
            row.appendChild( m('td', {innerHTML: person.GDPG.toFixed(2)}) );
            row.appendChild( m('td', {innerHTML: person.badges.length}) );
            d('leaguetable').appendChild(row);
        });
    };

    ui.showPlayer = function(player){
        console.log(player);
        d('p-name').innerHTML = player.name;

        var prev = Math.max(player.P-6,0),
        makeHist = function(v,old){
            return m('div',{children:[m('span',{innerHTML:v}), m('span',{innerHTML:"("+old+")"})]});
        };

        d('p-played').innerHTML = player.P;
        d('p-won').innerHTML = player.W;
        d('p-lost').innerHTML = player.L;

        d('p-form').innerHTML = player.form.slice(-5).join("");

	d('p-best-streak').innerHTML = player.streak.best;
	d('p-worst-streak').innerHTML = player.streak.worst;
	d('p-current-streak').innerHTML = player.streak.current;

        _([ "bff", "enemy", "rival", "sidekick", "whippingboy", "nemesis", "partner", "mismatch" ]).each( function(s){
            d('p-'+s).innerHTML = player[s].join("/");
        });

        dom.removeChildren(d('badgesbox'));
        _(player.badges).each( function(b){ 
	    d('badgesbox').appendChild(m('span',{innerHTML:b, title:league.badges[b], className: "badge"})); 
	});

    };

    return ui;
}(LEAGUE, DOM));


(function(xhr,league,ui){
    'use strict';

    xhr.get("/results", {ok: function(d){
        league.setData(d);
        ui.showTable();
    }});

}(XHR,LEAGUE,UI));