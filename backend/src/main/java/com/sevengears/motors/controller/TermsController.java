package com.sevengears.motors.controller;

import com.sevengears.motors.model.AppUser;
import com.sevengears.motors.service.TermsService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/** Repair Terms & Conditions the customer must accept before work begins on a job. */
@RestController
@RequestMapping("/api/jobs/{jobId}/terms")
public class TermsController {

    private final TermsService terms;

    public TermsController(TermsService terms) { this.terms = terms; }

    /** { accepted, latest, history[] } */
    @GetMapping
    public ResponseEntity<Map<String, Object>> overview(@PathVariable Long jobId) {
        return ResponseEntity.ok(terms.overview(jobId));
    }

    @PostMapping("/send")
    public ResponseEntity<Map<String, Object>> send(@PathVariable Long jobId, @AuthenticationPrincipal AppUser user) throws Exception {
        return ResponseEntity.ok(terms.send(jobId, name(user)));
    }

    @PostMapping("/resend")
    public ResponseEntity<Map<String, Object>> resend(@PathVariable Long jobId, @AuthenticationPrincipal AppUser user) throws Exception {
        return ResponseEntity.ok(terms.resend(jobId, name(user)));
    }

    /** { note? } — customer signed the printed terms at the counter. */
    @PostMapping("/accept-in-person")
    public ResponseEntity<Map<String, Object>> acceptInPerson(@PathVariable Long jobId, @AuthenticationPrincipal AppUser user,
                                                              @RequestBody(required = false) Map<String, String> body) {
        return ResponseEntity.ok(terms.acceptInPerson(jobId, name(user), body != null ? body.get("note") : null));
    }

    @GetMapping("/pdf")
    public ResponseEntity<byte[]> pdf(@PathVariable Long jobId) throws Exception {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=Terms_and_Conditions_" + jobId + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(terms.pdfForJob(jobId));
    }

    private static String name(AppUser u) {
        return u == null ? null : (u.getDisplayName() != null ? u.getDisplayName() : u.getUsername());
    }
}
