package com.sevengears.motors.dto;

import java.time.LocalDateTime;

public class FeedbackDTO {
    private Long id;
    private int rating;
    private String comment;
    private LocalDateTime createdAt;
    private Long jobId;
    private String jobNumber;

    public FeedbackDTO() {}

    public FeedbackDTO(Long id, int rating, String comment, LocalDateTime createdAt,
                       Long jobId, String jobNumber) {
        this.id = id;
        this.rating = rating;
        this.comment = comment;
        this.createdAt = createdAt;
        this.jobId = jobId;
        this.jobNumber = jobNumber;
    }

    public Long getId() { return id; }
    public int getRating() { return rating; }
    public String getComment() { return comment; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public Long getJobId() { return jobId; }
    public String getJobNumber() { return jobNumber; }
}
