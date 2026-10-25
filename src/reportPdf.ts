const disclaimer = 'Educational information only. This summary is not a diagnosis or a substitute for professional medical advice. Discuss findings with a qualified clinician. In an emergency, contact local emergency services.'

export async function downloadReportSummary(reportTitle: string, explanation: string) {
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
  const margin = 18
  const width = pdf.internal.pageSize.getWidth() - margin * 2
  const bottom = pdf.internal.pageSize.getHeight() - margin
  let y = margin

  const write = (value: string, size = 11, bold = false) => {
    pdf.setFont('helvetica', bold ? 'bold' : 'normal')
    pdf.setFontSize(size)
    for (const line of pdf.splitTextToSize(value || ' ', width) as string[]) {
      if (y > bottom) { pdf.addPage(); y = margin }
      pdf.text(line, margin, y)
      y += size * 0.5
    }
  }

  write('MediAssist AI - Medical Report Summary', 17, true)
  y += 5
  write(`Report: ${reportTitle}`, 11, true)
  write(`Generated: ${new Date().toLocaleString()}`, 10)
  y += 7
  const plainText = explanation
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/^[\t ]*[-*]\s+/gm, '- ')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[`*]/g, '')
  for (const paragraph of plainText.split('\n')) {
    if (!paragraph.trim()) { y += 3; continue }
    write(paragraph.trim())
    y += 2
  }
  y += 8
  write('Educational disclaimer', 11, true)
  write(disclaimer, 9)
  const safeName = reportTitle.replace(/\.pdf$/i, '').replace(/[^a-z0-9_-]+/gi, '-').slice(0, 60) || 'medical-report'
  pdf.save(`${safeName}-summary.pdf`)
}
