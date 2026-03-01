package com.nbh.backend.util;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

/**
 * Standalone smoke test to verify Database connectivity bypassing Spring Boot
 * auto-config.
 * Mandatory environment variables:
 * - SPRING_DATASOURCE_URL
 * - SPRING_DATASOURCE_USERNAME
 * - SPRING_DATASOURCE_PASSWORD
 */
public class DbSmokeTest {
    public static void main(String[] args) {
        String url = System.getenv("SPRING_DATASOURCE_URL");
        String user = System.getenv("SPRING_DATASOURCE_USERNAME");
        String password = System.getenv("SPRING_DATASOURCE_PASSWORD");

        System.out.println("🔍 TESTING CONNECTION TO: " + url);
        System.out.println("👤 ATTEMPTING AUTH AS: " + user);

        if (url == null || user == null || password == null) {
            System.err.println("❌ ERROR: Missing environment variables.");
            System.exit(1);
        }

        try (Connection conn = DriverManager.getConnection(url, user, password);
                Statement stmt = conn.createStatement();
                ResultSet rs = stmt.executeQuery("SELECT current_user, now()")) {

            if (rs.next()) {
                String currentUser = rs.getString(1);
                String dbTime = rs.getString(2);
                System.out.println("✅ CONNECTION SUCCESS!");
                System.out.println("🔑 LOGGED IN AS: " + currentUser);
                System.out.println("🕒 DATABASE TIME: " + dbTime);
            }

            System.exit(0);
        } catch (Exception e) {
            System.err.println("❌ CONNECTION FAILED!");
            e.printStackTrace();
            System.exit(1);
        }
    }
}
