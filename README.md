## 使用 redis 做队列同步消息到 ES/HBase


script_receiveMessage lua脚本的处理逻辑
```nashorn js
script_receiveMessage
```
1. 从有序集合表(rsmq:zwn1)获取最近一个消息，如果没有，直接返回空对象。
2. 修改有序集合((rsmq:zwn1))中的 score。用最新获取的 score 设置原来的 score 值。
3. 修改 Hash 表(rsmq:zwn1:Q) 中的 totalrecv(表示总共发送了多少次消息)。
4. 从 Hash 表中获取消息。
5. 更新 Hash 表下该消息被收到的次数(和 totalrecv 区分开，因为 totalrecv 是所有的消息接收的次数，而 fjgjvy2876pGJlZh9UWWqbVBwqmWg1jw:rc 表示特定消息的接收次数)。
6. 获取 o 对象。``local o = {msg[1], mbody, rc}` o 对象中包括消息 id 。消息内容。和 特定消息的接收次数
7. 判断 rc 是否是 1。
    如果不是 1，说明此消息曾经被收到过。从 Hash 表的 ``fjgjvy2876pGJlZh9UWWqbVBwqmWg1jw:fr` field 中获取第一次接收到的该消息的时间。然后放入 o 中返回
    如果是 1 。 说明此消息是第一次被接收。然后设置第一次被接受的时间为 key2 .


[https://dev.to/usamaashraf/using-events-in-nodejs-the-right-way-449b]

```js
This approach causes our components to be much more decoupled. 
Basically, as we continue to write an application we’ll identify 
events along the way, fire them at the right time and attach one or more event 
listeners to each one. Extending functionality becomes much easier since we can just 
add on more listeners to a particular event without tampering with the existing 
listeners or the part of the application where the event was fired from. 
What we’re talking about is essentially the Observer pattern.

```
event 的方式使的组件(函数)之间的更加解耦。

[https://www.zhihu.com/question/30116462]

``
Event的方式。我用的不多，我认为的他最大的缺点就是把流程打乱了。你的代码爱怎么写怎么写，最后通过事件能串起来就行。Event适合模块之间通信用，而不适合控制流程。

``



1 创建队列


2 消费消息时
消费消息时使用一个定时器功能。然后可以保证保证消息到来后，可以被实时消费掉。











【更新】
1. 创建 mq。
2. 发送消息
3. 接受消息
























