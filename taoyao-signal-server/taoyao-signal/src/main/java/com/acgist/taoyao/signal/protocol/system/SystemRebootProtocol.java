package com.acgist.taoyao.signal.protocol.system;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;

import com.acgist.taoyao.boot.annotation.Description;
import com.acgist.taoyao.boot.model.Message;
import com.acgist.taoyao.boot.property.ScriptProperties;
import com.acgist.taoyao.boot.utils.ScriptUtils;
import com.acgist.taoyao.signal.client.Client;
import com.acgist.taoyao.signal.protocol.ProtocolClientAdapter;

import lombok.extern.slf4j.Slf4j;

/**
 * 重启系统信令
 * 
 * @author acgist
 */
@Slf4j
@Description(flow = "终端->信令服务+)终端")
public class SystemRebootProtocol extends ProtocolClientAdapter {

	public static final String SIGNAL = "system::reboot";
	
	@Autowired
	private ScriptProperties scriptProperties;
	
	public SystemRebootProtocol() {
		super("重启系统信令", SIGNAL);
	}

	@Override
	public void execute(String clientId, Map<?, ?> body, Client client, Message message) {
		log.info("重启系统：{}", clientId);
		this.clientManager.broadcast(message);
		ScriptUtils.execute(this.scriptProperties.getSystemReboot());
	}

}
