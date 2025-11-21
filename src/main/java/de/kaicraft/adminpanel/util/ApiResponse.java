package de.kaicraft.adminpanel.util;

import java.util.HashMap;
import java.util.Map;

/**
 * Utility class for creating standardized API responses
 * All API endpoints should return responses in the format:
 * Success: { success: true, data: {...} }
 * Error: { success: false, message: "error message" }
 */
public class ApiResponse {
    
    /**
     * Create a successful API response with data
     * @param dataKey The key for the data object (e.g., "stats", "players", "data")
     * @param data The data to return
     * @return Map representing the JSON response
     */
    public static Map<String, Object> success(String dataKey, Object data) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put(dataKey, data);
        return response;
    }
    
    /**
     * Create a successful API response with generic "data" key
     * @param data The data to return
     * @return Map representing the JSON response
     */
    public static Map<String, Object> success(Object data) {
        return success("data", data);
    }
    
    /**
     * Create a successful API response with a message
     * @param message The success message
     * @return Map representing the JSON response
     */
    public static Map<String, Object> successMessage(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", message);
        return response;
    }
    
    /**
     * Create an error API response
     * @param message The error message
     * @return Map representing the JSON response
     */
    public static Map<String, Object> error(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("message", message);
        return response;
    }
    
    /**
     * Create an error API response with additional details
     * @param message The error message
     * @param error The error type/code
     * @return Map representing the JSON response
     */
    public static Map<String, Object> error(String message, String error) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("message", message);
        response.put("error", error);
        return response;
    }
}
