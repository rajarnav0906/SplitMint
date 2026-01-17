import { groupsAPI } from './api.js';

export const getGroups = async () => {
  const response = await groupsAPI.getGroups();
  return response.data;
};

export const getGroup = async (id) => {
  const response = await groupsAPI.getGroup(id);
  return response.data;
};

export const createGroup = async (data) => {
  const response = await groupsAPI.createGroup(data);
  return response.data;
};

export const updateGroup = async (id, data) => {
  const response = await groupsAPI.updateGroup(id, data);
  return response.data;
};

export const deleteGroup = async (id) => {
  const response = await groupsAPI.deleteGroup(id);
  return response.data;
};

export const addParticipant = async (groupId, data) => {
  const response = await groupsAPI.addParticipant(groupId, data);
  return response.data;
};

export const updateParticipant = async (groupId, participantId, data) => {
  const response = await groupsAPI.updateParticipant(groupId, participantId, data);
  return response.data;
};

export const removeParticipant = async (groupId, participantId) => {
  const response = await groupsAPI.removeParticipant(groupId, participantId);
  return response.data;
};

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
