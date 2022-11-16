package com.acgist.taoyao.signal.protocol;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import com.acgist.taoyao.main.TaoyaoApplication;
import com.acgist.taoyao.signal.protocol.platform.ScriptProtocol;
import com.acgist.taoyao.test.annotation.TaoyaoTest;

@TaoyaoTest(classes = TaoyaoApplication.class)
class ScriptProtocolTest {
	
	@Autowired
	private ScriptProtocol scriptProtocol;

	@Test
	void testScript() {
		assertDoesNotThrow(() -> {
			this.scriptProtocol.execute(null, Map.of("script", "netstat -ano"), null, null);
		});
	}
	
}
