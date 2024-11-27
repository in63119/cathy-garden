import axios from "axios";

export const get = async (url: string, option?: any) => {
  try {
    const res = await axios.get(url, option);
    return res;
  } catch (error) {
    console.log(error);
  }
};

export const post = async (url: string, data?: any, option?: any) => {
  try {
    const res = await axios.post(url, data, option);
    return res;
  } catch (error) {
    console.log(error);
  }
};
