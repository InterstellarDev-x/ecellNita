const PROFILE_FIELDS = [
  ["First name", (user) => user?.firstname],
  ["Last name", (user) => user?.lastname],
  ["Email", (user) => user?.email],
  ["Gender", (user, profile) => profile?.gender ?? user?.gender],
  ["Enrollment number", (user, profile) => profile?.enrollmentno ?? user?.enrollmentno],
  ["Contact number", (user, profile) => profile?.contactno ?? user?.contactno],
  ["Graduation year", (user, profile) => profile?.graduationyr ?? user?.graduationyr],
  ["About", (user, profile) => profile?.about ?? user?.about],
];

const hasProfileValue = (value) => value !== null && value !== undefined && String(value).trim() !== "";

export const getProfileCompletion = (user) => {
  const profile = user?.additionaldetails || {};
  const missingFields = PROFILE_FIELDS
    .filter(([, getValue]) => !hasProfileValue(getValue(user, profile)))
    .map(([label]) => label);
  const totalFields = PROFILE_FIELDS.length;
  const completedFields = totalFields - missingFields.length;

  return {
    completedFields,
    totalFields,
    percentage: Math.round((completedFields / totalFields) * 100),
    isComplete: missingFields.length === 0,
    missingFields,
  };
};
