export type StudentExcelRow = {
  name: string;
  email: string;
  studentNumber: string;
  whatsapp: string;
  copyrightCode: string;
  balance: string;
  coursesCount: number;
  enrolledCourses: string;
};

export type StudentExcelHeaders = {
  name: string;
  email: string;
  studentNumber: string;
  whatsapp: string;
  copyrightCode: string;
  balance: string;
  coursesCount: string;
  enrolledCourses: string;
  sheetName: string;
};

export async function downloadStudentsExcel(
  rows: StudentExcelRow[],
  headers: StudentExcelHeaders,
  filename: string,
): Promise<void> {
  const XLSX = await import("xlsx");

  const sheetData: (string | number)[][] = [
    [
      headers.name,
      headers.email,
      headers.studentNumber,
      headers.whatsapp,
      headers.copyrightCode,
      headers.balance,
      headers.coursesCount,
      headers.enrolledCourses,
    ],
    ...rows.map((row) => [
      row.name,
      row.email,
      row.studentNumber,
      row.whatsapp,
      row.copyrightCode,
      row.balance,
      row.coursesCount,
      row.enrolledCourses,
    ]),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  worksheet["!cols"] = [
    { wch: 24 },
    { wch: 28 },
    { wch: 16 },
    { wch: 16 },
    { wch: 14 },
    { wch: 12 },
    { wch: 10 },
    { wch: 40 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, headers.sheetName.slice(0, 31));
  XLSX.writeFile(workbook, filename);
}
