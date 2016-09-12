# crossknowledge-api

## Reports

### POST method on the authenticate URL is refused

The url `http://ckauth.crossknowledge.com/api/learner/authenticate.json` does not accept POST requests.


```
Unhandled rejection StatusCodeError: 405 - "<!DOCTYPE html>\n<html>\n    <head>\n        <meta charset=\"UTF-8\" />\n        <title>An Error Occurred: Method Not Allowed</title>\n    </head>\n    <body>\n        <h1>Oops! An Error Occurred</h1>\n        <h2>The server returned a \"405 Method Not Allowed\".</h2>\n\n        <div>\n            Something is broken. Please let us know what you were doing when this error occurred.\n            We will fix it as soon as possible. Sorry for any inconvenience caused.\n        </div>\n    </body>\n</html>\n"
    at new StatusCodeError (/home/cadesalaberry/Apps/crossknowledge-api/node_modules/request-promise-core/lib/errors.js:32:15)
    at Request.plumbing.callback (/home/cadesalaberry/Apps/crossknowledge-api/node_modules/request-promise-core/lib/plumbing.js:104:33)
    at Request.RP$callback [as _callback] (/home/cadesalaberry/Apps/crossknowledge-api/node_modules/request-promise-core/lib/plumbing.js:46:31)
    at Request.self.callback (/home/cadesalaberry/Apps/crossknowledge-api/node_modules/request/request.js:187:22)
    at emitTwo (events.js:87:13)
    at Request.emit (events.js:172:7)
    at Request.<anonymous> (/home/cadesalaberry/Apps/crossknowledge-api/node_modules/request/request.js:1044:10)
    at emitOne (events.js:77:13)
    at Request.emit (events.js:169:7)
    at IncomingMessage.<anonymous> (/home/cadesalaberry/Apps/crossknowledge-api/node_modules/request/request.js:965:12)
    at emitNone (events.js:72:20)
    at IncomingMessage.emit (events.js:166:7)
    at endReadableNT (_stream_readable.js:903:12)
    at doNTCallback2 (node.js:439:9)
    at process._tickCallback (node.js:353:17)

```


It forces us to hit an unsecure URL then follow the redirection.

```
Unhandled rejection StatusCodeError: 301 - "<!DOCTYPE HTML PUBLIC \"-//IETF//DTD HTML 2.0//EN\">\n<html><head>\n<title>301 Moved Permanently</title>\n</head><body>\n<h1>Moved Permanently</h1>\n<p>The document has moved <a href=\"https://ckauth.crossknowledge.com/api/learner/authenticate.json?token=XS572\">here</a>.</p>\n</body></html>\n"
    at new StatusCodeError (/home/cadesalaberry/Apps/crossknowledge-api/node_modules/request-promise-core/lib/errors.js:32:15)
    at Request.plumbing.callback (/home/cadesalaberry/Apps/crossknowledge-api/node_modules/request-promise-core/lib/plumbing.js:104:33)
    at Request.RP$callback [as _callback] (/home/cadesalaberry/Apps/crossknowledge-api/node_modules/request-promise-core/lib/plumbing.js:46:31)
    at Request.self.callback (/home/cadesalaberry/Apps/crossknowledge-api/node_modules/request/request.js:187:22)
    at emitTwo (events.js:87:13)
    at Request.emit (events.js:172:7)
    at Request.<anonymous> (/home/cadesalaberry/Apps/crossknowledge-api/node_modules/request/request.js:1044:10)
    at emitOne (events.js:77:13)
    at Request.emit (events.js:169:7)
    at IncomingMessage.<anonymous> (/home/cadesalaberry/Apps/crossknowledge-api/node_modules/request/request.js:965:12)
    at emitNone (events.js:72:20)
    at IncomingMessage.emit (events.js:166:7)
    at endReadableNT (_stream_readable.js:903:12)
    at doNTCallback2 (node.js:439:9)
    at process._tickCallback (node.js:353:17)

```

### A HUGE delay is needed to make sure the user is authenticated

If we don't wait for at least 3000ms, the login is unsuccessful:

```
Unhandled rejection StatusCodeError: 401 - {"message":"Access denied: not logged-in.","success":false,"totalResults":0,"value":null}
    at new StatusCodeError (/home/cadesalaberry/Apps/crossknowledge-api/node_modules/request-promise-core/lib/errors.js:32:15)
    at Request.plumbing.callback (/home/cadesalaberry/Apps/crossknowledge-api/node_modules/request-promise-core/lib/plumbing.js:104:33)
    at Request.RP$callback [as _callback] (/home/cadesalaberry/Apps/crossknowledge-api/node_modules/request-promise-core/lib/plumbing.js:46:31)
    at Request.self.callback (/home/cadesalaberry/Apps/crossknowledge-api/node_modules/request/request.js:187:22)
    at emitTwo (events.js:87:13)
    at Request.emit (events.js:172:7)
    at Request.<anonymous> (/home/cadesalaberry/Apps/crossknowledge-api/node_modules/request/request.js:1044:10)
    at emitOne (events.js:77:13)
    at Request.emit (events.js:169:7)
    at IncomingMessage.<anonymous> (/home/cadesalaberry/Apps/crossknowledge-api/node_modules/request/request.js:965:12)
    at emitNone (events.js:72:20)
    at IncomingMessage.emit (events.js:166:7)
    at endReadableNT (_stream_readable.js:903:12)
    at doNTCallback2 (node.js:439:9)
    at process._tickCallback (node.js:353:17)

```

### The REST login needs a cookie...

For some reason, we need to attach the cookies when hitting the API at `https://mylearning.lms.crossknowledge.com/API/v1/REST/Learner/login.json`...

If we don't, we get the following:

```
Unhandled rejection StatusCodeError: 401 - {"message":"Access denied: not logged-in.","success":false,"totalResults":0,"value":null}
    at new StatusCodeError (/home/cadesalaberry/Apps/crossknowledge-api/node_modules/request-promise-core/lib/errors.js:32:15)
    at Request.plumbing.callback (/home/cadesalaberry/Apps/crossknowledge-api/node_modules/request-promise-core/lib/plumbing.js:104:33)
    at Request.RP$callback [as _callback] (/home/cadesalaberry/Apps/crossknowledge-api/node_modules/request-promise-core/lib/plumbing.js:46:31)
    at Request.self.callback (/home/cadesalaberry/Apps/crossknowledge-api/node_modules/request/request.js:187:22)
    at emitTwo (events.js:87:13)
    at Request.emit (events.js:172:7)
    at Request.<anonymous> (/home/cadesalaberry/Apps/crossknowledge-api/node_modules/request/request.js:1044:10)
    at emitOne (events.js:77:13)
    at Request.emit (events.js:169:7)
    at IncomingMessage.<anonymous> (/home/cadesalaberry/Apps/crossknowledge-api/node_modules/request/request.js:965:12)
    at emitNone (events.js:72:20)
    at IncomingMessage.emit (events.js:166:7)
    at endReadableNT (_stream_readable.js:903:12)
    at doNTCallback2 (node.js:439:9)
    at process._tickCallback (node.js:353:17)

```
