#!/bin/bash

curl http://foosaholics.herokuapp.com/results > foos.json
git push heroku master
sleep 3
curl -XPUT http://foosaholics.herokuapp.com/results --data-binary @foos.json -H "content-type:application/json"
