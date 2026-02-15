package com.nbh.homestay;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class HomestayServiceApplication {
	public static void main(String[] args) {
		SpringApplication.run(HomestayServiceApplication.class, args);
	}

	@org.springframework.context.annotation.Bean
	public org.springframework.web.filter.ShallowEtagHeaderFilter shallowEtagHeaderFilter() {
		return new org.springframework.web.filter.ShallowEtagHeaderFilter();
	}
}
