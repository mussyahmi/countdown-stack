export interface Dashboard {
  id: string;
  slug: string;
  title: string;
  description: string;
  passwordHash: string;
  isPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastActivityAt: Date;
  viewCount: number;
}

export interface Event {
  id: string;
  title: string;
  date: Date;
  description: string;
  color: string;
  createdAt: Date;
}