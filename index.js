'use strict';

const PROXY = require('./lib/Proxy');

// proxy middleware options
// let options = {
//     target: 'http://www.2o3t.cn', // target host
//     changeOrigin: true, // needed for virtual hosted sites
//     ws: true, // proxy websockets
//     pathRewrite: {
//         '^/api/old-path': '/api/new-path', // rewrite path
//         '^/api/remove/path': '/path', // remove base path
//     },
//     proxyBody: true, // ctx.body = {};
// };


/**
 *   // rewrite path
 *   pathRewrite: {'^/old/api' : '/new/api'}
 *   // remove path
 *   pathRewrite: {'^/remove/api' : ''}
 *   // add base path
 *   pathRewrite: {'^/' : '/basepath/'}
 *   // custom rewriting
 *   pathRewrite: function (path, req) { return path.replace('/api', '/base/api') }
 *
 * @param {*} context
 * @param {*} opts
 */

module.exports = function(context, opts) {
    return new PROXY(context, opts);
};

/*

option.target: url string to be parsed with the url module

option.forward: url string to be parsed with the url module

option.agent: object to be passed to http(s).request (see Node's https agent and http agent objects)

option.ssl: object to be passed to https.createServer()

option.ws: true/false: if you want to proxy websockets

option.xfwd: true/false, adds x-forward headers

option.secure: true/false, if you want to verify the SSL Certs

option.toProxy: true/false, passes the absolute URL as the path (useful for proxying to proxies)

option.prependPath: true/false, Default: true - specify whether you want to prepend the target's path to the proxy path

option.ignorePath: true/false, Default: false - specify whether you want to ignore the proxy path of the incoming request (note: you will have to append / manually if required).

option.localAddress : Local interface string to bind for outgoing connections

option.changeOrigin: true/false, Default: false - changes the origin of the host header to the target URL

option.preserveHeaderKeyCase: true/false, Default: false - specify whether you want to keep letter case of response header key

option.auth : Basic authentication i.e. 'user:password' to compute an Authorization header.

option.hostRewrite: rewrites the location hostname on (301/302/307/308) redirects.

option.autoRewrite: rewrites the location host/port on (301/302/307/308) redirects based on requested host/port. Default: false.

option.protocolRewrite: rewrites the location protocol on (301/302/307/308) redirects to 'http' or 'https'. Default: null.

option.cookieDomainRewrite: rewrites domain of set-cookie headers. Possible values:

false (default): disable cookie rewriting
String: new domain, for example cookieDomainRewrite: "new.domain". To remove the domain, use cookieDomainRewrite: "".
Object: mapping of domains to new domains, use "*" to match all domains.
For example keep one domain unchanged, rewrite one domain and remove other domains:
cookieDomainRewrite: {
  "unchanged.domain": "unchanged.domain",
  "old.domain": "new.domain",
  "*": ""
}
option.cookiePathRewrite: rewrites path of set-cookie headers. Possible values:

false (default): disable cookie rewriting
String: new path, for example cookiePathRewrite: "/newPath/". To remove the path, use cookiePathRewrite: "". To set path to root use cookiePathRewrite: "/".
Object: mapping of paths to new paths, use "*" to match all paths. For example, to keep one path unchanged, rewrite one path and remove other paths:
cookiePathRewrite: {
  "/unchanged.path/": "/unchanged.path/",
  "/old.path/": "/new.path/",
  "*": ""
}
option.headers: object, adds request headers. (Example: {host:'www.2o3t.cn'})

option.proxyTimeout: timeout (in millis) when proxy receives no response from target

option.timeout: timeout (in millis) for incoming requests

option.followRedirects: true/false, Default: false - specify whether you want to follow redirects

option.selfHandleResponse true/false, if set to true, none of the webOutgoing passes are called and it's your responsibility to appropriately return the response by listening and acting on the proxyRes event

option.buffer: stream of data to send as the request body. Maybe you have some middleware that consumes the request stream before proxying it on e.g. If you read the body of a request into a field called 'req.rawbody' you could restream this field in the buffer option:


*/
