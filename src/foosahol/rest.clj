(ns foosahol.rest
  (:use compojure.core)
  (:use clojure.data.json)
  (:use [slingshot.slingshot :only [throw+ try+]])
  (:require [compojure.route :as route]))

;; we don't need no stinkin database
(def results (atom []))

(defn body [req]
  (slurp (req :body)))

(defn safe-read-json [s]
  (try
    (read-json s)
    (catch Exception e (throw+ "bad json :("))))

(defn error
  ([msg]
     (println msg)
     {:status 400 :body (json-str {:msg msg}) :headers {"content-type" "application/json"}})
  ([msg cb]
     (println msg)
     (if (nil? cb)
       (error msg)
       {:status 400 :body (str cb "(" (json-str {:msg msg}) ");") :headers {"content-type" "application/json"}})))

(defn success
  ([msg]
     {:status 200
      :body (json-str msg)
      :headers {"content-type" "application/json"}})
  ([msg cb]
     (if (nil? cb)
       (success msg)
       {:status 200
        :body (str cb "(" (json-str msg) ");")
        :headers {"content-type" "application/javascript"}})))


(defn now []
  (System/currentTimeMillis))

(defn merge-meta [result]

  (let [timestamp (get-in result [:meta :timestamp]
                          (get-in result [:timestamp]
                                  (now)))]
    (assoc-in result [:meta :timestamp] timestamp)))

(defn check-format [result]

  (cond

   (not (map? result))
   (throw+ "needs to be a json map")

   (not (and (map? (result :team1))
             (map? (result :team2))))
   (throw+ "needs team1 and team2")

   (not (or (= #{:team1 :team2} (set (keys result)))
            (= #{:team1 :team2 :meta} (set (keys result)))))
            (throw+ "only specify team1, team2 and optionally meta")

            (not (contains? #{#{"black" "yellow"} #{"red" "blue"}}
                            (into #{} [((result :team1) :colour)
                                       ((result :team2) :colour)] )))
            (throw+ "teams must have colours of red/blue or yellow/black")

            (not (and (integer? ((result :team1) :score))
                      (integer? ((result :team2) :score))))
            (throw+ "team1 and team2 must have integer scores")

            (not (or (nil? (result :meta)) (map? (result :meta))))
            (throw+ "if specified, meta must be a map")

            (not (some #{10} (map :score (vals result))))
            (throw+ "one team must have scored ten goals")

            (not (<= 10 (+ ((result :team1) :score) ((result :team2) :score)) 19))
            (throw+ "total score must be between 10 & 19 goals")

            (not (every? true? (map string? [((result :team1) :attacker)
                                             ((result :team1) :defender)
                                             ((result :team2) :attacker)
                                             ((result :team2) :defender)])))
            (throw+ "both teams need an attacker and defender")

            (not= 4 (count (into #{} [((result :team1) :attacker) ((result :team1) :defender)
                                      ((result :team2) :attacker) ((result :team2) :defender)])))
            (throw+ "all players need to be distinct")

            :otherwise (merge-meta result)))

   (defn save-result [r]
     (do
       (swap! results conj r)
       r))

   (defn add-result [body cb]
     (try+
      (-> body
          (safe-read-json)
          (check-format)
          (save-result)
          (success cb))
      (catch string? s
        (error s cb))))

   (defn cb [req]
     ((req :query-params) "callback"))

   (defn delete-result [timestamp]
     (if (nil? timestamp)
       (error "show me the timestamp")
       (swap! results (partial filter #(not= timestamp (str (:timestamp %)))))))

   (defroutes foos-routes
     (GET "/ping" [:as req] (success {:msg "ponk"}))

     (GET  "/dev" [:as req] (json-str (assoc (dissoc req :body) :body (body req))))
     (POST "/dev" [:as req] (json-str (assoc (dissoc req :body) :body (body req))))

     (DELETE "/results" [:as req] (delete-result ((req :query-params) "timestamp")))

     (GET  "/results" [:as req]
           (if (= "POST" ((req :headers) "x-http-method-override"))
             (add-result ((req :query-params) "body") (cb req))
             (success {:results @results} (cb req))))

     (POST "/results" [:as req] (add-result (body req) (cb req)))

     (PUT "/results" [:as req] (let [b (body req)]
                                 (doseq [res (:results (read-json b))]
                                   (add-result (json-str res) nil))
                                 (success @results)))

     (route/files "/" {:root "resources/www-root"})
     (route/not-found "404. Problem?"))
