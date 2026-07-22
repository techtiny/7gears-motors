package com.sevengears.motors.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class WhatsAppService {

    private static final Logger log = LoggerFactory.getLogger(WhatsAppService.class);

    @Value("${WHATSAPP_URL:${whatsapp.gateway-url:http://localhost:9091}}")
    private String gatewayUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Sends a WhatsApp message via the local gateway (whatsapp-web.js).
     * Works for ANY WhatsApp number — no opt-in or sandbox required.
     *
     * @param toPhone  e.g. "9876543210" or "+91 98765 43210"
     * @param body     Message text
     * @return gateway messageId, or null on failure
     */
    public String send(String toPhone, String body) {
        try {
            // Check gateway is ready
            ResponseEntity<Map> status = restTemplate.getForEntity(gatewayUrl + "/status", Map.class);
            if (status.getBody() == null || !Boolean.TRUE.equals(status.getBody().get("ready"))) {
                log.warn("WhatsApp gateway not ready — message not sent to {}", toPhone);
                throw new RuntimeException("WhatsApp gateway not connected. Scan QR code at terminal.");
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, String>> request = new HttpEntity<>(
                    Map.of("to", toPhone, "message", body), headers
            );

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    gatewayUrl + "/send", request, Map.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                String messageId = (String) response.getBody().get("messageId");
                log.info("📱 WhatsApp sent → {} | ID: {}", toPhone, messageId);
                return messageId;
            }
            throw new RuntimeException("Gateway returned: " + response.getStatusCode());

        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            log.error("WhatsApp gateway error → {}: {}", toPhone, e.getMessage());
            throw new RuntimeException("WhatsApp send failed: " + e.getMessage(), e);
        }
    }

    public String sendDocument(String toPhone, String base64Pdf, String fileName, String caption) {
        try {
            ResponseEntity<Map> status = restTemplate.getForEntity(gatewayUrl + "/status", Map.class);
            if (status.getBody() == null || !Boolean.TRUE.equals(status.getBody().get("ready"))) {
                throw new RuntimeException("WhatsApp gateway not connected.");
            }
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, String>> request = new HttpEntity<>(
                    Map.of("to", toPhone, "fileName", fileName, "pdfBase64", base64Pdf, "caption", caption),
                    headers
            );
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    gatewayUrl + "/send-document", request, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                String messageId = (String) response.getBody().get("messageId");
                log.info("📄 PDF sent → {} | ID: {}", toPhone, messageId);
                return messageId;
            }
            throw new RuntimeException("Gateway returned: " + response.getStatusCode());
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            log.error("WhatsApp document send error → {}: {}", toPhone, e.getMessage());
            throw new RuntimeException("WhatsApp document send failed: " + e.getMessage(), e);
        }
    }

    public boolean isEnabled() {
        try {
            ResponseEntity<Map> status = restTemplate.getForEntity(gatewayUrl + "/status", Map.class);
            return status.getBody() != null && Boolean.TRUE.equals(status.getBody().get("ready"));
        } catch (Exception e) {
            return false;
        }
    }

    public static String buildMessage(String jobNumber, String vehicleReg, String customerName,
                                      String statusLabel, String updateMessage) {
        return "🚗 *7GEARS MOTORS* — Service Update\n\n" +
               "Hello " + customerName + ",\n\n" +
               "Your vehicle *" + vehicleReg + "* (Job #" + jobNumber + ") service update:\n\n" +
               "📌 *" + statusLabel.toUpperCase() + "*\n" +
               updateMessage + "\n\n" +
               "Thank you,\n" +
               "*7GEARS MOTORS*, Chennai\n" +
               "Queries: +91 78260 47847\n\n" +
               "This is a system generated message.";
    }
}
