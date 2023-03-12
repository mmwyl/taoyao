package com.acgist.taoyao.signal.protocol.media;

import java.util.Map;

import com.acgist.taoyao.boot.annotation.Description;
import com.acgist.taoyao.boot.annotation.Protocol;
import com.acgist.taoyao.boot.model.Message;
import com.acgist.taoyao.signal.client.Client;
import com.acgist.taoyao.signal.client.ClientType;
import com.acgist.taoyao.signal.party.media.Room;
import com.acgist.taoyao.signal.protocol.ProtocolRoomAdapter;

/**
 * 视频方向变化信令
 * 
 * @author acgist
 */
@Protocol
@Description(
    body = """
    """,
    flow = "媒体服务->信令服务->终端"
)
public class MediaVideoOrientationChangeProtocol extends ProtocolRoomAdapter {

    public static final String SIGNAL = "media::video::orientation::change";
    
    public MediaVideoOrientationChangeProtocol() {
        super("视频方向变化信令", SIGNAL);
    }
    
    @Override
    public void execute(String clientId, ClientType clientType, Room room, Client client, Client mediaClient, Message message, Map<String, Object> body) {
        if(clientType.mediaServer()) {
            room.broadcast(message);
        } else {
            this.logNoAdapter(clientType);
        }
    }

}
