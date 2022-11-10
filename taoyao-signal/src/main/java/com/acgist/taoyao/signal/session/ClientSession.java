package com.acgist.taoyao.signal.session;

import com.acgist.taoyao.boot.model.Message;

/**
 * 会话
 * 
 * @author acgist
 *
 * @param <T> 会话类型
 */
public interface ClientSession extends AutoCloseable {

	/**
	 * @return 终端标识
	 */
	String sn();
	
	/**
	 * 推送消息
	 * 
	 * @param message 消息
	 */
	void push(Message message);

	/**
	 * @param timeout 超时时间
	 * 
	 * @return 是否超时会话
	 */
	boolean timeout(long timeout);
	
	/**
	 * 设置授权
	 * 
	 * @param sn 重点标识
	 */
	void authorize(String sn);
	
	/**
	 * @return 是否授权
	 */
	boolean authorized();
	
	/**
	 * @param sn 终端标识
	 * 
	 * @return 终端标识是否匹配
	 */
	boolean matchSn(String sn);
	
	/**
	 * @param sn 终端标识
	 * 
	 * @return 终端标识是否匹配失败
	 */
	boolean matchNoneSn(String sn);
	
	/**
	 * @param instance 会话实例
	 * 
	 * @return 会话实例是否匹配
	 */
	<M extends AutoCloseable> boolean matchInstance(M instance);
	
}
