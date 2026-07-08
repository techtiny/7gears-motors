package com.sevengears.motors.controller;

import org.springframework.core.io.ClassPathResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
public class SpaController {

    private final byte[] indexHtml;

    public SpaController() {
        byte[] bytes = null;
        try {
            ClassPathResource resource = new ClassPathResource("static/index.html");
            if (resource.exists()) {
                bytes = resource.getInputStream().readAllBytes();
            }
        } catch (Exception ignored) {
        }
        this.indexHtml = bytes;
    }

    @RequestMapping(value = {
        "/",
        "/{path:^(?!api|assets|favicon|logo|icons|serve).*$}",
        "/{path:^(?!api|assets|favicon|logo|icons|serve).*$}/**"
    })
    @ResponseBody
    public ResponseEntity<?> spa() {
        if (indexHtml == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok()
            .contentType(MediaType.TEXT_HTML)
            .contentLength(indexHtml.length)
            .body(indexHtml);
    }
}
