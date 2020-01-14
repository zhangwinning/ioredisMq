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
        }, options);

        this.redisns = opts.ns + ":";
        this.redis = new Redis(opts);
        this.redis.on("connect",  () => {
            initScript.call(this, this.redis);
        });
    }

     createQueue(options) {
        const key = `${this.redisns}${options.qname}:Q`;
        options.maxsize = options.maxsize != null ? options.maxsize : 65536;
        return new Promise((resolve, reject) => {
            this.redis.time().then((resp) => {
                const mc = [
                    ["hsetnx", key, "maxsize", options.maxsize],
                    ["hsetnx", key, "created", resp[0]],
                    ["hsetnx", key, "modified", resp[0]],
                ];
                // using pipeline
                this.redis.multi(mc).exec().then((resp) => {
                    if (get(resp, '0.1') === 0) {
                        return reject('queueExists');
                    }
                    this.redis.sadd(`${this.redisns}QUEUES`, options.qname).then(resp => {
                        return resolve()
                    })
                })
            })
        })
    }

    sendMessage(options) {
        return new Promise((resolve, reject) => {
            this.__getQueue(options.qname, true).then(q => {
                if (typeof options.message !== "string") {
                    return reject('messageNotString')
                }
                if (q.maxsize !== -1 && options.message.length > q.maxsize) {
                    return reject('messageTooLong')
                }
                const key = `${this.redisns}${options.qname}`;
                const mc = [
                    ["zadd", key, q.ts, q.uid],
                    ["hset", `${key}:Q`, q.uid, options.message],
                    ["hincrby", `${key}:Q`, "totalsent", 1]
                ];
                this.redis.multi(mc).exec().then(resp => resolve(resp))
            })
        })
    }

    __getQueue(qname, uid) {
        const mc = [
            ["hmget", `${this.redisns}${qname}:Q`, "maxsize"],
            ["time"]
        ];
        return new Promise((resolve, reject) => {
            this.redis.multi(mc).exec().then((resp) => {
                if (resp[0][1][0] === null ) {
                    return reject('queueNotFound')
                }
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
                return resolve(q);
            })
        })
    }

    // 接受消息后的处理流程
    _handleReceivedMessage(resp) {
        if (!resp || !resp.length) {
            return { }
        }
        const o = {
            id: resp[0],
            message: resp[1],
            rc: resp[2],
            fr: Number(resp[3]),
            // sent: Number(parseInt(resp[0].slice(0, 10), 36) / 1000)
        };
        return o;
    };

    listQueues() {
        return new Promise((resolve, reject) => {
            this.redis.smembers(`${this.redisns}QUEUES`).then(resp => resolve(resp))
        })
    }

    _receiveMessage (options, q) {
        return new Promise((resolve, reject) => {
            this.redis.evalsha(this.receiveMessage_sha1, 2, `${this.redisns}${options.qname}`, q.ts).then((resp) => {
                return resolve(this._handleReceivedMessage(resp));
            })
        })
    };

    receiveMessage(options) {
        return new Promise((resolve, reject) => {
            this.__getQueue(options.qname, false).then((q) => {
                options.vt = options.vt != null ? options.vt : q.vt;
                if (this.receiveMessage_sha1) {
                    return this._receiveMessage(options, q).then(result => resolve(result))
                }
                this.on("scriptload:receiveMessage", () => {
                    this._receiveMessage(options, q).then(result => resolve(result))
                });
            }, (err) => reject(err))
        })
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
}

module.exports = RedisMQ