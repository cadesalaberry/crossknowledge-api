#!/usr/bin/env node

'use strict';
var Promise = require('bluebird');
var request = require('request-promise');
var cheerio = require('cheerio');

var CK_URL_SETUP = {
  fakeLoginURL     : 'https://mylearning.lms.crossknowledge.com/login_trainee.php',
  profileURL       : 'https://mylearning.lms.crossknowledge.com/candidat/profile.php',
  // FIXME: I get a "405 - An Error Occurred: Method Not Allowed" if I use https
  authenticationURL: 'http://ckauth.crossknowledge.com/api/learner/authenticate.json',
  mobileLoginURL   : 'https://mylearning.lms.crossknowledge.com/API/v1/REST/Learner/mobileLogin.json',
  loginURL         : 'https://mylearning.lms.crossknowledge.com/API/v1/REST/Learner/login.json',
  accountURL       : 'https://mylearning.lms.crossknowledge.com/API/v1/REST/Learner/profile.json',
};
var CK_USER_EMAIL = process.env.CK_USER_EMAIL;
var CK_USER_PASSWORD = process.env.CK_USER_PASSWORD;

var authInformations = {};
var webLoginPayload = {
  login: CK_USER_EMAIL,
  pass : CK_USER_PASSWORD,
};

Promise
  .resolve(webLoginPayload)
  .then(webLogin)
  .then(getProfilePage)
  .then(extractTokenFromPage)
  .tap(saveToken)
  .tap(console.log.bind(console, '[token]'))
  .then(authenticatePlayer)
  .tap(saveAuthInformations)
  .tap(console.log.bind(console, '[auth]'))
  // FIXED?: Forces a delay to allow server to record the login event
  // .delay(3000)
  .then(playerMobileLogin)
  .tap(console.log.bind(console, '[first]'))
  .then(playerLogin)
  .tap(console.log.bind(console, '[login]'))
  .then(playerAccount)
  .tap(console.log.bind(console, '[account]'));

function webLogin(_webLoginPayload) {
  var options = {
    method  : 'POST',
    jar     : true,
    uri     : CK_URL_SETUP.fakeLoginURL,
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

  for (var key in _webLoginPayload)
    options.formData[key] = _webLoginPayload[key];

  return request(options);
}

function getProfilePage() {
  var options = {
    method: 'GET',
    jar   : true,
    uri   : CK_URL_SETUP.profileURL,
  };

  return request(options);
}

function extractTokenFromPage(page) {
  var $ = cheerio.load(page);
  var token = $('.token').text();

  return token;
}

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
function authenticatePlayer(token) {
  var options = {
    method: 'POST',
    json  : true,
    uri   : CK_URL_SETUP.authenticationURL,
    qs    : {
      token: token,
    },
    // FIXME: "301 - Moved Permanently" with the HTTP authenticationURL if redirect disabled
    followAllRedirects: true,
  };

  return request(options);
}


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
function playerMobileLogin() {
  // Identify the device by concatenating the App name and the device MAC address.
  var deviceId = 'SPARTED00:00:00:00:00:00:00';
  var options = {
    method: 'POST',
    json  : true,
    uri   : CK_URL_SETUP.mobileLoginURL,
    body  : {
      login   : authInformations.learnerLogin,
      password: authInformations.password,
      deviceid: deviceId,
    },
  };

  console.log('[first]', 'options.body', options.body);

  return request(options);
}

/*
  playerLogin looks like:
  {
    message     : 'Login successful',
    success     : true,
    totalResults: 1,
    value       : {}
  }

 */
function playerLogin() {

  var options = {
    method: 'POST',
    json  : true, // Automatically stringifies the body to JSON
    jar   : true, // FIXME: Getting a 401 if not used... so RESTFUL bro
    uri   : CK_URL_SETUP.loginURL,
    body  : {
      login   : authInformations.learnerLogin,
      password: authInformations.password,
    },
  };

  return request(options);
}

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
function playerAccount() {

  var options = {
    method: 'GET',
    json  : true, // Automatically stringifies the body to JSON
    jar   : true, // FIXME: Getting a 401 if not used... so RESTFUL bro
    uri   : CK_URL_SETUP.accountURL,
    qs  : {
      learnerLogin: authInformations.learnerLogin,
    },
  };

  return request(options);
}

function saveAuthInformations(_authInformations) {
  console.log('[auth]', 'Saving auth info', _authInformations.value);

  for (var key in _authInformations.value)
    authInformations[key] = _authInformations.value[key];
}


function saveToken(token) {
  authInformations.token = token;
}

