package com.rubricas.evaluation_service.model;

public class StudentResultDTO {
    private Long id;
    private String rubricTitle;
    private String courseName; // <-- NUEVO CAMPO
    private Double score;

    public StudentResultDTO(Long id, String rubricTitle, String courseName, Double score) {
        this.id = id;
        this.rubricTitle = rubricTitle;
        this.courseName = courseName;
        this.score = score;
    }

    // Getters
    public Long getId() { return id; }
    public String getRubricTitle() { return rubricTitle; }
    public String getCourseName() { return courseName; } // <-- NUEVO GETTER
    public Double getScore() { return score; }
}