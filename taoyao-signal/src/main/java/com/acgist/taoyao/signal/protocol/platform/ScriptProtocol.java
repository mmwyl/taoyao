package com.acgist.taoyao.signal.protocol.platform;

import java.util.Map;

import org.springframework.stereotype.Component;

import com.acgist.taoyao.boot.model.Message;
import com.acgist.taoyao.signal.client.ClientSession;
import com.acgist.taoyao.signal.event.platform.ScriptEvent;
import com.acgist.taoyao.signal.protocol.ProtocolMapAdapter;

/**
 * 执行命令信令
 * 
 * @author acgist
 */
@Component
public class ScriptProtocol extends ProtocolMapAdapter {

	/**
	 * 信令协议标识
	 */
	public static final Integer PID = 1001;
	
	public ScriptProtocol() {
		super(PID, "执行命令信令");
	}

	@Override
	public void execute(String sn, Map<?, ?> body, Message message, ClientSession session) {
		this.publishEvent(new ScriptEvent(body, message, session));
	}
	
}
