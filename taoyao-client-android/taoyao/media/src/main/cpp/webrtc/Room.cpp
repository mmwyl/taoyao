#include "Room.hpp"

namespace acgist {

    class SendListener : public mediasoupclient::SendTransport::Listener {

    public:
        Room* room;

    public:
        SendListener(Room* room) {
            this->room = room;
        }

        virtual ~SendListener() {
        }

    public:
        std::future<void> OnConnect(mediasoupclient::Transport* transport, const nlohmann::json& dtlsParameters) override {
            const std::string cTransportId    = transport->GetId();
            const std::string cDtlsParameters = dtlsParameters.dump();
            JNIEnv* env;
            this->room->javaVM->AttachCurrentThread(&env, nullptr);
            this->room->sendTransportConnectCallback(env, cTransportId, cDtlsParameters);
            this->room->javaVM->DetachCurrentThread();
            return std::future<void>();
        }

        void OnConnectionStateChange(mediasoupclient::Transport* transport, const std::string& connectionState) override {
            // TODO：restartIce？
        }

        std::future<std::string> OnProduce(mediasoupclient::SendTransport* transport, const std::string& kind, nlohmann::json rtpParameters, const nlohmann::json& appData) override {
            const std::string cTransportId   = transport->GetId();
            const std::string cRtpParameters = rtpParameters.dump();
            JNIEnv* env;
            this->room->javaVM->AttachCurrentThread(&env, nullptr);
            std::string result = this->room->sendTransportProduceCallback(env, kind, cTransportId, cRtpParameters);
            this->room->javaVM->DetachCurrentThread();
            std::promise <std::string> promise;
            promise.set_value(result);
            return promise.get_future();
        }

        std::future<std::string> OnProduceData(mediasoupclient::SendTransport* transport, const nlohmann::json& sctpStreamParameters, const std::string& label, const std::string& protocol, const nlohmann::json& appData) override {
            return std::future<std::string>();
        }

    };

    class RecvListener : public mediasoupclient::RecvTransport::Listener {

    public:
        Room* room;

    public:
        RecvListener(Room* room) {
            this->room = room;
        }

        virtual ~RecvListener() {
        }

        std::future<void> OnConnect(mediasoupclient::Transport* transport, const nlohmann::json& dtlsParameters) override {
            const std::string cTransportId    = transport->GetId();
            const std::string cDtlsParameters = dtlsParameters.dump();
            JNIEnv* env;
            this->room->javaVM->AttachCurrentThread(&env, nullptr);
            this->room->recvTransportConnectCallback(env, cTransportId, cDtlsParameters);
            this->room->javaVM->DetachCurrentThread();
            return std::future<void>();
        }

        void OnConnectionStateChange(mediasoupclient::Transport* transport, const std::string& connectionState) override {
        }

    };

    class ProducerListener : public mediasoupclient::Producer::Listener {

    public:
        Room* room;

    public:
        ProducerListener(Room* room) {
            this->room = room;
        }

        virtual ~ProducerListener() {
        }

        void OnTransportClose(mediasoupclient::Producer* producer) override {
            producer->Close();
            JNIEnv* env;
            this->room->javaVM->AttachCurrentThread(&env, nullptr);
            this->room->producerCloseCallback(env, producer->GetId());
            this->room->javaVM->DetachCurrentThread();
        }

    };

    class ConsumerListener : public mediasoupclient::Consumer::Listener {

    public:
        Room* room;

    public:
        ConsumerListener(Room* room) {
            this->room = room;
        }

        virtual ~ConsumerListener() {
        }

        void OnTransportClose(mediasoupclient::Consumer* consumer) override {
            consumer->Close();
            JNIEnv* env;
            this->room->javaVM->AttachCurrentThread(&env, nullptr);
            this->room->consumerCloseCallback(env, consumer->GetId());
            this->room->javaVM->DetachCurrentThread();
        }

    };

    Room::Room(
        std::string roomId,
        JavaVM* javaVM,
        jobject routerCallback
    ) {
        this->roomId = roomId;
        this->javaVM = javaVM;
        this->routerCallback = routerCallback;
        this->device = new mediasoupclient::Device();
        this->sendListener = new SendListener(this);
        this->recvListener = new RecvListener(this);
        this->producerListener = new ProducerListener(this);
        this->consumerListener = new ConsumerListener(this);
    }

    Room::~Room() {
        delete this->device;
        delete this->sendListener;
        delete this->sendTransport;
        delete this->recvListener;
        delete this->recvTransport;
        delete this->audioProducer;
        delete this->videoProducer;
        delete this->producerListener;
        delete this->consumerListener;
        JNIEnv* env;
        this->javaVM->AttachCurrentThread(&env, nullptr);
        env->DeleteLocalRef(this->routerCallback);
        env->DeleteGlobalRef(this->routerCallback);
        this->javaVM->DetachCurrentThread();
    }

    void Room::enter(
        JNIEnv* env,
        std::string rtpCapabilities,
        webrtc::PeerConnectionFactoryInterface* factory,
        webrtc::PeerConnectionInterface::RTCConfiguration& rtcConfiguration
    ) {
        nlohmann::json json;
        // TODO：全局
        mediasoupclient::PeerConnection::Options options;
        options.config  = rtcConfiguration;
        options.factory = factory;
        json["routerRtpCapabilities"] = nlohmann::json::parse(rtpCapabilities);
        this->device->Load(json, &options);
        const std::string cRtpCapabilities  = this->device->GetRtpCapabilities().dump();
        const std::string cSctpCapabilities = this->device->GetSctpCapabilities().dump();
        this->enterRoomCallback(env, cRtpCapabilities, cSctpCapabilities);
    }

    void Room::createSendTransport(JNIEnv* env, std::string body) {
        nlohmann::json json = nlohmann::json::parse(body);
        this->sendTransport = this->device->CreateSendTransport(
            this->sendListener,
            json["transportId"],
            json["iceCandidates"],
            json["iceParameters"],
            json["dtlsParameters"],
            json["sctpParameters"]
            // TODO：全局options
        );
    }

    void Room::createRecvTransport(JNIEnv* env, std::string body) {
        nlohmann::json json = nlohmann::json::parse(body);
        this->recvTransport = this->device->CreateRecvTransport(
            this->recvListener,
            json["transportId"],
            json["iceCandidates"],
            json["iceParameters"],
            json["dtlsParameters"],
            json["sctpParameters"]
            // TODO：全局options
        );
    }

    void Room::mediaProduceAudio(JNIEnv* env, webrtc::MediaStreamInterface* mediaStream) {
        if(!this->device->CanProduce("audio")) {
            return;
        }
        nlohmann::json codecOptions =
            {
                { "opusStereo", true },
                { "opusDtx",    true }
            };
        this->audioProducer = this->sendTransport->Produce(
            this->producerListener,
            mediaStream->GetAudioTracks()[0],
            nullptr,
            &codecOptions,
            nullptr
        );
        this->producerNewCallback(env, this->audioProducer->GetKind(), this->audioProducer->GetId(), this->audioProducer, this->audioProducer->GetTrack());
    }

    void Room::mediaProduceVideo(JNIEnv* env, webrtc::MediaStreamInterface* mediaStream) {
        if(this->device->CanProduce("video")) {
            return;
        }
        // TODO：配置读取
        nlohmann::json codecOptions =
            {
                { "videoGoogleStartBitrate", 400  },
                { "videoGoogleMinBitrate",   800  },
                { "videoGoogleMaxBitrate",   1600 }
            };
        // 设置动态码率，帧率、分辨率在摄像头初始化处设置。
//      如果需要使用`Simulcast`打开下面配置
//      std::vector<webrtc::RtpEncodingParameters> encodings;
//      webrtc::RtpEncodingParameters min;
//      webrtc::RtpEncodingParameters mid;
//      webrtc::RtpEncodingParameters max;
//      min.active = true;
//      min.max_framerate   = 15;
//      min.min_bitrate_bps = 400;
//      min.max_bitrate_bps = 800;
//      encodings.emplace_back(min);
//      encodings.emplace_back(mid);
//      encodings.emplace_back(max);
        // 强制设置编码器
//      nlohmann::json codec = this->device->GetRtpCapabilities()["codec"];
        this->videoProducer = this->sendTransport->Produce(
            this->producerListener,
            mediaStream->GetVideoTracks()[0],
            nullptr,
            &codecOptions,
            nullptr
        );
        this->producerNewCallback(env, this->videoProducer->GetKind(), this->videoProducer->GetId(), this->videoProducer, this->videoProducer->GetTrack());
    }

    void Room::mediaConsume(JNIEnv* env, std::string message) {
        nlohmann::json json = nlohmann::json::parse(message);
        nlohmann::json body = json["body"];
        mediasoupclient::Consumer* consumer = this->recvTransport->Consume(
            this->consumerListener,
            body["consumerId"],
            body["producerId"],
            body["kind"],
            &body["rtpParameters"]
        );
        this->consumers.insert({ consumer->GetId(), consumer });
        webrtc::MediaStreamTrackInterface* trackPointer = consumer->GetTrack();
        this->consumerNewCallback(env, message, consumer, trackPointer);
    };

    void Room::mediaProducerPause(JNIEnv* env, std::string producerId) {
        if(this->audioProducer->GetId() == producerId) {
            this->audioProducer->Pause();
        } else if(this->videoProducer->GetId() == producerId) {
            this->videoProducer->Pause();
        } else {
        }
        this->producerPauseCallback(env, producerId);
    }

    void Room::mediaProducerResume(JNIEnv* env, std::string producerId) {
        if(this->audioProducer->GetId() == producerId) {
            this->audioProducer->Resume();
        } else if(this->videoProducer->GetId() == producerId) {
            this->videoProducer->Resume();
        } else {
        }
        this->producerResumeCallback(env, producerId);
    }

    void Room::mediaProducerClose(JNIEnv* env, std::string producerId) {
        if(this->audioProducer->GetId() == producerId) {
            this->audioProducer->Close();
        } else if(this->videoProducer->GetId() == producerId) {
            this->videoProducer->Close();
        } else {
        }
        this->producerCloseCallback(env, producerId);
    }

    void Room::mediaConsumerPause(JNIEnv* env, std::string consumerId) {
        mediasoupclient::Consumer* consumer = this->consumers[consumerId];
        if(consumer == nullptr) {
            return;
        }
        consumer->Pause();
        this->consumerPauseCallback(env, consumerId);
    }

    void Room::mediaConsumerResume(JNIEnv* env, std::string consumerId) {
        mediasoupclient::Consumer* consumer = this->consumers[consumerId];
        if(consumer == nullptr) {
            return;
        }
        consumer->Resume();
        this->consumerResumeCallback(env, consumerId);
    }

    void Room::mediaConsumerClose(JNIEnv* env, std::string consumerId) {
        mediasoupclient::Consumer* consumer = this->consumers[consumerId];
        if(consumer == nullptr) {
            return;
        }
        consumer->Close();
        this->consumerCloseCallback(env, consumerId);
    }

    void Room::close() {
        this->audioProducer->Close();
        this->videoProducer->Close();
        std::map<std::string, mediasoupclient::Consumer *>::iterator iterator;
        for (iterator = this->consumers.begin(); iterator != this->consumers.end(); iterator++) {
            iterator->second->Close();
        }
        this->consumers.clear();
        this->sendTransport->Close();
        this->recvTransport->Close();
    }

    extern "C" JNIEXPORT jlong JNICALL
    Java_com_acgist_taoyao_media_client_Room_nativeNewRoom(
        JNIEnv* env, jobject me,
        jstring jRoomId, jobject jRouterCallback
    ) {
        JavaVM* javaVM;
        env->GetJavaVM(&javaVM);
        jobject routerCallback = env->NewGlobalRef(jRouterCallback);
        const char* roomId = env->GetStringUTFChars(jRoomId, nullptr);
        Room* room = new Room(roomId, javaVM, routerCallback);
        env->DeleteLocalRef(jRoomId);
        env->ReleaseStringUTFChars(jRoomId, roomId);
        return (jlong) room;
    }

    extern "C" JNIEXPORT void JNICALL
    Java_com_acgist_taoyao_media_client_Room_nativeEnterRoom(
        JNIEnv* env, jobject me,
        jlong nativeRoomPointer, jstring jRtpCapabilities,
        jlong factoryPointer, jobject jRtcConfiguration
    ) {
        Room* room = (Room*) nativeRoomPointer;
        webrtc::PeerConnectionInterface::RTCConfiguration rtcConfiguration(webrtc::PeerConnectionInterface::RTCConfigurationType::kAggressive);
        // TODO：为什么不能转换？测试是否因为stun配置问题
        webrtc::JavaParamRef<jobject> jRtcConfigurationRef(jRtcConfiguration);
//      webrtc::jni::JavaToNativeMediaConstraints()
//      webrtc::jni::JavaToNativeRTCConfiguration(env, jRtcConfigurationRef, &rtcConfiguration);
        const char* rtpCapabilities = env->GetStringUTFChars(jRtpCapabilities, nullptr);
        room->enter(
            env,
            rtpCapabilities,
            reinterpret_cast<webrtc::PeerConnectionFactoryInterface*>(factoryPointer),
//          (webrtc::PeerConnectionFactoryInterface*) factoryPointer,
            rtcConfiguration
        );
        env->DeleteLocalRef(jRtpCapabilities);
        env->ReleaseStringUTFChars(jRtpCapabilities, rtpCapabilities);
        env->DeleteLocalRef(jRtcConfiguration);
    }

    extern "C" JNIEXPORT void JNICALL
    Java_com_acgist_taoyao_media_client_Room_nativeCloseRoom(JNIEnv* env, jobject me, jlong nativeRoomPointer) {
        Room* room = (Room*) nativeRoomPointer;
        room->close();
        delete room;
    }

    extern "C" JNIEXPORT void JNICALL
    Java_com_acgist_taoyao_media_client_Room_nativeCreateSendTransport(JNIEnv* env, jobject me, jlong nativeRoomPointer, jstring jBody) {
        Room* room = (Room*) nativeRoomPointer;
        const char* body = env->GetStringUTFChars(jBody, nullptr);
        room->createSendTransport(env, body);
        env->DeleteLocalRef(jBody);
        env->ReleaseStringUTFChars(jBody, body);
    }

    extern "C" JNIEXPORT void JNICALL
    Java_com_acgist_taoyao_media_client_Room_nativeCreateRecvTransport(JNIEnv* env, jobject me, jlong nativeRoomPointer, jstring jBody) {
        Room* room = (Room*) nativeRoomPointer;
        const char* body = env->GetStringUTFChars(jBody, nullptr);
        room->createRecvTransport(env, body);
        env->DeleteLocalRef(jBody);
        env->ReleaseStringUTFChars(jBody, body);
    }

    extern "C" JNIEXPORT void JNICALL
    Java_com_acgist_taoyao_media_client_Room_nativeMediaProduceAudio(JNIEnv* env, jobject me, jlong nativeRoomPointer, jlong mediaStreamPointer) {
        Room* room = (Room*) nativeRoomPointer;
        webrtc::MediaStreamInterface* mediaStream = reinterpret_cast<webrtc::MediaStreamInterface*>(mediaStreamPointer);
        room->mediaProduceAudio(env, mediaStream);
    }

    extern "C" JNIEXPORT void JNICALL
    Java_com_acgist_taoyao_media_client_Room_nativeMediaProduceVideo(JNIEnv* env, jobject me, jlong nativeRoomPointer, jlong mediaStreamPointer) {
        Room* room = (Room*) nativeRoomPointer;
        webrtc::MediaStreamInterface* mediaStream = reinterpret_cast<webrtc::MediaStreamInterface*>(mediaStreamPointer);
        room->mediaProduceVideo(env, mediaStream);
    }

    extern "C" JNIEXPORT void JNICALL
    Java_com_acgist_taoyao_media_client_Room_nativeMediaConsume(JNIEnv* env, jobject me, jlong nativeRoomPointer, jstring jMessage) {
        Room* room = (Room*) nativeRoomPointer;
        const char* message = env->GetStringUTFChars(jMessage, nullptr);
        room->mediaConsume(env, message);
        env->DeleteLocalRef(jMessage);
        env->ReleaseStringUTFChars(jMessage, message);
    }

    extern "C" JNIEXPORT void JNICALL
    Java_com_acgist_taoyao_media_client_Room_nativeMediaProducerPause(JNIEnv* env, jobject me, jlong nativeRoomPointer, jstring jProducerId) {
        Room* room = (Room*) nativeRoomPointer;
        const char* producerId = env->GetStringUTFChars(jProducerId, nullptr);
        room->mediaProducerPause(env, producerId);
        env->DeleteLocalRef(jProducerId);
        env->ReleaseStringUTFChars(jProducerId, producerId);
    }

    extern "C" JNIEXPORT void JNICALL
    Java_com_acgist_taoyao_media_client_Room_nativeMediaProducerResume(JNIEnv* env, jobject me, jlong nativeRoomPointer, jstring jProducerId) {
        Room* room = (Room*) nativeRoomPointer;
        const char* producerId = env->GetStringUTFChars(jProducerId, nullptr);
        room->mediaProducerResume(env, producerId);
        env->DeleteLocalRef(jProducerId);
        env->ReleaseStringUTFChars(jProducerId, producerId);
    }

    extern "C" JNIEXPORT void JNICALL
    Java_com_acgist_taoyao_media_client_Room_nativeMediaProducerClose(JNIEnv* env, jobject me, jlong nativeRoomPointer, jstring jProducerId) {
        Room* room = (Room*) nativeRoomPointer;
        const char* producerId = env->GetStringUTFChars(jProducerId, nullptr);
        room->mediaProducerClose(env, producerId);
        env->DeleteLocalRef(jProducerId);
        env->ReleaseStringUTFChars(jProducerId, producerId);
    }

    extern "C" JNIEXPORT void JNICALL
    Java_com_acgist_taoyao_media_client_Room_nativeMediaConsumerPause(JNIEnv* env, jobject me, jlong nativeRoomPointer, jstring jConsumerId) {
        Room* room = (Room*) nativeRoomPointer;
        const char* consumerId = env->GetStringUTFChars(jConsumerId, nullptr);
        room->mediaConsumerPause(env, consumerId);
        env->DeleteLocalRef(jConsumerId);
        env->ReleaseStringUTFChars(jConsumerId, consumerId);
    }

    extern "C" JNIEXPORT void JNICALL
    Java_com_acgist_taoyao_media_client_Room_nativeMediaConsumerResume(JNIEnv* env, jobject me, jlong nativeRoomPointer, jstring jConsumerId) {
        Room* room = (Room*) nativeRoomPointer;
        const char* consumerId = env->GetStringUTFChars(jConsumerId, nullptr);
        room->mediaConsumerResume(env, consumerId);
        env->DeleteLocalRef(jConsumerId);
        env->ReleaseStringUTFChars(jConsumerId, consumerId);
    }

    extern "C" JNIEXPORT void JNICALL
    Java_com_acgist_taoyao_media_client_Room_nativeMediaConsumerClose(JNIEnv* env, jobject me, jlong nativeRoomPointer, jstring jConsumerId) {
        Room* room = (Room*) nativeRoomPointer;
        const char* consumerId = env->GetStringUTFChars(jConsumerId, nullptr);
        room->mediaConsumerClose(env, consumerId);
        env->DeleteLocalRef(jConsumerId);
        env->ReleaseStringUTFChars(jConsumerId, consumerId);
    }

}
