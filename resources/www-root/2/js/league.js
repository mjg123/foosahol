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

    addBadges = function( players ){

        var maxP = _(players).pluck('P').reduce( function(m,n){ return Math.max(m,n); } );
        _(players).chain().keys().filter( function(k){ return players[k].P === maxP; })
            .each( function(p){ players[p].badges.push("KEENER"); });

        var minP = _(players).pluck('P').reduce( function(m,n){ return Math.min(m,n); } );
        _(players).chain().keys().filter( function(k){ return players[k].P === minP; })
            .each( function(p){ players[p].badges.push("SLACKER"); });


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
                r.team[on].whippingboy /= r.team[on].bff;
                r.team[on].nemesis     /= r.team[on].bff;
                r.team[on].partner     /= r.team[on].bff;
                r.team[on].mismatch    /= r.team[on].bff;
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

        addBadges(players);

        return players;
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
            var row = m('tr', {onclick: (function(){ return function(){ui.showPlayer(person);}; }())});
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


        _([ "bff", "enemy", "rival", "sidekick", "whippingboy", "nemesis", "partner", "mismatch" ]).each( function(s){
            d('p-'+s).innerHTML = player[s].join("/");
        });

        dom.removeChildren(d('badgesbox'));
        _(player.badges).each( function(b){ d('badgesbox').appendChild(m('span',{innerHTML:b})); } );

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