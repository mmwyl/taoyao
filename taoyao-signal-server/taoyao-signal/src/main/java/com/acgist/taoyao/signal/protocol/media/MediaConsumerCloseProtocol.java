package com.acgist.taoyao.signal.protocol.media;

import java.util.Map;

import org.springframework.context.ApplicationListener;

import com.acgist.taoyao.boot.annotation.Description;
import com.acgist.taoyao.boot.annotation.Protocol;
import com.acgist.taoyao.boot.config.Constant;
import com.acgist.taoyao.boot.model.Message;
import com.acgist.taoyao.boot.utils.MapUtils;
import com.acgist.taoyao.signal.client.Client;
import com.acgist.taoyao.signal.client.ClientType;
import com.acgist.taoyao.signal.event.ConsumerCloseEvent;
import com.acgist.taoyao.signal.party.media.Consumer;
import com.acgist.taoyao.signal.party.media.Room;
import com.acgist.taoyao.signal.protocol.ProtocolRoomAdapter;

import lombok.extern.slf4j.Slf4j;

/**
 * 关闭消费者信令
 * 
 * @author acgist
 */
@Slf4j
@Protocol
@Description(
    body = """
    {
        "consumerId": "消费者ID"
    }
    """,
    flow = "终端->信令服务+)终端"
)
public class MediaConsumerCloseProtocol extends ProtocolRoomAdapter implements ApplicationListener<ConsumerCloseEvent> {

    public static final String SIGNAL = "media::consumer::close";
    
    public MediaConsumerCloseProtocol() {
        super("关闭消费者信令", SIGNAL);
    }
    
    @Override
    public void onApplicationEvent(ConsumerCloseEvent event) {
        final Room room = event.getRoom();
        final Map<String, Object> body = Map.of(
            Constant.ROOM_ID, room.getRoomId(),
            Constant.CONSUMER_ID, event.getConsumerId()
        );
        this.close(room, this.build(body));
    }
    
    @Override
    public void execute(String clientId, ClientType clientType, Room room, Client client, Client mediaClient, Message message, Map<String, Object> body) {
        final String consumerId = MapUtils.get(body, Constant.CONSUMER_ID);
        final Consumer consumer = room.consumer(consumerId);
        if(consumer == null) {
            log.warn("关闭消费者无效：{}", consumerId);
        } else {
            consumer.close();
        }
    }

    /**
     * 关闭消费者
     * 
     * @param room 房间
     * @param message 消息
     */
    private void close(Room room, Message message) {
        room.broadcastAll(message);
    }

}
