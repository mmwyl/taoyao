package com.acgist.taoyao.signal.listener;

import org.springframework.beans.factory.annotation.Autowired;

import com.acgist.taoyao.signal.event.ApplicationEventAdapter;
import com.acgist.taoyao.signal.room.RoomManager;

/**
 * 房间事件监听适配器
 *
 * @param <E> 事件泛型
 * 
 * @author acgist
 */
public abstract class RoomListenerAdapter<E extends ApplicationEventAdapter> extends ApplicationListenerAdapter<E> {

	@Autowired
	protected RoomManager roomManager;
	
}
