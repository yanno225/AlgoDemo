import clsx, { type ClassValue } from "clsx";

/** Compose des classes conditionnelles. Raccourci utilisé dans tous les composants. */
export const cn = (...inputs: ClassValue[]) => clsx(inputs);
