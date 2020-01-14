async function initScript(redis) {
    const script_receiveMessage = `local msg = redis.call("ZRANGEBYSCORE", KEYS[1], "-inf", KEYS[2], "LIMIT", "0", "1")
			if #msg == 0 then
				return {}
			end
			redis.call("HINCRBY", KEYS[1] .. ":Q", "totalrecv", 1)
			local mbody = redis.call("HGET", KEYS[1] .. ":Q", msg[1])
			local o = {msg[1], mbody}
			redis.call("ZREM", KEYS[1], msg[1])
			redis.call("HDEL", KEYS[1] .. ":Q", msg[1], msg[1] .. ":rc", msg[1] .. ":fr")
			return o`;
	redis.script("load", script_receiveMessage).then((id) => {
		this.receiveMessage_sha1 = id;
		this.emit("scriptload:receiveMessage");
	})
};

module.exports = initScript;
