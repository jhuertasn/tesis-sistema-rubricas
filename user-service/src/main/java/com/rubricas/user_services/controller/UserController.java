package com.rubricas.user_services.controller;

import com.rubricas.user_services.model.Role;
import com.rubricas.user_services.model.User;
import com.rubricas.user_services.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.*; 
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Endpoint para que el frontend sepa quién está conectado.
     * Devuelve los datos del usuario directamente desde Google.
     */
@GetMapping("/me")
    public ResponseEntity<User> getMyInfo(@AuthenticationPrincipal OidcUser principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        // Buscamos al usuario en nuestra BD usando el email que nos da Google
        String email = principal.getAttribute("email");
        User user = userRepository.findByEmail(email)
                .orElse(null); // Devuelve null si no lo encuentra (aunque no debería pasar)

        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        
        // Devolvemos el objeto User completo de nuestra BD (incluyendo id y rol)
        return ResponseEntity.ok(user);
    }

    /**
     * Obtiene la lista de TODOS los usuarios.
     * Solo los Administradores pueden hacer esto.
     */
    @GetMapping
    @PreAuthorize("hasAuthority('ADMINISTRADOR')")
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    /**
     * Crea un nuevo usuario.
     * Solo los Administradores pueden hacer esto.
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('ADMINISTRADOR')")
    public User createUser(@RequestBody User newUser) {
        return userRepository.save(newUser);
    }

    /**
     * Obtiene un usuario específico por su ID.
     * Solo los Administradores pueden hacer esto.
     */
    @GetMapping("/{id}")
    //@PreAuthorize("hasAuthority('ADMINISTRADOR')")
    public User getUserById(@PathVariable Long id) {
        return userRepository.findById(id)
                .orElse(null);
    }

    /**
     * Actualiza la información general de un usuario.
     * Solo los Administradores pueden hacer esto.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMINISTRADOR')")
    public User updateUser(@PathVariable Long id, @RequestBody User userDetails) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con id: " + id));

        user.setNombre(userDetails.getNombre());
        user.setEmail(userDetails.getEmail());
        user.setRol(userDetails.getRol());
        
        return userRepository.save(user);
    }

    /**
     * Actualiza SOLAMENTE el rol de un usuario.
     * Solo los Administradores pueden hacer esto.
     */
    @PutMapping("/{userId}/role")
    @PreAuthorize("hasAuthority('ADMINISTRADOR')")
    public ResponseEntity<User> updateUserRole(@PathVariable Long userId, @RequestBody Map<String, String> body) {
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con id: " + userId));
        
        String newRoleStr = body.get("role");
        Role newRole;
        try {
            // Convierte el texto (ej. "DOCENTE") al enum (Role.DOCENTE)
            newRole = Role.valueOf(newRoleStr.toUpperCase());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null); // Devuelve error si el rol no es válido
        }

        user.setRol(newRole);
        User updatedUser = userRepository.save(user);
        
        return ResponseEntity.ok(updatedUser);
    }

    /**
     * Elimina un usuario.
     * Solo los Administradores pueden hacer esto.
     */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('ADMINISTRADOR')")
    public void deleteUser(@PathVariable Long id) {
        userRepository.deleteById(id);
    }
}
