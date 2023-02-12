package com.acgist.taoyao.signal.room;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.CopyOnWriteArrayList;

import org.springframework.beans.factory.annotation.Autowired;

import com.acgist.taoyao.boot.annotation.Manager;
import com.acgist.taoyao.boot.model.Message;
import com.acgist.taoyao.boot.model.MessageCodeException;
import com.acgist.taoyao.boot.service.IdService;
import com.acgist.taoyao.signal.client.Client;
import com.acgist.taoyao.signal.media.MediaClient;
import com.acgist.taoyao.signal.media.MediaClientManager;
import com.acgist.taoyao.signal.protocol.Constant;

import lombok.extern.slf4j.Slf4j;

/**
 * 房间管理
 * 
 * @author acgist
 */
@Slf4j
@Manager
public class RoomManager {

	@Autowired
	private IdService idService;
	@Autowired
	private MediaClientManager mediaClientManager;

	/**
	 * 房间列表
	 */
	private List<Room> rooms = new CopyOnWriteArrayList<>();
	
	/**
	 * @param id ID
	 * 
	 * @return 房间信息
	 */
	public Room room(Long id) {
		return this.rooms.stream()
			.filter(v -> Objects.equals(id, v.getId()))
			.findFirst()
			.orElse(null);
	}
	
	/**
	 * @return 所有房间列表
	 */
	public List<Room> rooms() {
		return this.rooms;
	}
	
	/**
	 * @param id ID
	 * 
	 * @return 房间信息
	 */
	public RoomStatus status(Long id) {
		final Room room = this.room(id);
		return room == null ? null : room.getStatus();
	}
	
	/**
	 * @return 所有房间状态
	 */
	public List<RoomStatus> status() {
		return this.rooms().stream()
			.map(Room::getStatus)
			.toList();
	}

	/**
	 * 创建房间
	 * 
	 * @param sn 创建终端标识
	 * @param name 名称
	 * @param password 密码
	 * @param mediaName 媒体服务名称
	 * @param message 创建消息
	 * 
	 * @return 房间信息
	 */
	public Room create(String sn, String name, String password, String mediaName, Message message) {
		final MediaClient mediaClient = this.mediaClientManager.mediaClient(mediaName);
		if(mediaClient == null) {
			throw MessageCodeException.of("无效媒体服务：" + mediaName);
		}
		final Long id = this.idService.buildId();
		// 状态
		final RoomStatus roomStatus = new RoomStatus();
		roomStatus.setId(id);
		roomStatus.setName(name);
		roomStatus.setSnSize(0L);
		roomStatus.setMediaName(mediaName);
		// 房间
		final Room room = new Room();
		room.setId(id);
		room.setPassword(password);
		room.setStatus(roomStatus);
		room.setMediaClient(mediaClient);
		room.setClients(new CopyOnWriteArrayList<>());
		// 创建媒体服务房间
		message.setBody(Map.of(Constant.ROOM_ID, id));
		mediaClient.sendSync(message);
		log.info("创建房间：{}-{}", id, name);
		this.rooms.add(room);
		return room;
	}
	
	/**
	 * 关闭房间
	 * 
	 * @param id ID
	 */
	public void close(Long id) {
		final Room room = this.room(id);
		if(room == null) {
			log.warn("房间无效：{}", id);
			return;
		}
		if(this.rooms.remove(room)) {
			// TODO:媒体服务
		}
	}

	/**
	 * 释放房间
	 * 
	 * @param client 终端
	 */
	public void leave(Client client) {
		this.rooms.forEach(v -> v.leave(client));
	}
	
}
