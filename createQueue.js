const RedisSMQ = require("rsmq");



const rsmq = new RedisSMQ( {host: "127.0.0.1", port: 6379, ns: "rsmq"} );


// console.log('===<>', rsmq)
// rsmq.createQueue({ qname: "zwn1" }, function (err, resp) {
//     if (err) {
//         console.error(err)
//         return
//     }
//
//     if (resp === 1) {
//         console.log("queue created")
//     }
// });

// rsmq.listQueues(function (err, queues) {
//     if (err) {
//         console.error(err)
//         return
//     }
//
//     console.log("Active queues: " + queues.join( "," ) )
// });

// rsmq.getQueueAttributes({ qname: "zwn1" }, function (err, resp) {
//     if (err) {
//         console.error(err);
//         return;
//     }
//
//     console.log("==============================================");
//     console.log("=================Queue Stats==================");
//     console.log("==============================================");
//     console.log("visibility timeout: ", resp.vt);
//     console.log("delay for new messages: ", resp.delay);
//     console.log("max size in bytes: ", resp.maxsize);
//     console.log("total received messages: ", resp.totalrecv);
//     console.log("total sent messages: ", resp.totalsent);
//     console.log("created: ", resp.created);
//     console.log("last modified: ", resp.modified);
//     console.log("current n of messages: ", resp.msgs);
//     console.log("hidden messages: ", resp.hiddenmsgs);
// });

rsmq.sendMessage({ qname: "zwn1", message: "Hello Worldasdfg"}, function (err, resp) {
    if (err) {
        console.error(err)
        return
    }

    console.log("Message sent. ID:", resp);
});

// console.log(rsmq)
