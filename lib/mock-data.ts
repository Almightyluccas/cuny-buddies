// Hardcoded demo data. Replaced by MongoDB reads once the DB layer exists.

import type { MatchDetail, User } from "@/lib/types";

export const currentUser: User = {
  id: "me",
  firstName: "Rasul",
  lastName: "Mohammad",
  showLastInitialOnly: true,
  age: 20,
  gender: "male",
  showGender: false,
  school: "City College",
  majors: ["Computer Science"],
  year: "Junior",
  hobbies: ["Basketball", "Photography", "Chess"],
  clubs: ["Hackathon club", "ACM"],
  lookingFor: ["Study mates", "Friends"],
  socials: [
    { label: "Instagram", url: "https://instagram.com/" },
    { label: "LinkedIn", url: "https://linkedin.com/" },
  ],
};

export const mockUsers: User[] = [
  {
    id: "maya-r",
    firstName: "Maya",
    lastName: "Rivera",
    showLastInitialOnly: true,
    age: 20,
    gender: "female",
    showGender: false,
    school: "City College",
    majors: ["Computer Science"],
    year: "Junior",
    hobbies: ["Basketball", "Photography", "Cooking"],
    clubs: ["Women in CS", "Hackathon club"],
    lookingFor: ["Study mates", "Friends"],
    socials: [{ label: "Instagram", url: "https://instagram.com/" }],
  },
  {
    id: "devin-k",
    firstName: "Devin",
    lastName: "Kim",
    showLastInitialOnly: true,
    age: 21,
    gender: "male",
    showGender: false,
    school: "City College",
    majors: ["Computer Science", "Math"],
    year: "Senior",
    hobbies: ["Basketball", "Running", "Music"],
    clubs: ["ACM"],
    lookingFor: ["Study mates"],
    socials: [{ label: "LinkedIn", url: "https://linkedin.com/" }],
  },
  {
    id: "aisha-n",
    firstName: "Aisha",
    lastName: "Nasser",
    showLastInitialOnly: true,
    age: 19,
    gender: "female",
    showGender: false,
    school: "Hunter College",
    majors: ["Data Science"],
    year: "Sophomore",
    hobbies: ["Photography", "Hiking", "Cooking"],
    clubs: ["Women in CS", "Outdoors club"],
    lookingFor: ["Friends", "Connections"],
    socials: [{ label: "Instagram", url: "https://instagram.com/" }],
  },
  {
    id: "leo-p",
    firstName: "Leo",
    lastName: "Park",
    showLastInitialOnly: true,
    age: 22,
    gender: "male",
    showGender: false,
    school: "City College",
    majors: ["Computer Engineering"],
    year: "Senior",
    hobbies: ["Chess", "Music", "Gaming"],
    clubs: ["Robotics", "ACM"],
    lookingFor: ["Study mates", "Connections"],
    socials: [{ label: "LinkedIn", url: "https://linkedin.com/" }],
  },
];

// matchPercent per user, used on the matches grid and profile header.
export const matchPercentById: Record<string, number> = {
  "maya-r": 92,
  "devin-k": 84,
  "aisha-n": 76,
  "leo-p": 71,
};

export const matchDetails: Record<string, MatchDetail> = {
  "maya-r": {
    userId: "maya-r",
    matchPercent: 92,
    sharedClasses: [
      { name: "Operating Systems", meets: "Mon & Wed 2:00-3:15" },
      { name: "Intro to Database Systems", meets: "Tue & Thu 3:30-4:45" },
    ],
    freeSlots: [
      { day: "Mon", time: null },
      { day: "Tue", time: "10:45-3:30" },
      { day: "Wed", time: null },
      { day: "Thu", time: "10:45-3:30" },
      { day: "Fri", time: null },
    ],
    idea: "Review for the Database Systems midterm at the campus library, 11:00-12:30.",
  },
  "devin-k": {
    userId: "devin-k",
    matchPercent: 84,
    sharedClasses: [{ name: "Operating Systems", meets: "Mon & Wed 2:00-3:15" }],
    freeSlots: [
      { day: "Mon", time: "1:00-2:00" },
      { day: "Tue", time: null },
      { day: "Wed", time: "1:00-2:00" },
      { day: "Thu", time: null },
      { day: "Fri", time: "12:00-3:00" },
    ],
    idea: "Grab lunch before OS on Wednesday and compare notes.",
  },
  "aisha-n": {
    userId: "aisha-n",
    matchPercent: 76,
    sharedClasses: [{ name: "Intro to Database Systems", meets: "Tue & Thu 3:30-4:45" }],
    freeSlots: [
      { day: "Mon", time: null },
      { day: "Tue", time: "11:00-1:00" },
      { day: "Wed", time: null },
      { day: "Thu", time: "11:00-1:00" },
      { day: "Fri", time: null },
    ],
    idea: "Photo walk around campus between classes on Tuesday.",
  },
  "leo-p": {
    userId: "leo-p",
    matchPercent: 71,
    sharedClasses: [{ name: "Operating Systems", meets: "Mon & Wed 2:00-3:15" }],
    freeSlots: [
      { day: "Mon", time: "3:30-5:00" },
      { day: "Tue", time: null },
      { day: "Wed", time: "3:30-5:00" },
      { day: "Thu", time: null },
      { day: "Fri", time: null },
    ],
    idea: "Chess in the student lounge after OS on Monday.",
  },
};

export function getMatches(): User[] {
  return mockUsers;
}

export function getUser(id: string): User | undefined {
  return mockUsers.find((u) => u.id === id);
}

export function getMatchDetail(id: string): MatchDetail | undefined {
  return matchDetails[id];
}

export function getCurrentUser(): User {
  return currentUser;
}
