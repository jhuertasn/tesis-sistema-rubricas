package com.rubricas.evaluation_service.model;

// Un DTO (Data Transfer Object) es un objeto simple para enviar datos al frontend.
public class ReporteDTO {
    private String studentName;
    private String studentEmail;
    private Double score;

    private Long id;        // ID de la evaluación
    private String results; // El JSON con las respuestas (miembros, notas, etc.)

    // Constructor
public ReporteDTO(Long id, String studentName, String studentEmail, Double score, String results) {
        this.id = id;
        this.studentName = studentName;
        this.studentEmail = studentEmail;
        this.score = score;
        this.results = results;
    }

    // Getters y Setters
    public String getStudentName() { return studentName; }
    public void setStudentName(String studentName) { this.studentName = studentName; }
    public String getStudentEmail() { return studentEmail; }
    public void setStudentEmail(String studentEmail) { this.studentEmail = studentEmail; }
    public Double getScore() { return score; }
    public void setScore(Double score) { this.score = score; }
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getResults() { return results; }
    public void setResults(String results) { this.results = results; }
}