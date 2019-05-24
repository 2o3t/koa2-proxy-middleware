'use strict';

const utility = require('2o3t-utility');
const isFunction = utility.is.function;
const logger = require('./logger');

module.exports = {
    init,
    getHandlers: getProxyEventHandlers,
};

function init(proxy, opts) {
    const handlers = getProxyEventHandlers(opts);

    for (const eventName in handlers) {
        if (handlers.hasOwnProperty(eventName)) {
            proxy.on(eventName, handlers[eventName]);
        }
    }

    // logger.system.debug('Subscribed to http-proxy events: ', Object.keys(handlers));
}

function getProxyEventHandlers(opts) {
    // https://github.com/nodejitsu/node-http-proxy#listening-for-proxy-events
    const proxyEvents = [ 'error', 'proxyReq', 'proxyReqWs', 'proxyRes', 'open', 'close' ];
    const handlers = {};

    proxyEvents.forEach(function(event) {
        // all handlers for the http-proxy events are prefixed with 'on'.
        // loop through options and try to find these handlers
        // and add them to the handlers object for subscription in init().
        const eventName = utility.defaultCamelize2Str('on_' + event, 'camel');
        const fnHandler = opts[eventName];

        if (isFunction(fnHandler)) {
            handlers[event] = fnHandler;
        }
    });

    // add default error handler in absence of error handler
    if (!isFunction(handlers.error)) {
        handlers.error = defaultErrorHandler;
    }

    // add default close handler in absence of close handler
    if (!isFunction(handlers.close)) {
        handlers.close = logClose;
    }

    return handlers;
}

function defaultErrorHandler(err, req, res) {
    const host = (req.headers && req.headers.host);
    const code = err.code;

    if (res.writeHead && !res.headersSent) {
        if (/HPE_INVALID/.test(code)) {
            res.writeHead(502);
        } else {
            switch (code) {
                case 'ECONNRESET':
                case 'ENOTFOUND':
                case 'ECONNREFUSED':
                    res.writeHead(504);
                    break;
                default: res.writeHead(500);
            }
        }
    }

    res.end('Error occured while trying to proxy to: ' + host + req.url);
}

function logClose(/* req, socket, head */) {
    // view disconnected websocket connections
    logger.system('Client disconnected');
}
