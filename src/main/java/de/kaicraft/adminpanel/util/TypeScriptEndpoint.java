package de.kaicraft.adminpanel.util;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Marks an API method with endpoint metadata for TypeScript generation
 * This information is included in the generated TypeScript as JSDoc comments
 */
@Retention(RetentionPolicy.SOURCE)
@Target(ElementType.METHOD)
public @interface TypeScriptEndpoint {
    /**
     * The API endpoint path (e.g., "/api/v1/dashboard/stats")
     */
    String path();
    
    /**
     * The HTTP method (GET, POST, PUT, DELETE, etc.)
     */
    String method();
    
    /**
     * Optional description of the endpoint
     */
    String description() default "";
}
