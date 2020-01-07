"use strict";
var Redis = require('ioredis');
const get = require('lodash/get');
const initScript = require('./initScript');
const EventEmitter = require("events").EventEmitter;

class RedisMQ extends EventEmitter {

    // 构造函数连接 redis
    constructor(options = {}) {
        super(options);
        const opts = Object.assign({
            host: "127.0.0.1",
            port: 6379,
            options: {
                password: options.password || null
            },
            client: null,
            ns: "rsmq",
            realtime: false
        }, options);

        this.redisns = opts.ns + ":";
        this.redis = new Redis(opts);
        this.redis.on("connect", async () => {
            const data = await initScript.call(this, this.redis);
            console.log('---->', data);
        });
    }

    async createQueue(options) {
        const key = `${this.redisns}${options.qname}:Q`;
        options.vt = options.vt != null ? options.vt : 30;
        options.delay = options.delay != null ? options.delay : 0;
        options.maxsize = options.maxsize != null ? options.maxsize : 65536;
        let resp = await this.redis.time();

        const mc = [
            ["hsetnx", key, "vt", options.vt],
            ["hsetnx", key, "delay", options.delay],
            ["hsetnx", key, "maxsize", options.maxsize],
            ["hsetnx", key, "created", resp[0]],
            ["hsetnx", key, "modified", resp[0]],
        ];
        // 使用 pipeline 命令提高性能
        resp = await this.redis.multi(mc).exec();
        if (get(resp, '0.1') === 0) {
            return new Error("queueExists");
        }

        resp = await this.redis.sadd(`${this.redisns}QUEUES`, options.qname);
    }


    async sendMessage(options) {
        //    1. 判断 qname 是否存在
        const q = await this.__getQueue(options.qname, true);

        options.delay = options.delay != null ? options.delay : q.delay;

        const key = `${this.redisns}${options.qname}`;
        const mc = [
            ["zadd", key, q.ts + options.delay * 1000, q.uid],
            ["hset", `${key}:Q`, q.uid, options.message],
            ["hincrby", `${key}:Q`, "totalsent", 1]
        ];
        const resp = this.redis.multi(mc).exec();
        return resp;
    }


    _formatZeroPad(num, count) {
        return ((Math.pow(10, count) + num) + "").substr(1);
    }

    _makeid(len) {
        let text = "";
        const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let i = 0;
        for (i = 0; i < len; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }

    async __getQueue(qname, uid) {
        const mc = [
            ["hmget", `${this.redisns}${qname}:Q`, "vt", "delay", "maxsize"],
            ["time"]
        ];

        const resp = await this.redis.multi(mc).exec();

        console.log('====>', resp);
        const ms = this._formatZeroPad(Number(resp[1][1][1]), 6);
        const ts = Number(resp[1][1][0] + ms.toString(10).slice(0, 3));
        const q = {
            vt: parseInt(resp[0][1][0], 10),
            delay: parseInt(resp[0][1][1], 10),
            maxsize: parseInt(resp[0][1][2], 10),
            ts: ts
        };
        if (uid) {
            uid = this._makeid(22);
            q.uid = Number(resp[1][1][0] + ms).toString(36) + uid;
        }
        return q;
    }

    // 接受消息后的处理流程
    _handleReceivedMessage(resp) {
        const o = {
            id: resp[0],
            message: resp[1],
            rc: resp[2],
            fr: Number(resp[3]),
            // sent: Number(parseInt(resp[0].slice(0, 10), 36) / 1000)
        };
        return o;
    };

    async listQueues() {
        const resp = this.redis.smembers(`${this.redisns}QUEUES`);
        return resp;
    }

    async _receiveMessage (options, q) {
        console.log('----->', this.receiveMessage_sha1, 3, `${this.redisns}${options.qname}`, q.ts, q.ts + options.vt * 1000)
        const resp = await this.redis.evalsha(this.receiveMessage_sha1, 3, `${this.redisns}${options.qname}`, q.ts, q.ts + options.vt * 1000);

        console.log('--->', resp)
        return this._handleReceivedMessage(resp);
    };


    async receiveMessage(options) {
        const q = await this.__getQueue(options.qname, false);
        options.vt = options.vt != null ? options.vt : q.vt;

        console.log('@@@@@', this.receiveMessage_sha1)
        if (this.receiveMessage_sha1) {
            await this._receiveMessage(options, q);
            return;
        }
        this.on("scriptload:receiveMessage", async () => {
            await this._receiveMessage(options, q);
        });
    }
}


async function test() {
    const mq = new RedisMQ();
    // let a = await mq.createQueue({qname: 'test'});
    // console.log(a);
    // let a = await mq.__getQueue('test')
    // console.log(a);
    // let a = await mq.sendMessage({qname: 'test', message: "123456789"})
    // console.log(a);

    const list = await mq.receiveMessage({qname: 'zwn1'});
    console.log(list);
    // process.exit();
}

test();



