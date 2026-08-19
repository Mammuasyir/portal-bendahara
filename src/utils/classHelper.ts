export interface NormalizedClassButton {
  value: string; // ID atau nilai asli dari database (misal: "1", "2")
  label: string; // Nama kelas (misal: "7A", "7B", "8A", "9A")
  id?: number | string;
}

// Fallback kamus relasi ID kelas santri di pesantren jika API tidak mengembalikan label eksplisit
export const KNOWN_CLASS_MAP: Record<string, string> = {
  '1': '7A',
  '2': '7B',
  '3': '8A',
  '4': '8B',
  '5': '9A',
  '6': '9B',
  '7': '10-RPL',
  '8': '10-TKJ',
  '9': '11-RPL',
  '10': '11-TKJ',
  '11': '12-RPL',
  '12': '12-TKJ',
};

/**
 * Normalisasi class_buttons dari API backend dalam format apapun:
 * - Array of { value, label }
 * - Array of { id, name }
 * - Array of { class_id, class_name }
 * - Array of { id_kelas, nama_kelas }
 * - Object / Record { "1": "7A", "2": "7B" }
 * - Array of strings ["7A", "7B"]
 */
export function normalizeClassButtons(rawButtons: any): NormalizedClassButton[] {
  if (!rawButtons) {
    return Object.entries(KNOWN_CLASS_MAP).map(([val, lbl]) => ({
      value: val,
      label: lbl,
      id: Number(val),
    }));
  }

  // Jika berupa Array
  if (Array.isArray(rawButtons) && rawButtons.length > 0) {
    return rawButtons.map((item, idx) => {
      if (typeof item === 'string' || typeof item === 'number') {
        const val = String(item);
        const lbl = KNOWN_CLASS_MAP[val] || (val.startsWith('Kelas') ? val : `Kelas ${val}`);
        return { value: val, label: lbl.replace(/^kelas\s*/i, '').trim(), id: item };
      }
      if (typeof item === 'object' && item !== null) {
        const val = String(
          item.value ?? item.id ?? item.class_id ?? item.id_kelas ?? item.key ?? idx + 1
        );
        let lbl = String(
          item.label ?? item.name ?? item.class_name ?? item.nama_kelas ?? item.nama ?? ''
        );
        if (!lbl || lbl === val || lbl === `Kelas ${val}`) {
          lbl = KNOWN_CLASS_MAP[val] || val;
        }
        const cleanLabel = lbl.replace(/^kelas\s*/i, '').trim() || lbl;
        return { value: val, label: cleanLabel, id: item.id ?? item.value ?? val };
      }
      return { value: String(idx + 1), label: String(idx + 1) };
    });
  }

  // Jika berupa Object / Record { "1": "7A", "2": "7B" }
  if (typeof rawButtons === 'object' && rawButtons !== null) {
    return Object.entries(rawButtons).map(([key, val]) => {
      const rawLbl = typeof val === 'string' ? val : (val as any)?.name ?? (val as any)?.label ?? String(val);
      const cleanLbl = String(rawLbl).replace(/^kelas\s*/i, '').trim();
      return {
        value: String(key),
        label: cleanLbl || KNOWN_CLASS_MAP[String(key)] || String(key),
        id: key,
      };
    });
  }

  // Fallback default
  return Object.entries(KNOWN_CLASS_MAP).map(([val, lbl]) => ({
    value: val,
    label: lbl,
    id: Number(val),
  }));
}

/**
 * Mendapatkan Label Nama Kelas dari Objek Santri (misal: "7A", "7B", "8A")
 */
export function resolveStudentClassLabel(student: any, classButtons: NormalizedClassButton[] = []): string {
  if (!student) return '7A';

  // 1. Cek apakah ada field nama kelas langsung pada objek siswa
  const directName =
    student.class_name ||
    student.nama_kelas ||
    student.kelas_name ||
    student.className ||
    (typeof student.class === 'string' && isNaN(Number(student.class)) ? student.class : null) ||
    (typeof student.kelas === 'string' && isNaN(Number(student.kelas)) ? student.kelas : null) ||
    student.class?.name ||
    student.class?.label ||
    student.class?.nama_kelas ||
    student.kelas?.nama ||
    student.kelas?.nama_kelas;

  if (directName && typeof directName === 'string') {
    const clean = directName.replace(/^kelas\s*/i, '').trim();
    if (clean) return clean;
  }

  // 2. Ambil raw class ID dari student
  const rawId =
    student.class_id ??
    student.id_kelas ??
    student.kelas_id ??
    student.classId ??
    (typeof student.class === 'number' || typeof student.class === 'string' ? student.class : null) ??
    (typeof student.kelas === 'number' || typeof student.kelas === 'string' ? student.kelas : null) ??
    student.class?.id ??
    student.kelas?.id;

  if (rawId === undefined || rawId === null || rawId === '') {
    return '7A';
  }

  const rawIdStr = String(rawId);

  // 3. Cari di normalized class buttons
  const matchedBtn = classButtons.find(
    (b) => String(b.value) === rawIdStr || String(b.id) === rawIdStr || b.label.toLowerCase() === rawIdStr.toLowerCase()
  );
  if (matchedBtn && matchedBtn.label) {
    return matchedBtn.label;
  }

  // 4. Cocokkan dengan kamus relasi ID bawaan database
  if (KNOWN_CLASS_MAP[rawIdStr]) {
    return KNOWN_CLASS_MAP[rawIdStr];
  }

  // 5. Jika rawId sudah berbentuk string "7A", "8A", dst.
  if (isNaN(Number(rawIdStr))) {
    return rawIdStr.replace(/^kelas\s*/i, '').trim();
  }

  return `Kelas ${rawIdStr}`;
}

/**
 * Cek apakah seorang siswa cocok dengan filter kelas yang dipilih
 */
export function isStudentInClassFilter(
  student: any,
  selectedClass: string | number | 'ALL',
  classButtons: NormalizedClassButton[] = []
): boolean {
  if (selectedClass === 'ALL' || !selectedClass) return true;

  const target = String(selectedClass).toLowerCase().replace(/^kelas\s*/i, '').trim();
  const studentLabel = resolveStudentClassLabel(student, classButtons).toLowerCase().replace(/^kelas\s*/i, '').trim();

  // Raw ID siswa
  const rawId = String(
    student.class_id ??
    student.id_kelas ??
    student.kelas_id ??
    student.classId ??
    (typeof student.class === 'number' || typeof student.class === 'string' ? student.class : '') ??
    student.class?.id ??
    ''
  ).toLowerCase().trim();

  // Cocokkan berdasarkan label kelas ("7a" == "7a")
  if (studentLabel === target) return true;

  // Cocokkan berdasarkan ID kelas ("1" == "1")
  if (rawId && rawId === target) return true;

  // Cocokkan target yang berupa ID ("1") ke label ("7A")
  const targetLabelFromKnown = KNOWN_CLASS_MAP[target]?.toLowerCase();
  if (targetLabelFromKnown && (studentLabel === targetLabelFromKnown || rawId === target)) {
    return true;
  }

  // Cocokkan button
  const matchedBtn = classButtons.find(
    (b) => String(b.value).toLowerCase() === target || b.label.toLowerCase() === target
  );
  if (matchedBtn) {
    if (studentLabel === matchedBtn.label.toLowerCase()) return true;
    if (rawId && rawId === String(matchedBtn.value).toLowerCase()) return true;
  }

  return false;
}
