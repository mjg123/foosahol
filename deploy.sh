#!/bin/bash

curl http://foosaholics.herokuapp.com/results > foos.json
git push heroku master
curl -XPOST http://foosaholics.herokuapp.com/import --data-binary @foos.json -H "content-type:application/json"
