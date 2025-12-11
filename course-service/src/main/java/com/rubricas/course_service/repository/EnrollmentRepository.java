package com.rubricas.course_service.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.rubricas.course_service.model.Enrollment;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {
	// Método para buscar todas las inscripciones de un estudiante
	List<Enrollment> findByStudentId(Long studentId);
	List<Enrollment> findByCourseId(Long courseId);

	boolean existsByCourseIdAndStudentId(Long courseId, Long studentId);
	Optional<Enrollment> findByCourseIdAndStudentId(Long courseId, Long studentId);

}