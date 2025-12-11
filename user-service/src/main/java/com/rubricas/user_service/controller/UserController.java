package com.rubricas.user_service.controller;

import com.rubricas.user_service.model.User;
import com.rubricas.user_service.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // Listar todos (Para el panel de Admin)
    @GetMapping
    public List<User> getAllUsers() {
        return userService.getAllUsers();
    }

    // Obtener uno por ID
    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        User user = userService.getUserById(id);
        return user != null ? ResponseEntity.ok(user) : ResponseEntity.notFound().build();
    }
    
    // Obtener info del usuario logueado (por email)
    @GetMapping("/search")
    public ResponseEntity<User> getUserByEmail(@RequestParam String email) {
        User user = userService.getUserByEmail(email);
        return user != null ? ResponseEntity.ok(user) : ResponseEntity.notFound().build();
    }

    // Cambiar rol (Admin)
    @PutMapping("/{userId}/role")
    public ResponseEntity<?> updateUserRole(@PathVariable Long userId, @RequestBody Map<String, String> body) {
        try {
            String newRole = body.get("role");
            User updatedUser = userService.updateUserRole(userId, newRole);
            return ResponseEntity.ok(updatedUser);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Eliminar usuario
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}