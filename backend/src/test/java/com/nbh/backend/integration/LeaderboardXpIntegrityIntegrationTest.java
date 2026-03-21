package com.nbh.backend.integration;

import org.h2.jdbcx.JdbcConnectionPool;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.junit.jupiter.api.Assertions.assertEquals;

class LeaderboardXpIntegrityIntegrationTest {

    private static final String LEADERBOARD_SQL = """
            SELECT u.id,
                   COALESCE(ph.total_xp, 0) + COALESCE(h.total_xp, 0) AS total_xp
            FROM users u
            LEFT JOIN (
                SELECT user_id, SUM(xp_delta) AS total_xp
                FROM user_xp_post_helpful
                GROUP BY user_id
            ) ph ON ph.user_id = u.id
            LEFT JOIN (
                SELECT user_id, SUM(xp_delta) AS total_xp
                FROM user_xp_history
                GROUP BY user_id
            ) h ON h.user_id = u.id
            WHERE u.is_deleted = FALSE
            ORDER BY COALESCE(ph.total_xp, 0) + COALESCE(h.total_xp, 0) DESC, u.id
            """;

    private JdbcConnectionPool dataSource;

    @BeforeEach
    void setUp() throws SQLException {
        dataSource = JdbcConnectionPool.create("jdbc:h2:mem:leaderboard_xp;MODE=PostgreSQL;DB_CLOSE_DELAY=-1", "sa", "");
        try (Connection connection = dataSource.getConnection(); Statement statement = connection.createStatement()) {
            statement.execute("""
                    CREATE TABLE users (
                        id UUID PRIMARY KEY,
                        is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
                        total_xp INTEGER NOT NULL DEFAULT 0
                    )
                    """);
            statement.execute("""
                    CREATE TABLE posts (
                        id UUID PRIMARY KEY,
                        is_deleted BOOLEAN NOT NULL DEFAULT FALSE
                    )
                    """);
            statement.execute("""
                    CREATE TABLE user_xp_history (
                        id UUID PRIMARY KEY,
                        user_id UUID NOT NULL,
                        source_type VARCHAR(50) NOT NULL,
                        xp_delta INTEGER NOT NULL,
                        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                    )
                    """);
            statement.execute("""
                    CREATE TABLE user_xp_post_helpful (
                        id UUID PRIMARY KEY,
                        user_id UUID NOT NULL,
                        post_id UUID NOT NULL,
                        xp_delta INTEGER NOT NULL,
                        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
                    )
                    """);
            statement.execute("""
                    CREATE TRIGGER trigger_purge_post_helpful_xp_on_soft_delete
                    AFTER UPDATE ON posts
                    FOR EACH ROW CALL "com.nbh.backend.integration.PostSoftDeleteXpCleanupTrigger"
                    """);
        }
    }

    @AfterEach
    void tearDown() throws SQLException {
        try (Connection connection = dataSource.getConnection(); Statement statement = connection.createStatement()) {
            statement.execute("DROP ALL OBJECTS");
        }
        dataSource.dispose();
    }

    @Test
    @DisplayName("Create post, award helpful XP, then soft-delete post: typed XP and leaderboard both drop to zero")
    void helpfulXpDisappearsOnSoftDelete() throws SQLException {
        UUID userId = insertUser();
        UUID postId = insertPost();

        insertPostHelpfulXp(userId, postId, 16);

        assertEquals(16, fetchPostHelpfulXpTotal(userId));
        assertEquals(16, fetchLeaderboardXp(userId));

        softDeletePost(postId);

        assertEquals(0, countRows("SELECT COUNT(*) FROM user_xp_post_helpful"));
        assertEquals(0, fetchPostHelpfulXpTotal(userId));
        assertEquals(0, fetchLeaderboardXp(userId));
    }

    @Test
    @DisplayName("Batch post deletion removes XP rows for all deleted posts")
    void batchDeleteRemovesPostHelpfulXp() throws SQLException {
        UUID userId = insertUser();
        UUID postOne = insertPost();
        UUID postTwo = insertPost();

        insertPostHelpfulXp(userId, postOne, 16);
        insertPostHelpfulXp(userId, postTwo, 19);

        try (Connection connection = dataSource.getConnection();
             PreparedStatement statement = connection.prepareStatement("DELETE FROM posts WHERE id IN (?, ?)")) {
            statement.setObject(1, postOne);
            statement.setObject(2, postTwo);
            statement.executeUpdate();
        }

        assertEquals(0, countRows("SELECT COUNT(*) FROM user_xp_post_helpful"));
        assertEquals(0, fetchPostHelpfulXpTotal(userId));
        assertEquals(0, fetchLeaderboardXp(userId));
    }

    @Test
    @DisplayName("Users with mixed XP sources retain valid non-post XP after post-linked XP is removed")
    void mixedXpSourcesRemainConsistent() throws SQLException {
        UUID userId = insertUser();
        UUID postId = insertPost();

        insertHistoryXp(userId, "BADGE_AWARD", 20);
        insertPostHelpfulXp(userId, postId, 16);

        assertEquals(36, fetchLeaderboardXp(userId));

        softDeletePost(postId);

        assertEquals(0, fetchPostHelpfulXpTotal(userId));
        assertEquals(20, fetchLeaderboardXp(userId));
    }

    @Test
    @DisplayName("Concurrent helpful XP inserts preserve typed-ledger totals")
    void concurrentHelpfulXpWritesRemainConsistent() throws Exception {
        UUID firstUserId = insertUser();
        UUID secondUserId = insertUser();
        UUID postOne = insertPost();
        UUID postTwo = insertPost();
        CountDownLatch startGate = new CountDownLatch(1);
        ExecutorService executor = Executors.newFixedThreadPool(2);

        try {
            Future<?> first = executor.submit(() -> awaitAndInsert(startGate, firstUserId, postOne, 16));
            Future<?> second = executor.submit(() -> awaitAndInsert(startGate, secondUserId, postTwo, 19));

            startGate.countDown();
            first.get();
            second.get();
        } finally {
            executor.shutdownNow();
        }

        assertEquals(16, fetchPostHelpfulXpTotal(firstUserId));
        assertEquals(19, fetchPostHelpfulXpTotal(secondUserId));
        assertEquals(35, countRows("SELECT COALESCE(SUM(xp_delta), 0) FROM user_xp_post_helpful"));
    }

    private UUID insertUser() throws SQLException {
        UUID userId = UUID.randomUUID();
        try (Connection connection = dataSource.getConnection();
             PreparedStatement statement = connection.prepareStatement(
                     "INSERT INTO users (id, is_deleted, total_xp) VALUES (?, FALSE, 0)")) {
            statement.setObject(1, userId);
            statement.executeUpdate();
        }
        return userId;
    }

    private UUID insertPost() throws SQLException {
        UUID postId = UUID.randomUUID();
        try (Connection connection = dataSource.getConnection();
             PreparedStatement statement = connection.prepareStatement(
                     "INSERT INTO posts (id, is_deleted) VALUES (?, FALSE)")) {
            statement.setObject(1, postId);
            statement.executeUpdate();
        }
        return postId;
    }

    private void insertPostHelpfulXp(UUID userId, UUID postId, int xpDelta) throws SQLException {
        try (Connection connection = dataSource.getConnection();
             PreparedStatement statement = connection.prepareStatement(
                     "INSERT INTO user_xp_post_helpful (id, user_id, post_id, xp_delta) VALUES (?, ?, ?, ?)")) {
            statement.setObject(1, UUID.randomUUID());
            statement.setObject(2, userId);
            statement.setObject(3, postId);
            statement.setInt(4, xpDelta);
            statement.executeUpdate();
        }
    }

    private void insertHistoryXp(UUID userId, String sourceType, int xpDelta) throws SQLException {
        try (Connection connection = dataSource.getConnection();
             PreparedStatement statement = connection.prepareStatement(
                     "INSERT INTO user_xp_history (id, user_id, source_type, xp_delta) VALUES (?, ?, ?, ?)")) {
            statement.setObject(1, UUID.randomUUID());
            statement.setObject(2, userId);
            statement.setString(3, sourceType);
            statement.setInt(4, xpDelta);
            statement.executeUpdate();
        }
    }

    private void softDeletePost(UUID postId) throws SQLException {
        try (Connection connection = dataSource.getConnection();
             PreparedStatement statement = connection.prepareStatement(
                     "UPDATE posts SET is_deleted = TRUE WHERE id = ?")) {
            statement.setObject(1, postId);
            statement.executeUpdate();
        }
    }

    private int fetchLeaderboardXp(UUID userId) throws SQLException {
        try (Connection connection = dataSource.getConnection();
             PreparedStatement statement = connection.prepareStatement(LEADERBOARD_SQL);
             ResultSet resultSet = statement.executeQuery()) {
            while (resultSet.next()) {
                if (userId.equals(resultSet.getObject("id", UUID.class))) {
                    return resultSet.getInt("total_xp");
                }
            }
        }
        return 0;
    }

    private int fetchPostHelpfulXpTotal(UUID userId) throws SQLException {
        try (Connection connection = dataSource.getConnection();
             PreparedStatement statement = connection.prepareStatement(
                     "SELECT COALESCE(SUM(xp_delta), 0) FROM user_xp_post_helpful WHERE user_id = ?")) {
            statement.setObject(1, userId);
            try (ResultSet resultSet = statement.executeQuery()) {
                resultSet.next();
                return resultSet.getInt(1);
            }
        }
    }

    private int countRows(String sql) throws SQLException {
        try (Connection connection = dataSource.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql);
             ResultSet resultSet = statement.executeQuery()) {
            resultSet.next();
            return resultSet.getInt(1);
        }
    }

    private void awaitAndInsert(CountDownLatch startGate, UUID userId, UUID postId, int xpDelta) {
        try {
            startGate.await();
            insertPostHelpfulXp(userId, postId, xpDelta);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
