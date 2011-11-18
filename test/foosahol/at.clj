(ns foosahol.at
  (:use midje.sweet)
  (:use clojure.data.json)
  (:require [foosahol.rest-driver :as drv]))

(drv/set-base-url! "http://localhost:8080")

(def BAD-REQUEST 400)

(defn body [o]
  (drv/body (json-str o) "application/json"))

(def g {:team1 {:attacker "aaa" :defender "bbb" :score 10 :colour "red"}
        :team2 {:attacker "ccc" :defender "ddd" :score 0  :colour "blue"}
        :meta {:yep "yep"}})

(defn dissoc-in [ data keys val ]
  (assoc-in data keys (dissoc (get-in data keys) val)))

(facts
 "ATs"

 (fact (:body (drv/GET "/ping")) => (json-str {:msg "ponk"}))

 (fact (:status (drv/POST "/results")) => BAD-REQUEST)

 (fact (:status (drv/POST "/results" (body {}))) => BAD-REQUEST)
 (fact (:status (drv/POST "/results" (body {:team1 "no" :team2 "no"}))) => BAD-REQUEST)

 (fact (:status (drv/POST "/results" (body (assoc-in g [:NO] "no")))) => BAD-REQUEST)
 (fact (:status (drv/POST "/results" (body (assoc-in g [:team1 :colour] "yellow")))) => BAD-REQUEST)
 (fact (:status (drv/POST "/results" (body (assoc-in g [:team1 :score] "banana")))) => BAD-REQUEST)
 (fact (:status (drv/POST "/results" (body (assoc-in g [:meta] "banana")))) => BAD-REQUEST)
 (fact (:status (drv/POST "/results" (body (assoc-in g [:team1 :attacker] nil)))) => BAD-REQUEST)
 (fact (:status (drv/POST "/results" (body (assoc-in g [:team1 :score] 9)))) => BAD-REQUEST)
 (fact (:status (drv/POST "/results" (body (assoc-in g [:team2 :score] 10)))) => BAD-REQUEST)

 (let [ok-response (drv/POST "/results" (body g))]
   (fact (:status ok-response) => 200)
   (fact (get-in (read-json ok-response) [:body :meta :timestamp]) => #(not (nil? %)))
   (fact (dissoc-in (read-json (:body ok-response)) [:meta] :timestamp) => g)
   
   (drv/DELETE (str "/results?timestamp="  (get-in (read-json (:body ok-response)) [:meta :timestamp]))))

 (fact (:results (read-json (:body (drv/GET "/results")))) => [])
 
 )