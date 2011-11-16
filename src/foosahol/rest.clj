(ns foosahol.rest
  (:use compojure.core)
  (:require [compojure.route :as route]))

(defroutes foos-routes
  (GET "/ping" [:as req] "ponk")
  (route/files "/" {:root "resources/www-root"})
  (route/not-found "404. Problem?"))

