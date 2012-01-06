/*jslint indent: 4, nomen: false, maxerr: 50 */
/*globals _,document,alert,DOM,XHR*/

var RESULTS = (function () { 
    'use strict';
    
    var data = {},
        results = {};

    results.setData = function (d) {
        data = d;
    };

    results.getData = function () {
        return data;
    };

    results.getAllResults = function () {
        return data.results;
    };

    return results;
}());

var LEAGUE = (function () {
    'use strict';

    var league = {},

        isTeam1 = function (n, g) {
            return g.team1.attacker === n || g.team1.defender === n;
        },

        isTeam2 = function (n, g) {
            return g.team2.attacker === n || g.team2.defender === n;
        },

        played = function (n, g) {
            return isTeam1(n, g) || isTeam2(n, g);
        },

        won = function (n, g) {
            if (isTeam1(n, g)) { return g.team1.score === 10; }
            if (isTeam2(n, g)) { return g.team2.score === 10; }
            return false;
        },

        lost = function (n, g) {
            if (isTeam1(n, g)) { return g.team1.score !== 10; }
            if (isTeam2(n, g)) { return g.team2.score !== 10; }
            return false;
        },

        goalsFor = function (n, g) {
            if (isTeam1(n, g)) { return g.team1.score; }
            if (isTeam2(n, g)) { return g.team2.score; }
            return 0;
        },

        goalsAgainst = function (n, g) {
            if (isTeam1(n, g)) { return g.team2.score; }
            if (isTeam2(n, g)) { return g.team1.score; }
            return 0;
        },

        oppositeTeams = function (n1, n2, g) {
            if (isTeam1(n1, g) && isTeam2(n2, g)) { return true; }
            if (isTeam2(n1, g) && isTeam1(n2, g)) { return true; }
            return false;
        },

        getTeamPeople = function (p, val) {
            var max = _(p.team).pluck(val)
                      .reduce(function (m, n) { return Math.max(m, n); }, 0);
            return _(p.team).keys().filter(function (k) { return p.team[k][val] === max; });
        },

        addStreaks = function (players) {
            _(players).each(function (p) {
                var b = 0, w = 0, c = 0, grouped = [], currentGroup = [];

                _(p.form).each(function (res) {
                    if (currentGroup.length === 0 || currentGroup[0] === res) {
                        currentGroup.push(res);
                    } else {
                        grouped.push(currentGroup);
                        currentGroup = [res];
                    }
                });

                grouped.push(currentGroup);

                p.streak = {};
                p.streak.best = _(grouped).chain()
                    .filter(function (g) { return g[0] === "W"; })
                    .map(function (g) { return g.length; })
                    .max().value();
                p.streak.worst = _(grouped).chain()
                    .filter(function (g) { return g[0] === "L"; })
                    .map(function (g) { return g.length; })
                    .max().value() * -1;
                p.streak.current = grouped.slice(-1)[0].length * (grouped.slice(-1)[0][0] === "W" ? 1 : -1);

                if (p.streak.worst === Infinity) {
                    p.streak.worst = "N/A";
                }

                if (p.streak.best === -Infinity) {
                    p.streak.best = "N/A";
                }
            });
        },

        addBadges = function (players, games) {

            var maxP = _(players).chain().pluck('P').max().value(),
                minP = _(players).chain().pluck('P').min().value(),
                WRorder, 
                curr, 
                prev,
                maxBrink,
                maxImpr,
                minImpr;

            _(players).chain().keys().filter(function (k) { return players[k].P === maxP; })
                .each(function (p) { players[p].badges.push("KEENER"); });

            _(players).chain().keys().filter(function (k) { return players[k].P === minP; })
                .each(function (p) { players[p].badges.push("SLACKER"); });

            WRorder = _(players).chain()
                .sortBy(function (p) { return -p.hist.WR.slice(-1)[0]; }).pluck('name').value();

            players[WRorder[0]].badges.push("GOLD MEDAL");
            players[WRorder[1]].badges.push("SILVER MEDAL");
            players[WRorder.slice(-1)[0]].badges.push("WOODEN SPOON");

            _(players).each(function (p) {
                if (p.P < 10) { p.badges.push("NEWB"); }

                if (p.P >= 10) { p.badges.push("DECENARIAN"); }
                if (p.W >= 10) { p.badges.push("DEC+"); }
                if (p.L >= 10) { p.badges.push("DEC-"); }

                if (p.P >= 100) { p.badges.push("CENTURION"); }
                if (p.W >= 100) { p.badges.push("CENT+"); }
                if (p.L >= 100) { p.badges.push("CENT-"); }

                if (p.streak.best === p.streak.current) { p.badges.push("WINNING!"); }
                if (p.streak.worst === p.streak.current) { p.badges.push("LOSING!"); }

                curr = p.hist.WR.length - 1;
                prev = Math.max(p.hist.WR.length - 6, 0);
                p.improvement = p.hist.WR[curr] / p.hist.WR[prev];

                p.brink = { P : 0, W : 0, L : 0 };
                _(games).each(function (g) {
                    var totalScore = g.team1.score + g.team2.score;
                    if (totalScore === 10 && won(p.name, g)) { p.badges.push("UNICORN"); }
                    if (totalScore === 10 && lost(p.name, g)) { p.badges.push("UNICORNED"); }
                    if (totalScore === 11 && lost(p.name, g)) { p.badges.push("PHEW!"); }
                    if (totalScore === 19 && won(p.name, g)) { p.brink.P += 1; p.brink.W += 1; }
                    if (totalScore === 19 && lost(p.name, g)) { p.brink.P += 1; p.brink.L += 1; }
                    if (g.meta.rhino && won(p.name, g)) { p.badges.push("RHINO!"); }
                    if (g.meta.rhino && lost(p.name, g)) { p.badges.push("RHINOED!"); }
                });
	    
                if (p.brink.P > 0) {
                    if (p.brink.W / p.brink.P > 0.6) { p.badges.push("STEADY NERVE"); }
                    if (p.brink.W / p.brink.P < 0.4) { p.badges.push("CRUMBLES"); }
                }

            });

            maxBrink = _(players).chain().map(function (p) { return p.brink.P; }).max().value();
            _(players).chain().keys().filter(function (k) { return players[k].brink.P === maxBrink; })
                .each(function (p) { players[p].badges.push("BRINKSMAN"); });

            maxImpr = _(players).chain().pluck('improvement').max().value();
            _(players).chain().keys().filter(function (k) { return players[k].improvement === maxImpr; })
                .each(function (p) { players[p].badges.push("IMPROVING"); });

            minImpr = _(players).chain().pluck('improvement').min().value();
            _(players).chain().keys().filter(function (k) { return players[k].improvement === minImpr; })
                .each(function (p) { players[p].badges.push("COLLAPSING"); });


        };

    league.getPeople = function (data) {
        var names =  _(data).chain()
            .map(function (g) { return [g.team1.attacker, g.team1.defender, g.team2.attacker, g.team2.defender]; })
            .flatten().uniq().value(),

            players = {};

        if (names.length === 0) {
            return;
        }

        _(names).each(function (n) {
            var r = { P : 0, W : 0, L : 0, GF : 0, GA : 0, GDPG : 0,
                form : [], team : {}, badges : [],
                hist : {W : [], L : [], WR : []}};

            r.name = n;

            _(data).chain().sortBy(function (g) { return g.meta.timestamp; })
                .each(function (g) {

                    if (played(n, g)) {
                        r.P += 1;
                        r.GF += goalsFor(n, g);
                        r.GA += goalsAgainst(n, g);
                        if (won(n, g)) { r.W += 1; r.form.push('W'); }
                        if (lost(n, g)) { r.L += 1; r.form.push('L'); }

                        r.hist.WR.push(Math.ceil(r.W * 100 / r.P));
                        r.hist.W.push(r.W);
                        r.hist.L.push(r.L);

                        _(names).chain().reject(function (on) { return n === on; })
                            .each(function (on) {
                        
                                r.team[on] = r.team[on] || 
                                    { bff : 0, enemy : 0, rival : 0, sidekick : 0,
                                        whippingboy : 0, nemesis : 0, partner : 0, mismatch : 0 };

                                if (played(on, g)) {
                                    r.team[on].bff += 1;
                                    if (oppositeTeams(n, on, g)) {
                                        r.team[on].rival += 1;
                                        if (won(n, g)) {
                                            r.team[on].whippingboy += 1;
                                        } else {
                                            r.team[on].nemesis += 1;
                                        }
                                    } else {
                                        r.team[on].sidekick += 1;
                                        if (won(n, g)) {
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
            _(names).chain().reject(function (on) { return n === on; }).each(function (on) {
                if (r.team[on].rival > 0) {
                    r.team[on].whippingboy /= r.team[on].rival;
                    r.team[on].nemesis     /= r.team[on].rival;
                }
                if (r.team[on].sidekick > 0) {
                    r.team[on].partner     /= r.team[on].sidekick;
                    r.team[on].mismatch    /= r.team[on].sidekick;
                }
            });

            if (r.P > 0) {
                r.WR = r.W * 100 / r.P;
                r.LR = r.L * 100 / r.P;
                r.GDPG = (r.GF - r.GA) / r.P;

                _([ "bff", "enemy", "rival", "sidekick", "whippingboy", "nemesis", "partner", "mismatch" ])
                    .each(function (s) {
                        r[s] = getTeamPeople(r, s);
                    });
            }

            players[n] = r;
        });

        addStreaks(players);
        addBadges(players, data);

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
        "STEADY NERVE": "Wins >60% of golden-goal games",
        "CRUMBLES": "Loses >60% of golden-goal games",
        "BRINKSMAN": "Takes it to golden-goal more than anyone else",
        "RHINO!": "Ten goals in a row.  Pretty damn special if you ask me",
        "RHINOED!": "Doh the huge manatee - you got panned!"
    };

    return league;

}());

var UI = (function (league, dom, results) {
    'use strict';

    var ui = {},
        groupedBadges = {},
        m = dom.m, 
        d = dom.d,
 
        spark = function (data) {
            return "https://chart.googleapis.com/chart?chs=100x30" +
                "&cht=lc" +
                "&chco=336699" +
                "&chls=1,1,0" +
                "&chxl=0:|" + data[data.length - 1] + "|1:||2:||" +
                "&chxp=0," + data[data.length - 1] +
                "&chxt=r,x,y" +
                "&chxs=0,990000,11,0,_|1,990000,1,0,_|2,990000,1,0,_" +
                "&chm=o,990000,0," + data.length + ",4" +
                "&chd=t:" + data.join();
        },

        makeScoreDist = function (dist) {
            return "https://chart.googleapis.com/chart?cht=bvs&chs=270x80" +
                "&chd=t:" + dist.join() + 
                "&chco=336699" +
                "&chbh=20" +
                "&chds=0," + _(dist).max() +
                "&chxt=x&chxl=0:|U|1|2|3|4|5|6|7|8|GG";
        },

        makeTimeDist = function (res) {
            var d, h, 
                xs = [], ys = [], ss = [],
                maxS = 0,

                dist = _(res).reduce(function (dist, g) {
                    var d = new Date(g.meta.timestamp);
                    dist[d.getDay()] = dist[d.getDay()] || [];
                    dist[d.getDay()][d.getHours()] = dist[d.getDay()][d.getHours()] || 0;
                    dist[d.getDay()][d.getHours()] += 1;
                    return dist;
                }, []);

            for (d = 0; d < 7; d += 1) {
                for (h = 0; h < 24; h += 1) {
                    if (dist[d] && dist[d][h]) {
                        xs.push(h * 4);
                        ys.push(86 - (d * 14));
                        ss.push(dist[d][h]);
                        maxS = Math.max(maxS, dist[d][h]);
                    }
                }
            }

            return "https://chart.googleapis.com/chart?cht=s" +
                "&chd=t:" + xs.join() + "|" + ys.join() + "|" + _(ss).map(function (v) { return v * 100 / maxS; }).join() + 
                "&chxt=x,y" +
                "&chco=336699" +
                "&chxr=0,0,24,6" +
                "&chxl=1:||Fri||Wed||Mon|" + 
                "&chs=270x80";
        };

    ui.showSummaryBar = function (res) {

        d('totalgames').innerHTML = res.length;

        d('totalgoals').innerHTML = _(res).reduce(function (sum, g) {
            return sum + g.team1.score + g.team2.score; 
        }, 0);


        var scoreDist = _(res).reduce(function (counts, g) {
            counts[g.team1.score + g.team2.score - 10] += 1;
            return counts;
        }, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

        d('scoredist').appendChild(m('img', {src: makeScoreDist(scoreDist)}));
        d('timedist').appendChild(m('img', {src: makeTimeDist(res)}));

    };

    ui.showPlayer = function (player) {
//        console.log(player);

        d('p-name').innerHTML = player.name;

        var prev = Math.max(player.P - 6, 0),
            makeHist = function (v, old) {
                return m('div', {children: [m('span', {innerHTML: v}), m('span', {innerHTML: "(" + old + ")"})]});
            },
            formWin = "<span class=\"form-win\">&#x2580;</span>",
            formLoss = "<span class=\"form-loss\">&#x2584;</span>";

        d('p-played').innerHTML = player.P;
        d('p-won').innerHTML = player.W;
        d('p-lost').innerHTML = player.L;

        d('p-form').innerHTML = player.form.slice(-16).join("")
            .replace(/W/g, formWin)
            .replace(/L/g, formLoss);

        d('p-best-streak').innerHTML = player.streak.best;
        d('p-worst-streak').innerHTML = player.streak.worst;
        d('p-current-streak').innerHTML = player.streak.current;

        _([ "bff", "enemy", "rival", "sidekick", "whippingboy", "nemesis", "partner", "mismatch" ])
            .each(function (s) {
                d('p-' + s).innerHTML = player[s].join("/");
            });

        dom.removeChildren(d('badgesbox'));

        groupedBadges = _(player.badges).reduce(function (counts, b) {
            counts[b] = (counts[b] || 0) + 1;
            return counts;
        }, {});
	
        _(groupedBadges).each(function (count, badge) {
            var classname = "badge",
                badgetext = badge;

            if (badge === "UNICORN") { classname += " rainbow"; }
            if (count > 1) { badgetext += " &times;" + count; }
	    
            d('badgesbox').appendChild(m('span', 
                {innerHTML: badgetext, title: league.badges[badge], className: classname})); 
        });
	
    };

    ui.showResults = function (res) {
        var sortedPeople =  _(league.getPeople(res)).chain()
            .sortBy(function (p) { return -p.GDPG; })
            .sortBy(function (p) { return -p.WR; })
            .value();

        ui.showSummaryBar(res);

        _(sortedPeople).each(function (person) {
            var row = m('tr', {onclick: (function () { return function () { ui.showPlayer(person); }; }()), className: "leaguerow"});

            row.appendChild(m('td', {innerHTML: person.name}));
            row.appendChild(m('td', {innerHTML: person.P}));
            row.appendChild(m('td', {innerHTML: person.W}));
            row.appendChild(m('td', {innerHTML: person.L}));
            row.appendChild(m('td', { children: [m('img', {src: spark(person.hist.WR), alt: person.WR.toFixed(0)})] }));
            row.appendChild(m('td', {innerHTML: person.GF}));
            row.appendChild(m('td', {innerHTML: person.GA}));
            row.appendChild(m('td', {innerHTML: person.GDPG.toFixed(2)}));
            row.appendChild(m('td', {innerHTML: person.badges.length}));

            d('leaguetable').appendChild(row);
        });

        ui.showPlayer(sortedPeople[0]);

    };

    ui.clearShown = function () {
        var table = d('leaguetable');

        dom.removeChildren(d('scoredist'));
        dom.removeChildren(d('timedist'));

        while (document.getElementsByClassName('leaguerow').length !== 0) {
            table.removeChild(document.getElementsByClassName('leaguerow')[0]);
        }

        d('time-all').className = "timeselect";
        d('time-week').className = "timeselect";
        d('time-month').className = "timeselect";
    };

    ui.showTimeRange = function (from, to) {
        ui.clearShown();
        d('fromtime').innerHTML = new Date(from).toDateString();
        d('totime').innerHTML = new Date(to).toDateString();
        ui.showResults(_(results.getAllResults()).filter(function (g) { return g.meta.timestamp >= from && g.meta.timestamp <= to; }));
    };

    ui.showAllResults = function () {
        var data = results.getData();
        ui.showTimeRange(data.results.slice(-1)[0].meta.timestamp, data.timestamp);
        d('time-all').className += " selected";
    };

    ui.showMonth = function () {
        var now = results.getData().timestamp,
            month = new Date(now).getMonth(),
            year = new Date(now).getFullYear(),
            from = new Date(year, month, 1, 0, 0, 0, 0),
            to = new Date(year, month + 1, 1, 0, 0, -1, 0);

        ui.showTimeRange(from.getTime(), to.getTime());
        d('time-month').className += " selected";
    };

    ui.showWeek = function () {
        var now = new Date(results.getData().timestamp),
            midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime(),
            weekStart = midnight - (now.getDay() - 1) * 86400000,
            weekEnd = weekStart + 7 * 86400000 - 1;

        ui.showTimeRange(weekStart, weekEnd);
        d('time-week').className += " selected";
    };

    d('time-all').onclick = ui.showAllResults;
    d('time-month').onclick = ui.showMonth;
    d('time-week').onclick = ui.showWeek;

    return ui;
}(LEAGUE, DOM, RESULTS));


(function (xhr, league, ui, results) {
    'use strict';

    xhr.get("/results", {ok: function (d) {
        results.setData(d);
        ui.showMonth();
    }});

}(XHR, LEAGUE, UI, RESULTS));