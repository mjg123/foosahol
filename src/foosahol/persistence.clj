(ns foosahol.persistence
  (:use [somnium.congomongo]))


;; copied from http://thecomputersarewinning.com/post/clojure-heroku-noir-mongo
(defn- split-mongo-url
  "Parses mongodb url from heroku, eg. mongodb://user:pass@localhost:1234/db"
  [url]
  (when url
    (let [matcher (re-matcher #"^.*://(.*?):(.*?)@(.*?):(\d+)/(.*)$" url)]
      (when (.find matcher)
        (zipmap [:match :user :pass :host :port :db] (re-groups matcher))))))

(comment
  "export MONGOHQ_URL=mongodb://foos:foos@localhost:27017/app1793512")

;; TODO: use protocols!

(defn setup-mongo-persistence [config]
  (println "MONGO: " (str config))
  (mongo! :db (:db config) :host (:host config) :port (Integer. (:port config)))
  (authenticate (:user config) (:pass config))


  ;;;;; PROTOCOL STUFF ;;;;;;;;
  
  (defn delete-result [timestamp]
    (fetch-and-modify :results
		      {:meta.timestamp (Long. timestamp)}
		      {}
		      :remove? true))
  
  (defn save-result [result]
    (insert! :results result)
    result)
  
  (defn all-results []
    {:results (map #(dissoc % :_id) (fetch :results :sort {:meta.timestamp -1}))})

  (defn reset-results []
    (drop-coll! :results))

  ;;;;;;;; END PROTOCOL ;;;;;;;;
  )

(defn setup-inmemory-persistence []
  (println "IN MEMORY")

  (def results (atom []))

  ;;;;; PROTOCOL STUFF ;;;;;;;;
  
  (defn delete-result [timestamp]
    (swap! results (partial filter #(not= timestamp (str (get-in % [:meta :timestamp]))))))

  (defn save-result [result]
    (do (swap! results conj result)
	result))

  (defn all-results []
    {:results @results})

  (defn reset-results []
    (reset! results []))

  ;;;;; END PROTOCOL ;;;;;;;;
  )

(if-let [config (split-mongo-url (System/getenv "MONGOHQ_URL"))]
  (setup-mongo-persistence config)
  (setup-inmemory-persistence))


