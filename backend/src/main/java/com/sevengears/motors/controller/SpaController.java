package com.sevengears.motors.controller;

import org.springframework.core.io.ClassPathResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import java.io.IOException;

@Controller
public class SpaController {

    private final byte[] indexHtml;

    public SpaController() throws IOException {
        this.indexHtml = new ClassPathResource("static/index.html").getInputStream().readAllBytes();
    }

    @RequestMapping(value = {
        "/",
        "/{path:^(?!api|assets|favicon|logo|icons|serve).*$}",
        "/{path:^(?!api|assets|favicon|logo|icons|serve).*$}/**"
    })
    @ResponseBody
    public ResponseEntity<byte[]> spa() {
        return ResponseEntity.ok()
            .contentType(MediaType.TEXT_HTML)
            .contentLength(indexHtml.length)
            .body(indexHtml);
    }
}
