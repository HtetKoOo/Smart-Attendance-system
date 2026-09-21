interface FaceTemplateStudentReference {
  studentId: string;
}

export function countFaceTemplatesByStudent(
  templates: readonly FaceTemplateStudentReference[],
) {
  return templates.reduce<Record<string, number>>((counts, template) => {
    counts[template.studentId] = (counts[template.studentId] ?? 0) + 1;
    return counts;
  }, {});
}
