package com.rubricas.evaluation_service.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rubricas.evaluation_service.model.Evaluation;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.HttpClientErrorException;

@Service
public class ResultCalculationService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ResultCalculationService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    /**
     * Calcula la nota de una evaluación.
     * - Si es QUIZ: Compara respuestas y calcula nota (0-100).
     * - Si es COEVAL: Devuelve 100.0 para marcarla como "Completada".
     */
    public double calculateScore(Evaluation evaluation) throws Exception {
        
        System.out.println("--- [ResultCalculationService] Iniciando cálculo para Evaluación ID: " + evaluation.getId());

        // 1. Obtener el "molde" (la rúbrica) del course-service
        String rubricUrl = "http://localhost:8082/api/courses/rubrics/" + evaluation.getRubricId();
        ResponseEntity<String> response;
        
        try {
            response = restTemplate.getForEntity(rubricUrl, String.class);
        } catch (HttpClientErrorException.NotFound e) {
            System.err.println("Error: No se encontró la rúbrica/molde con ID: " + evaluation.getRubricId());
            throw new Exception("Molde no encontrado");
        }
        
        // 2. Leer la rúbrica
        JsonNode rubricNode = objectMapper.readTree(response.getBody());
        
        // --- DETECCIÓN DE TIPO ---
        // Verificamos si la rúbrica tiene el campo "type" (que añadimos en el paso anterior)
        String type = "QUIZ"; // Valor por defecto
        if (rubricNode.has("type") && !rubricNode.get("type").isNull()) {
            type = rubricNode.get("type").asText();
        }
        
        System.out.println("--- Tipo de Evaluación Detectada: " + type + " ---");

        // --- LÓGICA DIVIDIDA ---
        if ("COEVAL".equalsIgnoreCase(type)) {
            // CASO 1: ES UNA COEVALUACIÓN
            // Como es participativa, no calculamos "correctas vs incorrectas".
            // Simplemente devolvemos 100.0 para indicar que se completó exitosamente.
            return 100.0;
            
        } else {
            // CASO 2: ES UN EXAMEN / CUESTIONARIO (Lógica existente)
            return calculateQuizScore(rubricNode, evaluation);
        }
    }

    // Método auxiliar con tu lógica original de cuestionarios
    private double calculateQuizScore(JsonNode rubricNode, Evaluation evaluation) throws Exception {
        String quizContentString = rubricNode.get("content").asText();
        JsonNode answerKey = objectMapper.readTree(quizContentString);
        JsonNode studentAnswers = objectMapper.readTree(evaluation.getResults());
        
        double totalQuestions = 0;
        double correctAnswers = 0;

        for (int i = 0; i < answerKey.size(); i++) {
            totalQuestions++;
            
            String correctAnswer = answerKey.get(i).get("RespuestaCorrecta").asText().toLowerCase().trim();
            
            // Manejo seguro de nulos por si el estudiante no respondió una pregunta
            String studentAnswerNode = studentAnswers.has(Integer.toString(i)) 
                    ? studentAnswers.get(Integer.toString(i)).asText() 
                    : "";
            
            String studentAnswer = studentAnswerNode.toLowerCase().trim();

            System.out.println("Pregunta " + i + ": Correcta='" + correctAnswer + "', Estudiante='" + studentAnswer + "'");

            if (correctAnswer.equals(studentAnswer)) {
                correctAnswers++;
            }
        }

        if (totalQuestions == 0) return 0.0;

        double score = (correctAnswers / totalQuestions) * 100.0;
        System.out.println("--- Cálculo Final: " + score + "% ---");
        return score;
    }
}