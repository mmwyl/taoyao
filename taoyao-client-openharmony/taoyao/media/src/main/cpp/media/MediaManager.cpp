#include "../include/MediaManager.hpp"

#include "api/peer_connection_interface.h"

acgist::MediaManager::MediaManager() {
    this->peerConnectionFactoryPtr = nullptr;
}

acgist::MediaManager::~MediaManager() {
    if(this->peerConnectionFactoryPtr != nullptr) {
//      delete this->peerConnectionFactoryPtr;
        this->peerConnectionFactoryPtr->Release();
        this->peerConnectionFactoryPtr = nullptr;
    }
}

void acgist::MediaManager::initPeerConnectionFactory() {
//    webrtc::PeerConnectionFactoryDependencies peerConnectionFactoryDependencies;
//    webrtc::PeerConnectionFactory::Create(PeerConnectionFactoryDependencies dependencies)
//    webrtc::PeerConnectionFactoryDependencies c;
//    this->peerConnectionFactoryPtr = webrtc::PeerConnectionFactory::Create(c);
}

