/**
 * Grade calculator based on numeric mark
 * Returns { grade, gradePoint }
 */
const calculateGrade = (mark) => {
  const score = parseFloat(mark);
  if (isNaN(score)) return { grade: 'F', gradePoint: 0.0 };

  if (score >= 90) return { grade: 'A+', gradePoint: 4.0 };
  if (score >= 85) return { grade: 'A',  gradePoint: 4.0 };
  if (score >= 80) return { grade: 'A-', gradePoint: 3.7 };
  if (score >= 75) return { grade: 'B+', gradePoint: 3.3 };
  if (score >= 70) return { grade: 'B',  gradePoint: 3.0 };
  if (score >= 65) return { grade: 'B-', gradePoint: 2.7 };
  if (score >= 60) return { grade: 'C+', gradePoint: 2.3 };
  if (score >= 55) return { grade: 'C',  gradePoint: 2.0 };
  if (score >= 50) return { grade: 'C-', gradePoint: 1.7 };
  if (score >= 45) return { grade: 'D',  gradePoint: 1.0 };
  return { grade: 'F', gradePoint: 0.0 };
};

/**
 * Check if a grade is passing
 */
const isPassing = (grade) => {
  return !['F'].includes(grade);
};

module.exports = { calculateGrade, isPassing };
