(defproject foosahol "1.0.0-SNAPSHOT"
  :description "Game for foosaholics"
  :dependencies [[org.clojure/clojure "1.3.0"]
		 [ring/ring-jetty-adapter "1.0.0-RC1"]
		 [ring/ring-devel "1.0.0-RC1"]
		 [compojure "0.6.5"]
		 [org.clojure/data.json "0.1.1"]
		 [hiccup "0.3.7"]]
  :dev-dependencies [[swank-clojure "1.4.0-SNAPSHOT"]]
  :resources-path "resources")