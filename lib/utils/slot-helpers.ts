export const SLOT_TIMES = (() => {
  const slots: string[] = [];

  for (let hour = 10; hour < 19; hour += 1) {
    slots.push(`${hour.toString().padStart(2, "0")}:00`);
    slots.push(`${hour.toString().padStart(2, "0")}:30`);
  }

  slots.push("19:00");

  return slots;
})();

export const formatTimeSlot = (time: string | null) => {
  if (!time) {
    return "";
  }

  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;

  return `${displayHour}:${minutes} ${ampm}`;
};

export const isWorkingDay = (date: Date) => {
  if (!(date instanceof Date)) {
    return false;
  }

  const day = date.getDay();
  if (day === 0) {
    return false;
  }

  const month = date.getMonth();
  const dateOfMonth = date.getDate();

  if (month === 0 && dateOfMonth === 26) return false;
  if (month === 7 && dateOfMonth === 15) return false;
  if (month === 9 && dateOfMonth === 2) return false;

  return true;
};

export const findNextWorkingDay = (
  fromDate: Date,
  filterDate: (d: Date) => boolean = isWorkingDay,
  maxLookaheadDays = 30
) => {
  if (!(fromDate instanceof Date)) {
    return null;
  }

  for (let dayOffset = 1; dayOffset <= maxLookaheadDays; dayOffset += 1) {
    const candidate = new Date(fromDate);
    candidate.setDate(fromDate.getDate() + dayOffset);

    if (filterDate(candidate)) {
      return candidate;
    }
  }

  return null;
};

export const getAvailableSlots = (
  slotAvailability: Record<string, any> = {},
  slotTimes = SLOT_TIMES
) => {
  return slotTimes.filter((slot) => {
    const availability = slotAvailability?.[slot];
    return availability && !availability.is_full && !availability.is_past;
  });
};

export const getNextAvailableSlot = ({
  slotAvailability = {},
  selectedTimeSlot = "",
  slotTimes = SLOT_TIMES,
}: {
  slotAvailability?: Record<string, any>;
  selectedTimeSlot?: string;
  slotTimes?: string[];
}) => {
  const availableSlots = getAvailableSlots(slotAvailability, slotTimes);

  if (availableSlots.length === 0) {
    return null;
  }

  if (!selectedTimeSlot) {
    return availableSlots[0];
  }

  const currentIndex = slotTimes.indexOf(selectedTimeSlot);
  if (currentIndex === -1) {
    return availableSlots[0];
  }

  const laterSlot = slotTimes
    .slice(currentIndex + 1)
    .find((slot) => availableSlots.includes(slot));

  return laterSlot || availableSlots[0];
};
