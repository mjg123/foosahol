(defproject foosahol "1.0.0-SNAPSHOT"
  :description "Game for foosaholics"
  :dependencies [[org.clojure/clojure "1.3.0"]
                 [ring/ring-jetty-adapter "1.0.0-RC1"]
                 [ring/ring-devel "1.0.0-RC1"]
                 [compojure "0.6.5"]
                 [org.clojure/data.json "0.1.1"]
                 [hiccup "0.3.7"]
                 [slingshot "0.8.0"]
		 [congomongo "0.1.7-SNAPSHOT"]]
  :dev-dependencies [[swank-clojure "1.4.0-SNAPSHOT"]
                     [lein-midje "1.0.4"]
                     [com.github.rest-driver/rest-server-driver "1.1.15"]
                     [midje "1.3-alpha5"]]
  :resources-path "resources")