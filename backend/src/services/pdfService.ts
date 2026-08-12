import puppeteer from "puppeteer";
import { Certificate, Training, Employee, Batch } from "../models/index.js";
import { NotFoundError } from "../utils/errors.js";
import { format } from "date-fns";

interface CertificateData {
  certificateNumber: string;
  employeeName: string;
  employeeSapId: string;
  employeeTokenNo: string | null;
  employeeDesignation: string;
  trainingName: string;
  trainingType: string;
  batchDates: string;
  venue: string;
  instructorName: string;
  daysAttended: number;
  issueDate: string;
  validFrom: string;
  validUntil: string;
}

/**
 * Generate PDF certificate
 */
export async function generateCertificatePDF(
  certificateId: number,
): Promise<Buffer> {
  const certificate = await Certificate.findByPk(certificateId, {
    include: [
      { model: Training, as: "training" },
      { model: Employee, as: "employee" },
      { model: Batch, as: "batch" },
    ],
  });

  if (!certificate) {
    throw new NotFoundError("Certificate");
  }

  const training = (certificate as any).training;
  const employee = (certificate as any).employee;
  const batch = (certificate as any).batch;

  const batchStart = batch?.startDate
    ? format(new Date(batch.startDate), "dd MMM yyyy")
    : "N/A";
  const batchEnd = batch?.endDate
    ? format(new Date(batch.endDate), "dd MMM yyyy")
    : "N/A";
  const venue = batch?.venue || "N/A";
  const instructorName = batch?.instructorName || "N/A";

  // Use the model's actual stored certificate number attribute (certNumber) and
  // fall back to the virtual certificateNumber accessor only if defined.
  const certificateNumber =
    certificate.certNumber || (certificate as any).certificateNumber || "DRAFT";

  const data: CertificateData = {
    certificateNumber,
    employeeName: employee?.fullName || "N/A",
    employeeSapId: employee?.sapId || "N/A",
    employeeTokenNo: employee?.tokenNo || null,
    employeeDesignation: employee?.designation || "N/A",
    trainingName: training?.name || "N/A",
    trainingType: training?.trainingType || "N/A",
    batchDates: `${batchStart} - ${batchEnd}`,
    venue,
    instructorName,
    daysAttended: certificate.daysAttended ?? 0,
    issueDate: certificate.issueDate
      ? format(new Date(certificate.issueDate), "dd MMMM yyyy")
      : "N/A",
    validFrom: certificate.validFrom
      ? format(new Date(certificate.validFrom), "dd MMM yyyy")
      : "N/A",
    validUntil: certificate.validUntil
      ? format(new Date(certificate.validUntil), "dd MMM yyyy")
      : "N/A",
  };

  const html = generateCertificateHTML(data);

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      landscape: true,
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

/**
 * Generate HTML template for certificate
 */
function generateCertificateHTML(data: CertificateData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Open+Sans:wght@400;600&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Open Sans', sans-serif;
      background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    
    .certificate {
      width: 1050px;
      height: 740px;
      background: white;
      border-radius: 8px;
      position: relative;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
    }
    
    .border-pattern {
      position: absolute;
      top: 15px;
      left: 15px;
      right: 15px;
      bottom: 15px;
      border: 3px solid #c9a227;
      border-radius: 4px;
    }
    
    .content {
      position: relative;
      padding: 50px 60px;
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #1a365d;
      margin-bottom: 10px;
    }
    
    .title {
      font-family: 'Playfair Display', serif;
      font-size: 42px;
      font-weight: 700;
      color: #1a365d;
      margin-bottom: 5px;
    }
    
    .subtitle {
      font-size: 14px;
      color: #4a5568;
      text-transform: uppercase;
      letter-spacing: 3px;
    }
    
    .cert-number {
      position: absolute;
      top: 40px;
      right: 40px;
      font-size: 12px;
      color: #718096;
      font-weight: 600;
    }
    
    .body {
      flex: 1;
      text-align: center;
    }
    
    .presented-to {
      font-size: 14px;
      color: #718096;
      margin-bottom: 10px;
    }
    
    .name {
      font-family: 'Playfair Display', serif;
      font-size: 36px;
      font-weight: 700;
      color: #1a365d;
      margin-bottom: 5px;
    }
    
    .designation {
      font-size: 14px;
      color: #4a5568;
      margin-bottom: 25px;
    }
    
    .sap-id {
      font-size: 12px;
      color: #718096;
      font-family: monospace;
    }
    
    .description {
      font-size: 14px;
      color: #4a5568;
      line-height: 1.8;
      max-width: 700px;
      margin: 20px auto;
    }
    
    .training-name {
      font-weight: 600;
      color: #1a365d;
    }
    
    .details {
      display: flex;
      justify-content: center;
      gap: 60px;
      margin-top: 20px;
    }
    
    .detail-item {
      text-align: center;
    }
    
    .detail-label {
      font-size: 11px;
      color: #718096;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 5px;
    }
    
    .detail-value {
      font-size: 14px;
      font-weight: 600;
      color: #1a365d;
    }
    
    .validity {
      background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
      padding: 15px 30px;
      border-radius: 6px;
      margin-top: 25px;
      display: inline-block;
    }
    
    .validity-text {
      font-size: 13px;
      color: #4a5568;
    }
    
    .validity-dates {
      font-weight: 600;
      color: #1a365d;
    }
    
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
    }
    
    .signature-block {
      text-align: center;
      width: 200px;
    }
    
    .signature-line {
      border-top: 1px solid #1a365d;
      margin-bottom: 5px;
    }
    
    .signature-title {
      font-size: 11px;
      color: #718096;
    }
    
    .issue-date {
      font-size: 12px;
      color: #718096;
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="border-pattern"></div>
    <div class="content">
      <div class="cert-number">No: ${data.certificateNumber}</div>
      
      <div class="header">
        <div class="logo">MINING PSU</div>
        <div class="title">Certificate of Completion</div>
        <div class="subtitle">Training Program</div>
      </div>
      
      <div class="body">
        <div class="presented-to">This is to certify that</div>
        <div class="name">${data.employeeName}</div>
        <div class="designation">${data.employeeDesignation}</div>
        <div class="sap-id">SAP ID: ${data.employeeSapId}${data.employeeTokenNo ? ` (${data.employeeTokenNo})` : ""}</div>
        
        <div class="description">
          has successfully completed the <span class="training-name">${data.trainingName}</span> 
          training program conducted at ${data.venue} from ${data.batchDates}, 
          with ${data.daysAttended} days of attendance under the instruction of ${data.instructorName}.
        </div>
        
        <div class="details">
          <div class="detail-item">
            <div class="detail-label">Training Type</div>
            <div class="detail-value">${data.trainingType}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Duration</div>
            <div class="detail-value">${data.daysAttended} Days</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Issue Date</div>
            <div class="detail-value">${data.issueDate}</div>
          </div>
        </div>
        
        <div class="validity">
          <div class="validity-text">
            Valid from <span class="validity-dates">${data.validFrom}</span> to <span class="validity-dates">${data.validUntil}</span>
          </div>
        </div>
      </div>
      
      <div class="footer">
        <div class="signature-block">
          <div class="signature-line"></div>
          <div class="signature-title">Training Officer</div>
        </div>
        <div class="issue-date">Issued on ${data.issueDate}</div>
        <div class="signature-block">
          <div class="signature-line"></div>
          <div class="signature-title">Mines Manager</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export default { generateCertificatePDF };
