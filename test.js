const EventEmitter = require('events');

class MyEmitter extends EventEmitter {}

const myEmitter = new MyEmitter();

myEmitter.emit('event');

myEmitter.on('event', () => {
    console.log('an event occurred!');
});
