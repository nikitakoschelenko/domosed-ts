interface UserBalance {
  vkid: number;
  money: string;
}

export interface UsersBalance {
  users: UserBalance[];
  count: number;
}
