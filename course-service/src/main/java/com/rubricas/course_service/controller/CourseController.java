package com.rubricas.course_service.controller;

import java.io.InputStream;
import java.util.List;
import java.util.UUID;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.xssf.usermodel.XSSFSheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.rubricas.course_service.model.Course;
import com.rubricas.course_service.model.Enrollment;
import com.rubricas.course_service.model.Rubric;
import com.rubricas.course_service.repository.CourseRepository;
import com.rubricas.course_service.repository.EnrollmentRepository;
import com.rubricas.course_service.repository.RubricRepository;

@RestController
@RequestMapping("/api/courses")
public class CourseController {

	private final CourseRepository courseRepository;
	private final RubricRepository rubricRepository;

	private final EnrollmentRepository enrollmentRepository;

	public CourseController(CourseRepository courseRepository, RubricRepository rubricRepository,
			EnrollmentRepository enrollmentRepository) {
		this.courseRepository = courseRepository;
		this.rubricRepository = rubricRepository;
		this.enrollmentRepository = enrollmentRepository;
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public ResponseEntity<?> createCourse(@RequestBody Course newCourse) {
		
		// 1. Validar si el código ya existe
		if (newCourse.getCodigoClase() == null || newCourse.getCodigoClase().trim().isEmpty()) {
			// Generar código único automático
			String codigoAutomatico;
			do {
				codigoAutomatico = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
			} while (courseRepository.existsByCodigoClase(codigoAutomatico));
			newCourse.setCodigoClase(codigoAutomatico);
		} else {
			// Validar código personalizado
			String codigo = newCourse.getCodigoClase().toUpperCase().trim();

			// Rechazar si el código ya existe
			if (courseRepository.existsByCodigoClase(codigo)) {
				return ResponseEntity.status(HttpStatus.CONFLICT).body("Ya existe una clase con el código: " + codigo);
			}
			newCourse.setCodigoClase(codigo);
		}		

		// 2. Guardar el curso
		Course savedCourse = courseRepository.save(newCourse);

		// 3. Generar el contenido del QR
		String qrContent = "https://tuapp.com/enroll?courseId=" + savedCourse.getId();
		savedCourse.setQrCodeContent(qrContent);

		// 4. Guardar nuevamente con QR
		return ResponseEntity.status(HttpStatus.CREATED).body(courseRepository.save(savedCourse));
	}

	// --- ENDPOINT NUEVO PARA OBTENER UNA RÚBRICA POR SU ID ---
	@GetMapping("/rubrics/{rubricId}")
	public ResponseEntity<Rubric> getRubricById(@PathVariable Long rubricId) {
		return rubricRepository.findById(rubricId).map(ResponseEntity::ok) // Si la encuentra, devuelve 200 OK con la
																			// rúbrica
				.orElse(ResponseEntity.notFound().build()); // Si no, devuelve 404 Not Found
	}

	// Endpoint SIMULADO para que un estudiante se inscriba
	@PostMapping("/{courseId}/enroll")
	// @PreAuthorize("hasAuthority('ESTUDIANTE')")
	public ResponseEntity<Enrollment> enrollStudent(@PathVariable Long courseId, @RequestParam Long studentId) {
		// Aquí iría la lógica para inscribir a un estudiante en un curso.
		// Por ahora, solo simulamos y mostramos un log.

		// Validar que el curso existe
		if (!courseRepository.existsById(courseId)) {
			return new ResponseEntity<>(null, HttpStatus.NOT_FOUND);
		}

		Enrollment newEnrollment = new Enrollment(courseId, studentId);
		enrollmentRepository.save(newEnrollment);

		return new ResponseEntity<>(newEnrollment, HttpStatus.CREATED);
	}

	// --- MÉTODO PARA SUBIR EL ARCHIVO EXCEL ---
	@SuppressWarnings("resource")
	@PostMapping("/{courseId}/rubrics")
	public ResponseEntity<String> uploadRubric(@PathVariable Long courseId, @RequestParam("file") MultipartFile file) {
		if (!courseRepository.existsById(courseId)) {
			return new ResponseEntity<>("El curso no existe.", HttpStatus.NOT_FOUND);
		}

		try (InputStream is = file.getInputStream()) {
			XSSFWorkbook workbook = new XSSFWorkbook(is);
			XSSFSheet sheet = workbook.getSheetAt(0);
			Row headerRow = sheet.getRow(0);

			if (headerRow == null) {
				return new ResponseEntity<>("Excel vacío.", HttpStatus.BAD_REQUEST);
			}

			// --- 1. DETECCIÓN DE TIPO ---
			String detectedType = "QUIZ";
			org.apache.poi.ss.usermodel.DataFormatter formatter = new org.apache.poi.ss.usermodel.DataFormatter();

			for (Cell cell : headerRow) {
				String text = formatter.formatCellValue(cell).trim().toLowerCase();
				if (text.contains("puntaje") || text.contains("integrantes")) {
					detectedType = "COEVAL";
					break;
				}
			}

			ObjectMapper mapper = new ObjectMapper();
			ArrayNode rubricData = mapper.createArrayNode();

			// --- 2. LECTURA Y FILTRADO ---
			// Empezamos en i=1 para saltar la cabecera
			for (int i = 1; i <= sheet.getLastRowNum(); i++) {
				Row currentRow = sheet.getRow(i);
				if (currentRow == null)
					continue;

				ObjectNode rowNode = mapper.createObjectNode();
				boolean isValidRow = true; // Bandera para saber si la fila sirve

				// Si es COEVALUACIÓN, leemos columnas 0 y 1 específicamente
				if ("COEVAL".equals(detectedType)) {
					Cell celdaCriterio = currentRow.getCell(0);
					Cell celdaPuntaje = currentRow.getCell(1);

					String criterioVal = formatter.formatCellValue(celdaCriterio).trim();
					String puntajeVal = formatter.formatCellValue(celdaPuntaje).trim();

					// ¡AQUÍ ESTÁ EL ARREGLO!
					// Si no hay criterio o no hay puntaje (o es 0), ignoramos la fila
					if (criterioVal.isEmpty() || puntajeVal.isEmpty()) {
						isValidRow = false;
					} else {
						rowNode.put("Criterio", criterioVal);
						rowNode.put("PuntajeMaximo", puntajeVal);
					}

				} else {
					// LÓGICA PARA QUIZ (Tu código anterior para exámenes)
					for (int j = 0; j < headerRow.getLastCellNum(); j++) {
						Cell cell = currentRow.getCell(j);
						if (headerRow.getCell(j) != null) {
							String header = formatter.formatCellValue(headerRow.getCell(j)).trim();
							String val = formatter.formatCellValue(cell).trim();
							rowNode.put(header, val);
						}
					}
					// Validación simple para quiz
					if (!rowNode.has("Pregunta") || rowNode.get("Pregunta").asText().isEmpty()) {
						isValidRow = false;
					}
				}

				// Solo añadimos la fila si es válida
				if (isValidRow) {
					rubricData.add(rowNode);
				}
			}

			Rubric rubric = new Rubric();
			rubric.setCourseId(courseId);
			rubric.setContent(rubricData.toString());
			rubric.setType(detectedType);
			rubricRepository.save(rubric);

			return new ResponseEntity<>("Rúbrica (" + detectedType + ") subida exitosamente.", HttpStatus.CREATED);

		} catch (Exception e) {
			e.printStackTrace();
			return new ResponseEntity<>("Error procesando Excel.", HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	/**
	 * Obtiene todas las clases creadas por un docente específico.
	 */
	// --- ACTUALIZAR: Obtener solo cursos ACTIVOS del docente ---
	@GetMapping("/teacher/{teacherId}")
	public List<Course> getCoursesByTeacher(@PathVariable Long teacherId) {
		List<Course> allCourses = courseRepository.findByTeacherId(teacherId);
		// Filtramos: Solo devolvemos los que NO están eliminados
		return allCourses.stream().filter(c -> !c.isDeleted()).toList();
	}

	@GetMapping("/student/{studentId}")
	// @PreAuthorize("hasAuthority('ESTUDIANTE')")
	public ResponseEntity<List<Course>> getEnrolledCourses(@PathVariable Long studentId) {
		// 1. Buscamos todas las inscripciones de ese estudiante
		List<Enrollment> enrollments = enrollmentRepository.findByStudentId(studentId);

		// 2. Extraemos los IDs de los cursos
		List<Long> courseIds = enrollments.stream().map(Enrollment::getCourseId).toList();

		// 3. Buscamos todos esos cursos en la base de datos
		List<Course> courses = courseRepository.findAllById(courseIds);

		// --- ¡AQUÍ ESTÁ EL ARREGLO! ---
		// 4. Filtramos para eliminar los que tienen Soft Delete (deleted = true)
		List<Course> activeCourses = courses.stream().filter(c -> !c.isDeleted()) // Solo los NO eliminados
				.toList();
		// ------------------------------

		return ResponseEntity.ok(activeCourses);
	}

	/**
	 * CASO DE USO: El Administrador puede ver TODAS las clases.
	 */
	// --- ACTUALIZAR: Obtener solo cursos ACTIVOS para Admin ---
	@GetMapping("/all")
	public List<Course> getAllCourses() {
		List<Course> allCourses = courseRepository.findAll();
		return allCourses.stream().filter(c -> !c.isDeleted()).toList();
	}

	/**
	 * CASO DE USO: El Docente o Admin pueden modificar una clase. (Por ahora, solo
	 * permitimos cambiar el nombre)
	 */
	// --- ACTUALIZAR: Editar Curso Completo ---
	@PutMapping("/{courseId}")
	public ResponseEntity<Course> updateCourse(@PathVariable Long courseId, @RequestBody Course courseDetails) {
		Course course = courseRepository.findById(courseId)
				.orElseThrow(() -> new RuntimeException("Curso no encontrado"));

		// Actualizamos los campos
		course.setName(courseDetails.getName());
		course.setDescripcion(courseDetails.getDescripcion());
		course.setPeriodoAcademico(courseDetails.getPeriodoAcademico());
		course.setMaxEstudiantes(courseDetails.getMaxEstudiantes());
		// (El código no se suele cambiar, pero podrías si quieres)

		return ResponseEntity.ok(courseRepository.save(course));
	}

	/**
	 * CASO DE USO: El Docente o Admin pueden eliminar una clase.
	 */
	// --- ACTUALIZAR: Soft Delete (Borrado Lógico) ---
	@DeleteMapping("/{courseId}")
	public ResponseEntity<Void> deleteCourse(@PathVariable Long courseId) {
		Course course = courseRepository.findById(courseId).orElse(null);
		if (course != null) {
			// En lugar de borrar, lo marcamos como eliminado
			course.setDeleted(true);
			courseRepository.save(course);
		}
		return ResponseEntity.noContent().build();
	}

	/**
	 * Endpoint para OBTENER UNA SOLA CLASE por su ID. (Necesario para que la página
	 * de detalle muestre el nombre de la clase)
	 */
	@GetMapping("/{id}")
	public ResponseEntity<Course> getCourseById(@PathVariable Long id) {
		Course course = courseRepository.findById(id).orElse(null);

		// Si no existe O si está marcado como eliminado...
		if (course == null || course.isDeleted()) {
			return ResponseEntity.notFound().build(); // ...decimos que no se encontró.
		}

		return ResponseEntity.ok(course);
	}

	/**
	 * Endpoint para OBTENER LA LISTA DE RÚBRICAS/QUIZZES de una clase.
	 */
	@GetMapping("/{courseId}/rubrics")
	public ResponseEntity<List<Rubric>> getRubricsForCourse(@PathVariable Long courseId) {
		if (!courseRepository.existsById(courseId)) {
			return ResponseEntity.notFound().build();
		}
		List<Rubric> rubrics = rubricRepository.findByCourseId(courseId);

		// FILTRO: Solo devolvemos las que no están borradas
		List<Rubric> activeRubrics = rubrics.stream().filter(r -> !r.isDeleted()).toList();

		return ResponseEntity.ok(activeRubrics);
	}

	// Endpoint para inscribirse usando el CÓDIGO DE CLASE (Texto)
	@PostMapping("/enroll/code/{classCode}")
	public ResponseEntity<?> enrollByCode(@PathVariable String classCode, @RequestParam Long studentId) {

		// 1. Buscamos el curso por el código
		Course course = courseRepository.findByCodigoClase(classCode).orElse(null);

		if (course == null) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND)
					.body("No se encontró ninguna clase con el código: " + classCode);
		}

		// 2. Creamos la inscripción con el ID real del curso
		Enrollment newEnrollment = new Enrollment(course.getId(), studentId);
		enrollmentRepository.save(newEnrollment);

		return ResponseEntity.status(HttpStatus.CREATED).body(newEnrollment);
	}

	// --- NUEVO: Restaurar Curso (Recuperar) ---
	@PutMapping("/{courseId}/restore")
	public ResponseEntity<Void> restoreCourse(@PathVariable Long courseId) {
		Course course = courseRepository.findById(courseId).orElse(null);
		if (course != null) {
			course.setDeleted(false); // Lo revivimos
			courseRepository.save(course);
		}
		return ResponseEntity.ok().build();
	}

	// --- ACTUALIZADO: Eliminar Rúbrica (Soft Delete) ---
	@DeleteMapping("/rubrics/{rubricId}")
	public ResponseEntity<Void> deleteRubric(@PathVariable Long rubricId) {
		Rubric rubric = rubricRepository.findById(rubricId).orElse(null);

		if (rubric == null) {
			return ResponseEntity.notFound().build();
		}

		// EN LUGAR DE BORRAR, LA MARCAMOS COMO ELIMINADA
		rubric.setDeleted(true);
		rubricRepository.save(rubric);

		return ResponseEntity.noContent().build();
	}

	// --- (OPCIONAL) Nuevo Endpoint para Restaurar por si acaso ---
	@PutMapping("/rubrics/{rubricId}/restore")
	public ResponseEntity<Void> restoreRubric(@PathVariable Long rubricId) {
		Rubric rubric = rubricRepository.findById(rubricId).orElse(null);
		if (rubric != null) {
			rubric.setDeleted(false);
			rubricRepository.save(rubric);
		}
		return ResponseEntity.ok().build();
	}
}