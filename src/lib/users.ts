// src/lib/users.ts
export type User = {
  id: string;
  username: string;
  phone: string;
  password: string;
  role: string;
  createdAt: string;
};

export const users: User[] = [];