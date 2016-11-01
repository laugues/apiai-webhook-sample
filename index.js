'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const request = require("request");


const app = express();
app.use(bodyParser.json());

app.post('/hook', function (req, res) {

        console.log('hook request');

        try {
            var speech = 'empty speech';


            var body = req.body;

            if (typeof body == 'undefined' || body == null || body === '') {
                console.log('Body of request is not defined or null');
                return {};
            }

            var action = body.result.action;
            if (action !== 'yahooWeatherForecast') {
                console.log('Action [' + body.result.action + '] is unknown... ');
                return {};
            } else {

                var city = body.result.parameters['geo-city'];
                console.log('Getting wether of city [' + city + ']');
                var weatherParam = 'select * from weather.forecast where woeid in (select woeid from geo.places(1) where text="' + city + '")';

                var options = {
                    uri: 'https://query.yahooapis.com/v1/public/yql',
                    qs: {'q': weatherParam, 'format': 'json'}
                };

                request(options, function (err, response, body) {
                    if (err) {
                        console.log(err);
                        return;
                    }
                    console.log("Get Status response: " + response.statusCode);
                    console.log("Get Body response: " + body);
                    body = JSON.parse(body);
                    var query = body.query;
                    console.log("query: " + query);
                    if (typeof query == 'undefined') {
                        return {};
                    }

                    var results = query.results;
                    if (typeof results == 'undefined') {
                        return {};
                    }

                    var channel = results.channel;
                    if (typeof channel == 'undefined') {
                        return {};
                    }

                    var item = channel.item;
                    var location = channel.location;
                    var units = channel.units;
                    if (typeof item == 'undefined' || typeof location == 'undefined' || typeof units == 'undefined') {
                        return {};
                    }

                    var condition = item.condition;
                    if (typeof condition == 'undefined') {
                        return {};
                    }
                    speech = "Today in " + location.city + ": " + condition.text + ", the temperature is " + condition.temp + " " + units.temperature;
                    console.log('result: ', speech);

                    res.json({
                        speech: speech,
                        displayText: speech,
                        source: 'apiai-webhook-sample'
                    });
                });
            }


        }
        catch
            (err) {
            console.error("Can't process request", err);

            res.status(400).json({
                status: {
                    code: 400,
                    errorType: err.message
                }
            });
        }
    }
);

app.listen((process.env.PORT || 5000), function () {
    console.log("Server listening");
});