package com.acgist.taoyao.signal.session;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.acgist.taoyao.boot.config.TaoyaoProperties;
import com.acgist.taoyao.boot.model.Message;

import lombok.extern.slf4j.Slf4j;

/**
 * 会话管理
 * 
 * @author acgist
 */
@Slf4j
@Service
public class ClientSessionManager {
	
	@Autowired
	private TaoyaoProperties taoyaoProperties;
	
	/**
	 * 会话列表
	 */
	private List<ClientSession> sessions = new CopyOnWriteArrayList<>();

	@Scheduled(cron = "${taoyao.scheduled.session:0 * * * * ?}")
	public void scheduled() {
		this.closeTimeoutSession();
	}
	
	/**
	 * @param session 会话
	 */
	public void open(ClientSession session) {
		this.sessions.add(session);
	}
	
	/**
	 * @param instance 会话实例
	 * 
	 * @return 会话
	 */
	public ClientSession session(AutoCloseable instance) {
		return this.sessions.stream()
			.filter(v -> v.matchInstance(instance))
			.findFirst()
			.orElse(null);
	}
	
	/**
	 * 单播消息
	 * 
	 * @param to 接收终端
	 * @param message 消息
	 */
	public void unicast(String to, Message message) {
		this.sessions.stream().filter(v -> v.matchSn(to)).forEach(v -> {
			message.getHeader().setSn(v.sn());
			v.push(message);
		});
	}
	
	/**
	 * 广播消息
	 * 
	 * @param message 消息
	 */
	public void broadcast(Message message) {
		this.sessions.forEach(v -> {
			message.getHeader().setSn(v.sn());
			v.push(message);
		});
	}
	
	/**
	 * 广播消息
	 * 
	 * @param from 发送终端
	 * @param message 消息
	 */
	public void broadcast(String from, Message message) {
		this.sessions.stream().filter(v -> v.matchNoneSn(from)).forEach(v -> {
			message.getHeader().setSn(v.sn());
			v.push(message);
		});
	}
	
	/**
	 * 关闭会话
	 * 
	 * @param instance 会话实例
	 */
	public void close(AutoCloseable instance) {
		final ClientSession session = this.session(instance);
		try {
			if(session != null) {
				session.close();
			} else {
				instance.close();
			}
		} catch (Exception e) {
			log.error("关闭会话异常", e);
		} finally {
			if(session != null) {
				this.sessions.remove(session);
			}
		}
	}
	
	/**
	 * 定时关闭超时会话
	 */
	private void closeTimeoutSession() {
		log.debug("定时关闭超时会话");
		this.sessions.stream()
		.filter(v -> v.timeout(this.taoyaoProperties.getTimeout()))
		.forEach(v -> {
			log.debug("关闭超时会话：{}", v);
			this.close(v);
		});
	}
	
}
