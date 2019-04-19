const Koa = require('koa');
const app = new Koa();
const proxy = require('../index.js');

app.use(proxy({ target: 'https://www.baidu.com', changeOrigin: true }))

app.use(ctx => {
    console.log(ctx.status);
});

const server = app.listen(3003);
// server.on('upgrade', proxy.upgrade({ target: 'https://www.baidu.com', changeOrigin: true })); // <-- subscribe to http 'upgrade'
