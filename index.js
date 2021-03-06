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
var moment = require('./moment');
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
    // session.attributes.state = 0;
    console.log("HelloWorld onSessionStarted requestId: " + sessionStartedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // session.attributes = {};
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
};

//stages
//1 needs name
//2 needs description
//3 needs start time
//4 needs end time

HelloWorld.prototype.intentHandlers = {
    // register custom intent handlers
    "HelloWorldIntent": function (intent, session, response) {
        response.tellWithCard("Hello World!", "Greeter", "Hello World!");
    },
    "AMAZON.HelpIntent": function (intent, session, response) {
        response.ask("You can say hello to me!", "You can say hello to me!");
    },
    "CreateTaskIntent": function(intent, session, response) {
        session.attributes.stage = 0;
        // session.attributes.taskName = "hey";
        // session.attributes.taskDesc = "a description";
        // createTask(session, function() {
        //     response.tell(getTaskShortDesc(session));                
        // });
        createTaskHandler(intent, session, response);
    },
    "YesIntent": function(intent, session, response) {
        if (session.attributes.stage == 3) {
            //collect end time
            response.ask("Please give a start time.");         
        } else {
            response.ask("You can't do that here");
        }
    },
    "NoIntent": function(intent, session, response) {
        if (session.attributes.stage == 3) {
            //post
            createTask(session, function() {
                response.tell(getTaskShortDesc(session));                
            });
        } else {
            response.ask("You can't do that here");
        }
    },
    "AddEmployeeIntent": function(intent, session, response) {
        addEmployeeHandler(intent, session, response);
    },
    "GetDetailIntent": function(intent, session, response) {
        switch (session.attributes.stage) {
            case 1:
                var name = intent.slots.Detail.value;
                session.attributes.taskName = name;
                session.attributes.stage = 2;
                response.ask("Please give a short description.");
                break;
            case 2:
                var desc = intent.slots.Detail.value;
                session.attributes.taskDesc = desc;
                session.attributes.stage = 3;
                response.ask("Please give a start time.");
                break;
            default:
                response.tell("Please say something correct.");
        }
    },
    "SetTimeIntent": function(intent, session, response) {
        switch (session.attributes.stage) {
            case 3:
                var start = intent.slots.Time.value;
                session.attributes.startTime = start;
                session.attributes.stage = 4;
                response.ask("Please give an end time.");
                break;
            case 4:
                var end = intent.slots.Time.value;
                session.attributes.endTime = end;
                session.attributes.stage = 5;

                createTask(session, function() {
                    response.tell(getTaskShortDesc(session));
                });
                break;
            default:
                response.tell("Please say something correct.");
        }   
    },
    "StatusIntent": function(intent, session, response) {
        request({
            uri: "http://mockbin.org/bin/301a631f-afd1-471b-bfba-8dc77b9affd3",
            method: "GET",
            timeout: 10000,
        }, function(error, res, body) {
            console.log(body);
            console.log(JSON.stringify(res));
            var data = JSON.parse(body);
            est = data["estimated_time"];
            act = data["actual_time"];
            response.tell("So far " + hToStr(act) + " have been completed.  An estimated " + hToStr(est - act) + " remain for a total of time worked of " + hToStr(est) + ".");
        });
    },
    "EmployeeDetailIntent": function(intent, session, response) {
        var lastName = intent.slots.LastName.value;
        var firstName = intent.slots.FirstName.value;
        request({
            uri: "http://epicapi-dev.us-west-2.elasticbeanstalk.com/api/Employees?lastName=" + lastName + "&firstName" + firstName,
            method: "GET",
            timeout: 10000,
        }, function(error, res, body) {
            console.log(body);
            console.log(JSON.stringify(res));

            var data = JSON.parse(body);
            var employee = data[0];

            response.tell(data["FirstName"] + " " + data["LastName"] + " works in " + data["Department"] + " as a " + data["JobTitle"] + ".");
        });
    }
};

function createTask(session, callback) {
    var dataBody = {
        "Title": session.attributes.taskName,
        "Description": session.attributes.taskDesc
    };

    if (session.attributes.startTime) {
        console.log(typeof session.attributes.startTime);
        console.log(JSON.stringify(session.attributes.startTime));
        console.log(typeof session.attributes.endTime);
        console.log(JSON.stringify(session.attributes.endTime));
        console.log(moment(JSON.stringify(session.attributes.startTime), moment.ISO_8601).toISOString());
        console.log(moment(JSON.stringify(session.attributes.endTime), moment.ISO_8601).toISOString());
        console.log(moment(JSON.stringify(session.attributes.startTime)).toISOString());
        console.log(moment(JSON.stringify(session.attributes.endTime)).toISOString());

        dataBody.StartDate = moment(JSON.stringify(session.attributes.startTime), moment.ISO_8601).toISOString();
        dataBody.EndDate = moment(JSON.stringify(session.attributes.endTime), moment.ISO_8601).toISOString();
    }

    request({
        url: "http://epicapi-dev.us-west-2.elasticbeanstalk.com/api/Work?user=c18977cd-e9e2-4bcb-9602-953816bbe9f5",
        method: 'POST',
        json: dataBody
        }, function(err, httpResponse, body) {
            console.log(JSON.stringify(err));
            console.log(JSON.stringify(httpResponse));
            console.log(JSON.stringify(body));
            callback();
    });

}

function getTaskShortDesc(session) {
    var str = "Creating new task";
str += " called " + session.attributes.taskName;
str += " starting " + session.attributes.startTime + ".";
    return str;
}

function hToStr(decHours) {
    var str = "";
    var hours = Math.floor(decHours);
    var minutes = (decHours - hours) * 60
    minutes = Math.floor(minutes);

    if (hours > 0) {
        str += hours + " hours";
    }

    if (minutes > 0) {
        str += ((hours > 0) ? " " : "") + minutes + " minutes";
    }

    return str;
}

function createTaskHandler(intent, session, response) {
    var name = intent.slots.TaskTitle;

    if (name && name.value) {
        response.tell("Making new task called " + name.value);        
    } else {
        session.attributes.stage = 1;
        response.ask("What do you want to call it?");
    }
}

function addEmployeeHandler(intent, session, response) {
    var first = intent.slots.FirstName.value;
    var last = intent.slots.LastName.value;

    var dataBody = {
        "first": first,
        "last": last
    }

    request({
            uri: "http://epicapi-dev.us-west-2.elasticbeanstalk.com/api/employees",
            method: "GET",
            timeout: 10000,
        }, function(error, res, body) {
            console.log(body);
            console.log(JSON.stringify(res));
            response.tell("got " + body);
        });

    // request.post({
    //     url:'http://requestb.in/1em85741',
    //     form: JSON.stringify(dataBody)
    //     }, function(err, httpResponse, body){
    //         response.tell("ok i did it");
    //     });
}


// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    // Create an instance of the HelloWorld skill.
    var helloWorld = new HelloWorld();
    helloWorld.execute(event, context);
};