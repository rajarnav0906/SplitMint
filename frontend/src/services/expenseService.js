import { expensesAPI } from './api.js';

export const getExpenses = async (groupId) => {
  const response = await expensesAPI.getExpenses(groupId);
  return response.data;
};

export const getExpense = async (id) => {
  const response = await expensesAPI.getExpense(id);
  return response.data;
};

export const createExpense = async (data) => {
  const response = await expensesAPI.createExpense(data);
  return response.data;
};

export const updateExpense = async (id, data) => {
  const response = await expensesAPI.updateExpense(id, data);
  return response.data;
};

export const deleteExpense = async (id) => {
  const response = await expensesAPI.deleteExpense(id);
  return response.data;
};
