import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Group } from "../App";

const normalizeName = (name: string): string =>
    name.trim().toLocaleLowerCase();

const normalizeForMatching = (name: string): string =>
    name
        .toLocaleLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s*-\s*/g, "-")
        .replace(/\s+/g, " ")
        .trim();

const namesMatch = (a: string, b: string): boolean => {
    const left = normalizeForMatching(a);
    const right = normalizeForMatching(b);

    if (left === right) return true;

    const leftParts = left.split(",").map((part) => part.trim());
    const rightParts = right.split(",").map((part) => part.trim());
    if (leftParts.length !== 2 || rightParts.length !== 2) {
        return false;
    }

    const [leftLast, leftFirst] = leftParts;
    const [rightLast, rightFirst] = rightParts;
    if (leftLast !== rightLast) return false;

    return leftFirst.includes(rightFirst) || rightFirst.includes(leftFirst);
};

export function exportGroupsToPDF(groups: Group[], subjectName: string, groupingTitle: string) {
    const doc = new jsPDF();
    const currentDate = new Date().toLocaleDateString();

    // Document Title
    doc.setFontSize(16); // Slightly smaller to look cleaner
    doc.text(subjectName, 14, 20);
    doc.text("Groupings", 14, 28);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${currentDate}`, 14, 34);
    doc.setTextColor(0); // Reset color

    const rowMetadata = groups.map((group) => {
        const sortedMembers = [...group.members].sort((a, b) => a.localeCompare(b));
        return {
            sortedMembers,
            representative: group.representative ? normalizeName(group.representative) : undefined,
        };
    });

    const tableRows = groups.map((group, index) => [
        group.name,
        group.members.length.toString(),
        rowMetadata[index].sortedMembers.join('\n'),
    ]);

    autoTable(doc, {
        head: [["Group Name", "Count", "Members List"]],
        body: tableRows,
        startY: 40,
        theme: "plain",
        rowPageBreak: 'avoid',
        styles: {
            fontSize: 10,
            cellPadding: 3,
            valign: 'top',
            lineColor: [220, 220, 220],
            lineWidth: 0.1,
            textColor: [50, 50, 50],
            overflow: 'linebreak', // Ensure wrapping
        },
        headStyles: {
            fillColor: [240, 240, 240], // Light Gray / Neutral
            textColor: [50, 50, 50],    // Dark Gray Text
            fontStyle: 'bold',
            halign: 'left',
        },
        columnStyles: {
            0: { cellWidth: 40, fontStyle: 'bold', valign: 'middle' }, // Group Name
            1: { cellWidth: 20, halign: 'center', valign: 'middle' },  // Count
            2: { cellWidth: 'auto' },                // Members List
        },
        didParseCell: (data) => {
            if (data.section !== "body" || data.column.index !== 2) return;
            // Hide default text so we can draw mixed normal/bold lines without overlap.
            data.cell.styles.textColor = [255, 255, 255];
        },
        didDrawCell: (data) => {
            if (data.section !== "body" || data.column.index !== 2) return;

            const meta = rowMetadata[data.row.index];
            if (!meta) return;

            const maxWidth = data.cell.width - data.cell.padding("left") - data.cell.padding("right");
            const fontSize = data.cell.styles.fontSize || 10;
            const lineHeight = fontSize * 0.352778 * doc.getLineHeightFactor();
            const x = data.cell.x + data.cell.padding("left");
            let y = data.cell.y + data.cell.padding("top");

            meta.sortedMembers.forEach((member) => {
                const memberLines = doc.splitTextToSize(member, maxWidth) as string[];
                const isRepresentative = meta.representative
                    ? namesMatch(member, meta.representative)
                    : false;

                doc.setFont(undefined, isRepresentative ? "bold" : "normal");
                doc.setTextColor(50, 50, 50);
                memberLines.forEach((line) => {
                    doc.text(line, x, y, { baseline: "top" });
                    y += lineHeight;
                });
            });

            doc.setFont(undefined, "normal");
            doc.setTextColor(0);
        }
    });

    // Save PDF manually to ensure filename is respected
    const fileName = `${subjectName}_${groupingTitle}`.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const finalFileName = `${fileName}_groups_${new Date().toISOString().split('T')[0]}.pdf`;

    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = finalFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
