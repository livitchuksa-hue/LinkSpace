package ru.linkspace;

import java.nio.file.Files;
import java.nio.file.Path;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class LinkspaceApplication {

    public static void main(String[] args) throws Exception {
        Files.createDirectories(Path.of("data"));
        SpringApplication.run(LinkspaceApplication.class, args);
    }
}
