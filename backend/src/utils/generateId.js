import { customAlphabet } from "nanoid";

const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const generateCustomId = customAlphabet(alphabet, 8);

export const generateId = () => generateCustomId();
