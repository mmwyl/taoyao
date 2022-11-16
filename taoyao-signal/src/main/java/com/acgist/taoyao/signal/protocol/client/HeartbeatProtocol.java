package com.acgist.taoyao.signal.protocol.client;

import java.util.Map;

import org.springframework.stereotype.Component;

import com.acgist.taoyao.boot.model.Message;
import com.acgist.taoyao.signal.client.ClientSession;
import com.acgist.taoyao.signal.client.ClientSessionStatus;
import com.acgist.taoyao.signal.protocol.ProtocolMapAdapter;

/**
 * 心跳信令
 * 
 * @author acgist
 */
@Component
public class HeartbeatProtocol extends ProtocolMapAdapter {

	/**
	 * 信令协议标识
	 */
	public static final Integer PID = 2005;
	
	public HeartbeatProtocol() {
		super(PID, "心跳信令");
	}
	
	@Override
	public void execute(String sn, Map<?, ?> body, Message message, ClientSession session) {
		// 回应心跳
		session.push(message.cloneWidthoutBody());
		// 设置状态
		final ClientSessionStatus status = session.status();
		status.setSignal((Integer) body.get("signal"));
		status.setBattery((Integer) body.get("battery"));
	}

}
