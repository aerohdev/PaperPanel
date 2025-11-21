package de.kaicraft.adminpanel.util;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Marks a class that should be exported as a TypeScript interface
 * The annotation processor will generate corresponding TypeScript types
 */
@Retention(RetentionPolicy.SOURCE)
@Target(ElementType.TYPE)
public @interface TypeScriptType {
    /**
     * Optional custom name for the TypeScript interface
     * If not specified, uses the Java class name
     */
    String value() default "";
}
