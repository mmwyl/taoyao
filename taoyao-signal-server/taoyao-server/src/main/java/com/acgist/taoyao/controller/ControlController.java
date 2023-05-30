package com.acgist.taoyao.controller;

import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.acgist.taoyao.boot.config.MediaAudioProperties;
import com.acgist.taoyao.boot.config.MediaVideoProperties;
import com.acgist.taoyao.boot.model.Message;
import com.acgist.taoyao.signal.protocol.control.ControlBellProtocol;
import com.acgist.taoyao.signal.protocol.control.ControlConfigAudioProtocol;
import com.acgist.taoyao.signal.protocol.control.ControlConfigVideoProtocol;
import com.acgist.taoyao.signal.protocol.control.ControlPhotographProtocol;
import com.acgist.taoyao.signal.protocol.control.ControlRecordProtocol;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;

/**
 * 控制
 * 
 * @author acgist
 */
@Tag(name = "控制", description = "控制管理")
@Validated
@RestController
@RequestMapping("/control")
@RequiredArgsConstructor
public class ControlController {
    
    private final ControlBellProtocol controlBellProtocol;
    private final ControlRecordProtocol controlRecordProtocol;
    private final ControlPhotographProtocol controlPhotographProtocol;
    private final ControlConfigAudioProtocol controlConfigAudioProtocol;
    private final ControlConfigVideoProtocol controlConfigVideoProtocol;
    
    @Operation(summary = "响铃", description = "响铃控制")
    @GetMapping("/bell/{clientId}")
    public Message bell(@PathVariable String clientId, @NotNull(message = "没有指定操作状态") Boolean enabled) {
        return this.controlBellProtocol.execute(clientId, enabled);
    }
    
    @Operation(summary = "录像", description = "录像控制")
    @GetMapping("/record/{clientId}")
    public Message record(@PathVariable String clientId, @NotNull(message = "没有指定操作状态") Boolean enabled) {
        return this.controlRecordProtocol.execute(clientId, enabled);
    }
    
    @Operation(summary = "拍照", description = "拍照控制")
    @GetMapping("/photograph/{clientId}")
    public Message photograph(@PathVariable String clientId) {
        return this.controlPhotographProtocol.execute(clientId);
    }
    
    @Operation(summary = "配置音频", description = "配置音频")
    @GetMapping("/config/audio/{clientId}")
    public Message configAudio(@PathVariable String clientId, @Valid MediaAudioProperties mediaAudioProperties) {
        return this.controlConfigAudioProtocol.execute(clientId, mediaAudioProperties);
    }
    
    @Operation(summary = "配置视频", description = "配置视频")
    @GetMapping("/config/video/{clientId}")
    public Message configVideo(@PathVariable String clientId, @Valid MediaVideoProperties mediaVideoProperties) {
        return this.controlConfigVideoProtocol.execute(clientId, mediaVideoProperties);
    }
    
}
