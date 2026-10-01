/**
 * GPA Calculator
 * Calculates cumulative GPA from an array of results
 * Each result: { gradePoint, credits }
 */
const calculateGPA = (results) => {
  if (!results || results.length === 0) return 0.0;

  let totalPoints = 0;
  let totalCredits = 0;

  results.forEach(({ gradePoint, credits }) => {
    const gp = parseFloat(gradePoint) || 0;
    const cr = parseFloat(credits) || 0;
    totalPoints += gp * cr;
    totalCredits += cr;
  });

  if (totalCredits === 0) return 0.0;
  return parseFloat((totalPoints / totalCredits).toFixed(2));
};

/**
 * Calculate semester GPA from an array of results for one semester
 */
const calculateSemesterGPA = (results) => calculateGPA(results);

/**
 * Classify degree based on GPA
 */
const classifyDegree = (gpa) => {
  if (gpa >= 3.7) return 'First Class Honours';
  if (gpa >= 3.3) return 'Second Class Honours (Upper)';
  if (gpa >= 3.0) return 'Second Class Honours (Lower)';
  if (gpa >= 2.0) return 'Third Class Honours';
  if (gpa >= 1.0) return 'Pass';
  return 'Fail';
};

module.exports = { calculateGPA, calculateSemesterGPA, classifyDegree };
