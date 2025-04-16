import axios from "axios";


const BASE_URL = import.meta.env.VITE_BASE_URL;



export const fetchInvoices = async () => {



  console.log(`this is base url ${BASE_URL}`);

  const {data} = await axios.get(`${BASE_URL}/invoices/all`, {
    headers: { 'Content-Type': 'application/json' },
   
  });


  return data;


 
};

export const fetchInvoiceById = async (id) => {
  const { data } = await axios.get(`${BASE_URL}/invoices/${id}`);
  return data;
};
