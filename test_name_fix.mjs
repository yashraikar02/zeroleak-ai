import { generateMockProcessResult } from './src/mockData.js';

const testCases = [
  {
    label: "Asha Example — stop at 'Example' (should detect only 'Asha')",
    text: "Customer: Asha Example PAN: KLMNO1234P Phone: +91 90000 00025 Email: asha.example@example.test Please review this customer application.",
    dept: "Banking"
  },
  {
    label: "Rahul Sharma joint loan — Banking Aadhaar=mask (should NOT block)",
    text: "Mera naam Rahul Sharma hai, main Davangere mein rehta hoon. Applicant 1: Rahul Sharma, Aadhaar: 1234-5678-9012, PAN: ABCDE1234F.",
    dept: "Banking"
  },
  {
    label: "lowercase 'rahul sharma' — case-insensitive dict match",
    text: "Customer: rahul sharma, Aadhaar: 9999-8888-7777, Email: rahul@domain.in",
    dept: "Banking"
  },
  {
    label: "Kavya Demo — stops at 'Demo'",
    text: "Name: Kavya Demo, PAN: ABCDE1234F",
    dept: "Banking"
  },
  {
    label: "Healthcare Aadhaar=block — should still block",
    text: "Patient: Meera Verma, Aadhaar: 5555-4444-3333, Phone: +91 99000 11223",
    dept: "Healthcare"
  }
];

let pass = 0;
let fail = 0;

for (const tc of testCases) {
  const r = generateMockProcessResult({ text: tc.text, department: tc.dept });
  const persons = r.entities.filter(e => e.type === "PERSON").map(e => e.original);
  const aadhaar = r.entities.find(e => e.type === "AADHAAR");
  const blocked = r.is_blocking;

  console.log(`\n[${tc.label}]`);
  console.log(`  PERSON(s) detected: [${persons.join(", ")}]`);
  if (aadhaar) console.log(`  AADHAAR action: ${aadhaar.action}`);
  console.log(`  is_blocking: ${blocked}`);
}

console.log("\nTest complete.");
