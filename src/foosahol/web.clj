(ns foosahol.web
  (:use ring.adapter.jetty)
  (:use ring.middleware.stacktrace)
  (:require [foosahol.rest :as rest]
	    [compojure.handler :as handler]))

(def app
  (->
    (handler/site rest/foos-routes)
    (wrap-stacktrace)))

(defn -main []
  (let [port (Integer/parseInt (get (System/getenv) "PORT" "8080"))]
    (run-jetty app {:port port})))