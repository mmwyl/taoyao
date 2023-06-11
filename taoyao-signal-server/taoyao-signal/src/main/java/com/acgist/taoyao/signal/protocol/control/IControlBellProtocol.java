package com.acgist.taoyao.signal.protocol.control;

import com.acgist.taoyao.boot.model.Message;

/**
 * 响铃信令接口
 * 
 * @author acgist
 */
public interface IControlBellProtocol {

    /**
     * @param clientId 终端ID
     * @param enabled 状态
     * 
     * @return 执行结果
     */
    Message execute(String clientId, Boolean enabled);
    
}
