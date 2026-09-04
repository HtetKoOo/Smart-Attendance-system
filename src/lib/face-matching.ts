/**
 * Browser-safe matching helpers shared by recognition test and attendance.
 * These functions only operate on numeric descriptors already held in memory.
 */
export const DEFAULT_RECOGNITION_THRESHOLD = 0.48;
export const AMBIGUITY_MARGIN = 0.055;

export interface FaceMatchTemplate {
  studentDbId: string;
  studentId: string;
  studentName: string;
  embedding: number[];
}

export interface FaceMatchCandidate extends FaceMatchTemplate {
  distance: number;
}

export interface FaceMatchEvaluation {
  best: FaceMatchCandidate | null;
  runnerUp: FaceMatchCandidate | null;
  isWithinThreshold: boolean;
  isAmbiguous: boolean;
}

function euclideanDistance(
  first: ArrayLike<number>,
  second: ArrayLike<number>,
): number {
  let sum = 0;
  for (let index = 0; index < first.length; index += 1) {
    const difference = first[index] - second[index];
    sum += difference * difference;
  }
  return Math.sqrt(sum);
}

/**
 * Scores every stored template, retaining only each student's closest template
 * before comparing students. This prevents a student's own three templates
 * from being mistaken as a competing identity.
 */
export function evaluateFaceMatch(
  descriptor: ArrayLike<number>,
  templates: FaceMatchTemplate[],
  threshold = DEFAULT_RECOGNITION_THRESHOLD,
): FaceMatchEvaluation {
  const bestByStudent = new Map<string, FaceMatchCandidate>();

  for (const template of templates) {
    const distance = euclideanDistance(descriptor, template.embedding);
    const candidate = { ...template, distance };
    const previous = bestByStudent.get(template.studentDbId);
    if (!previous || distance < previous.distance) {
      bestByStudent.set(template.studentDbId, candidate);
    }
  }

  const ranked = [...bestByStudent.values()].sort(
    (left, right) => left.distance - right.distance,
  );
  const best = ranked[0] ?? null;
  const runnerUp = ranked[1] ?? null;
  const isWithinThreshold = Boolean(best && best.distance <= threshold);
  const isAmbiguous = Boolean(
    isWithinThreshold &&
      runnerUp &&
      runnerUp.distance - (best?.distance ?? Infinity) < AMBIGUITY_MARGIN,
  );

  return { best, runnerUp, isWithinThreshold, isAmbiguous };
}
