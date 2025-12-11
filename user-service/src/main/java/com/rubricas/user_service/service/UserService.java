package com.rubricas.user_service.service;

import com.rubricas.user_service.dto.LoginRequest;
import com.rubricas.user_service.dto.RegisterRequest;
import com.rubricas.user_service.model.User;
import com.rubricas.user_service.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // --- AUTENTICACIÓN ---

    public User register(RegisterRequest req) {
        if (userRepository.findByEmail(req.getEmail()).isPresent()) {
            throw new RuntimeException("El email ya está registrado");
        }

        User user = new User();
        user.setNombre(req.getNombre());
        user.setEmail(req.getEmail());
        // Encriptamos la contraseña
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        
        // Manejo de roles (Por defecto ESTUDIANTE si no se envía nada)
        String rolAsignado = req.getRol() != null && !req.getRol().isEmpty() ? req.getRol().toUpperCase() : "ESTUDIANTE";
        user.setRol(rolAsignado);
        
        // Generar avatar por defecto
        user.setPicture("https://ui-avatars.com/api/?background=random&name=" + req.getNombre().replace(" ", "+"));

        return userRepository.save(user);
    }

    public User login(LoginRequest req) {
        // 1. Buscamos por email
        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        // 2. Verificamos la contraseña
        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new RuntimeException("Contraseña incorrecta");
        }

        return user;
    }

    // --- GESTIÓN DE USUARIOS (CRUD) ---

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User getUserById(Long id) {
        return userRepository.findById(id).orElse(null);
    }
    
    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email).orElse(null);
    }

    public User updateUserRole(Long userId, String newRole) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        
        user.setRol(newRole.toUpperCase());
        return userRepository.save(user);
    }
    
    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }
}