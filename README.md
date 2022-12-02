# 桃夭

基于WebRTC实现信令服务，实现Mesh、MCU和SFU三种媒体通信架构，支持直播会议两种场景。<br />
项目提供WebRTC服务信令，终端已有H5示例，其他终端需要自己实现。

## 模块

|模块|名称|描述|
|:--|:--|:--|
|taoyao|桃夭|桃之夭夭灼灼其华|
|taoyao-boot|基础|基础模块|
|taoyao-live|直播|直播、连麦、本地视频同看|
|taoyao-test|测试|测试模块|
|taoyao-media|媒体|录制<br />音频（降噪、混音、变声）<br />视频（水印、美颜、AI识别）|
|taoyao-signal|信令|信令服务|
|taoyao-server|服务|启动服务|
|taoyao-meeting|会议|会议模式、广播模式、单人对讲|
|taoyao-webrtc|WebRTC|WebRTC模块|
|taoyao-webrtc-sfu|SFU架构|SFU架构|
|taoyao-webrtc-mcu|MCU架构|MCU架构|
|taoyao-webrtc-mesh|MESH架构|MESH架构|
|taoyao-webrtc-kurento|kurento框架|WebRTC协议簇kurento实现|

## 模块关系

```
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                        taoyao-server                          |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|            taoyao-live            |      taoyao-meeting       |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                        taoyao-media                           |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|   taoyao-sfu   /   taoyao-mcu     |                           |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+      taoyao-mesh          +
|         taoyao-kurento            |                           |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                        taoyao-signal                          |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                         taoyao-boot                           |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

> 综合比较`jitsi`|`kurento`两个框架最后选择`kurento`框架作为基础框架

## 架构比较

### Mesh

流媒体点对点连接，不经过服务端。

#### 注意事项

* ~~直播~~
* 会议：一对一、~~多对多~~
* ~~媒体：录制、降噪、美颜等等~~
* 可能需要自己搭建`coturn`服务实现`STUN`/`TURN`内网穿透功能

### MCU/SFU

终端推流到服务端，由服务端处理后分流。

#### 注意事项

* 需要安装[KMS服务](./docs/Deploy.md#kmskurento-media-server)