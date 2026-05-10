package com.sevengears.motors.service;

import com.sevengears.motors.model.ServiceImage;
import com.sevengears.motors.model.ServiceJob;
import com.sevengears.motors.repository.ServiceImageRepository;
import com.sevengears.motors.repository.ServiceJobRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.nio.file.*;
import java.util.*;

@Service
public class ImageService {

    private static final Logger log = LoggerFactory.getLogger(ImageService.class);
    private static final int THUMB_SIZE = 320;

    private final ServiceImageRepository imageRepository;
    private final ServiceJobRepository jobRepository;

    @Value("${upload.dir:./uploads}")
    private String uploadDir;

    public ImageService(ServiceImageRepository imageRepository, ServiceJobRepository jobRepository) {
        this.imageRepository = imageRepository;
        this.jobRepository = jobRepository;
    }

    public java.util.List<ServiceImage> findByJob(Long jobId) {
        return imageRepository.findByServiceJobIdOrderByUploadedAtAsc(jobId);
    }

    public java.util.List<ServiceImage> findByJobAndType(Long jobId, String type) {
        return imageRepository.findByServiceJobIdAndImageTypeOrderByUploadedAtAsc(jobId, type.toUpperCase());
    }

    @Transactional
    public ServiceImage upload(Long jobId, MultipartFile file, String imageType) throws IOException {
        ServiceJob job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found: " + jobId));

        String ext = getExtension(file.getOriginalFilename());
        if (!java.util.List.of("jpg", "jpeg", "png", "webp", "heic").contains(ext.toLowerCase()))
            throw new IllegalArgumentException("Only JPG, PNG, WEBP images allowed");

        String fileName = jobId + "_" + imageType.toUpperCase() + "_" + UUID.randomUUID() + "." + ext;
        String thumbFileName = "thumb_" + jobId + "_" + imageType.toUpperCase() + "_" + UUID.randomUUID() + ".jpg";

        Path dir = Paths.get(uploadDir, "jobs", String.valueOf(jobId));
        Files.createDirectories(dir);

        Path originalPath = dir.resolve(fileName);
        Files.copy(file.getInputStream(), originalPath, StandardCopyOption.REPLACE_EXISTING);

        // Generate thumbnail (best-effort — skip if format unsupported e.g. HEIC)
        Path thumbPath = dir.resolve(thumbFileName);
        boolean thumbOk = generateThumbnail(originalPath, thumbPath);

        ServiceImage img = new ServiceImage();
        img.setServiceJob(job);
        img.setFileName(fileName);
        img.setOriginalName(file.getOriginalFilename());
        img.setImageType(imageType.toUpperCase());
        img.setContentType(file.getContentType());
        img.setFileSize(file.getSize());
        if (thumbOk) img.setThumbnailFileName(thumbFileName);
        return imageRepository.save(img);
    }

    @Transactional
    public void delete(Long jobId, Long imageId) throws IOException {
        ServiceImage img = imageRepository.findById(imageId)
                .orElseThrow(() -> new RuntimeException("Image not found"));
        Path dir = Paths.get(uploadDir, "jobs", String.valueOf(jobId));
        Files.deleteIfExists(dir.resolve(img.getFileName()));
        if (img.getThumbnailFileName() != null)
            Files.deleteIfExists(dir.resolve(img.getThumbnailFileName()));
        imageRepository.delete(img);
    }

    public Path resolveFile(Long jobId, String fileName) {
        return Paths.get(uploadDir, "jobs", String.valueOf(jobId), fileName);
    }

    /** Returns the thumbnail path for a given original fileName, or null if none stored. */
    public Path resolveThumb(Long jobId, String fileName) {
        return imageRepository.findByServiceJobIdOrderByUploadedAtAsc(jobId).stream()
                .filter(i -> fileName.equals(i.getFileName()) && i.getThumbnailFileName() != null)
                .findFirst()
                .map(i -> Paths.get(uploadDir, "jobs", String.valueOf(jobId), i.getThumbnailFileName()))
                .orElse(null);
    }

    private boolean generateThumbnail(Path original, Path thumbPath) {
        try {
            BufferedImage src = ImageIO.read(original.toFile());
            if (src == null) return false; // unsupported format (HEIC, WEBP, etc.)

            int w = src.getWidth(), h = src.getHeight();
            double scale = (double) THUMB_SIZE / Math.max(w, h);
            int tw = Math.max(1, (int) (w * scale));
            int th = Math.max(1, (int) (h * scale));

            BufferedImage thumb = new BufferedImage(tw, th, BufferedImage.TYPE_INT_RGB);
            Graphics2D g = thumb.createGraphics();
            g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
            g.drawImage(src, 0, 0, tw, th, null);
            g.dispose();

            ImageIO.write(thumb, "jpg", thumbPath.toFile());
            return true;
        } catch (Exception e) {
            log.warn("Thumbnail generation failed for {}: {}", original.getFileName(), e.getMessage());
            return false;
        }
    }

    private String getExtension(String name) {
        if (name == null || !name.contains(".")) return "jpg";
        return name.substring(name.lastIndexOf('.') + 1);
    }
}
