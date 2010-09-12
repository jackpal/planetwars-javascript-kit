Google AI Challenge Planet Wars JavaScript Starter Kit

This is a starter kit for the JavaScript programming language.

Step One: Install Node

This kit is based on the Node.js JavaScript runtime environment. To use it
you must install Node.js. Node.js runs on Unix, Mac, and Windows systems.

Installing node.js on Ubuntu Server 8.04 Server x86

	sudo apt-get install curl make g++ libssl-dev
	curl http://nodejs.org/dist/node-v0.2.1.tar.gz -O
	tar xvfz node-v0.2.1.tar.gz
	cd node-v0.2.1
	./configure
	make
	sudo make install

For other systems, please start with http://nodejs.org/#build , or do a
web search for something like "build node.js osx" or "build node.js windows".

NOTE: The contest node server is using node version v0.2.1. If you use
a different version of node.js you may run into problems due to different APIs.

Step Two: Run a test

The "MyBot.js" bot is the sample JavaScript bot.
    
In order to run it in a competition on your local server,
type the following:

	java -jar tools/PlayGame-1.2.jar maps/map7.txt 1000 1000 log.txt \
	  "java -jar example_bots/RandomBot.jar" "node MyBot.js" \
	  | java -jar tools/ShowGame.jar

(That's should be entered as one long line. It's just wrapped to make it readable)

Good Luck!
