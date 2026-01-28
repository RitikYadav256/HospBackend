// ⏱️ Convert "HH:MM" string → total minutes since midnight
function timeStringToMinutes(timeStr) {
  const [hoursStr, minutesStr] = timeStr.split(":");
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);
  return hours * 60 + minutes;
}

// 📅 Convert total minutes since midnight → Date + Time string
function minutesToDateTime(totalMinutes) {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // reset to midnight
  const resultDate = new Date(today.getTime() + totalMinutes * 60 * 1000);

  return resultDate.toLocaleString([], {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

// 🧮 Main calculation function
export const calculateEstimatedTime = (startTimeStr, totalPatientsAttended, myNumber) => {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const startMinutes = timeStringToMinutes(startTimeStr);
  const elapsed = currentMinutes - startMinutes;

  const avgPerPatient = totalPatientsAttended > 0 ? elapsed / totalPatientsAttended : 0;
  let predictedMinutes = startMinutes + avgPerPatient * (myNumber + 1);

  // ✅ Restrict between 9 AM (540 min) and 9 PM (1260 min)
  const MIN_TIME = 9 * 60;   // 9:00 AM
  const MAX_TIME = 21 * 60;  // 9:00 PM

  if (predictedMinutes < MIN_TIME) {
    predictedMinutes = MIN_TIME; // shift to 9 AM same day
  } else if (predictedMinutes > MAX_TIME) {
    // shift to next day at 9 AM
    predictedMinutes = MIN_TIME + 24 * 60; 
  }

  console.log("Start:", startTimeStr);
  console.log("Now:", currentMinutes, "min since midnight");
  console.log("Elapsed:", elapsed, "min");
  console.log("Avg/Patient:", avgPerPatient, "min");
  console.log("My Number:", myNumber);
  console.log("Predicted:", minutesToDateTime(predictedMinutes));

  return minutesToDateTime(predictedMinutes);
};

export default calculateEstimatedTime;
