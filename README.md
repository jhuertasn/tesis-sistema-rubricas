# 🎓 EvaluaApp - Sistema de Evaluación por Rúbricas (Tesis)

Este proyecto es una plataforma web para la gestión de evaluaciones académicas, permitiendo a docentes crear clases, subir exámenes desde Excel y gestionar rúbricas de coevaluación.

## 📋 Requisitos Previos

Antes de empezar, asegúrate de tener instalado en tu computadora:

1.  **Java JDK 17** o superior.
2.  **Maven** (generalmente viene con el IDE, pero es bueno tenerlo).
3.  **Node.js** (versión 18 o superior) y **npm**.
4.  **MySQL Workbench** (Base de datos).
5.  **Git** (para clonar el repositorio).

---

## 🚀 1. Configuración de Base de Datos

El sistema usa 3 bases de datos independientes (Microservicios).
Abre **MySQL Workbench** y ejecuta este script SQL para crearlas limpias:

```sql
CREATE DATABASE IF NOT EXISTS tesis_users_db;
CREATE DATABASE IF NOT EXISTS tesis_courses_db;
CREATE DATABASE IF NOT EXISTS tesis_evaluations_db;
```
## Nota: 
Asegúrate de que tu usuario de MySQL sea root y la contraseña sea la que configuraste en los archivos application.properties de cada servicio.

## ⚙️ 2. Ejecución del Sistema (Paso a Paso)
El sistema se compone de 4 partes. Debes iniciarlas en este orden:

## Paso A: Iniciar Servicios Backend (Desde el Editor)
No uses la terminal para esto. Usa el botón "Run" o "Play" de tu editor para cada archivo principal:

## User Service (Puerto 8081):

Abre el archivo: user-service/src/main/java/.../UserServicesApplication.java

Haz clic en Run (o Ejecutar).

Espera a ver en consola: Tomcat started on port 8081.

## Course Service (Puerto 8082):

Abre el archivo: course-service/src/main/java/.../CourseServiceApplication.java

Haz clic en Run.

Espera a ver en consola: Tomcat started on port 8082.

## Evaluation Service (Puerto 8083):

Abre el archivo: evaluation-service/src/main/java/.../EvaluationServiceApplication.java

Haz clic en Run.

Espera a ver en consola: Tomcat started on port 8083.

## Paso B: Iniciar Frontend (Desde la Terminal)

Para la página web, sí usaremos una terminal.

Abre una terminal en la carpeta frontend.

```bash
cd frontend
```

Si es la primera vez, instala las librerías:

```bash
npm install
```

Luego, inicia el servidor de desarrollo:

```bash
npm run dev
```

Abre el link que aparece (usualmente http://localhost:5173).

## 🎭 Guion de Demostración (Ruta de Pruebas)

Sigue estos pasos exactos para la defensa de la tesis.

## Escena 1: El Administrador
Ingresa a http://localhost:5173.

Inicia sesión con el usuario Admin: admin@tesis.com / 123456.

Ve al menú "Gestionar Usuarios".

Muestra la lista de usuarios y explica que tienes control total (cambiar roles, eliminar usuarios inactivos).

Cierra sesión.

## Escena 2: El Docente (Creación)

Regístrate o inicia sesión como Docente: profe@tesis.com / 123.

Ve a "Mis Clases" y haz clic en "+ Crear Clase".

Crea la clase: "Ingeniería de Software II" (Cupo: 10).

¡IMPORTANTE! Copia el Código de la Clase (ej. ING-SW2) que aparece en la tarjeta.

Entra a la clase y haz clic en "Subir Cuestionario".

Sube el archivo Excel de prueba (examen_demo.xlsx).

Verifica que aparezca la tarjeta del examen.

Cierra sesión.

## Escena 3: El Estudiante (Ejecución)

Regístrate como Estudiante: alumno@tesis.com / 123.

En "Mis Clases", pega el Código de la Clase y dale a "Unirse".

Entra a la clase y haz clic en "Iniciar Evaluación".

Responde el examen y dale a "Enviar".

Ve al menú lateral "Mis Notas" y muestra que tu calificación se calculó automáticamente.

## Escena 4: Resultados (Cierre)

Vuelve a entrar como el Docente.

Entra a la clase, busca el cuestionario y dale a "Ver Resultados".

Muestra que el alumno ya tiene nota en la tabla.

Clic en "Descargar Excel" y abre el archivo para mostrar el reporte final.

Ve a "Mi Perfil" y muestra cómo puedes actualizar tus datos personales.

## 🛠️ Solución de Problemas Comunes

1. Error de Conexión (Connection Refused): Verifica que MySQL esté abierto en Workbench.

2. Error 400/403: Cierra sesión y vuelve a entrar para refrescar tus permisos.

3. Frontend en blanco: Asegúrate de haber ejecutado npm install dentro de la carpeta frontend antes de npm run dev.

4. Puerto Ocupado: Asegúrate de no tener dos terminales corriendo el mismo servicio a la vez.