#!/usr/bin/env node

'use strict';
var Promise = require('bluebird');
var request = require('request-promise');
var cheerio = require('cheerio');

var CK_URL_CONFIG = {
  fakeLoginURL     : 'https://mylearning.lms.crossknowledge.com/login_trainee.php',
  profileURL       : 'https://mylearning.lms.crossknowledge.com/candidat/profile.php',
  // FIXME: I get a "405 - An Error Occurred: Method Not Allowed" if I use https
  authenticationURL: 'http://ckauth.crossknowledge.com/api/learner/authenticate.json',
  mobileLoginURL   : 'https://mylearning.lms.crossknowledge.com/API/v1/REST/Learner/mobileLogin.json',
  loginURL         : 'https://mylearning.lms.crossknowledge.com/API/v1/REST/Learner/login.json',
  accountURL       : 'https://mylearning.lms.crossknowledge.com/API/v1/REST/Learner/profile.json',
};

var CrossKnowledgeAPI = function CrossKnowledgeAPI(setup) {
  var self = this;

  self.urlConfig = JSON.parse(JSON.stringify(CK_URL_CONFIG));

  self.authInformations = {};

  // Overrides default URL config
  for (var key in setup)
    self.urlConfig[key] = setup[key];
};

CrossKnowledgeAPI.prototype.debug = function debug(webCredentials) {
  var self = this;

  return Promise
    .resolve(webCredentials)
    .then(exec(self, 'webLogin'))
    .then(exec(self, 'getProfilePage'))
    .then(exec(self, 'extractTokenFromPage'))
    .tap(console.log.bind(console, '[token]'))
    .then(exec(self, 'authenticatePlayer'))
    .tap(exec(self, 'saveAuthInformations'))
    .tap(console.log.bind(console, '[auth]'))
    // FIXED?: Forces a delay to allow server to record the login event
    // .delay(3000)
    .then(exec(self, 'playerMobileLogin'))
    .tap(console.log.bind(console, '[first]'))
    .then(exec(self, 'playerLogin'))
    .tap(console.log.bind(console, '[login]'))
    .then(exec(self, 'playerAccount'))
    .tap(console.log.bind(console, '[account]'));
};

CrossKnowledgeAPI.prototype.authenticateTest = function authenticateTest(webCredentials) {
  var self = this;

  return Promise
    .resolve(webCredentials)
    .then(exec(self, 'webLogin'))
    .then(exec(self, 'getProfilePage'))
    .then(exec(self, 'extractTokenFromPage'))
    .then(exec(self, 'authenticatePlayer'))
    .tap(exec(self, 'saveAuthInformations'))
    .then(exec(self, 'playerMobileLogin'))
    .then(exec(self, 'playerLogin'))
    .then(exec(self, 'playerAccount'))
    .tap(console.log.bind(console, '[account]'));
};

function exec(self, fctName) {
  return self[fctName].bind(self);
}

CrossKnowledgeAPI.prototype.authenticate = function authenticate(token) {
  var self = this;

  return Promise
  .resolve(token)
  .then(exec(self, 'authenticatePlayer'))
  .tap(exec(self, 'saveAuthInformations'))
  .then(exec(self, 'playerMobileLogin'))
  .then(exec(self, 'playerLogin'))
  .then(exec(self, 'playerAccount'));
};

CrossKnowledgeAPI.prototype.webLogin = function webLogin(_webCredentials) {
  var self = this;

  var options = {
    method  : 'POST',
    jar     : true,
    uri     : self.urlConfig.fakeLoginURL,
    formData: {
      auth_driver         : '1',
      login               : 'FAKE_USERNAME',
      pass                : 'FAKE_PASSWORD',
      langcode            : 'en-GB',
      SavePasswordInCookie: 'N',
      submitButtonName    : 'SPARTED Log in',
    },
    followAllRedirects: true,
  };

  for (var key in _webCredentials)
    options.formData[key] = _webCredentials[key];

  return request(options);
};

CrossKnowledgeAPI.prototype.getProfilePage = function getProfilePage() {
  var self = this;

  var options = {
    method: 'GET',
    jar   : true,
    uri   : self.urlConfig.profileURL,
  };

  return request(options);
};

CrossKnowledgeAPI.prototype.extractTokenFromPage = function extractTokenFromPage(page) {
  var $ = cheerio.load(page);
  var token = $('.token').text();

  return token;
};

/*

// Unroll the "Access your training through your app"
// To find you "temporary user code"
// On https://mylearning.lms.crossknowledge.com/candidat/profile.php
  reply looks like:
  {
    message: 'Success',
    totalResults: 1,
    success: true,
    value: {
      learnerLogin: "sebastien@sparted.com",
      password    : "n8wx6fekx4",
      instanceUrl : "https://mylearning.lms.crossknowledge.com/",
    }
  }
 */
CrossKnowledgeAPI.prototype.authenticatePlayer = function authenticatePlayer(token) {
  var self = this;

  var options = {
    method: 'POST',
    json  : true,
    uri   : self.urlConfig.authenticationURL,
    qs    : {
      token: token,
    },
    // FIXME: "301 - Moved Permanently" with the HTTP authenticationURL if redirect disabled
    followAllRedirects: true,
  };

  return request(options);
};


/*
  loginResult looks like:
  {
    "message"     : "Login successful",
    "success"     : true,
    "totalResults": 1,
    "value"       : {
      mainColor: '#BE0E00',
      logoUrl: 'https://mylearning.lms.crossknowledge.com/data/medias/mobileCompanionLogo1397464257.png'
    },
  }
*/
CrossKnowledgeAPI.prototype.playerMobileLogin = function playerMobileLogin() {
  var self = this;

  // Identify the device by concatenating the App name and the device MAC address.
  var deviceId = 'SPARTED00:00:00:00:00:00:00';
  var options = {
    method: 'POST',
    json  : true,
    jar   : true,
    uri   : self.urlConfig.mobileLoginURL,
    body  : {
      login   : self.authInformations.learnerLogin,
      password: self.authInformations.password,
      deviceid: deviceId,
    },
  };

  // console.log('[first]', 'options.body', options.body);

  return request(options);
};

/*
  playerLogin looks like:
  {
    message     : 'Login successful',
    success     : true,
    totalResults: 1,
    value       : {}
  }

 */
CrossKnowledgeAPI.prototype.playerLogin = function playerLogin() {
  var self = this;

  var options = {
    method: 'POST',
    json  : true, // Automatically stringifies the body to JSON
    jar   : true, // FIXME: Getting a 401 if not used... so RESTFUL bro
    uri   : self.urlConfig.loginURL,
    body  : {
      login   : self.authInformations.learnerLogin,
      password: self.authInformations.password,
    },
  };

  return request(options);
};

/*
  {
    message: 'OK',
    success: true,
    totalResults: 1,
    value: {
      id: 539997,
      login: 'sebastien@sparted.com',
      name: '',
      firstname: 'Sebastien',
      email: '',
      lastAccessDate: '2016-09-13 11:41:14',
      normalPictureUrl: 'https://mylearning.lms.crossknowledge.com/candidate_picture/guid/A670B81B-E526-A554-AAE7-25CD14EA0150/width/100/height/100/modhash/2cc9af51e867a984753f242e7714c3a9/',
      bigPictureUrl: 'https://mylearning.lms.crossknowledge.com/candidate_picture/guid/A670B81B-E526-A554-AAE7-25CD14EA0150/width/500/height/500/modhash/2cc9af51e867a984753f242e7714c3a9/',
      displayName: 'Sebastien',
      preferredLanguage: 'en-GB',
      presentation: '',
      webUrl: '',
      linkedInUrl: '',
      twitterUrl: ''
    }
  }

 */
CrossKnowledgeAPI.prototype.playerAccount = function playerAccount() {
  var self = this;

  var options = {
    method: 'GET',
    json  : true, // Automatically stringifies the body to JSON
    jar   : true, // FIXME: Getting a 401 if not used... so RESTFUL bro
    uri   : self.urlConfig.accountURL,
    qs    : {
      learnerLogin: self.authInformations.learnerLogin,
    },
  };

  return request(options)
    .then(patchWithAuthInformations);


  function patchWithAuthInformations(o) {

    for (var key in self.authInformations)
      o.value[key] = self.authInformations[key];

    return o.value;
  }
};

CrossKnowledgeAPI.prototype.saveAuthInformations = function saveAuthInformations(_authInformations) {
  var self = this;

  // console.log('[auth]', 'Saving auth info', _authInformations.value);

  for (var key in _authInformations.value)
    self.authInformations[key] = _authInformations.value[key];
};

module.exports = CrossKnowledgeAPI;

