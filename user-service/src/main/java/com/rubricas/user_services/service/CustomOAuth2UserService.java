package com.rubricas.user_services.service;

import com.rubricas.user_services.model.Role;
import com.rubricas.user_services.model.User;
import com.rubricas.user_services.repository.UserRepository;

// Imports de OIDC
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;

// --- ¡IMPORTS NUEVOS Y CRUCIALES! ---
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import java.util.HashSet;
import java.util.Set;
// --- FIN DE IMPORTS ---

import org.springframework.stereotype.Service;
import java.util.Optional;

@Service
public class CustomOAuth2UserService extends OidcUserService {

    private final UserRepository userRepository;

    public CustomOAuth2UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public OidcUser loadUser(OidcUserRequest userRequest) throws OAuth2AuthenticationException {
        
        System.out.println("--- 1. [CustomOAuth2UserService] loadUser() INICIADO ---");

        // 1. Carga el usuario base de Google (atributos, token, etc.)
        OidcUser oidcUser = super.loadUser(userRequest); 

        String email = oidcUser.getAttribute("email");
        String name = oidcUser.getAttribute("name");
        
        System.out.println("--- 2. Usuario de Google obtenido: " + email + " ---");

        // 2. Busca o crea el usuario en nuestra BD
        Optional<User> userOptional = userRepository.findByEmail(email);
        User user; // Este es nuestro usuario de la BD (con el rol correcto)

        if (userOptional.isPresent()) {
            user = userOptional.get();
            System.out.println("--- 3. Usuario ENCONTRADO en la BD. Rol: " + user.getRol() + " ---");
        } else {
            System.out.println("--- 3. Usuario NO encontrado. Creando nuevo usuario... ---");
            user = new User();
            user.setEmail(email);
            user.setNombre(name);
            user.setRol(Role.ESTUDIANTE); 
            userRepository.save(user);
            System.out.println("--- 4. ¡Usuario nuevo GUARDADO en la BD! ---");
        }

        // --- 3. EL ARREGLO MÁGICO ---
        // Creamos una nueva lista de permisos (authorities) para Spring Security
        // Empezamos con los permisos que ya nos dio Google (ej. "SCOPE_openid")
        Set<GrantedAuthority> authorities = new HashSet<>(oidcUser.getAuthorities());
        
        // 4. Añadimos NUESTRO ROL de la base de datos a esa lista
        String dbRole = user.getRol().name(); // Ej: "ADMINISTRADOR"
        authorities.add(new SimpleGrantedAuthority(dbRole));
        System.out.println("--- 5. Rol final para la sesión: " + dbRole + " ---");

        // 5. Creamos un nuevo usuario (DefaultOidcUser) que Spring usará para la sesión.
        return new DefaultOidcUser(authorities, oidcUser.getIdToken(), oidcUser.getUserInfo());
    }
}