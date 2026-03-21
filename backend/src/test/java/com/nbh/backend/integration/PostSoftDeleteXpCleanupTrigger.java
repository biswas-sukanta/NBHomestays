package com.nbh.backend.integration;

import org.h2.api.Trigger;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.UUID;

public class PostSoftDeleteXpCleanupTrigger implements Trigger {

    @Override
    public void init(Connection conn, String schemaName, String triggerName, String tableName, boolean before, int type) {
    }

    @Override
    public void fire(Connection conn, Object[] oldRow, Object[] newRow) throws SQLException {
        if (oldRow == null || newRow == null) {
            return;
        }
        boolean oldDeleted = asBoolean(oldRow[1]);
        boolean newDeleted = asBoolean(newRow[1]);
        if (!oldDeleted && newDeleted) {
            UUID postId = asUuid(newRow[0]);
            try (PreparedStatement statement = conn.prepareStatement(
                    "DELETE FROM user_xp_post_helpful WHERE post_id = ?")) {
                statement.setObject(1, postId);
                statement.executeUpdate();
            }
        }
    }

    private boolean asBoolean(Object value) {
        if (value instanceof Boolean booleanValue) {
            return booleanValue;
        }
        return value != null && Boolean.parseBoolean(value.toString());
    }

    private UUID asUuid(Object value) {
        return value instanceof UUID uuid ? uuid : UUID.fromString(value.toString());
    }

    @Override
    public void close() {
    }

    @Override
    public void remove() {
    }
}
