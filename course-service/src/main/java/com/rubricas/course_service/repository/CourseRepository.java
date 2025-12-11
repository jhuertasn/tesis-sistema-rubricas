package com.rubricas.course_service.repository;

import com.rubricas.course_service.model.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {
	
    List<Course> findByTeacherId(Long teacherId);
    Optional<Course> findByCodigoClase(String codigoClase);
    
    boolean existsByCodigoClase(String codigoClase);
    boolean existsByCodigoClaseAndIdNot(String codigoClase, Long id);
   
}















