import { TtEntry } from './types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExportOptions {
  branch?: string;
  year?: number;
  section?: string;
}

// ─── CSV Export ───────────────────────────────────────────────────────────────

function escapeCsv(val: unknown): string {
  const str = String(val ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportToCsv(entries: TtEntry[], options: ExportOptions = {}): void {
  const headers = [
    'Day', 'Start Time', 'End Time', 'Subject', 'Type',
    'Faculty', 'Room', 'Branch', 'Year', 'Section',
  ];

  const rows = entries
    .filter(e => !e.isLunch && !e.isFree)
    .map(e => [
      e.day,
      e.timeSlot?.startTime,
      e.timeSlot?.endTime,
      e.subjectName,
      e.subjectType,
      e.facultyName,
      e.roomName,
      e.branch,
      e.year,
      e.section,
    ].map(escapeCsv).join(','));

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  const suffix = [options.branch, options.year, options.section].filter(Boolean).join('-');
  a.download = `timetable${suffix ? `-${suffix}` : ''}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Excel Export ─────────────────────────────────────────────────────────────

export async function exportToExcel(entries: TtEntry[], options: ExportOptions = {}): Promise<void> {
  try {
    // Dynamic import so it doesn't break if xlsx isn't installed
    const XLSX = await import('xlsx');

    const data = entries
      .filter(e => !e.isLunch && !e.isFree)
      .map(e => ({
        Day: e.day,
        'Start Time': e.timeSlot?.startTime,
        'End Time': e.timeSlot?.endTime,
        Subject: e.subjectName,
        Type: e.subjectType,
        Faculty: e.facultyName,
        Room: e.roomName,
        Branch: e.branch,
        Year: e.year,
        Section: e.section,
      }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Timetable');

    // Style the header row
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let col = range.s.c; col <= range.e.c; col++) {
      const addr = XLSX.utils.encode_cell({ r: 0, c: col });
      if (ws[addr]) {
        ws[addr].s = { font: { bold: true } };
      }
    }

    const suffix = [options.branch, options.year, options.section].filter(Boolean).join('-');
    XLSX.writeFile(wb, `timetable${suffix ? `-${suffix}` : ''}.xlsx`);
  } catch {
    // Fallback to CSV if xlsx isn't available
    console.warn('xlsx package not available, falling back to CSV export');
    exportToCsv(entries, options);
  }
}

// ─── PDF Export ───────────────────────────────────────────────────────────────

export function exportToPdf(title: string = 'Weekly Timetable'): void {
  // Inject a print stylesheet that hides everything except the timetable
  const styleId = 'timetable-print-style';
  let style = document.getElementById(styleId) as HTMLStyleElement | null;

  if (!style) {
    style = document.createElement('style');
    style.id = styleId;
    document.head.appendChild(style);
  }

  style.textContent = `
    @media print {
      body > * { display: none !important; }
      .timetable-print-area,
      .timetable-print-area * { display: revert !important; }
      .timetable-print-area {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        padding: 16px !important;
        background: white !important;
      }
      .timetable-no-print { display: none !important; }
      @page { size: A4 landscape; margin: 10mm; }
    }
  `;

  const originalTitle = document.title;
  document.title = title;

  window.print();

  // Restore title after print dialog closes
  setTimeout(() => {
    document.title = originalTitle;
  }, 1000);
}

// ─── Helper: Build grid-friendly data for display ─────────────────────────────

export function groupEntriesByDayAndSlot(
  entries: TtEntry[],
  branch?: string,
  year?: number,
  section?: string,
): Map<string, Map<string, TtEntry>> {
  const map = new Map<string, Map<string, TtEntry>>();

  const filtered = entries.filter(e => {
    if (branch && e.branch !== branch) return false;
    if (year && e.year !== year) return false;
    if (section && e.section !== section) return false;
    return true;
  });

  for (const entry of filtered) {
    const day = entry.day;
    const slot = entry.timeSlot?.label || `${entry.timeSlot?.startTime}-${entry.timeSlot?.endTime}`;
    if (!map.has(day)) map.set(day, new Map());
    map.get(day)!.set(slot, entry);
  }

  return map;
}

// ─── Phase 7: Specialized Export Functions ────────────────────────────────────

export async function exportFacultyTimetable(
  entries: TtEntry[],
  facultyName: string,
  format: 'excel' | 'csv' = 'excel'
): Promise<void> {
  const filtered = entries.filter(e => e.facultyName === facultyName);
  if (format === 'excel') {
    await exportToExcel(filtered, { branch: `Faculty-${facultyName.replace(/\s+/g, '_')}` });
  } else {
    exportToCsv(filtered, { branch: `Faculty-${facultyName.replace(/\s+/g, '_')}` });
  }
}

export async function exportDepartmentTimetable(
  entries: TtEntry[],
  departmentCode: string,
  format: 'excel' | 'csv' = 'excel'
): Promise<void> {
  const filtered = entries.filter(e => e.branch === departmentCode);
  if (format === 'excel') {
    await exportToExcel(filtered, { branch: `Dept-${departmentCode}` });
  } else {
    exportToCsv(filtered, { branch: `Dept-${departmentCode}` });
  }
}

export async function exportWholeCollegeTimetable(
  entries: TtEntry[]
): Promise<void> {
  try {
    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();

    // Group entries by branch
    const branches = [...new Set(entries.map(e => e.branch).filter(Boolean))];

    if (branches.length === 0) {
      // Fallback if empty
      const data = entries.map(e => ({
        Day: e.day,
        'Start Time': e.timeSlot?.startTime,
        'End Time': e.timeSlot?.endTime,
        Subject: e.subjectName,
        Type: e.subjectType,
        Faculty: e.facultyName,
        Room: e.roomName,
        Branch: e.branch,
        Year: e.year,
        Section: e.section,
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, 'Whole College');
    } else {
      branches.forEach(b => {
        const branchEntries = entries.filter(e => e.branch === b && !e.isLunch && !e.isFree);
        const data = branchEntries.map(e => ({
          Day: e.day,
          'Start Time': e.timeSlot?.startTime,
          'End Time': e.timeSlot?.endTime,
          Subject: e.subjectName,
          Type: e.subjectType,
          Faculty: e.facultyName,
          Room: e.roomName,
          Year: e.year,
          Section: e.section,
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, b.substring(0, 31)); // sheet names limited to 31 chars
      });
    }

    XLSX.writeFile(wb, 'whole-college-timetable.xlsx');
  } catch (err) {
    console.error('Failed to export whole college timetable', err);
    exportToCsv(entries, { branch: 'Whole-College' });
  }
}

