import type { Question } from "@/lib/types";
import questions from "./questions.json";

// questions.json buduje tools/pytania_ai/build.py: pytania „🤖 AI” wklejone przez użytkownika, z ręcznie ustalonym
// kluczem, wyjaśnieniami i poprawkami treści (raport: tools/pytania_ai/RAPORT.md).
export const AI_QUESTIONS = questions as Question[];
