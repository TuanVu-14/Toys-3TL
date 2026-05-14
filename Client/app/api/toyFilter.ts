
import axios from 'axios';

const backendURL = process.env.BACKEND_URL;

export interface ToyFilterParams {
  // Category page params
  categoryName?: string;
  categoryID?: number;
  // Search page params
  productName?: string;
  // Shared price/rating params
  minPrice?: string | number;
  maxPrice?: string | number;
  minRating?: string | number;
  // Toy-specific params
  ageGroup?: string;
  gender?: string;
  material?: string;
  skillType?: string;
}

// Dùng cho trang Category
export async function toyFilterCategoryHandler(params: ToyFilterParams) {
  try {
    const response = await axios.post(
      `${backendURL}/api/toy-filter/category`,
      params,
      { withCredentials: true }
    );
    return { status: response.status, data: response.data };
  } catch (error: any) {
    return { status: error?.response?.status || 500, data: null };
  }
}

// Dùng cho trang Search
export async function toyFilterSearchHandler(params: ToyFilterParams) {
  try {
    const response = await axios.post(
      `${backendURL}/api/toy-filter/search`,
      params,
      { withCredentials: true }
    );
    return { status: response.status, data: response.data };
  } catch (error: any) {
    return { status: error?.response?.status || 500, data: null };
  }
}