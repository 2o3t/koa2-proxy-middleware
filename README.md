# @2o3t/koa2-proxy-middleware

Node.js proxying made simple. Configure proxy middleware with ease for [koa2](https://github.com/koajs/koa).

Powered by [`http-proxy-middleware`](https://github.com/chimurai/http-proxy-middleware). [![GitHub stars](https://img.shields.io/github/stars/chimurai/http-proxy-middleware.svg?style=social&label=Star)](https://github.com/chimurai/http-proxy-middleware)

## TL;DR

Proxy `/api` requests to `http://www.2o3t.cn`

```javascript
const Koa = require('koa');
const app = new Koa();
const proxy = require('@2o3t/koa2-proxy-middleware');

// app.use(proxy({ target: 'http://www.2o3t.cn', changeOrigin: true }));

const Router = require('koa-router');
const router = new Router();
router.use(
  '/api',
  proxy({ target: 'http://www.2o3t.cn', changeOrigin: true })
);
app.use(router.routes())
  .use(router.allowedMethods());
app.listen(3000);
// http://localhost:3000/api/foo/bar -> http://www.2o3t.cn/api/foo/bar
```

_All_ `http-proxy` [options](https://github.com/nodejitsu/node-http-proxy#options) can be used, along with some extra `http-proxy-middleware` [options](#options).

:bulb: **Tip:** Set the option `changeOrigin` to `true` for [name-based virtual hosted sites](http://en.wikipedia.org/wiki/Virtual_hosting#Name-based).

## Install

```javascript
$ npm install --save-dev @2o3t/koa2-proxy-middleware
// or
yarn add @2o3t/koa2-proxy-middleware
```

## Core concept

Proxy middleware configuration.

#### proxy([context,] config)

```javascript
const proxy = require('@2o3t/koa2-proxy-middleware');

const apiProxy = proxy('/api', { target: 'http://www.2o3t.cn' });
//                   \____/   \_____________________________/
//                     |                    |
//                   context             options

// 'apiProxy' is now ready to be used as middleware in a server.
```

- **context**: Determine which requests should be proxied to the target host.
  (more on [context matching](#context-matching))
- **options.target**: target host to proxy to. _(protocol + host)_

(full list of [`http-proxy-middleware` configuration options](#options))

#### proxy(uri [, config])

```javascript
// shorthand syntax for the example above:
const apiProxy = proxy('http://www.2o3t.cn/api');
```

More about the [shorthand configuration](#shorthand).

## Example

An example with `koa2` server.

```javascript
const Koa = require('koa');
const app = new Koa();
const proxy = require('@2o3t/koa2-proxy-middleware');

// proxy middleware options
const options = {
  target: 'http://www.2o3t.cn', // target host
  changeOrigin: true, // needed for virtual hosted sites
  ws: true, // proxy websockets
  pathRewrite: {
    '^/api/old-path': '/api/new-path', // rewrite path
    '^/api/remove/path': '/path' // remove base path
  },
  router: {
    // when request.headers.host == 'dev.localhost:3000',
    // override target 'http://www.2o3t.cn' to 'http://localhost:8000'
    'dev.localhost:3000': 'http://localhost:8000'
  }
};

// create the proxy (without context)
const exampleProxy = proxy(options);

app.use(exampleProxy)

app.use(ctx => {
    console.log(ctx.status);
});

app.listen(3003);
```

## Context matching

Providing an alternative way to decide which requests should be proxied; In case you are not able to use the server's [`path` parameter](http://expressjs.com/en/4x/api.html#app.use) to mount the proxy or when you need more flexibility.

[RFC 3986 `path`](https://tools.ietf.org/html/rfc3986#section-3.3) is used for context matching.

```
         foo://example.com:8042/over/there?name=ferret#nose
         \_/   \______________/\_________/ \_________/ \__/
          |           |            |            |        |
       scheme     authority       path        query   fragment
```

- **path matching**

  - `proxy({...})` - matches any path, all requests will be proxied.
  - `proxy('/', {...})` - matches any path, all requests will be proxied.
  - `proxy('/api', {...})` - matches paths starting with `/api`

- **multiple path matching**

  - `proxy(['/api', '/ajax', '/someotherpath'], {...})`

- **wildcard path matching**

  For fine-grained control you can use wildcard matching. Glob pattern matching is done by _micromatch_. Visit [micromatch](https://www.npmjs.com/package/micromatch) or [glob](https://www.npmjs.com/package/glob) for more globbing examples.

  - `proxy('**', {...})` matches any path, all requests will be proxied.
  - `proxy('**/*.html', {...})` matches any path which ends with `.html`
  - `proxy('/*.html', {...})` matches paths directly under path-absolute
  - `proxy('/api/**/*.html', {...})` matches requests ending with `.html` in the path of `/api`
  - `proxy(['/api/**', '/ajax/**'], {...})` combine multiple patterns
  - `proxy(['/api/**', '!**/bad.json'], {...})` exclusion

  **Note**: In multiple path matching, you cannot use string paths and wildcard paths together.

- **custom matching**

  For full control you can provide a custom function to determine which requests should be proxied or not.

  ```javascript
  /**
   * @return {Boolean}
   */
  const filter = function(pathname, req) {
    return pathname.match('^/api') && req.method === 'GET';
  };

  const apiProxy = proxy(filter, { target: 'http://www.2o3t.cn' });
  ```

## Options

### [`http-proxy-middleware` configuration options](https://github.com/chimurai/http-proxy-middleware#options)

### new options

- `option.proxyBody`: [Boolean|Function] Collect the results returned by the agent and assign them to `ctx.body`. Default: false.

```js
option.proxyBody: true,
// or
option.proxyBody: function(json, proxyRes, req, res, ctx) {
    ctx.body = json;
}
```

## License

The MIT License (MIT)

Copyright (c) 2018-2019 Zyao89
