## ioredisMq

Another point to point mq's implementation based [ioredis](https://github.com/luin/ioredis)。inspired by [rsmp](https://github.com/smrchy/rsmq/blob/master/package.json)

## Install
```
npm install ioredisMq
```

## Usage
```
const MQ = require("ioredisMq");
const mq = new MQ( {host: "127.0.0.1", port: 6379, ns: "rsmq"} );

```
### createQueue
```
const resp = await mq.createQueue({qname: 'test'})

```
### sendMessage

```
const resp = await mq.sendMessage({qname: 'test', message: 'hello world'})
if (resp) {
    console.log('sendMessage success')
}
```

### receiveMessage
```
const resp = await mq.receiveMessage({qname: 'test'})
if (resp) {
    console.log(resp)   // { id: 'fjpelmxa4ssQUxNw1Xv2plsvoCPOsrXv', message: 'hello world' }
}
```

## License

## MIT