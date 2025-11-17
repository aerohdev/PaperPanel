package de.kaicraft.adminpanel.auth;

import com.auth0.jwt.JWT;
import com.auth0.jwt.JWTVerifier;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;

import java.util.Date;

/**
 * Utility class for JWT token generation and verification
 */
public class JWTUtil {

    /**
     * Generate a JWT token for a user
     *
     * @param username The username to encode in the token
     * @param secret The secret key for signing
     * @param timeoutSeconds Token validity duration in seconds
     * @return JWT token string
     */
    public static String generateToken(String username, String secret, int timeoutSeconds) {
        Algorithm algorithm = Algorithm.HMAC256(secret);
        Date now = new Date();
        Date expiresAt = new Date(now.getTime() + (timeoutSeconds * 1000L));

        return JWT.create()
                .withSubject(username)
                .withIssuedAt(now)
                .withExpiresAt(expiresAt)
                .withIssuer("ServerAdminPanel")
                .sign(algorithm);
    }

    /**
     * Verify a JWT token and extract the username
     *
     * @param token The JWT token to verify
     * @param secret The secret key for verification
     * @return The username from the token
     * @throws JWTVerificationException if token is invalid or expired
     */
    public static String verifyToken(String token, String secret) throws JWTVerificationException {
        Algorithm algorithm = Algorithm.HMAC256(secret);
        JWTVerifier verifier = JWT.require(algorithm)
                .withIssuer("ServerAdminPanel")
                .build();

        DecodedJWT jwt = verifier.verify(token);
        return jwt.getSubject();
    }

    /**
     * Check if a token is valid without throwing exceptions
     *
     * @param token The JWT token to check
     * @param secret The secret key for verification
     * @return true if token is valid, false otherwise
     */
    public static boolean isTokenValid(String token, String secret) {
        try {
            verifyToken(token, secret);
            return true;
        } catch (JWTVerificationException e) {
            return false;
        }
    }

    /**
     * Extract username from token without verification (use with caution)
     *
     * @param token The JWT token
     * @return The username or null if token is malformed
     */
    public static String extractUsername(String token) {
        try {
            DecodedJWT jwt = JWT.decode(token);
            return jwt.getSubject();
        } catch (Exception e) {
            return null;
        }
    }
}
