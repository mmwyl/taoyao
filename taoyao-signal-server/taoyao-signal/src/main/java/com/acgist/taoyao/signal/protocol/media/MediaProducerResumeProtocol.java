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
 * 恢复生产者信令
 * 
 * @author acgist
 */
@Protocol
@Description(
    body = """
    {
        "roomId": "房间ID"
        "producerId": "消费者ID"
    }
    """,
    flow = "终端->信令服务->媒体服务->信令服务->终端"
)
public class MediaProducerResumeProtocol extends ProtocolRoomAdapter {

    public static final String SIGNAL = "media::producer::resume";
    
    public MediaProducerResumeProtocol() {
        super("恢复生产者信令", SIGNAL);
    }
    
    @Override
    public void execute(String clientId, ClientType clientType, Room room, Client client, Client mediaClient, Message message, Map<String, Object> body) {
        if(clientType.mediaClient()) {
            mediaClient.push(message);
        } else if(clientType.mediaServer()) {
            room.broadcast(message);
        } else {
            this.logNoAdapter(clientType);
        }
    }

}
