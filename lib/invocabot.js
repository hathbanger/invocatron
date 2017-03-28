'use strict';

var util = require('util');
var path = require('path');
var fs = require('fs');
var request = require('request');
var SQLite = require('sqlite3').verbose();
var Bot = require('slackbots');
var oauth = process.env.BOT_API_KEY || require('../oauth');

/**
 * Constructor function. It accepts a settings object which should contain the following keys:
 *      token : the API token of the bot (mandatory)
 *      name : the name of the bot (will default to "invocabot")
 *      dbPath : the path to access the database (will default to "data/norrisbot.db")
 *
 * @param {object} settings
 * @constructor
 *
 * @author Andrew Hathaway
 */
var InvocaBot = function Constructor(settings) {
    this.settings = settings;
    this.settings.name = this.settings.name || 'invocabot';
    this.dbPath = settings.dbPath || path.resolve(__dirname, '..', 'data', 'invocabot.db');

    this.user = null;
    this.db = null;
};

// inherits methods and properties from the Bot constructor
util.inherits(InvocaBot, Bot);

/**
 * Run the bot
 * @public
 */
InvocaBot.prototype.run = function () {
    InvocaBot.super_.call(this, this.settings);

    this.on('start', this._onStart);
    this.on('message', this._onMessage);
};

/**
 * On Start callback, called when the bot connects to the Slack server and access the channel
 * @private
 */
InvocaBot.prototype._onStart = function () {
    this._loadBotUser();
    this._connectDb();
    this._firstRunCheck();
};

/**
 * On message callback, called when a message (of any type) is detected with the real time messaging API
 * @param {object} message
 * @private
 */
InvocaBot.prototype._onMessage = function (message) {
	// console.log('message:', message);
    if (this._isChatMessage(message) &&
        this._isChannelConversation(message) &&
        !this._isFromInvocaBot(message) 
        &&
        this._isMentioningChuckNorris(message)
    ) {
        this._replyWithRandomJoke(message);
    }
};

/**
 * Replyes to a message with a random Joke
 * @param {object} originalMessage
 * @private
 */
InvocaBot.prototype._replyWithRandomJoke = function (originalMessage) {
    var self = this;
    // self.db.get('SELECT id, joke FROM jokes ORDER BY used ASC, RANDOM() LIMIT 1', function (err, record) {
    //     if (err) {
    //         return console.error('DATABASE ERROR:', err);
    //     }
    var response = "what ever you want!";
    var channel = self._getChannelById(originalMessage.channel);
    self.postMessageToChannel(channel.name, response, {as_user: true});
    //     self.db.run('UPDATE jokes SET used = used + 1 WHERE id = ?', record.id);
    // });

    function recursive_invoca_request(date, lastElId, count){
        console.log('recursive_invoca_request fire!');
        // if(lastElId == ''){
            request('https://connectyourhome.invoca.net/api/2016-10-01/networks/transactions/1219.json?from='+date+'&to='+date+'&limit=1000&oauth_token='+oauth, function(err, response, body){
                console.log(err);
                console.log(response);
                console.log(body);
            });
         


            // var arrayLen = r.length
            // // arrayLenStr = str(arrayLen)
            // lastElId = r[arrayLen - 1]
            // count = count + arrayLen

            // if (arrayLen % 4000 == 0){
            //     recursive_invoca_request(date, lastElId, count)
            // }
            // else{
            //     console.log('failure!');
            //     console.log("We found " + arrayLenStr + " records");
            // }
        // }
        // else{
        //     var r = request.get('https://connectyourhome.invoca.net/api/2016-10-01/networks/transactions/1219.json?from='+date+'&to='+date+'&limit=4000&start_after_transaction_id='+ lastElId +'&oauth_token='+oauth)
        //     var arrayLen = r.length
        //     count = count + arrayLen
        //     console.log(count);
        //     console.log('r: ', r);
        //     lastElId = r[arrayLen - 1]
        //     var arrayLenStr = arrayLen

        //     if (arrayLen % 4000 == 0){
        //         recursive_invoca_request(date, lastElId, count)
        //     }
        //     else{
        //         console.log("We found " + str(count) + " records");
        //     }
        // }
    }

    recursive_invoca_request('2017-01-09', '', 0);

};

/**
 * Loads the user object representing the bot
 * @private
 */
InvocaBot.prototype._loadBotUser = function () {
	console.log('loading bot user');
    var self = this;
    this.user = this.users.filter(function (user) {
        return user.name === self.name;
    })[0];
    // console.log('this.user');
    // console.log(this.user);
};

/**
 * Open connection to the db
 * @private
 */
InvocaBot.prototype._connectDb = function () {
    if (!fs.existsSync(this.dbPath)) {
        console.error('Database path ' + '"' + this.dbPath + '" does not exists or it\'s not readable.');
        process.exit(1);
    }

    this.db = new SQLite.Database(this.dbPath);
};

/**
 * Check if the first time the bot is run. It's used to send a welcome message into the channel
 * @private
 */
InvocaBot.prototype._firstRunCheck = function () {
	console.log('First Run Check');
    var self = this;
    // self.db.get('SELECT val FROM info WHERE name = "lastrun" LIMIT 1', function (err, record) {
    //     if (err) {
    //         return console.error('DATABASE ERROR:', err);
    //     }

    //     var currentTime = (new Date()).toJSON();

    //     // this is a first run
    //     if (!record) {
    //         self._welcomeMessage();
    //         return self.db.run('INSERT INTO info(name, val) VALUES("lastrun", ?)', currentTime);
    //     }

    //     // updates with new last running time
    //     self.db.run('UPDATE info SET val = ? WHERE name = "lastrun"', currentTime);
    // });
};

/**
 * Sends a welcome message in the channel
 * @private
 */
InvocaBot.prototype._welcomeMessage = function () {
    this.postMessageToChannel(this.channels[0].name, 'Hi guys, roundhouse-kick anyone?' +
        '\n I can tell jokes, but very honest ones. Just say `Chuck Norris` or `' + this.name + '` to invoke me!',
        {as_user: true});
};

/**
 * Util function to check if a given real time message object represents a chat message
 * @param {object} message
 * @returns {boolean}
 * @private
 */
InvocaBot.prototype._isChatMessage = function (message) {
    return message.type === 'message' && Boolean(message.text);
};

/**
 * Util function to check if a given real time message object is directed to a channel
 * @param {object} message
 * @returns {boolean}
 * @private
 */
InvocaBot.prototype._isChannelConversation = function (message) {
    return typeof message.channel === 'string' &&
        message.channel[0] === 'C'
        ;
};

/**
 * Util function to check if a given real time message is mentioning Chuck Norris or the norrisbot
 * @param {object} message
 * @returns {boolean}
 * @private
 */
InvocaBot.prototype._isMentioningChuckNorris = function (message) {
    return message.text.toLowerCase().indexOf('chuck norris') > -1 ||
        message.text.toLowerCase().indexOf(this.name) > -1;
};

/**
 * Util function to check if a given real time message has ben sent by the norrisbot
 * @param {object} message
 * @returns {boolean}
 * @private
 */
InvocaBot.prototype._isFromInvocaBot = function (message) {
	// console.log(this.user);
    return message.user === this.user.id;
};

/**
 * Util function to get the name of a channel given its id
 * @param {string} channelId
 * @returns {Object}
 * @private
 */
InvocaBot.prototype._getChannelById = function (channelId) {
    return this.channels.filter(function (item) {
        return item.id === channelId;
    })[0];
};

module.exports = InvocaBot;
