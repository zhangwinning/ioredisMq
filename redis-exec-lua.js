

const RedisSMQ = require("rsmq");



const rsmq = new RedisSMQ( {host: "127.0.0.1", port: 6379, ns: "rsmq"} );


async function test() {

    const script_receiveMessage = `
        local msg = redis.call("ZRANGEBYSCORE", KEYS[1], "-inf", KEYS[2], "LIMIT", "0", "1")
        if #msg == 0 then
            return { }
        end
        redis.call("ZADD", KEYS[1], KEYS[3], msg[1])
        redis.call("HINCRBY", KEYS[1] .. ":Q", "totalrecv", 1)
        local mbody = redis.call("HGET", KEYS[1] .. ":Q", msg[1])
        local rc = redis.call("HINCRBY", KEYS[1] .. ":Q", msg[1] .. ":rc", 1)
        local o = {msg[1], mbody, rc}
        local fr = redis.call("HGET", KEYS[1] .. ":Q", msg[1] .. ":fr")
        table.insert(o, fr)
        return o`;

    rsmq.redis.script("load", script_receiveMessage, (err, resp) => {
        // if (err) {
        //     console.log(err);
        //     return;
        // }
        // this.receiveMessage_sha1 = resp;
        // this.emit("scriptload:receiveMessage");
        console.log('===>', err, resp)
        rsmq.redis.evalsha(resp, 3, `rsmq:zwn1`, "1578297866989", "1578297866979", (err, data) => {
            console.log('---->', err, data)
        });

    });
}

test()
