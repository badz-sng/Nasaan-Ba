export interface Tag {
  id: string;
  name: string;
  createdAt: string;
}

export interface TagWithCount extends Tag {
  itemCount: number;
}

export interface CreateTagInput {
  name: string;
}
