import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

export default function generateReportPdf(report) {

  const doc = new jsPDF()

  // ===== TITLE =====

  doc.setFontSize(22)

  doc.text(
    "AI Mock Interview Report",
    20,
    20
  )

  // ===== OVERALL =====

  doc.setFontSize(14)

  doc.text(
    `Overall Performance: ${report.overall_performance}`,
    20,
    40
  )

  doc.text(
    `Final Score: ${report.final_score}/10`,
    20,
    50
  )

  // ===== STRENGTHS =====

  autoTable(doc, {
    startY: 65,

    head: [["Strengths"]],

    body: report.strengths.map(
      item => [item]
    )
  })

  // ===== WEAKNESSES =====

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,

    head: [["Weaknesses"]],

    body: report.weaknesses.map(
      item => [item]
    )
  })

  // ===== SUGGESTIONS =====

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,

    head: [["Suggestions"]],

    body: report.suggestions.map(
      item => [item]
    )
  })

  // ===== SAVE =====

  doc.save(
    "Interview_Report.pdf"
  )
}