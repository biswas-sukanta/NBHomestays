package com.nbh.backend.model.converter;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

/**
 * JPA Converter for PostgreSQL text[] to List<String>.
 * Handles conversion between PostgreSQL array type and Java List.
 */
@Converter
public class StringListConverter implements AttributeConverter<List<String>, String> {

    private static final String DELIMITER = "|||";
    private static final String POSTGRES_ARRAY_PREFIX = "{";
    private static final String POSTGRES_ARRAY_SUFFIX = "}";

    @Override
    public String convertToDatabaseColumn(List<String> attribute) {
        if (attribute == null || attribute.isEmpty()) {
            return null;
        }
        // PostgreSQL array format: {item1,item2,item3}
        StringBuilder sb = new StringBuilder(POSTGRES_ARRAY_PREFIX);
        for (int i = 0; i < attribute.size(); i++) {
            if (i > 0) {
                sb.append(",");
            }
            String item = attribute.get(i);
            if (item != null) {
                // Escape quotes and backslashes
                sb.append("\"").append(item.replace("\\", "\\\\").replace("\"", "\\\"")).append("\"");
            }
        }
        sb.append(POSTGRES_ARRAY_SUFFIX);
        return sb.toString();
    }

    @Override
    public List<String> convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) {
            return new ArrayList<>();
        }
        
        // Parse PostgreSQL array format: {item1,item2,item3}
        String content = dbData.trim();
        if (content.startsWith(POSTGRES_ARRAY_PREFIX) && content.endsWith(POSTGRES_ARRAY_SUFFIX)) {
            content = content.substring(1, content.length() - 1);
        }
        
        if (content.isBlank()) {
            return new ArrayList<>();
        }
        
        // Handle quoted strings properly
        List<String> result = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean inQuotes = false;
        boolean escapeNext = false;
        
        for (int i = 0; i < content.length(); i++) {
            char c = content.charAt(i);
            
            if (escapeNext) {
                current.append(c);
                escapeNext = false;
            } else if (c == '\\') {
                escapeNext = true;
            } else if (c == '"') {
                inQuotes = !inQuotes;
            } else if (c == ',' && !inQuotes) {
                result.add(current.toString());
                current = new StringBuilder();
            } else {
                current.append(c);
            }
        }
        result.add(current.toString());
        
        return result;
    }
}
