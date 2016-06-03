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

    var makeResult = function(r){
        var game = d.createElement("table");
        game.className = "rTable";

        var tr0 = d.createElement("tr");
        var td0 = d.createElement("td");
        td0.className = "rDate";
        td0.innerHTML = new Date(r.meta.timestamp).toLocaleTimeString();
        td0.setAttribute("colspan", 5);
        tr0.appendChild(td0);

        if (r.team1.score == 10) {
          winner = r.team1
          loser = r.team2
        } else {
          winner = r.team2
          loser = r.team1
        }

        var tr1 = d.createElement("tr");
        tr1.appendChild(createTd("rPos", "D"));
        tr1.appendChild(createTd(winner.colour, winner.defender));
        tr1.appendChild(createTd("rScore", winner.score + " - " + loser.score, true));
        tr1.appendChild(createTd(loser.colour, loser.attacker));
        tr1.appendChild(createTd("rPos", "A"));

        var tr2 = d.createElement("tr");
        tr2.appendChild(createTd("rPos", "A"));
        tr2.appendChild(createTd(winner.colour, winner.attacker));
        // score in here...
        tr2.appendChild(createTd(loser.colour, loser.defender));
        tr2.appendChild(createTd("rPos", "D"));

        game.appendChild(tr0);
        game.appendChild(tr1);
        game.appendChild(tr2);

        return game;
    };

    var days = [":(", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    var dayOf = function(result){
        var d = new Date(result.meta.timestamp);
        return days[d.getDay()] + " " + d.getDate() +" "+ months[d.getMonth()] + " " + (d.getYear()+1900);
    }

    var newDayDiv = function(result){
        var dayDiv = d.createElement("div");
        dayDiv.className = "dayDiv";
        var dayHeader = d.createElement("h2");
        dayHeader.innerHTML = dayOf(result);
        dayHeader.className = "dayHeader";
        dayDiv.appendChild(dayHeader);
        return dayDiv;
    }

    var showResults = function(results){
        console.log(results);
        rDiv.innerHTML = '';

        currentDayDiv = newDayDiv(results.results[0]);
        previousDay = dayOf(results.results[0]);

        for (i=0; i<results.results.length; i++){
            var thisRes = results.results[i];
            if (dayOf(thisRes)!=previousDay){
                rDiv.appendChild(currentDayDiv);
                currentDayDiv = newDayDiv(thisRes);
                previousDay = dayOf(thisRes);
            }
            currentDayDiv.appendChild(makeResult(results.results[i]));
        }

        rDiv.appendChild(currentDayDiv);

    };

    xhr.get("/results", {ok: showResults});
}(XHR));

console.log(results);
