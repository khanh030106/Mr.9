package com.example.backend.configs;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class PostgresSchemaRepairRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(PostgresSchemaRepairRunner.class);

    private static final String FIND_COLUMN_DATA_TYPE = """
            SELECT data_type
            FROM information_schema.columns
            WHERE table_schema = 'dbo'
              AND table_name = ?
              AND column_name = ?
            """;

    private static final List<TextColumnRepair> TEXT_COLUMN_REPAIRS = List.of(
            new TextColumnRepair("books", "title"),
            new TextColumnRepair("categories", "categoryname"),
            new TextColumnRepair("authors", "authorname"),
            new TextColumnRepair("publishers", "publishername"),
            new TextColumnRepair("users", "fullname"),
            new TextColumnRepair("users", "email"),
            new TextColumnRepair("roles", "rolename")
    );

    private final JdbcTemplate jdbcTemplate;

    public PostgresSchemaRepairRunner(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        for (TextColumnRepair repair : TEXT_COLUMN_REPAIRS) {
            String dataType = findColumnDataType(repair.tableName(), repair.columnName());
            if (dataType == null || !"bytea".equalsIgnoreCase(dataType)) {
                continue;
            }

            repairByteaTextColumn(repair);
        }
    }

    private void repairByteaTextColumn(TextColumnRepair repair) {
        String qualifiedName = "dbo." + repair.tableName() + "." + repair.columnName();
        log.warn("Detected {} as bytea. Repairing to text for case-insensitive search support.", qualifiedName);

        try {
            jdbcTemplate.execute(buildRepairSql(repair, true));
            log.info("Repaired {} to text using UTF-8 conversion.", qualifiedName);
        } catch (DataAccessException utf8Ex) {
            log.warn("UTF-8 conversion failed while repairing {}. Trying escape-encoding fallback.", qualifiedName);
            jdbcTemplate.execute(buildRepairSql(repair, false));
            log.info("Repaired {} to text using escape-encoding fallback.", qualifiedName);
        }
    }

    private String buildRepairSql(TextColumnRepair repair, boolean utf8Conversion) {
        String expression = utf8Conversion
                ? "convert_from(" + repair.columnName() + ", 'UTF8')"
                : "encode(" + repair.columnName() + ", 'escape')";

        return "ALTER TABLE dbo." + repair.tableName()
                + " ALTER COLUMN " + repair.columnName()
                + " TYPE text USING " + expression;
    }

    private String findColumnDataType(String tableName, String columnName) {
        try {
            return jdbcTemplate.query(
                    FIND_COLUMN_DATA_TYPE,
                    ps -> {
                        ps.setString(1, tableName);
                        ps.setString(2, columnName);
                    },
                    rs -> rs.next() ? rs.getString("data_type") : null
            );
        } catch (DataAccessException ex) {
            log.debug("Skipping schema repair for {}.{} because metadata query failed.", tableName, columnName, ex);
            return null;
        }
    }

    private record TextColumnRepair(String tableName, String columnName) {}
}
