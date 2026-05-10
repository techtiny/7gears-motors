package com.sevengears.motors.controller;

import com.sevengears.motors.model.ServiceImage;
import com.sevengears.motors.service.ImageService;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/jobs/{jobId}/images")
public class ImageController {

    private final ImageService imageService;
    public ImageController(ImageService imageService) { this.imageService = imageService; }

    @GetMapping
    public ResponseEntity<List<ServiceImage>> getAll(@PathVariable Long jobId,
                                                      @RequestParam(required = false) String type) {
        if (type != null) return ResponseEntity.ok(imageService.findByJobAndType(jobId, type));
        return ResponseEntity.ok(imageService.findByJob(jobId));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ServiceImage> upload(@PathVariable Long jobId,
                                               @RequestParam("file") MultipartFile file,
                                               @RequestParam("type") String type) throws IOException {
        return ResponseEntity.ok(imageService.upload(jobId, file, type));
    }

    @GetMapping("/{fileName:.+}")
    public ResponseEntity<Resource> serve(@PathVariable Long jobId,
                                          @PathVariable String fileName) {
        Path path = imageService.resolveFile(jobId, fileName);
        Resource resource = new FileSystemResource(path);
        if (!resource.exists()) return ResponseEntity.notFound().build();

        String ct = fileName.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(ct))
                .header(HttpHeaders.CACHE_CONTROL, "max-age=86400")
                .body(resource);
    }

    @GetMapping("/{fileName:.+}/thumb")
    public ResponseEntity<Resource> serveThumb(@PathVariable Long jobId,
                                               @PathVariable String fileName) {
        Path thumbPath = imageService.resolveThumb(jobId, fileName);
        if (thumbPath != null) {
            Resource thumbResource = new FileSystemResource(thumbPath);
            if (thumbResource.exists()) {
                return ResponseEntity.ok()
                        .contentType(MediaType.IMAGE_JPEG)
                        .header(HttpHeaders.CACHE_CONTROL, "max-age=86400")
                        .body(thumbResource);
            }
        }
        // Fallback to original if no thumbnail available
        return serve(jobId, fileName);
    }

    @DeleteMapping("/{imageId}")
    public ResponseEntity<Void> delete(@PathVariable Long jobId, @PathVariable Long imageId) throws IOException {
        imageService.delete(jobId, imageId);
        return ResponseEntity.noContent().build();
    }
}
