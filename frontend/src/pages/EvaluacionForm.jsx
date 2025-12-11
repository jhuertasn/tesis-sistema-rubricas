// src/pages/EvaluacionForm.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../services/api';
import Sidebar from '../components/Sidebar.jsx';
import './MisClases.css'; // Reutilizamos el CSS
import Loader from '../components/Loader.jsx';
import Swal from 'sweetalert2'; // <-- 1. FALTABA IMPORTAR ESTO


function EvaluacionForm() {
  const navigate = useNavigate();
  const { rubricId } = useParams(); // Obtiene el ID de la rúbrica/quiz

  const [user, setUser] = useState(null);
  const [quiz, setQuiz] = useState([]); // El JSON del quiz
  const [rubricTitle, setRubricTitle] = useState('');
  const [answers, setAnswers] = useState({}); // { 0: "a", 1: "c", ... }
  const [loading, setLoading] = useState(true);
  const [targetId, setTargetId] = useState(''); // ID de a quién evalúo

  useEffect(() => {
    const loadQuizData = async () => {
      try {
        const userRes = await apiClient.get('/api/users/me');
        setUser(userRes.data);

        // 1. Pedimos la rúbrica/quiz al backend
        // ¡Necesitamos crear este endpoint! (GET /api/courses/rubrics/{id})
        const rubricRes = await apiClient.get(`/api/courses/rubrics/${rubricId}`);

        // El 'content' es un STRING, lo convertimos a un objeto JSON real
        const quizContent = JSON.parse(rubricRes.data.content);
        setQuiz(quizContent);
        setRubricTitle(rubricRes.data.title || `Evaluación #${rubricId}`); // (Necesitamos añadir 'title' a la Rúbrica)

      } catch (error) {
        console.error("Error al cargar la evaluación:", error);
        navigate('/clases');
      } finally {
        setLoading(false);
      }
    };
    loadQuizData();
  }, [rubricId, navigate]);

  // Guarda la respuesta del estudiante
  const handleAnswerChange = (questionIndex, answer) => {
    setAnswers(prevAnswers => ({
      ...prevAnswers,
      [questionIndex]: answer
    }));
  };

  // Envía las respuestas al backend
  const handleSubmit = async () => {
    if (Object.keys(answers).length !== quiz.length) {
      Swal.fire('Falta información', 'Responde todas las preguntas.', 'warning');
      return;
    }

    // 1. Formateamos las respuestas para el backend
const evaluationData = {
      rubricId: rubricId,
      evaluatorId: user.id, // YO soy quien evalúa
      // Si targetId está vacío, es autoevaluación (user.id). Si no, es coevaluación.
      evaluatedId: targetId || user.id, 
      results: JSON.stringify(answers)
    };

    try {
      // 2. Llamamos al endpoint que YA TENEMOS en evaluation-service
      await apiClient.post('/api/evaluations', evaluationData);
      Swal.fire('¡Enviado!', 'Evaluación enviada con éxito.', 'success');
      navigate('/clases'); // Lo regresamos a las clases
    } catch (error) {
      console.error("Error al enviar la evaluación:", error);
      Swal.fire('Error', 'No se pudo enviar.', 'error');
    }
  };

if (loading) { 
  return <Loader />; 
}
  return (
    <div className="dashboard-container">
      <Sidebar user={user} activePage="evaluaciones" />

      <main className="main-content">
        <div className="main-header">
          <h2>{rubricTitle}</h2>
        </div>
        
        <div className="quiz-instructions">
           <p>Responde todas las preguntas seleccionando la alternativa correcta y presiona Enviar.</p>
        </div>

        <div className="quiz-form">
          {quiz.map((question, index) => (
            <div className="class-card question-card" key={index}>
              <h4 className="question-title">
                <span className="question-number">Pregunta {index + 1}</span> 
                {question.Pregunta}
              </h4>
              
              <div className="quiz-options-container">
                {/* Opción A */}
                <label className={`quiz-option ${answers[index] === 'a' ? 'selected' : ''}`}>
                  <div className="radio-wrapper">
                    <input 
                      type="radio" name={`question-${index}`} value="a" 
                      onChange={() => handleAnswerChange(index, 'a')} 
                    />
                    <span className="option-letter">a.</span>
                  </div>
                  <span className="option-text">{question.OpcionA}</span>
                </label>

                {/* Opción B */}
                <label className={`quiz-option ${answers[index] === 'b' ? 'selected' : ''}`}>
                  <div className="radio-wrapper">
                    <input 
                      type="radio" name={`question-${index}`} value="b" 
                      onChange={() => handleAnswerChange(index, 'b')} 
                    />
                    <span className="option-letter">b.</span>
                  </div>
                  <span className="option-text">{question.OpcionB}</span>
                </label>

                {/* Opción C */}
                <label className={`quiz-option ${answers[index] === 'c' ? 'selected' : ''}`}>
                  <div className="radio-wrapper">
                    <input 
                      type="radio" name={`question-${index}`} value="c" 
                      onChange={() => handleAnswerChange(index, 'c')} 
                    />
                    <span className="option-letter">c.</span>
                  </div>
                  <span className="option-text">{question.OpcionC}</span>
                </label>

                {/* Opción D */}
                <label className={`quiz-option ${answers[index] === 'd' ? 'selected' : ''}`}>
                  <div className="radio-wrapper">
                    <input 
                      type="radio" name={`question-${index}`} value="d" 
                      onChange={() => handleAnswerChange(index, 'd')} 
                    />
                    <span className="option-letter">d.</span>
                  </div>
                  <span className="option-text">{question.OpcionD}</span>
                </label>
              </div>
            </div>
          ))}

          <div className="quiz-actions">
            <button className="button-primary large-button" onClick={handleSubmit}>
              Enviar Evaluación
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default EvaluacionForm;