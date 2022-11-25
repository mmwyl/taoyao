/** 桃夭WebRTC终端核心功能 */
/** 兼容 */
const RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
const RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription;
/** 默认音频配置 */
const defaultAudioConfig = {
	// 音量：0~1
	volume: 0.5,
	// 延迟大小（单位毫秒）：500毫秒以内较好
	latency: 0.4,
	// 设备
	// deviceId : '',
	// 采样率：8000|16000|32000|48000
	sampleRate: 48000,
	// 采样数：16
	sampleSize: 16,
	// 声道数量：1|2
	channelCount : 1,
	// 是否开启自动增益：true|false
	autoGainControl: false,
	// 是否开启降噪功能：true|false
	noiseSuppression: true,
	// 是否开启回音消除：true|false
	echoCancellation: true,
	// 消除回音方式：system|browser
	echoCancellationType: 'system'
};
/** 默认视频配置 */
const defaultVideoConfig = {
	// 宽度
	width: 1280,
	// 高度
	height: 720,
	// 设备
	// deviceId: '', 
	// 帧率
	frameRate: 24,
	// 裁切
	// resizeMode: '',
	// 选摄像头：user|left|right|environment 
	facingMode: 'environment'
}
/** 默认RTCPeerConnection配置 */
const defaultRPCConfig = {
	// ICE代理的服务器
	iceServers: null,
	// 传输通道绑定策略：balanced|max-compat|max-bundle
	bundlePolicy: 'balanced',
	// RTCP多路复用策略：require|negotiate
	rtcpMuxPolicy: 'require',
	// ICE传输策略：all|relay
	iceTransportPolicy: 'all'
	// ICE候选个数
	// iceCandidatePoolSize: 8
}
/** 信令配置 */
const signalConfig = {
	/** 当前终端SN */
	sn: 'taoyao',
	/** 当前版本 */
	version: '1.0.0',
	// 信令授权
	username: 'taoyao',
	password: 'taoyao'
};
/** 信令协议 */
const signalProtocol = {
	/** 直播信令 */
	live: {
	},
	/** 媒体信令 */
	media: {
	},
	/** 终端信令 */
	client: {
		/** 注册 */
		register:  2000,
		/** 下发配置 */
		config: 2004,
		/** 心跳 */
		heartbeat: 2005,
		/** 重启终端 */
		reboot: 2997,
	},
	/** 会议信令 */
	meeting: {
		/** 创建会议信令 */
		create: 4000,
		/** 进入会议信令 */
		enter: 4002,
	},
	/** 平台信令 */
	platform: {
		/** 异常 */
		error: 1999
	},
	/** 当前索引 */
	index: 100000,
	/** 最小索引 */
	minIndex: 100000,
	/** 最大索引 */
	maxIndex: 999999,
	/** 生成索引 */
	buildId: function() {
		if(this.index++ >= this.maxIndex) {
			this.index = this.minIndex;
		}
		return Date.now() + '' + this.index;
	},
	/** 生成信令消息 */
	buildProtocol: function(sn, pid, body, id) {
		let message = {
			header: {
				v: signalConfig.version,
				id: id || this.buildId(),
				sn: sn,
				pid: pid,
			},
			'body': body
		};
		return message;
	}
};
/** 信令通道 */
const signalChannel = {
	/** 桃夭 */
	taoyao: null,
	/** 通道 */
	channel: null,
	/** 地址 */
	address: null,
	/** 回调 */
	callback: null,
	/** 回调事件 */
	callbackMapping: new Map(),
	/** 心跳时间 */
	heartbeatTime: 30 * 1000,
	/** 心跳定时器 */
	heartbeatTimer: null,
	/** 重连定时器 */
	reconnectTimer: null,
	/** 防止重复重连 */
	lockReconnect: false,
	/** 当前重连时间 */
	connectionTimeout: 5 * 1000,
	/** 最小重连时间 */
	minReconnectionDelay: 5 * 1000,
	/** 最大重连时间 */
	maxReconnectionDelay: 60 * 1000,
	/** 重连失败时间增长倍数 */
	reconnectionDelayGrowFactor: 2,
	/** 心跳 */
	heartbeat: function() {
		let self = this;
		if(self.heartbeatTimer) {
			clearTimeout(self.heartbeatTimer);
		}
		self.heartbeatTimer = setTimeout(function() {
			if (self.channel && self.channel.readyState == WebSocket.OPEN) {
				self.push(signalProtocol.buildProtocol(
					signalConfig.sn,
					signalProtocol.client.heartbeat,
					{
						signal: 100,
						battery: 100
					}
				));
				self.heartbeat();
			} else {
				console.warn('发送心跳失败', self.channel);
			}
		}, self.heartbeatTime);
	},
	/** 连接 */
	connect: function(address, callback, reconnection = true) {
		let self = this;
		self.address = address;
		self.callback = callback;
		return new Promise((resolve, reject) => {
			console.debug('连接信令通道', address);
			self.channel = new WebSocket(address);
			self.channel.onopen = function(e) {
				console.debug('打开信令通道', e);
				// 注册终端
				self.push(signalProtocol.buildProtocol(
					signalConfig.sn,
					signalProtocol.client.register,
					{
						ip: null,
						mac: null,
						signal: 100,
						battery: 100,
						username: signalConfig.username,
						password: signalConfig.password
					}
				));
				// 重置时间
				self.connectionTimeout = self.minReconnectionDelay
				// 开始心跳
				self.heartbeat();
				// 成功回调
				resolve(e);
			};
			self.channel.onclose = function(e) {
				console.error('信令通道关闭', self.channel, e);
				if(reconnection) {
					self.reconnect();
				}
				reject(e);
			};
			self.channel.onerror = function(e) {
				console.error('信令通道异常', self.channel, e);
				if(reconnection) {
					self.reconnect();
				}
				reject(e);
			};
			/**
			 * 回调策略：
			 * 1. 如果注册请求回调，同时执行结果返回true不再执行后面所有回调。
			 * 2. 如果注册全局回调，同时执行结果返回true不再执行后面所有回调。
			 * 3. 如果前面所有回调没有返回true执行默认回调。
			 */
			self.channel.onmessage = function(e) {
				console.debug('信令通道消息', e.data);
				let done = false;
				let data = JSON.parse(e.data);
				// 请求回调
				if(self.callbackMapping.has(data.header.id)) {
					try {
						done = self.callbackMapping.get(data.header.id)(data);
					} finally {
						self.callbackMapping.delete(data.header.id);
					}
				}
				// 全局回调
				if(self.callback) {
					done = self.callback(data);
				}
				// 默认回调
				if(!done) {
					self.defaultCallback(data);
				}
			};
		});
	},
	/** 重连 */
	reconnect: function() {
		let self = this;
		if (self.lockReconnect) {
			return;
		}
		self.lockReconnect = true;
		// 关闭旧的通道
		if(self.channel && self.channel.readyState == WebSocket.OPEN) {
			self.channel.close();
			self.channel = null;
		}
		if(self.reconnectTimer) {
			clearTimeout(self.reconnectTimer);
		}
		// 打开定时重连
		self.reconnectTimer = setTimeout(function() {
			console.info('信令通道重连', self.address, new Date());
			self.connect(self.address, self.callback, true);
			self.lockReconnect = false;
		}, self.connectionTimeout);
		if (self.connectionTimeout >= self.maxReconnectionDelay) {
			self.connectionTimeout = self.maxReconnectionDelay;
		} else {
			self.connectionTimeout = self.connectionTimeout * self.reconnectionDelayGrowFactor
		}
	},
	/** 发送消息 */
	push: function(data, callback) {
		// 注册回调
		if(data && callback) {
			this.callbackMapping.set(data.header.id, callback);
		}
		// 发送消息
		if(data && data.header) {
			this.channel.send(JSON.stringify(data));
		} else {
			this.channel.send(data);
		}
	},
	/** 关闭通道 */
	close: function() {
		clearTimeout(this.heartbeatTimer);
	},
	/** 默认回调 */
	defaultCallback: function(data) {
		console.debug('没有适配信令消息默认处理', data);
		switch(data.header.pid) {
		case signalProtocol.client.register:
		break;
		case signalProtocol.client.config:
			this.defaultClientConfig(data);
		break;
		case signalProtocol.client.heartbeat:
		break;
		case signalProtocol.client.reboot:
			this.defaultClientReboot(data);
		break;
		case signalProtocol.meeting.create:
		break;
		case signalProtocol.meeting.enter:
		break;
		case signalProtocol.platform.error:
			console.error('信令发生错误', data);
		break;
		}
	},
	/** 终端默认回调 */
	defaultClientConfig: function(data) {
		this.taoyao
			.configMedia(data.body.media)
			.configWebrtc(data.body.webrtc);
	},
	defaultClientReboot: function(data) {
		console.info('重启终端');
		location.reload();
	},
	/** 默认媒体回调 */
	defaultMediaSubscribe: function(data) {
		
	},
	/** 会议默认回调 */
	defaultMeetingEnter: function(data) {
		this.taoyao
			.mediaSubscribe(data.body.sn);
	}
};
/** 终端 */
function TaoyaoClient(
	sn
) {
	/** 终端标识 */
	this.sn = sn;
	/** 视频对象 */
	this.video = null;
	/** 媒体信息 */
	this.stream = null;
	this.audioTrack = null;
	this.videoTrack = null;
	/** 媒体状态 */
	this.audioStatus = false;
	this.videoStatus = false;
	this.recordStatus = false;
	/** 播放视频 */
	this.play = async function() {
		await this.video.play();
		return this;
	};
	/** 重新加载 */
	this.load = function() {
		this.video.load();
		return this;
	}
	/** 暂停视频 */
	this.pause = function() {
		this.video.pause();
		return this;
	};
	/** 关闭视频 */
	this.close = function() {
		this.video.close();
		return this;
	};
	/** 设置视频对象 */
	this.buildVideo = async function(videoId, stream) {
		if(!this.video) {
			this.video = document.getElementById(videoId);
		}
		await this.buildStream(stream);
		return this;
	};
	/** 设置媒体流 */
	this.buildStream = async function(stream) {
		if(stream) {
			this.stream = stream;
			this.video.srcObject = stream;
			let audioTrack = stream.getAudioTracks();
			let videoTrack = stream.getVideoTracks();
			if(audioTrack && audioTrack.length) {
				this.audioTrack = audioTrack;
				this.audioStatus = true;
			}
			if(videoTrack && videoTrack.length) {
				this.videoTrack = videoTrack;
				this.videoStatus = true;
			}
			console.debug('设置媒体流', this.stream, this.audioTrack, this.videoTrack);
			await this.play();
		}
		return this;
	};
	/** 设置音频流 */
	this.buildAudioTrack = function() {
		// 关闭旧的
		// 创建新的
	};
	/** 设置视频流 */
	this.buildVideoTrack = function() {
		// 关闭旧的
		// 创建新的
	};
}
/** 桃夭 */
function Taoyao(
	webSocket
) {
	/** WebRTC配置 */
	this.webrtc = null;
	/** WebSocket地址 */
	this.webSocket = webSocket;
	/** 设备状态 */
	this.audioEnabled = true;
	this.videoEnabled = true;
	/** 媒体配置 */
	this.audioConfig = defaultAudioConfig;
	this.videoConfig = defaultVideoConfig;
	/** 发送信令 */
	this.push = null;
	/** 本地终端 */
	this.localClient = null;
	this.localMediaChannel = null;
	/** 远程终端 */
	this.remoteClient = [];
	this.remoteMediaChannel = null;
	/** 信令通道 */
	this.signalChannel = null;
	/** 检查设备 */
	this.checkDevice = function() {
		let self = this;
		if(
			navigator.mediaDevices &&
			navigator.mediaDevices.getUserMedia &&
			navigator.mediaDevices.enumerateDevices
		) {
			navigator.mediaDevices.enumerateDevices()
			.then(list => {
				let audioDevice = false;
				let videoDevice = false;
				list.forEach(v => {
					console.debug('终端媒体设备', v.kind, v.label);
					switch(v.kind) {
					case 'audioinput':
						audioDevice = true;
					break;
					case 'videoinput':
						videoDevice = true;
					break;
					default:
						console.debug('没有适配设备', v.kind, v.label);
					break;
					}
				});
				if(!audioDevice) {
					console.warn('终端没有音频输入设备');
					self.audioEnabled = false;
				}
				if(!videoDevice) {
					console.warn('终端没有视频输入设备');
					self.videoEnabled = false;
				}
			})
			.catch(e => {
				console.error('检查终端设备异常', e);
				self.videoEnabled = false;
				self.videoEnabled = false;
			});
		} else {
			throw new Error('不支持的终端设备');
		}
		return this;
	};
	/** 媒体配置 */
	this.configMedia = function(audio = {}, video = {}) {
		this.audioConfig = {...this.audioConfig, ...audio};
		this.videoCofnig = {...this.videoCofnig, ...video};
		console.debug('终端媒体配置', this.audioConfig, this.videoConfig);
		return this;
	};
	/** WebRTC配置 */
	this.configWebrtc = function(config = {}) {
		this.webrtc = config;
		this.webSocket = this.webrtc.signalAddress;
		defaultRPCConfig.iceServers = this.webrtc.stun.map(v => ({'urls': v}));
		console.debug('WebRTC配置', this.webrtc, defaultRPCConfig);
		return this;
	};
	/** 打开信令通道 */
	this.buildChannel = function(callback) {
		signalChannel.taoyao = this;
		this.signalChannel = signalChannel;
		// 不能直接this.push = this.signalChannel.push这样导致this对象错误
		this.push = function(data, callback) {
			this.signalChannel.push(data, callback)
		};
		return this.signalChannel.connect(this.webSocket, callback);
	};
	/** 打开本地媒体 */
	this.buildLocalMedia = function() {
		console.debug('打开终端媒体', this.audioConfig, this.videoConfig);
		let self = this;
		this.checkDevice();
		return new Promise((resolve, reject) => {
			navigator.mediaDevices.getUserMedia({
				audio: self.audioConfig,
				video: self.videoConfig
			})
			.then(resolve)
			.catch(reject);
			// 兼容旧版
			// navigator.getUserMedia({
			// 	audio: self.audioConfig,
			// 	video: self.videoConfig
			// }, resolve, reject);
		});
	};
	/** 远程终端过滤 */
	this.remoteClientFilter = function(sn) {
		let array = this.remoteClient.filter(v => v.sn === sn);
		if(array.length <= 0) {
			return null;
		}
		return this.remoteClient.filter(v => v.sn === sn)[0];
	}
	/** 关闭：关闭媒体 */
	this.close = function() {
		// TODO：释放资源
	};
	/** 关机：关闭媒体、关闭信令 */
	this.shutdown = function() {
		this.close();
	};
	/** 打开媒体通道 */
	this.buildMediaChannel = async function(localVideoId, stream) {
		// 本地视频
		this.localClient = new TaoyaoClient(signalConfig.sn);
		await this.localClient.buildVideo(localVideoId, stream);
		// 本地通道
		this.localMediaChannel = new RTCPeerConnection(defaultRPCConfig);
		if(this.localClient.audioTrack) {
			this.localClient.audioTrack.forEach(v => this.localMediaChannel.addTrack(v, this.localClient.stream));
		}
		if(this.localClient.videoTrack) {
			this.localClient.videoTrack.forEach(v => this.localMediaChannel.addTrack(v, this.localClient.stream));
		}
		this.localMediaChannel.ontrack = this.localMediaChannelTrack;
		this.localMediaChannel.ondatachannel = this.localMediaChannelDataChannel;
		this.localMediaChannel.onicecandidate = this.localMediaChannelIceCandidate;
		// 远程通道
		this.remoteMediaChannel = new RTCPeerConnection(defaultRPCConfig);
		this.remoteMediaChannel.ontrack = this.remoteMediaChannelTrack;
		this.remoteMediaChannel.ondatachannel = this.remoteMediaChannelDataChannel;
		this.remoteMediaChannel.onicecandidate = this.remoteMediaChannelIceCandidate;
		return this;
	};
	/** 本地 */
	this.localMediaChannelTrack = function() {
	};
	this.localMediaChannelDataChannel = function(channel) {
		channel.onopen = function() {
			console.debug('DataChannel Open');
		}
		channel.onmessage = function(data) {
			console.debug('DataChannel Message', data);
		}
		channel.onclose = function() {
			console.debug('DataChannel Close');
		}
		channel.onerror = function(e) {
			console.debug('DataChannel Error', e);
		}
	};
	this.localMediaChannelIceCandidate = function() {
	};
	/** 远程 */
	this.localMediaChannelTrack = function() {
	};
	this.localMediaChannelDataChannel = function(channel) {
		channel.onopen = function() {
			console.debug('DataChannel Open');
		}
		channel.onmessage = function(data) {
			console.debug('DataChannel Message', data);
		}
		channel.onclose = function() {
			console.debug('DataChannel Close');
		}
		channel.onerror = function(e) {
			console.debug('DataChannel Error', e);
		}
	};
	this.localMediaChannelIceCandidate = function() {
	};
	/** 媒体信令 */
	this.mediaSubscribe = function(sn, callback) {
		let self = this;
		if(self.webrtc.model === 'MESH') {
			self.localMediaChannel.createOffer().then(description => {
				console.debug('Local Create Offer', description);
				self.localMediaChannel.setLocalDescription(description);
			});
		}
	};
	/** 会议信令 */
	this.meetingCreate = function(callback) {
		let self = this;
		self.push(signalProtocol.buildProtocol(
			signalConfig.sn,
			signalProtocol.meeting.create,
		), callback);
	}
	this.meetingEnter = function(id, callback) {
		let self = this;
		self.push(signalProtocol.buildProtocol(
			signalConfig.sn,
			signalProtocol.meeting.enter,
			{
				id: id
			}
		), callback);
	};
};
/*
var peer;
var socket; // WebSocket
var supportStream = false; // 是否支持使用数据流
var localVideo; // 本地视频
var localVideoStream; // 本地视频流
var remoteVideo; // 远程视频
var remoteVideoStream; // 远程视频流
var initiator = false; // 是否已经有人在等待
var started = false; // 是否开始
var channelReady = false; // 是否打开WebSocket通道
// 初始
function initialize() {
	console.log("初始聊天");
	// 获取视频
	localVideo = document.getElementById("localVideo");
	remoteVideo = document.getElementById("remoteVideo");
	supportStream = "srcObject" in localVideo;
	// 显示状态
	if (initiator) {
		setNotice("开始连接");
	} else {
		setNotice("加入聊天：https://www.acgist.com/demo/video/?oid=FFB85D84AC56DAF88B7E22AFFA7533D3");
	}
	// 打开WebSocket
	openChannel();
	// 创建终端媒体
	buildUserMedia();
}
function openChannel() {
	console.log("打开WebSocket");
	socket = new WebSocket("wss://www.acgist.com/video.ws/FFB85D84AC56DAF88B7E22AFFA7533D3");
	socket.onopen = channelOpened;
	socket.onmessage = channelMessage;
	socket.onclose = channelClosed;
	socket.onerror = channelError;
}
function channelOpened() {
	console.log("打开WebSocket成功");
	channelReady = true;
}
function channelMessage(message) {
	console.log("收到消息：" + message.data);
	var msg = JSON.parse(message.data);
	if (msg.type === "offer") { // 处理Offer消息
		if (!initiator && !started) {
			connectPeer();
		}
		peer.setRemoteDescription(new RTCSessionDescription(msg));
		peer.createAnswer().then(buildLocalDescription);
	} else if (msg.type === "answer" && started) { // 处理Answer消息
		peer.setRemoteDescription(new RTCSessionDescription(msg));
	} else if (msg.type === "candidate" && started) {
		var candidate = new RTCIceCandidate({
			sdpMLineIndex : msg.label,
			candidate : msg.candidate
		});
		peer.addIceCandidate(candidate);
	} else if (msg.type === "bye" && started) {
		onRemoteClose();
		setNotice("对方已断开！");
	} else if(msg.type === "nowaiting") {
		onRemoteClose();
		setNotice("对方已离开！");
	}
}
function channelClosed() {
	console.log("关闭WebSocket");
	openChannel(); // 重新打开WebSocket
}
function channelError(event) {
	console.log("WebSocket异常：" + event);
}
function buildUserMedia() {
	console.log("获取终端媒体");
	if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
		navigator.mediaDevices.getUserMedia({
			"audio" : true,
			"video" : true
		})
		.then(onUserMediaSuccess)
		.catch(onUserMediaError);
	} else {
		navigator.getUserMedia({
			"audio" : true,
			"video" : true
		}, onUserMediaSuccess, onUserMediaError);
	}
}
function onUserMediaSuccess(stream) {
	localVideoStream = stream;
	if (supportStream) {
		localVideo.srcObject = localVideoStream;
	} else {
		localVideo.src = URL.createObjectURL(localVideoStream);
	}
	if (initiator) {
		connectPeer();
	}
}
function onUserMediaError(error) {
	alert("请打开摄像头！");
}
function connectPeer() {
	if (!started && localVideoStream && channelReady) {
		console.log("开始连接Peer");
		started = true;
		buildPeerConnection();
		peer.addStream(localVideoStream);
		if (initiator) {
			peer.createOffer().then(buildLocalDescription);
		}
	}
}
function buildPeerConnection() {
	//var server = {"iceServers" : [{"url" : "stun:stun.l.google.com:19302"}]};
	var server = {"iceServers" : [{"url" : "stun:stun1.l.google.com:19302"}]};
	peer = new PeerConnection(server);
	peer.onicecandidate = peerIceCandidate;
	peer.onconnecting = peerConnecting;
	peer.onopen = peerOpened;
	peer.onaddstream = peerAddStream;
	peer.onremovestream = peerRemoveStream;
}
function peerIceCandidate(event) {
	if (event.candidate) {
		sendMessage({
			type : "candidate",
			id : event.candidate.sdpMid,
			label : event.candidate.sdpMLineIndex,
			candidate : event.candidate.candidate
		});
	} else {
		console.log("不支持的candidate");
	}
}
function peerConnecting(message) {
	console.log("Peer连接");
}
function peerOpened(message) {
	console.log("Peer打开");
}
function peerAddStream(event) {
	console.log("远程视频添加");
	remoteVideoStream = event.stream;
	if(supportStream) {
		remoteVideo.srcObject = remoteVideoStream;
	} else {
		remoteVideo.src = URL.createObjectURL(remoteVideoStream);
	}
	setNotice("连接成功");
	waitForRemoteVideo();
}
function peerRemoveStream(event) {
	console.log("远程视频移除");
}
function buildLocalDescription(description) {
	peer.setLocalDescription(description);
	sendMessage(description);
}
function sendMessage(message) {
	var msgJson = JSON.stringify(message);
	socket.send(msgJson);
	console.log("发送信息：" + msgJson);
}
function setNotice(msg) {
	document.getElementById("footer").innerHTML = msg;
}
function onRemoteClose() {
	started = false;
	initiator = false;
	if(supportStream) {
		remoteVideo.srcObject = null;
	} else {
		remoteVideo.src = null;
	}
	peer.close();
}
function waitForRemoteVideo() {
	if (remoteVideo.currentTime > 0) { // 判断远程视频长度
		setNotice("连接成功！");
	} else {
		setTimeout(waitForRemoteVideo, 100);
	}
}
window.onbeforeunload = function() {
	sendMessage({type : "bye"});
	if(peer) {
		peer.close();
	}
	socket.close();
}
if(!WebSocket) {
	alert("你的浏览器不支持WebSocket！");
} else if(!PeerConnection) {
	alert("你的浏览器不支持RTCPeerConnection！");
} else {
	setTimeout(initialize, 100); // 加载完成调用初始化方法
}
window.onbeforeunload = function() {
	socket.close();
}
*/