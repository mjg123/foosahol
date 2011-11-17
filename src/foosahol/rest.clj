(ns foosahol.rest
  (:use compojure.core)
  (:use clojure.data.json)
  (:require [compojure.route :as route]))

(def results (atom []))

(defn body [req]
  (slurp (req :body)))

(defn l* [o] [o nil])
(defn r* [o] [nil o])

(defn safe-read-json [s]
  (try
    (r* (read-json s))
    (catch Exception e (l* "bad json :("))))

(defn error
  ([msg]
     {:status 400 :body (json-str {:msg msg}) :headers {"content-type" "application/json"}})
  ([msg cb]
     (if (nil? cb)
       (error msg)
       {:status 400 :body (str cb "(" (json-str {:msg msg}) ")") :headers {"content-type" "application/json"}})))

(defn success
  ([msg]
     {:status 200
      :body (json-str msg)
      :headers {"content-type" "application/json"}})
  ([msg cb]
     (if (nil? cb)
       (success msg)
       {:status 200
	:body (str cb "(" (json-str msg) ")")
	:headers {"content-type" "application/javascript"}})))


(defn now []
  (System/currentTimeMillis))

(defn check-format [[l result]]
  (if l
    (l* l)

    (cond

     (not (map? result))
     (l* "needs to be a json map")
     
     (not (and (map? (result :team1))
	       (map? (result :team2))))
     (l* "needs team1 and team2")

     (not= 2 (count result))
     (l* "only 2 teams please")
     
     (not (contains? #{#{"black" "yellow"} #{"red" "blue"}}
		     (set (map :colour (vals result)))))
     (l* "teams must have colours of red/blue or yellow/black")

     (not (and (integer? ((result :team1) :score))
	       (integer? ((result :team2) :score))))
     (l* "team1 and team2 must have integer scores")
     
     (not (some #{10} (map :score (vals result))))
     (l* "one team must have scored ten goals")

     (not (<= 10 (+ ((result :team1) :score) ((result :team2) :score)) 19))
     (l* "total score must be between 10 & 19 goals")

     (not (every? true? (map string? [((result :team1) :attacker)
				      ((result :team1) :defender)
				      ((result :team2) :attacker)
				      ((result :team2) :defender)])))
     (l* "both teams need an attacker and defender")

     (not= 4 (count (into #{} [((result :team1) :attacker) ((result :team1) :defender)
		               ((result :team2) :attacker) ((result :team2) :defender)])))
     (l* "all players need to be distinct")
     
     :else (r* (assoc result :timestamp (now))))))

(comment
  (check-format [nil
		 {:team1 {:colour "red" :score 10 :attacker "a" :defender "b"}
		  :team2 {:colour "blue" :score 0 :attacker "e" :defender "f"}}]))

(defn save-result [[l r]]
  (if l
    (l* l)
    (do
      (swap! results conj r)
      (r* r))))

(defn add-result [body cb]
  (let [[err res]
	(-> body
	    (safe-read-json)
	    (check-format)
	    (save-result))]
    (if err
      (error err cb)
      (success res cb))))

(defn cb [req]
  ((req :query-params) "callback"))

(defroutes foos-routes
  (GET "/ping" [:as req] (success {:msg "ponk"}))

  (GET "/dev" [:as req] (json-str (assoc (dissoc req :body) :body (body req))))
  
  (GET  "/results" [:as req]
	(if (= "POST" ((req :headers) "x-http-method-override"))
	  (add-result ((req :query-params) "body") (cb req))
	  (success {:results @results} (cb req))))

  (POST "/results" [:as req] (add-result (body req) (cb req)))
  
  (route/files "/" {:root "resources/www-root"})
  (route/not-found "404. Problem?"))

