package com.rubricas.evaluation_service.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rubricas.evaluation_service.model.Evaluation;
import com.rubricas.evaluation_service.model.ReporteDTO;
import com.rubricas.evaluation_service.model.StudentResultDTO;
import com.rubricas.evaluation_service.repository.EvaluationRepository;
import com.rubricas.evaluation_service.service.ResultCalculationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/evaluations")
public class EvaluationController {

    private final EvaluationRepository evaluationRepository;
    private final RestTemplate restTemplate;
    private final ResultCalculationService resultCalculationService;

    // Constructor limpio (sin WebSocket ni GoogleSheets)
    public EvaluationController(EvaluationRepository evaluationRepository,
            RestTemplate restTemplate,
            ResultCalculationService resultCalculationService) {
        this.evaluationRepository = evaluationRepository;
        this.restTemplate = restTemplate;
        this.resultCalculationService = resultCalculationService;
    }

    /**
     * Endpoint para ENVIAR UNA EVALUACIÓN (Estudiante responde examen).
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Evaluation submitEvaluation(@RequestBody Evaluation evaluation) {
        System.out.println("--- Nueva Evaluación Recibida ---");

        try {
            // 1. Calculamos la nota usando el servicio de cálculo
            double score = resultCalculationService.calculateScore(evaluation);
            evaluation.setScore(score);
            System.out.println("--- Nota Calculada: " + score + " ---");

            // 2. APLICAMOS LA REGLA DE NEGOCIO (ESTO FALTABA)
            // Si la nota es 60 o más, APROBADO. Si no, REPROBADO.
            if (score >= 60.0) {
                evaluation.setStatus("APROBADO");
            } else {
                evaluation.setStatus("REPROBADO");
            }

        } catch (Exception e) {
            System.err.println("No se pudo calcular la nota: " + e.getMessage());
            evaluation.setScore(0.0); // Nota 0 si falla el cálculo
            evaluation.setStatus("REPROBADO"); // Y reprueba por defecto
        }

        return evaluationRepository.save(evaluation);
    }

    /**
     * Endpoint para "MIS NOTAS" (Estudiante ve sus resultados).
     */
    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<StudentResultDTO>> getEvaluationsForStudent(@PathVariable Long studentId) {
        List<Evaluation> evaluations = evaluationRepository.findByEvaluatorId(studentId);
        List<StudentResultDTO> results = new ArrayList<>();

        // URLs de los otros microservicios (en local)
        String rubricUrlBase = "http://localhost:8082/api/courses/rubrics/";
        String courseUrlBase = "http://localhost:8082/api/courses/";

        ObjectMapper mapper = new ObjectMapper();

        for (Evaluation ev : evaluations) {
            try {
                // 1. Obtener datos de la Rúbrica desde course-service
                String rubricJsonStr = restTemplate.getForObject(rubricUrlBase + ev.getRubricId(), String.class);
                JsonNode rubricObj = mapper.readTree(rubricJsonStr);

                String type = rubricObj.has("type") ? rubricObj.get("type").asText() : "Examen";
                String title = type.equals("COEVAL") ? "Ficha de Coevaluación" : "Cuestionario / Examen";
                Long courseId = rubricObj.get("courseId").asLong();

                // 2. Obtener nombre del Curso desde course-service
                String courseJsonStr = restTemplate.getForObject(courseUrlBase + courseId, String.class);
                JsonNode courseObj = mapper.readTree(courseJsonStr);
                String courseName = courseObj.get("name").asText();

                // 3. Agregar a la lista de resultados
                results.add(new StudentResultDTO(ev.getId(), title, courseName, ev.getScore()));

            } catch (Exception e) {
                // Si el curso o rúbrica fueron borrados, no mostramos esa nota antigua
                System.out.println("Omitiendo evaluación antigua o borrada ID: " + ev.getId());
            }
        }

        return ResponseEntity.ok(results);
    }

    /**
     * Endpoint para REPORTE DOCENTE (Ver notas de todos los alumnos en una
     * rúbrica).
     */
    @GetMapping("/rubric/{rubricId}")
    public ResponseEntity<List<ReporteDTO>> getResultsForRubric(@PathVariable Long rubricId) {
        List<Evaluation> evaluations = evaluationRepository.findByRubricId(rubricId);
        List<ReporteDTO> reportes = new ArrayList<>();

        String userServiceUrl = "http://localhost:8081/api/users/";

        try {
            for (Evaluation ev : evaluations) {
                try {
                    // Llamamos al user-service para obtener nombre y email del alumno
                    String userUrl = userServiceUrl + ev.getEvaluatorId();
                    JsonNode user = restTemplate.getForObject(userUrl, JsonNode.class);

                    String studentName = user.get("nombre").asText();
                    String studentEmail = user.get("email").asText();

                    reportes.add(new ReporteDTO(ev.getId(), studentName, studentEmail, ev.getScore(), ev.getResults()));
                } catch (Exception e) {
                    // Si el usuario fue borrado, ponemos "Usuario Eliminado"
                    reportes.add(new ReporteDTO(ev.getId(), "Usuario Eliminado", "-", ev.getScore(), ev.getResults()));
                }
            }
            return ResponseEntity.ok(reportes);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}