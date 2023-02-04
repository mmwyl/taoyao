/**
 * 配置
 */
const os = require("os");

module.exports = {
  // 系统名称
  name: "taoyao-media-server",
  // 交互式命令行
  command: true,
  // 日志级别
  logLevel: 'DEBUG',
  // 信令服务
  https: {
    listenIp: "0.0.0.0",
    listenPort: process.env.HTTPS_LISTEN_PORT || 4443,
    // WebSocket连接密码
    username: "taoyao",
    password: "taoyao",
    tls: {
      cert:
        process.env.HTTPS_CERT_PUBLIC_KEY || `${__dirname}/certs/publicKey.pem`,
      key:
        process.env.HTTPS_CERT_PRIVATE_KEY ||
        `${__dirname}/certs/privateKey.pem`,
    },
  },
  // Mediasoup
  mediasoup: {
    // 按照CPU数量配置进程数量
    numWorkers: Object.keys(os.cpus()).length,
    // Worker：https://mediasoup.org/documentation/v3/mediasoup/api/#WorkerSettings
    workerSettings: {
      logLevel: "warn",
      logTags: [
        "bwe",
        "ice",
        "rtp",
        "rtx",
        "svc",
        "dtls",
        "info",
        "sctp",
        "srtp",
        "rtcp",
        "score",
        "message",
        "simulcast",
      ],
      rtcMinPort: process.env.MEDIASOUP_MIN_PORT || 40000,
      rtcMaxPort: process.env.MEDIASOUP_MAX_PORT || 49999,
    },
    // Router：https://mediasoup.org/documentation/v3/mediasoup/api/#RouterOptions
    routerOptions: {
      mediaCodecs: [
        {
          kind: "audio",
          mimeType: "audio/opus",
          clockRate: 48000,
          channels: 2,
        },
        {
          kind: "video",
          mimeType: "video/VP8",
          clockRate: 90000,
          parameters: {
            "x-google-start-bitrate": 1000,
          },
        },
        {
          kind: "video",
          mimeType: "video/VP9",
          clockRate: 90000,
          parameters: {
            "profile-id": 2,
            "x-google-start-bitrate": 1000,
          },
        },
        {
          kind: "video",
          mimeType: "video/h264",
          clockRate: 90000,
          parameters: {
            "packetization-mode": 1,
            "profile-level-id": "4d0032",
            "level-asymmetry-allowed": 1,
            "x-google-start-bitrate": 1000,
          },
        },
        {
          kind: "video",
          mimeType: "video/h264",
          clockRate: 90000,
          parameters: {
            "packetization-mode": 1,
            "profile-level-id": "42e01f",
            "level-asymmetry-allowed": 1,
            "x-google-start-bitrate": 1000,
          },
        },
      ],
    },
    // WebRtcServer：https://mediasoup.org/documentation/v3/mediasoup/api/#WebRtcServerOptions
    webRtcServerOptions: {
      listenInfos: [
        {
          protocol: "udp",
          ip: process.env.MEDIASOUP_LISTEN_IP || "0.0.0.0",
          announcedIp: process.env.MEDIASOUP_ANNOUNCED_IP,
          port: 44444,
        },
        {
          protocol: "tcp",
          ip: process.env.MEDIASOUP_LISTEN_IP || "0.0.0.0",
          announcedIp: process.env.MEDIASOUP_ANNOUNCED_IP,
          port: 44444,
        },
      ],
    },
    // WebRtcTransport：https://mediasoup.org/documentation/v3/mediasoup/api/#WebRtcTransportOptions
    webRtcTransportOptions: {
      listenIps: [
        {
          ip: process.env.MEDIASOUP_LISTEN_IP || "0.0.0.0",
          announcedIp: process.env.MEDIASOUP_ANNOUNCED_IP,
        },
      ],
      initialAvailableOutgoingBitrate: 1000000,
      minimumAvailableOutgoingBitrate: 600000,
      maxSctpMessageSize: 262144,
      maxIncomingBitrate: 1500000,
    },
    // PlainTransport：https://mediasoup.org/documentation/v3/mediasoup/api/#PlainTransportOptions
    plainTransportOptions: {
      listenIp: {
        ip: process.env.MEDIASOUP_LISTEN_IP || "0.0.0.0",
        announcedIp: process.env.MEDIASOUP_ANNOUNCED_IP,
      },
      maxSctpMessageSize: 262144,
    },
  },
  wellcome: `<!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>桃夭媒体服务</title>
    <style type="text/css">
      p{text-align:center;}
      a{text-decoration:none;}
    </style>
  </head>
  <body>
    <p><a href="https://gitee.com/acgist/taoyao">taoyao-media-server</a></p>
    <p><a href="https://www.acgist.com">acgist</a></p>
  </body>
  </html>`,
};
