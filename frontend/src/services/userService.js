import { usersAPI } from './api.js';

export const searchUsers = async (query) => {
  const response = await usersAPI.searchUsers(query);
  return response.data;
};
