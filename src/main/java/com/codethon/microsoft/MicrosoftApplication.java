package com.codethon.microsoft;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class MicrosoftApplication {

	public static void main(String[] args) {
		SpringApplication.run(MicrosoftApplication.class, args);
	}

}
