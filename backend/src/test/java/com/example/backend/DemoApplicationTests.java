package com.example.backend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest
/*
 * 會讓測試優先載入 application-test.properties 的設定，從而忽略 src/main/resources 中的正式設定。
 */
@TestPropertySource(locations = "classpath:application-test.properties")
class DemoApplicationTests {

	@Test
	void contextLoads() {
	}

}
