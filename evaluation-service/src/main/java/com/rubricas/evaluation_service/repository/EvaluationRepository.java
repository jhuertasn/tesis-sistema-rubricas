package com.rubricas.evaluation_service.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.rubricas.evaluation_service.model.Evaluation;

@Repository
public interface EvaluationRepository extends JpaRepository<Evaluation, Long> {
    // ... dentro de la interfaz EvaluationRepository ...
    List<Evaluation> findByRubricId(Long rubricId);
    List<Evaluation> findByEvaluatorId(Long evaluatorId);
}
