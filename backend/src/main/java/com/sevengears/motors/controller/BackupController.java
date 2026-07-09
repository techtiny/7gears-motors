package com.sevengears.motors.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.io.*;
import java.nio.file.*;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.zip.*;

@RestController
@RequestMapping("/api/admin")
public class BackupController {

    @Value("${upload.dir:./uploads}")
    private String uploadDir;

    @GetMapping("/uploads.zip")
    public ResponseEntity<byte[]> downloadUploads() throws IOException {
        Path root = Paths.get(uploadDir);
        if (!Files.exists(root)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("No uploads directory found".getBytes());
        }

        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        try (ZipOutputStream zos = new ZipOutputStream(bos)) {
            Files.walkFileTree(root, new SimpleFileVisitor<>() {
                @Override
                public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) throws IOException {
                    String entryName = root.relativize(file).toString();
                    zos.putNextEntry(new ZipEntry(entryName));
                    Files.copy(file, zos);
                    zos.closeEntry();
                    return FileVisitResult.CONTINUE;
                }
            });
        }

        byte[] zipBytes = bos.toByteArray();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"uploads_backup.zip\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .contentLength(zipBytes.length)
                .body(zipBytes);
    }
}
