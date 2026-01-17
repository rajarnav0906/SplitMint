import { groupsAPI } from './api.js';

export const getBalances = async (groupId) => {
  const response = await groupsAPI.getBalances(groupId);
  return response.data;
};

export const getSettlements = async (groupId) => {
  const response = await groupsAPI.getSettlements(groupId);
  return response.data;
};

export const getUserBalance = async (groupId) => {
  const response = await groupsAPI.getUserBalance(groupId);
  return response.data;
};
