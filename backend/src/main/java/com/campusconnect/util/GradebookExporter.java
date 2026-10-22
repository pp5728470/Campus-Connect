package com.campusconnect.util;

import com.campusconnect.dto.grade.GradebookAssignment;
import com.campusconnect.dto.grade.GradebookCell;
import com.campusconnect.dto.grade.GradebookResponse;
import com.campusconnect.dto.grade.GradebookRow;
import com.campusconnect.entity.SubmissionStatus;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/** Renders a {@link GradebookResponse} as CSV or Excel for download. */
public final class GradebookExporter {

    private static final String SUMMARY_LABEL = "Class average";

    private GradebookExporter() {
    }

    public static byte[] toCsv(GradebookResponse gradebook) {
        StringBuilder csv = new StringBuilder("\uFEFF"); // BOM so Excel detects UTF-8
        appendCsvLine(csv, header(gradebook));

        for (GradebookRow row : gradebook.rows()) {
            List<String> fields = new ArrayList<>();
            fields.add(row.studentName());
            fields.add(row.studentEmail());
            for (GradebookCell cell : row.cells()) {
                fields.add(cellText(cell));
            }
            fields.add(percentText(row.averagePercent()));
            appendCsvLine(csv, fields);
        }

        List<String> summary = new ArrayList<>();
        summary.add(SUMMARY_LABEL);
        summary.add("");
        for (GradebookAssignment assignment : gradebook.assignments()) {
            summary.add(percentText(assignment.averagePercent()));
        }
        summary.add(percentText(gradebook.classAveragePercent()));
        appendCsvLine(csv, summary);

        return csv.toString().getBytes(StandardCharsets.UTF_8);
    }

    public static byte[] toXlsx(GradebookResponse gradebook) {
        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Gradebook");

            Font bold = workbook.createFont();
            bold.setBold(true);
            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFont(bold);

            Row headerRow = sheet.createRow(0);
            List<String> header = header(gradebook);
            for (int c = 0; c < header.size(); c++) {
                Cell cell = headerRow.createCell(c);
                cell.setCellValue(header.get(c));
                cell.setCellStyle(headerStyle);
            }

            int rowIndex = 1;
            for (GradebookRow row : gradebook.rows()) {
                Row excelRow = sheet.createRow(rowIndex++);
                excelRow.createCell(0).setCellValue(safeText(row.studentName()));
                excelRow.createCell(1).setCellValue(safeText(row.studentEmail()));
                int col = 2;
                for (GradebookCell cell : row.cells()) {
                    writeCell(excelRow.createCell(col++), cell);
                }
                writePercent(excelRow.createCell(col), row.averagePercent());
            }

            Row summary = sheet.createRow(rowIndex);
            Cell label = summary.createCell(0);
            label.setCellValue(SUMMARY_LABEL);
            label.setCellStyle(headerStyle);
            int col = 2;
            for (GradebookAssignment assignment : gradebook.assignments()) {
                writePercent(summary.createCell(col++), assignment.averagePercent());
            }
            writePercent(summary.createCell(col), gradebook.classAveragePercent());

            for (int c = 0; c < header.size(); c++) {
                sheet.autoSizeColumn(c);
            }
            workbook.write(out);
            return out.toByteArray();
        } catch (IOException ex) {
            throw new UncheckedIOException("Could not build Excel export", ex);
        }
    }

    private static List<String> header(GradebookResponse gradebook) {
        List<String> header = new ArrayList<>();
        header.add("Student");
        header.add("Email");
        for (GradebookAssignment assignment : gradebook.assignments()) {
            header.add(assignment.title() + " (/" + assignment.maxPoints() + ")");
        }
        header.add("Average %");
        return header;
    }

    private static void writeCell(Cell target, GradebookCell cell) {
        if (cell.grade() != null) {
            target.setCellValue(cell.grade().doubleValue());
        } else {
            target.setCellValue(statusLabel(cell.status()));
        }
    }

    private static void writePercent(Cell target, Double percent) {
        if (percent != null) {
            target.setCellValue(percent);
        }
    }

    private static String cellText(GradebookCell cell) {
        return cell.grade() != null ? plain(cell.grade()) : statusLabel(cell.status());
    }

    private static String percentText(Double percent) {
        return percent == null ? "" : String.valueOf(percent);
    }

    private static String plain(BigDecimal value) {
        return value.stripTrailingZeros().toPlainString();
    }

    private static String statusLabel(SubmissionStatus status) {
        return switch (status) {
            case ASSIGNED -> "Assigned";
            case SUBMITTED -> "Submitted";
            case LATE -> "Submitted late";
            case MISSING -> "Missing";
            case GRADED, RETURNED -> "Graded";
        };
    }

    private static void appendCsvLine(StringBuilder csv, List<String> fields) {
        for (int i = 0; i < fields.size(); i++) {
            if (i > 0) {
                csv.append(',');
            }
            csv.append(csvEscape(safeText(fields.get(i))));
        }
        csv.append("\r\n");
    }

    private static String csvEscape(String value) {
        if (value.contains(",") || value.contains("\"") || value.contains("\n") || value.contains("\r")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }

    /** Prevents spreadsheet formula injection from user-supplied names and titles. */
    private static String safeText(String value) {
        if (value == null) {
            return "";
        }
        if (!value.isEmpty() && "=+-@\t\r".indexOf(value.charAt(0)) >= 0) {
            return "'" + value;
        }
        return value;
    }
}
