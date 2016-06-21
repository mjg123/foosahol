'use strict'

var players = []
var game_timestamp
var current_score = null
var loser_color // blue or red
var selected = [] // list of the 4 names picked for playing

var score_lookup = {
  'unicorn': 0,
  'phew!': 1,
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9
}

function XHR(){
  var xhr = {}

  xhr.makeXhr = function() {
    try { return new XMLHttpRequest() }
    catch(e) { }
    console.log("XMLHttpRequest not supported")
    return null
  }

  var xhr_query = function(query) {
    return function(url, settings) {
      var xhr = this.makeXhr()

      xhr.open(query, url, true)
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4)
          settings.ok(JSON.parse(xhr.responseText), xhr.status)
      }
      xhr.send(settings.body)
    }
  }

  xhr.get =  xhr_query("GET")
  xhr.post =  xhr_query("POST")

  return xhr
}

function add_player(name, chosen) {
  var cell = $('<td>')

  cell.text(name)
  cell.on('click', select)

  var tbody = $('#players').find('tbody')
  tbody.append($("<tr>").append(cell))

  if (chosen)
    select(null, cell)
}

function populate_players(results) {
  $.each(results, function(index, value) {
    var name
    name = value['team1']['attacker']; if (players.indexOf(name) === -1) players.push(name)
    name = value['team1']['defender']; if (players.indexOf(name) === -1) players.push(name)
    name = value['team2']['attacker']; if (players.indexOf(name) === -1) players.push(name)
    name = value['team2']['defender']; if (players.indexOf(name) === -1) players.push(name)
  })

  players.sort()

  $.each(players, function(index, value) {
    add_player(value, false)
  })

  $('#loading').fadeOut('slow', function() {
    $('#players_table').css({opacity: 0.0})
    $('#players_table').fadeTo('slow', 1.0)
  })
}

function show_button() {
  $("#gogogo").fadeIn()
}

function hide_button() {
  $("#gogogo").fadeOut()
}

function select(evt, cell) {
  if (typeof cell == 'undefined')
    cell = this

  name = $(cell).text()

  var idx = selected.indexOf(name)
  if (idx > -1) {
    selected.splice(idx, 1)
    $(cell).removeClass('btn-primary')
    hide_button()
  } else if (selected.length < 4) {
    $(cell).addClass('btn-primary')
    selected.push(name)
    if (selected.length == 4) {
    show_button()
    }
  }
}

function new_player() {
  var name = prompt("Name")
  if (name !== null) {
    name = $.trim(name)
    if (name !== '')
      add_player(name, true)
  }
}

function show_table(fade) {
  if ((typeof fade === 'undefined') || (fade !== false))
    $('#selection').fadeOut('fast', function() {
      $('#table').css({opacity: 0.1})
      $('#table').fadeTo('fast', 1.0)
    })

  $("#ba").text(selected[0])
  $("#bd").text(selected[1])
  $("#ra").text(selected[2])
  $("#rd").text(selected[3])

  var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0)
  var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)

  var rotate = $('#rotate')
  rotate.offset({
    left: (w-rotate.outerWidth())/2,
    top: (h-rotate.outerHeight())/2
  })
}

function rotate() {
  selected = [selected[3], selected[0], selected[1], selected[2]]
  show_table(false)
}

function results() {
  game_timestamp = new Date().getTime() // when we press Go go go in the blue/red page
  $('.scorevalue').removeClass('selected')
  $('.scorevalue').removeClass('red')
  $('#validate').hide()

  $('#loser').bootstrapSwitch('state', true, true)
  loser_color = "Blue" // default
  current_score = null

  $('#table').fadeOut('fast', function() {
    $('#results').css({opacity: 0.1})
    $('#results').fadeTo('fast', 1.0)
  })
  $('#text-ba').text(selected[0])
  $('#text-bd').text(selected[1])
  $('#text-ra').text(selected[2])
  $('#text-rd').text(selected[3])
  // prevent accidental refresh by swiping down on Android,
  // not a problem because there's a Cancel button :)
  document.body.style.overflowY = 'hidden'
}

function change_color_cb(event, state) {
  // state === true: blue
  // state === fasle: red
  if (state) {
    loser_color = "Blue"
    $(".scorevalue").removeClass("red")
  }
  else {
    loser_color = "Red"
    $(".scorevalue").addClass("red")
  }
  if (current_score !== null)
    ready_to_validate(null, current_score)
}

function ready_to_validate(e, score) {
  if (typeof score == "undefined") {
    current_score = this.innerHTML
    $('.scorevalue').removeClass('selected')
    $(e.toElement).addClass("selected")
  }
  $("#validate").fadeIn()
}

function next_game() {
  $('#results').fadeOut('fast', function() {
    $('#table').css({opacity: 0.1})
    $('#table').fadeTo('fast', 1.0)
  })
  // Allow to refresh the app by swiping-down
  document.body.style.overflowY = 'auto'
}

function validate_and_next_game() {
  console.log(loser_color+" team have lost "+current_score+" to 10")

  var data = {
    team1: {
      colour: "red",
      score: loser_color == "Red" ? score_lookup[current_score] : 10,
      attacker: selected[2],
      defender: selected[3]
    },
    team2: {
      colour: "blue",
      score: loser_color == "Red" ? 10 : score_lookup[current_score],
      attacker: selected[0],
      defender: selected[1]
    },
    meta: {
      timestamp: game_timestamp,
      comments: "",
      rhino: false
    }
  }

  console.log("sending ", data, "to the server")
	XHR.post("/results", {ok: console.log, body: JSON.stringify(data)});

  next_game()
}

function cancel_and_next_game() {
  console.log("not sending any data (game cancelled)")
  next_game()
}

$(document).ready(function() {
  XHR().get("results", {
    ok: function(r,s){ populate_players(r.results) }
  })

  $('.btn.dragdrop').draggable({
    cancel: false,
    connectToSortable: '.container',
    containment: 'document',
    helper: 'clone'
  })

  $(".droppable").droppable({
    drop: function (event, ui) {
      var origin = $(ui.draggable).parent()
      var button = $(this).find('button')
      var idx_dest = selected.indexOf($(button).text())
      var idx_src = selected.indexOf($(ui.draggable).text())

      if (idx_src == -1 || idx_dest == -1)
        return

      // move the buttons labels around
      $(ui.draggable).text(selected[idx_dest])
      button.text(selected[idx_src])

      var tmp = selected[idx_dest]
      selected[idx_dest] = selected[idx_src]
      selected[idx_src] = tmp
    },
    hoverClass: 'dropping'
  })

  $('#loser').bootstrapSwitch()

  // Jquery handlers
  $("#gogogo").on("click", show_table)
  $('#new-player').on('click', new_player)
  $('#rotate').on('click', rotate)
  $('#startgame').on('click', results)
  $('#loser').on('switchChange.bootstrapSwitch', change_color_cb)
  $('.scorevalue').on('click', ready_to_validate)
  $('#validate').on('click', validate_and_next_game)
  $('#cancel-game').on('click', cancel_and_next_game)
})
