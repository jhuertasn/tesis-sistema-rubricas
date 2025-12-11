package com.rubricas.user_services.config;

//import org.springframework.http.HttpMethod;
import java.util.Arrays;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
// Imports de CORS
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.rubricas.user_services.service.CustomOAuth2UserService;

// Import para la respuesta HTTP
import jakarta.servlet.http.HttpServletResponse;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

	private final CustomOAuth2UserService customOAuth2UserService;

	// ¡Ya no necesitamos el ClientRegistrationRepository!
	public SecurityConfig(CustomOAuth2UserService customOAuth2UserService) {
		this.customOAuth2UserService = customOAuth2UserService;
	}

    // ¡Hemos eliminado el método oidcLogoutSuccessHandler()!

    @SuppressWarnings({"removal", "deprecation"})
    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

		System.out.println("--- CARGANDO CONFIGURACIÓN DE SEGURIDAD (CON LOGOUT 200 OK) ---");

		http.cors(cors -> cors.configurationSource(corsConfigurationSource())).csrf(csrf -> csrf.disable())

				.authorizeHttpRequests(authorizeRequests -> authorizeRequests
						// 1. Permite las rutas de los otros servicios (para el proxy)
						.requestMatchers("/api/courses/**", "/api/evaluations/**").permitAll()

						// 2. Permite el login y logout
						.requestMatchers("/login", "/api/logout").permitAll()

						// .requestMatchers(HttpMethod.GET, "/api/users/*").permitAll()
						.requestMatchers(HttpMethod.GET, "/api/users/{id:\\d+}").permitAll()
						// 3. Protege solo las rutas de este servicio (user-service)
						.requestMatchers("/api/users/**").authenticated()

						.anyRequest().authenticated())
				.oauth2Login(
						oauth2 -> oauth2.userInfoEndpoint(userInfo -> userInfo.oidcUserService(customOAuth2UserService) // Esto
																														// guarda
																														// el
																														// usuario
						).defaultSuccessUrl("http://localhost:5173/clases", true))
				// --- ARREGLO 2: Usamos un manejador de éxito simple ---
				.logout(logout -> logout.logoutRequestMatcher(new AntPathRequestMatcher("/api/logout", "GET"))
						.deleteCookies("JSESSIONID").invalidateHttpSession(true).clearAuthentication(true)
						// Le decimos que al tener éxito, solo devuelva "200 OK"
						.logoutSuccessHandler((request, response, authentication) -> {
							response.setStatus(HttpServletResponse.SC_OK);
						}));

		return http.build();
	}

	// Bean de CORS (se queda igual)
	@Bean
	CorsConfigurationSource corsConfigurationSource() {
		CorsConfiguration configuration = new CorsConfiguration();
		configuration.setAllowedOrigins(Arrays.asList("http://localhost:5173"));
		configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
		configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type"));
		configuration.setAllowCredentials(true);
		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/**", configuration);
		return source;
	}
}