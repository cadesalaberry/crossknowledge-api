var CrossKnowledgeAPI = require('./api');

var CK_WEB_CREDENTIALS = {
  login: process.env.CK_USER_EMAIL,
  pass : process.env.CK_USER_PASSWORD,
}

var API = new CrossKnowledgeAPI();

API.authenticateTest(CK_WEB_CREDENTIALS);
