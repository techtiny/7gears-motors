package com.sevengears.motors.controller;

import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
public class SpaController {

    @RequestMapping(value = {
        "/",
        "/{path:^(?!api|assets|favicon|logo|icons|serve).*$}",
        "/{path:^(?!api|assets|favicon|logo|icons|serve).*$}/**"
    })
    @ResponseBody
    public ResponseEntity<Resource> spa() {
        return ResponseEntity.ok()
            .contentType(MediaType.TEXT_HTML)
            .body(new ClassPathResource("static/index.html"));
    }
}
