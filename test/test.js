MQ = require("../lib");
should = require("should");
describe('Redis-Simple-Message-Queue Test', function() {
    var mq = null
    let queue1 = {
        qname : 'test1',
        message1 : 'hello world',
        message2 : 'hello world2'
    }
    before(function(done) {
        done();
    });

    after(function(done) {
        mq.deleteQueue({qname: queue1.qname}).then((resp) => {
            done()
        })
    })

    it('get a mq instance', function(done) {
        mq = new MQ()
        mq.should.be.an.instanceOf(MQ);
        done()
    })
    describe('Queues', function() {
       it('should create a queue', function(done) {
            mq.createQueue({qname: queue1.qname}).then((resp) => done())
       })
       it('should send a message1', function(done) {
           mq.sendMessage({qname: queue1.qname, message: queue1.message1}).then((resp) => {
               done()
           })
       })
       it('should send another message2', function(done) {
            mq.sendMessage({qname: queue1.qname, message: queue1.message2}).then((resp) => {
                done()
            })
        })
        it('should receive a message', function(done) {
            mq.receiveMessage({qname: queue1.qname}).then((resp) => {
                resp.message.should.equal(queue1.message1)
                done()
            })
        })
        it('should receive another message', function(done) {
            mq.receiveMessage({qname: queue1.qname}).then((resp) => {
                resp.message.should.equal(queue1.message2)
                done()
            })
        })
        it('should fail: receive another message - no availabe message', (done) => {
            mq.receiveMessage({qname: queue1.qname}).then((resp) => {
                should.not.exist(resp.id);
                done()
            })
        })
    })
})