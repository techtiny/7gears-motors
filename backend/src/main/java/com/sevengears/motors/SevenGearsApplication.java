package com.sevengears.motors;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SevenGearsApplication {
    public static void main(String[] args) {
        SpringApplication.run(SevenGearsApplication.class, args);
    }
}
