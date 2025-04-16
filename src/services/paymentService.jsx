import axios from "axios";


const BASE_URL = import.meta.env.VITE_BASE_URL;


export const fetchPayments = async () => {
  const { data } = await axios.get(`${BASE_URL}/payments`);
  return data;
};

export const fetchPaymentById = async (id) => {
  const { data } = await axios.get(`${BASE_URL}/payments/${id}`);
  return data;
};
