/**
    Copyright 2014-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.

    Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

        http://aws.amazon.com/apache2.0/

    or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/

/**
 * This simple sample has no external dependencies or session management, and shows the most basic
 * example of how to create a Lambda function for handling Alexa Skill requests.
 *
 * Examples:
 * One-shot model:
 *  User: "Alexa, tell Greeter to say hello"
 *  Alexa: "Hello World!"
 */

/**
 * App ID for the skill
 */
var APP_ID = undefined; //replace with "amzn1.echo-sdk-ams.app.[your-unique-value-here]";

/**
 * The AlexaSkill prototype and helper functions
 */
var AlexaSkill = require('./AlexaSkill');
var http = require('http');
var request = require('./request');
/**
 * HelloWorld is a child of AlexaSkill.
 * To read more about inheritance in JavaScript, see the link below.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Introduction_to_Object-Oriented_JavaScript#Inheritance
 */
var HelloWorld = function () {
    AlexaSkill.call(this, APP_ID);
};

// Extend AlexaSkill
HelloWorld.prototype = Object.create(AlexaSkill.prototype);
HelloWorld.prototype.constructor = HelloWorld;

HelloWorld.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
    console.log("HelloWorld onSessionStarted requestId: " + sessionStartedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any initialization logic goes here
};

HelloWorld.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("HelloWorld onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    var speechOutput = "Welcome to the Alexa Skills Kit, you can say hello";
    var repromptText = "You can say hello";
    response.ask(speechOutput, repromptText);
};

HelloWorld.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("HelloWorld onSessionEnded requestId: " + sessionEndedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any cleanup logic goes here
};


HelloWorld.prototype.intentHandlers = {
    // register custom intent handlers
    "HelloWorldIntent": function (intent, session, response) {
        response.tellWithCard("Hello World!", "Greeter", "Hello World!");
    },
    // "MakeRequestIntent": function(intent, session, response) {
    //     // response.tell("making web request");
    //     var dest = intent.slots.WebSite;

    //     // response.ask("Getting data");
    //     // response.tell("Going to " + dest.value);    
    //     http.get("http://wikipedia.com", function(res) {
    //         var responseData = "";
    //         res.on('data', function (data) {
    //             responseData += data;
    //         });


    //         res.on('end', function () {
    //             // response.tell("got data");
    //             response.tell("got data " + responseData);
    //         });
    //     }).on('error', function (e) {
    //         response.tell("http error");
    //         console.log("Communications error: " + e.message);
    //     });
    // },
    "AMAZON.HelpIntent": function (intent, session, response) {
        response.ask("You can say hello to me!", "You can say hello to me!");
    },
    "MakeTaskIntent": function(intent, session, response) {
        makeTaskHandler(intent, session, response);
    },
    "AddEmployeeIntent": function(intent, session, response) {
        addEmployeeHandler(intent, session, response);
    }
};
function addEmployeeHandler(intent, session, response) {
    // request.post("http://requestb.in/1em85741").form({"hey":"hyea"});
    var first = intent.slots.FirstName.value;
    var last = intent.slots.LastName.value;

    request.post({url:'http://service.com/upload', form: {key:'value'}},
        function(err, httpResponse, body){
            response.tell("hey");
        });
}

function makeTaskHandler(intent, session, response) {
    var name = intent.slots.TaskName.value;
    response.tell("Making new task called " + name);
}


// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    // Create an instance of the HelloWorld skill.
    var helloWorld = new HelloWorld();
    helloWorld.execute(event, context);
};