import course from "./course.json";
import type { Course } from "@/lib/nauka-types";

// course.json generuje tools/nauka/build_course.py (program kursu z haseł słownika i banków pytań).
export const COURSE = course as unknown as Course;
