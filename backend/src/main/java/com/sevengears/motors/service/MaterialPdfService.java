package com.sevengears.motors.service;

import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.Image;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.*;
import com.sevengears.motors.model.MaterialConsumed;
import com.sevengears.motors.model.ServiceJob;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.awt.*;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class MaterialPdfService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a");

    private static final Color BRAND_RED    = new Color(0xC0, 0x39, 0x2B);
    private static final Color BRAND_DARK   = new Color(0x1a, 0x1a, 0x2e);
    private static final Color HEADER_BG    = new Color(0x1a, 0x1a, 0x2e);
    private static final Color ROW_EVEN     = new Color(0xF9, 0xF9, 0xF9);
    private static final Color ROW_ODD      = Color.WHITE;
    private static final Color BORDER_COLOR = new Color(0xE5, 0xE7, 0xEB);

    public byte[] generate(ServiceJob job, List<MaterialConsumed> items) throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document doc = new Document(PageSize.A4, 40, 40, 40, 40);
        PdfWriter.getInstance(doc, out);
        doc.open();

        // ── Header ─────────────────────────────────────────────
        PdfPTable header = new PdfPTable(2);
        header.setWidthPercentage(100);
        header.setWidths(new float[]{1.5f, 3f});
        header.setSpacingAfter(16);

        // Logo cell
        PdfPCell logoCell = new PdfPCell();
        logoCell.setBorder(Rectangle.NO_BORDER);
        logoCell.setPadding(0);
        try {
            ClassPathResource logoRes = new ClassPathResource("static/logo.png");
            if (logoRes.exists()) {
                Image logo = Image.getInstance(logoRes.getURL());
                logo.scaleToFit(70, 70);
                logoCell.addElement(logo);
            }
        } catch (Exception ignored) {}
        header.addCell(logoCell);

        // Company info cell
        PdfPCell infoCell = new PdfPCell();
        infoCell.setBorder(Rectangle.NO_BORDER);
        infoCell.setPaddingLeft(10);
        infoCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        Font companyFont = new Font(Font.HELVETICA, 18, Font.BOLD, BRAND_RED);
        Font subFont     = new Font(Font.HELVETICA, 10, Font.NORMAL, Color.GRAY);
        Font tagFont     = new Font(Font.HELVETICA, 9,  Font.BOLD,   BRAND_DARK);
        Paragraph company = new Paragraph("7GEARS MOTORS", companyFont);
        company.setSpacingAfter(2);
        infoCell.addElement(company);
        infoCell.addElement(new Paragraph("Professional Auto Service Centre", subFont));
        infoCell.addElement(new Paragraph("Chennai, Tamil Nadu | +91 78260 47847", subFont));
        Phrase tag = new Phrase("  MATERIAL ESTIMATE  ", tagFont);
        Chunk tagChunk = new Chunk("  MATERIAL ESTIMATE  ", tagFont);
        tagChunk.setBackground(BRAND_DARK, 4, 3, 4, 3);
        tagChunk.setColor(Color.WHITE);
        Paragraph tagPara = new Paragraph();
        tagPara.setSpacingBefore(6);
        tagPara.add(tagChunk);
        infoCell.addElement(tagPara);
        header.addCell(infoCell);

        doc.add(header);

        // ── Divider ─────────────────────────────────────────────
        PdfPTable divider = new PdfPTable(1);
        divider.setWidthPercentage(100);
        divider.setSpacingAfter(14);
        PdfPCell divCell = new PdfPCell();
        divCell.setFixedHeight(3);
        divCell.setBackgroundColor(BRAND_RED);
        divCell.setBorder(Rectangle.NO_BORDER);
        divider.addCell(divCell);
        doc.add(divider);

        // ── Job Details ─────────────────────────────────────────
        PdfPTable jobInfo = new PdfPTable(4);
        jobInfo.setWidthPercentage(100);
        jobInfo.setWidths(new float[]{1f, 2f, 1f, 2f});
        jobInfo.setSpacingAfter(16);

        Font labelFont = new Font(Font.HELVETICA, 8, Font.BOLD, Color.GRAY);
        Font valueFont = new Font(Font.HELVETICA, 10, Font.BOLD, BRAND_DARK);

        String veh = job.getVehicle() != null ? job.getVehicle().getRegistrationNumber() : "-";
        String make = job.getVehicle() != null
                ? (job.getVehicle().getMake() + " " + job.getVehicle().getModel()) : "-";
        String customer = job.getVehicle() != null && job.getVehicle().getCustomer() != null
                ? job.getVehicle().getCustomer().getName() : "-";
        String phone = job.getVehicle() != null && job.getVehicle().getCustomer() != null
                ? job.getVehicle().getCustomer().getPhone() : "-";
        String date = LocalDateTime.now().format(DATE_FMT);

        addInfoPair(jobInfo, "JOB NO.", job.getJobNumber(), labelFont, valueFont);
        addInfoPair(jobInfo, "DATE",    date,               labelFont, valueFont);
        addInfoPair(jobInfo, "VEHICLE", veh,                labelFont, valueFont);
        addInfoPair(jobInfo, "MAKE/MODEL", make,            labelFont, valueFont);
        addInfoPair(jobInfo, "CUSTOMER", customer,          labelFont, valueFont);
        addInfoPair(jobInfo, "PHONE",   phone,              labelFont, valueFont);
        doc.add(jobInfo);

        // ── Items Table ─────────────────────────────────────────
        PdfPTable table = new PdfPTable(5);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{0.5f, 3f, 2f, 0.8f, 1.2f});
        table.setSpacingAfter(4);
        table.setHeaderRows(1);

        Font thFont = new Font(Font.HELVETICA, 9, Font.BOLD, Color.WHITE);
        addTh(table, "S.NO",        thFont, Element.ALIGN_CENTER);
        addTh(table, "DESCRIPTION", thFont, Element.ALIGN_LEFT);
        addTh(table, "REMARKS",     thFont, Element.ALIGN_LEFT);
        addTh(table, "QTY",         thFont, Element.ALIGN_CENTER);
        addTh(table, "AMOUNT (₹)",  thFont, Element.ALIGN_RIGHT);

        Font tdFont   = new Font(Font.HELVETICA, 10, Font.NORMAL, BRAND_DARK);
        Font tdGray   = new Font(Font.HELVETICA,  9, Font.NORMAL, Color.GRAY);
        Font tdAmount = new Font(Font.HELVETICA, 10, Font.BOLD,   BRAND_DARK);

        BigDecimal total = BigDecimal.ZERO;
        for (int i = 0; i < items.size(); i++) {
            MaterialConsumed m = items.get(i);
            Color rowBg = (i % 2 == 0) ? ROW_EVEN : ROW_ODD;
            total = total.add(m.getAmount());

            addTd(table, String.valueOf(i + 1),                           tdGray,   Element.ALIGN_CENTER, rowBg);
            addTd(table, m.getDescription(),                              tdFont,   Element.ALIGN_LEFT,   rowBg);
            addTd(table, m.getRemarks() != null ? m.getRemarks() : "",   tdGray,   Element.ALIGN_LEFT,   rowBg);
            addTd(table, m.getQuantity() != null ? m.getQuantity().stripTrailingZeros().toPlainString() : "-",
                  tdGray, Element.ALIGN_CENTER, rowBg);
            addTd(table, String.format("%.2f", m.getAmount()),            tdAmount, Element.ALIGN_RIGHT,  rowBg);
        }

        // Total row
        Font totalFont  = new Font(Font.HELVETICA, 11, Font.BOLD, Color.WHITE);
        PdfPCell totalLabel = new PdfPCell(new Phrase("TOTAL", totalFont));
        totalLabel.setColspan(4);
        totalLabel.setBackgroundColor(BRAND_DARK);
        totalLabel.setPadding(10);
        totalLabel.setHorizontalAlignment(Element.ALIGN_RIGHT);
        totalLabel.setBorderColor(BRAND_DARK);
        table.addCell(totalLabel);

        PdfPCell totalAmt = new PdfPCell(new Phrase(String.format("%.2f", total), totalFont));
        totalAmt.setBackgroundColor(BRAND_DARK);
        totalAmt.setPadding(10);
        totalAmt.setHorizontalAlignment(Element.ALIGN_RIGHT);
        totalAmt.setBorderColor(BRAND_DARK);
        table.addCell(totalAmt);

        doc.add(table);

        // ── Approval Note ───────────────────────────────────────
        Font noteFont = new Font(Font.HELVETICA, 9, Font.ITALIC, Color.GRAY);
        Paragraph note = new Paragraph(
            "Kindly review the above material estimate and reply with your approval to proceed with the service.",
            noteFont);
        note.setSpacingBefore(18);
        note.setSpacingAfter(30);
        doc.add(note);

        // ── Signature ───────────────────────────────────────────
        PdfPTable sig = new PdfPTable(2);
        sig.setWidthPercentage(100);
        sig.setSpacingBefore(10);
        Font sigLabelFont = new Font(Font.HELVETICA, 9, Font.BOLD, BRAND_DARK);
        Font sigLineFont  = new Font(Font.HELVETICA, 9, Font.NORMAL, Color.GRAY);

        PdfPCell custSig = new PdfPCell();
        custSig.setBorder(Rectangle.NO_BORDER);
        custSig.addElement(new Paragraph("Customer Approval", sigLabelFont));
        custSig.addElement(new Paragraph("Signature: _______________________", sigLineFont));
        custSig.addElement(new Paragraph("Date: ___________________________",  sigLineFont));

        PdfPCell authSig = new PdfPCell();
        authSig.setBorder(Rectangle.NO_BORDER);
        authSig.setHorizontalAlignment(Element.ALIGN_RIGHT);
        authSig.addElement(new Paragraph("Authorised by 7GEARS MOTORS", sigLabelFont));
        authSig.addElement(new Paragraph("Service Advisor: ________________",  sigLineFont));

        sig.addCell(custSig);
        sig.addCell(authSig);
        doc.add(sig);

        // ── Footer ──────────────────────────────────────────────
        PdfPTable footer = new PdfPTable(1);
        footer.setWidthPercentage(100);
        footer.setSpacingBefore(20);
        PdfPCell footerCell = new PdfPCell();
        footerCell.setBackgroundColor(ROW_EVEN);
        footerCell.setBorder(Rectangle.NO_BORDER);
        footerCell.setPadding(8);
        Font footerFont = new Font(Font.HELVETICA, 8, Font.NORMAL, Color.GRAY);
        footerCell.addElement(new Paragraph(
            "This is a system generated document by 7GEARS MOTORS Service Tracker.", footerFont));
        footer.addCell(footerCell);
        doc.add(footer);

        doc.close();
        return out.toByteArray();
    }

    private void addInfoPair(PdfPTable t, String label, String value, Font lf, Font vf) {
        PdfPCell lc = new PdfPCell();
        lc.setBorder(Rectangle.NO_BORDER);
        lc.setPadding(4);
        lc.addElement(new Paragraph(label, lf));
        t.addCell(lc);

        PdfPCell vc = new PdfPCell();
        vc.setBorder(Rectangle.NO_BORDER);
        vc.setPadding(4);
        vc.addElement(new Paragraph(value, vf));
        t.addCell(vc);
    }

    private void addTh(PdfPTable t, String text, Font f, int align) {
        PdfPCell c = new PdfPCell(new Phrase(text, f));
        c.setBackgroundColor(HEADER_BG);
        c.setPadding(9);
        c.setHorizontalAlignment(align);
        c.setBorderColor(HEADER_BG);
        t.addCell(c);
    }

    private void addTd(PdfPTable t, String text, Font f, int align, Color bg) {
        PdfPCell c = new PdfPCell(new Phrase(text, f));
        c.setBackgroundColor(bg);
        c.setPadding(8);
        c.setHorizontalAlignment(align);
        c.setBorderColor(BORDER_COLOR);
        t.addCell(c);
    }
}
