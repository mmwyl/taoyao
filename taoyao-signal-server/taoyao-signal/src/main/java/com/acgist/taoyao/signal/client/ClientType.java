package com.acgist.taoyao.signal.client;

import com.acgist.taoyao.boot.model.MessageCodeException;

import lombok.Getter;

/**
 * 终端类型
 * 
 * @author acgist
 */
@Getter
public enum ClientType {

    WEB("Web"),
    MEDIA("媒体服务"),
    CAMERA("摄像头"),
    OTHER("其他终端");
    
    /**
     * 终端名称
     */
    private final String name;

    private ClientType(String name) {
        this.name = name;
    }
    
    /**
     * @return 是否是Web
     */
    public boolean web() {
        return this == WEB;
    }
    
    /**
     * @return 是否是媒体服务
     */
    public boolean media() {
        return this == MEDIA;
    }
    
    /**
     * @return 是否是摄像头
     */
    public boolean camera() {
        return this == CAMERA;
    }
    
    /**
     * @return 是否是媒体终端
     */
    public boolean mediaClient() {
        return this == WEB || this == CAMERA;
    }
    
    /**
     * @return 是否是媒体服务
     */
    public boolean mediaServer() {
        return this == MEDIA;
    }

    /**
     * @param value 类型
     * 
     * @return 类型
     */
    public static final ClientType of(String value) {
        for (ClientType type : ClientType.values()) {
            if(type.name().equalsIgnoreCase(value)) {
                return type;
            }
        }
        throw MessageCodeException.of("未知终端类型：" + value);
    }
    
}
