var results = (function(xhr){

    var d = document;
    var rDiv = d.getElementById("results");

    var createTd = function(cls, content, dbl){
        var td = d.createElement("td");
        td.className = cls;
        td.innerHTML = content;
        if (dbl) td.setAttribute("rowspan", 2);
        return td;
    }

    var showResult = function(r){
        var game = d.createElement("table");
        game.className = "rTable";

        var tr0 = d.createElement("tr");
        var td0 = d.createElement("td");
        td0.className = "rDate";
        td0.innerHTML = new Date(r.meta.timestamp);
        td0.setAttribute("colspan", 5);
        tr0.appendChild(td0);

        var tr1 = d.createElement("tr");
        tr1.appendChild(createTd("rPos", "D"));
        tr1.appendChild(createTd(r.team1.colour, r.team1.defender));
        tr1.appendChild(createTd("rScore", r.team1.score + " - " + r.team2.score, true));
        tr1.appendChild(createTd(r.team2.colour, r.team2.attacker));
        tr1.appendChild(createTd("rPos", "A"));

        var tr2 = d.createElement("tr");
        tr2.appendChild(createTd("rPos", "A"));
        tr2.appendChild(createTd(r.team1.colour, r.team1.attacker));
        // score in here...
        tr2.appendChild(createTd(r.team2.colour, r.team2.defender));
        tr2.appendChild(createTd("rPos", "D"));


        game.appendChild(tr0);
        game.appendChild(tr1);
        game.appendChild(tr2);

        rDiv.insertBefore(game, rDiv.firstChild);
    };

    var showResults = function(results){
        console.log(results);
        rDiv.innerHTML = '';

        _.each(results.results, showResult);
    };

    xhr.get("/results", {ok: showResults});
}(XHR));

console.log(results);
