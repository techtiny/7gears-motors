package com.sevengears.motors.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class SpaController {

    // Forward all non-API, non-static-asset routes to index.html for React Router
    @RequestMapping(value = {
        "/",
        "/{path:^(?!api|assets|favicon|logo|icons|serve).*$}",
        "/{path:^(?!api|assets|favicon|logo|icons|serve).*$}/**"
    })
    public String spa() {
        return "forward:/index.html";
    }
}
