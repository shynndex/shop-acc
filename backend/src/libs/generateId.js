import { nanoid } from 'nanoid'

export const generateId = () => {
  const customAlphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return nanoid(customAlphabet, 8);
};
