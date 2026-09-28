import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { LetterTemplate } from '../types';

export const LETTER_TEMPLATES: LetterTemplate[] = [
  {
    id: 'office-leave',
    name: 'Leave Application (Office / Company)',
    category: 'formal',
    description: 'Standard formal leave application for workplace, medical or casual absence.',
    defaultRecipient: 'The Reporting Manager / HR Department\nDocuMate Technologies Pvt. Ltd.\nTech Park, Sector 4',
    defaultSubject: 'Application for Casual Leave from [Start Date] to [End Date]',
    defaultBody: `Respected Sir/Madam,

I am writing this letter to formally request leave for [Number] days, starting from [Start Date] to [End Date], due to [personal reason / urgent family commitment / medical recovery].

I have handed over my immediate responsibilities and pending action items to [Colleague's Name], who has kindly agreed to handle urgent escalations during my absence. I will also remain reachable via email and phone for any emergency queries.

I kindly request you to approve my leave application. I will resume my duties promptly on [Return Date].

Thanking you.`,
  },
  {
    id: 'school-leave',
    name: 'School / College Leave Application',
    category: 'academic',
    description: 'Application addressed to the Principal or Class Teacher for student leave.',
    defaultRecipient: 'The Principal / Class Teacher\nSt. Xavier Senior Secondary School\nCivil Lines, New Delhi',
    defaultSubject: 'Application for Sick Leave for Student [Student Name]',
    defaultBody: `Respected Principal / Madam,

With due respect, I wish to state that my child, [Student Name], a student of Class [Class/Division], Roll No. [Roll Number], has been unwell and diagnosed with [fever / viral infection]. The doctor has advised complete bed rest for [Number] days from [Start Date] to [End Date].

Therefore, I kindly request you to grant leave of absence for the aforementioned period. The doctor's medical certificate is attached for your reference.

I assure you that the missed classwork and homework will be completed promptly upon return.

Thanking you.`,
  },
  {
    id: 'job-application',
    name: 'Job Application Cover Letter',
    category: 'formal',
    description: 'Professional cover letter expressing interest and qualifications for an open role.',
    defaultRecipient: 'The Hiring Manager\nTalent Acquisition Team\nAcme Global Enterprises',
    defaultSubject: 'Application for the Position of [Job Title] - [Your Name]',
    defaultBody: `Dear Hiring Manager,

I am writing to express my strong enthusiasm and application for the [Job Title] role at [Company Name], as advertised on your careers portal. With over [Number] years of demonstrable experience in [Field/Domain], I have honed my expertise in driving impactful results and collaborating across dynamic teams.

In my previous tenure at [Previous Organization], I led initiatives that achieved [key milestone or metric, e.g. 35% efficiency boost / scalable deployment]. I have admired [Company Name]'s leadership in [Industry/Specialty] and am confident that my technical skills and proactive mindset align seamlessly with your mission.

Please find my updated resume attached for your detailed perusal. I look forward to the opportunity to discuss how my background can add immediate value to your organization.

Thank you for your time and consideration.`,
  },
  {
    id: 'bank-address-change',
    name: 'Bank Address Change Request',
    category: 'banking',
    description: 'Formal letter to bank manager requesting update of communication address.',
    defaultRecipient: 'The Branch Manager\nState Bank of India / HDFC Bank\nMain Branch, MG Road',
    defaultSubject: 'Request for Change of Registered Address in Savings Account No: [Account Number]',
    defaultBody: `Respected Sir/Madam,

I hold a Savings Bank Account in your branch with Account Number [Account Number] under the name of [Your Name].

I have recently relocated to a new residence. Hence, I request you to kindly update my correspondence and permanent address in your bank records. My new address details are as follows:

New Address:
[Flat/House No., Street Name]
[Area / Landmark]
[City, State, PIN Code]

I have enclosed a self-attested copy of my Aadhaar Card / Passport as valid address proof along with this application for your verification.

Kindly update the records and dispatch the confirmation to my registered email or mobile.

Thanking you.`,
  },
  {
    id: 'bank-closing',
    name: 'Bank Account Closure Application',
    category: 'banking',
    description: 'Formal application to close an inactive or surplus bank account and transfer balance.',
    defaultRecipient: 'The Branch Manager\nBank Name\nCity Branch',
    defaultSubject: 'Application for Permanent Closure of Account No: [Account Number]',
    defaultBody: `Respected Sir/Madam,

I have a Savings Account (A/C No: [Account Number]) with your branch. Due to [relocation / maintaining another salary account], I am unable to operate this account actively and wish to close it permanently.

I am returning unused cheque leaves, debit card, and passbook along with this application. Please transfer the remaining balance amount to my alternative account via NEFT / RTGS (Account No: [Alternative Account Number], IFSC: [IFSC Code], Bank: [Bank Name]).

I request you to kindly process the closure at the earliest and provide an acknowledgement.

Thanking you.`,
  },
  {
    id: 'complaint-letter',
    name: 'Formal Complaint Letter (Consumer/Service)',
    category: 'official',
    description: 'Documented grievance letter regarding defective goods, delay, or substandard service.',
    defaultRecipient: 'The Customer Grievance Officer / Service Head\nConsumer Redressal Cell\nCompany / Service Provider Name',
    defaultSubject: 'Formal Complaint regarding Defective Product / Service Delay (Ref No: [Order/Complaint ID])',
    defaultBody: `Respected Sir/Madam,

I am writing to register a formal complaint regarding the unsatisfactory service / defective product received against Order ID [Order ID], purchased on [Purchase Date].

Despite raising initial requests on [Prior Date] and speaking with your helpline, the issue remains unresolved. The item continues to have [describe defect / issue concisely], which has caused significant inconvenience and loss of productive time.

I request you to urgently arrange for a full replacement or complete refund of the paid amount [Amount] within 7 business days from the receipt of this letter, failing which I will be constrained to escalate the matter to the National Consumer Helpline.

Enclosed: Copy of invoice, warranty card, and photographic evidence.

Thanking you.`,
  },
  {
    id: 'permission-letter',
    name: 'Permission Letter (Event / Venue / Lab)',
    category: 'academic',
    description: 'Application seeking official authorization or venue access for an event.',
    defaultRecipient: 'The Dean / Administrative Officer\nDepartment / Institution Name\nCity Campus',
    defaultSubject: 'Request for Permission to Conduct [Event Name] on [Date]',
    defaultBody: `Respected Sir/Madam,

We, the students/members of [Club/Organization Name], respectfully seek your kind permission to organize [Event/Seminar Name] on [Date] between [Start Time] and [End Time] at [Auditorium / Ground / Lab].

The primary objective of this event is to [briefly describe purpose, e.g. foster technical skills / celebrate cultural exchange]. Expected attendance is approximately [Number] participants. We have formulated a comprehensive schedule and will adhere to all campus discipline guidelines.

We humbly request your approval and guidance for the successful conduction of the event.

Thanking you.`,
  },
  {
    id: 'certificate-request',
    name: 'Request Letter for Document / Certificate',
    category: 'official',
    description: 'Formal application for issuance of Bonafide, Experience, or Transfer Certificate.',
    defaultRecipient: 'The Registrar / Head of Institution\nCollege / Organization Name\nCity, State',
    defaultSubject: 'Application for Issuance of [Bonafide / Experience / Transfer] Certificate',
    defaultBody: `Respected Sir/Madam,

I was a student / employee of your esteemed institution from [Start Year] to [End Year] in the [Department/Course Name] (ID / Enrollment No: [ID Number]).

I require an official [Experience / Bonafide / Transfer] Certificate for the purpose of [higher education application / visa documentation / new employment joining].

I have cleared all institutional dues and library obligations. I kindly request you to issue the requested certificate at the earliest convenience.

Thanking you.`,
  },
  {
    id: 'general-application',
    name: 'General Formal Application',
    category: 'formal',
    description: 'Multi-purpose official letter format compliant with standard administrative guidelines.',
    defaultRecipient: 'The Concerned Authority / Officer-in-Charge\nOrganization / Department Name\nOffice Address',
    defaultSubject: 'Application Regarding [Subject Matter]',
    defaultBody: `Respected Sir/Madam,

I am writing this application to bring to your kind notice that [detailed explanation of the matter/situation].

In light of the circumstances mentioned above, I request you to kindly [specific action requested, e.g. review the records / grant approval / expedite processing].

I have appended all relevant supporting documents for your evaluation. I shall be grateful for your prompt response and favorable action.

Thanking you.`,
  },
];

export interface LetterFormData {
  senderName: string;
  senderAddress: string;
  senderPhone?: string;
  senderEmail?: string;
  date: string;
  recipientDetails: string;
  subject: string;
  body: string;
  signOff: string;
}

/**
 * Generate a crisp, professional A4 PDF letter
 */
export async function generateLetterPdf(data: LetterFormData): Promise<{ blob: Blob; size: number }> {
  const pdfDoc = await PDFDocument.create();
  // Standard A4: 595.28 x 841.89
  const page = pdfDoc.addPage([595.28, 841.89]);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const margin = 54; // 0.75 inch
  let y = 841.89 - margin;
  const pageWidth = 595.28 - margin * 2;

  // 1. Sender Header (Top right or top left)
  page.drawText(data.senderName || 'Your Name', {
    x: margin,
    y,
    size: 13,
    font: fontBold,
    color: rgb(0.08, 0.12, 0.2),
  });
  y -= 16;

  const senderLines = (data.senderAddress || '').split('\n').filter(Boolean);
  for (const sLine of senderLines) {
    page.drawText(sLine, {
      x: margin,
      y,
      size: 10,
      font: fontRegular,
      color: rgb(0.3, 0.35, 0.4),
    });
    y -= 14;
  }

  if (data.senderPhone || data.senderEmail) {
    const contact = [data.senderPhone, data.senderEmail].filter(Boolean).join(' | ');
    page.drawText(contact, {
      x: margin,
      y,
      size: 9.5,
      font: fontRegular,
      color: rgb(0.4, 0.45, 0.5),
    });
    y -= 14;
  }

  // Divider line
  y -= 6;
  page.drawLine({
    start: { x: margin, y },
    end: { x: 595.28 - margin, y },
    thickness: 1,
    color: rgb(0.85, 0.88, 0.92),
  });
  y -= 18;

  // Date
  page.drawText(`Date: ${data.date || new Date().toLocaleDateString()}`, {
    x: margin,
    y,
    size: 10,
    font: fontBold,
    color: rgb(0.2, 0.25, 0.3),
  });
  y -= 22;

  // Recipient block
  page.drawText('To,', {
    x: margin,
    y,
    size: 10.5,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.2),
  });
  y -= 14;

  const recipientLines = (data.recipientDetails || '').split('\n').filter(Boolean);
  for (const rLine of recipientLines) {
    page.drawText(rLine, {
      x: margin,
      y,
      size: 10,
      font: fontRegular,
      color: rgb(0.2, 0.25, 0.3),
    });
    y -= 14;
  }
  y -= 14;

  // Subject line (bold with highlighted styling)
  page.drawText(`Subject: ${data.subject || 'Application'}`, {
    x: margin,
    y,
    size: 11,
    font: fontBold,
    color: rgb(0.05, 0.15, 0.35),
  });
  y -= 22;

  // Body paragraphs with word wrapping
  const bodyParagraphs = (data.body || '').split('\n');
  for (const paragraph of bodyParagraphs) {
    if (!paragraph.trim()) {
      y -= 12;
      continue;
    }

    const words = paragraph.split(' ');
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const textWidth = fontRegular.widthOfTextAtSize(testLine, 10.5);

      if (textWidth > pageWidth && currentLine) {
        page.drawText(currentLine, {
          x: margin,
          y,
          size: 10.5,
          font: fontRegular,
          color: rgb(0.15, 0.18, 0.22),
        });
        y -= 16;
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      page.drawText(currentLine, {
        x: margin,
        y,
        size: 10.5,
        font: fontRegular,
        color: rgb(0.15, 0.18, 0.22),
      });
      y -= 16;
    }
  }

  // Sign off block
  y -= 24;
  page.drawText('Yours sincerely,', {
    x: margin,
    y,
    size: 10.5,
    font: fontRegular,
    color: rgb(0.2, 0.25, 0.3),
  });
  y -= 38; // space for physical signature

  page.drawText(data.senderName || 'Your Name', {
    x: margin,
    y,
    size: 11,
    font: fontBold,
    color: rgb(0.08, 0.12, 0.2),
  });

  const bytes = await pdfDoc.save();
  const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
  return { blob, size: blob.size };
}

/**
 * Generate editable Word (.docx) letter
 */
export async function generateLetterDocx(data: LetterFormData): Promise<{ blob: Blob }> {
  const paragraphs: Paragraph[] = [];

  // Sender info
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: data.senderName || 'Your Name',
          bold: true,
          size: 26,
        }),
      ],
      spacing: { after: 60 },
    })
  );

  if (data.senderAddress) {
    data.senderAddress.split('\n').forEach((line) => {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: line, size: 20, color: '555555' })],
          spacing: { after: 40 },
        })
      );
    });
  }

  // Date
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Date: ${data.date || new Date().toLocaleDateString()}`,
          bold: true,
          size: 22,
        }),
      ],
      spacing: { before: 180, after: 180 },
    })
  );

  // Recipient
  paragraphs.push(
    new Paragraph({
      children: [new TextRun({ text: 'To,', bold: true, size: 22 })],
      spacing: { after: 60 },
    })
  );

  (data.recipientDetails || '').split('\n').forEach((line) => {
    paragraphs.push(
      new Paragraph({
        children: [new TextRun({ text: line, size: 22 })],
        spacing: { after: 40 },
      })
    );
  });

  // Subject
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Subject: ${data.subject || ''}`,
          bold: true,
          underline: {},
          size: 24,
          color: '0D3B66',
        }),
      ],
      spacing: { before: 200, after: 200 },
    })
  );

  // Body
  (data.body || '').split('\n').forEach((para) => {
    if (para.trim()) {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: para, size: 22 })],
          spacing: { after: 120 },
          alignment: AlignmentType.JUSTIFIED,
        })
      );
    }
  });

  // Closing
  paragraphs.push(
    new Paragraph({
      children: [new TextRun({ text: 'Yours sincerely,', size: 22 })],
      spacing: { before: 240, after: 400 },
    })
  );

  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: data.senderName || 'Your Name',
          bold: true,
          size: 24,
        }),
      ],
    })
  );

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: paragraphs,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  return { blob };
}
