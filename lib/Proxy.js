'use strict';

const utility = require('2o3t-utility');
const isFunction = utility.is.function;
const httpProxy = require('http-proxy');
const logger = require('./logger');

const createConfig = require('./createConfig');
const handlers = require('./handlers');
const PathRewriter = require('./path-rewriter');
const contextMatcher = require('./context-matcher');
const Router = require('./router');

function PROXY(context, opts) {
    let _wsInitialized = false;
    const config = createConfig(context, opts);
    const proxyOptions = config.options;
    // create proxy
    const proxy = httpProxy.createProxyServer({});
    // ws
    const upgrade = _initUpgrade();

    const pathRewriter = PathRewriter.create(proxyOptions.pathRewrite); // returns undefined when "pathRewrite" is not provided
    // attach handler to http-proxy events
    handlers.init(proxy, proxyOptions);

    // log errors for debug purpose
    proxy.on('error', _handleLogError);

    // 新增加的功能
    proxy.on('proxyRes', _handleProxyResBody);

    // server.on('upgrade', proxy.upgrade);  // <-- directly subscribe to server's upgrade event.
    function _initUpgrade() {
        // https://github.com/chimurai/http-proxy-middleware/issues/57
        const wsUpgradeDebounced = utility.debounce(_handleUpgrade);
        return wsUpgradeDebounced;
    }

    function _handleLogError(err, req /* res */) {
        const hostname = (req.headers && req.headers.host) || (req.hostname || req.host); // (websocket) || (node0.10 || node 4/5)
        const target = proxyOptions.target.host || proxyOptions.target;
        const errorMessage = 'Error occurred while trying to proxy request %s from %s to %s (%s) (%s)';
        const errReference = 'https://nodejs.org/api/errors.html#errors_common_system_errors'; // link to Node Common Systems Errors page

        logger.error(errorMessage, req.url, hostname, target, err.code, errReference);
    }

    function _handleProxyResBody(proxyRes, req, res) {
        const oriWrite = res.write;
        const oriEnd = res.end;
        const proxyBody = proxyOptions.proxyBody;
        if (proxyBody) {
            const ctx = res._ctx;
            const jsonStrings = [];
            Object.assign(res, {
                write(chunk) {
                    jsonStrings.push(chunk);
                    oriWrite.apply(res, arguments);
                },
                end() {
                    let buffer = jsonStrings.join();
                    try {
                        if (isFunction(proxyBody)) {
                            const oriJSONRes = JSON.parse(buffer.toString());
                            const handledJSONRes = proxyBody(oriJSONRes, proxyRes, req, res, ctx);
                            buffer = new Buffer(JSON.stringify(handledJSONRes)); // 一定要转成buffer，buffer长度和string长度不一样
                        } else {
                            ctx.body = JSON.parse(buffer.toString());
                        }
                    } catch (error) {
                        logger.warn(error);
                    }
                    oriEnd.apply(res, arguments);
                },
            });
        }
        if (res.__resolve && isFunction(res.__resolve)) {
            res.__resolve(proxyRes);
        }
    }

    function _shouldProxy(req) {
        const context = config.context;
        const path = (req.originalUrl || req.url);
        return contextMatcher.match(context, path, req);
    }

    function _handleUpgrade(req, socket, head) {
        // set to initialized when used externally
        _wsInitialized = true;

        if (_shouldProxy(req)) {
            const activeProxyOptions = prepareProxyRequest(req);
            proxy.ws(req, socket, head, activeProxyOptions);
            logger.system('Upgrading to WebSocket');
        }
    }

    function _catchUpgradeRequest(server) {
        // subscribe once; don't subscribe on every request...
        // https://github.com/chimurai/http-proxy-middleware/issues/113
        if (!_wsInitialized) {
            server.on('upgrade', upgrade);
            _wsInitialized = true;
        }
    }

    function _prepareProxyRequest(req) {
        // https://github.com/chimurai/http-proxy-middleware/issues/17
        // https://github.com/chimurai/http-proxy-middleware/issues/94
        req.url = (req.originalUrl || req.url);

        // store uri before it gets rewritten for logging
        const newProxyOptions = Object.assign({}, proxyOptions);

        // Apply in order:
        // 1. option.router
        // 2. option.pathRewrite
        __applyRouter(req, newProxyOptions);
        __applyPathRewrite(req, pathRewriter);

        return newProxyOptions;
    }

    async function middleware(ctx, next) {
        const req = ctx.req;
        const res = ctx.res;

        if (proxyOptions.ws === true) {
            // use initial request to access the server object to subscribe to http upgrade event
            _catchUpgradeRequest(req.connection.server);
        }

        // function middleware(req, res, next) {
        const proxyRes = await new Promise(resolve => {
            if (_shouldProxy(req)) {
                ctx.respond = false;
                ctx.status = 302;
                const activeProxyOptions = _prepareProxyRequest(req);
                res._ctx = ctx;
                res.__resolve = resolve;

                proxy.web(req, res, activeProxyOptions);
            } else {
                resolve();
            }
        });

        if (proxyRes) {
            res.proxyRes = proxyRes;
        }

        await next();
    }

    middleware.upgrade = upgrade;

    logger.system('inited...');

    return middleware;
}

// Modify option.target when router present.
function __applyRouter(req, options) {
    let newTarget;

    if (options.router) {
        newTarget = Router.getTarget(req, options);

        if (newTarget) {
            logger.system(
                'Router new target: %s -> "%s"',
                options.target,
                newTarget
            );
            options.target = newTarget;
        }
    }
}

// rewrite path
function __applyPathRewrite(req, pathRewriter) {
    if (pathRewriter) {
        const path = pathRewriter(req.url, req);

        if (typeof path === 'string') {
            req.url = path;
        } else {
            logger.system('pathRewrite: No rewritten path found. (%s)', req.url);
        }
    }
}

module.exports = PROXY;
