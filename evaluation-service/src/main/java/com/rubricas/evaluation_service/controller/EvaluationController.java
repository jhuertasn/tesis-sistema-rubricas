package com.rubricas.evaluation_service.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rubricas.evaluation_service.model.Evaluation;
import com.rubricas.evaluation_service.model.ReporteDTO;
import com.rubricas.evaluation_service.model.StudentResultDTO;
import com.rubricas.evaluation_service.repository.EvaluationRepository;
import com.rubricas.evaluation_service.service.GoogleSheetsService;
import com.rubricas.evaluation_service.service.ResultCalculationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/evaluations")
public class EvaluationController {

    private final EvaluationRepository evaluationRepository;
    private final RestTemplate restTemplate;
    private final SimpMessagingTemplate messagingTemplate;
    private final GoogleSheetsService googleSheetsService;
    private final ResultCalculationService resultCalculationService;

    // El constructor con las 5 dependencias
    public EvaluationController(EvaluationRepository evaluationRepository,
            RestTemplate restTemplate,
            SimpMessagingTemplate messagingTemplate,
            GoogleSheetsService googleSheetsService,
            ResultCalculationService resultCalculationService) {
        this.evaluationRepository = evaluationRepository;
        this.restTemplate = restTemplate;
        this.messagingTemplate = messagingTemplate;
        this.googleSheetsService = googleSheetsService;
        this.resultCalculationService = resultCalculationService;
    }

    // El método POST actualizado que calcula la nota
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Evaluation submitEvaluation(@RequestBody Evaluation evaluation) {

        System.out.println("--- Nueva Evaluación Recibida ---");
        System.out.println("Resultados: " + evaluation.getResults());

        try {
            double score = resultCalculationService.calculateScore(evaluation);
            evaluation.setScore(score); // Guardamos la nota
            System.out.println("--- Nota Calculada: " + score + " ---");
        } catch (Exception e) {
            System.err.println("No se pudo calcular la nota: " + e.getMessage());
            evaluation.setScore(0.0); // Asigna 0 si falla el cálculo
        }

        Evaluation savedEvaluation = evaluationRepository.save(evaluation);

        String destination = "/topic/evaluation-update/" + savedEvaluation.getRubricId();
        messagingTemplate.convertAndSend(destination, savedEvaluation);
        System.out.println("Notificación WebSocket enviada a: " + destination);

        return savedEvaluation;
    }

    // El cuerpo de tus métodos originales, ahora sin comentar.

    @GetMapping("/{evaluationId}/export")
    public ResponseEntity<String> exportResults(@PathVariable Long evaluationId) {
        Evaluation evaluation = evaluationRepository.findById(evaluationId).orElse(null);

        if (evaluation == null) {
            return new ResponseEntity<>("Evaluación no encontrada.", HttpStatus.NOT_FOUND);
        }

        try {
            String sheetUrl = googleSheetsService.createAndWriteSheet(evaluationId, evaluation.getResults());
            return ResponseEntity.ok(sheetUrl);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>("Error al exportar a Google Sheets.", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<StudentResultDTO>> getEvaluationsForStudent(@PathVariable Long studentId) {
        List<Evaluation> evaluations = evaluationRepository.findByEvaluatorId(studentId);
        List<StudentResultDTO> results = new ArrayList<>();

        String rubricUrlBase = "http://localhost:8082/api/courses/rubrics/";
        String courseUrlBase = "http://localhost:8082/api/courses/";

        for (Evaluation ev : evaluations) {
            String title = "Evaluación";
            String courseName = "Curso";

            try {
                // 1. Obtenemos la Rúbrica
                // (Si la rúbrica fue borrada, esto lanzará excepción y saltaremos al catch)
                String rubricJsonStr = restTemplate.getForObject(rubricUrlBase + ev.getRubricId(), String.class);

                // ... (lógica de parsing de rúbrica igual que antes) ...
                ObjectMapper mapper = new ObjectMapper();
                JsonNode rubricObj = mapper.readTree(rubricJsonStr);
                String type = rubricObj.has("type") ? rubricObj.get("type").asText() : "Examen";
                title = type.equals("COEVAL") ? "Ficha de Coevaluación" : "Cuestionario / Examen";
                Long courseId = rubricObj.get("courseId").asLong();

                // 2. Obtenemos el Curso
                // ¡AQUÍ ESTÁ EL CAMBIO!
                // Si el curso fue eliminado (Soft Delete), el course-service devolverá 404.
                // RestTemplate lanzará una excepción y entraremos al 'catch'.
                String courseJsonStr = restTemplate.getForObject(courseUrlBase + courseId, String.class);
                JsonNode courseObj = mapper.readTree(courseJsonStr);
                courseName = courseObj.get("name").asText();

                // 3. Solo si todo existió, agregamos el resultado a la lista
                results.add(new StudentResultDTO(ev.getId(), title, courseName, ev.getScore()));

            } catch (Exception e) {
                // Si el curso o la rúbrica fueron eliminados,
                // simplemente NO agregamos esta evaluación a la lista 'results'.
                // El estudiante dejará de verla.
                System.out.println("Omitiendo evaluación " + ev.getId() + ": Curso o rúbrica eliminados.");
            }
        }

        return ResponseEntity.ok(results);
    }

    @GetMapping("/rubric/{rubricId}")
    public ResponseEntity<List<ReporteDTO>> getResultsForRubric(@PathVariable Long rubricId) {

        List<Evaluation> evaluations = evaluationRepository.findByRubricId(rubricId);
        List<ReporteDTO> reportes = new ArrayList<>();

        // 1. URL base de nuestro user-service
        String userServiceUrl = "http://localhost:8081/api/users/";

        try {
            // 2. Iteramos sobre cada evaluación enviada
            for (Evaluation ev : evaluations) {
                // 3. Llamamos al user-service para pedir los datos del estudiante
                String userUrl = userServiceUrl + ev.getEvaluatorId();
                JsonNode user = restTemplate.getForObject(userUrl, JsonNode.class);

                String studentName = user.get("nombre").asText();
                String studentEmail = user.get("email").asText();

                // 4. Creamos el DTO con los datos combinados
                reportes.add(new ReporteDTO(ev.getId(),
                        studentName,
                        studentEmail,
                        ev.getScore(),
                        ev.getResults()));
            }

            return ResponseEntity.ok(reportes);

        } catch (Exception e) {
            System.err.println("Error al construir el reporte: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

}