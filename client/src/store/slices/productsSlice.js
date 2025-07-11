import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Ensure the environment variable is loaded correctly
const SERVER_URL = import.meta.env.SERVER_URL || "http://localhost:5000";

// Fetch user role
export const fetchUserRole = createAsyncThunk(
      "products/fetchUserRole",
      async () => {
            // const response = await axios.get(
            //       `${SERVER_URL}/api/user-role`
            // );
            return "retailer"; // Assuming API returns { role: 'retailer' | 'customer' }
      }
);

// New thunk to fetch shelf info
export const fetchShelfInfo = createAsyncThunk(
      "products/fetchShelfInfo",
      async () => {
            const response = await axios.get(`${SERVER_URL}/api/objects`);
            return response.data.map(({ nid, name }) => ({ nid, name }));
      }
);

// Fetch products
export const fetchProducts = createAsyncThunk(
      "products/fetchProducts",
      async () => {
            const response = await axios.get(`${SERVER_URL}/api/objects`);
            // Transform the data to flatten products
            return response.data.flatMap((object) =>
                  object.products
                        ? object.products.map((product) => ({
                                ...product,
                                nid: object.nid,
                                name: object.name,
                          }))
                        : []
            );
      }
);

// Add new product
export const addProduct = createAsyncThunk(
      "products/addProduct",
      async (productData) => {
            const response = await axios.post(
                  `${SERVER_URL}/api/objects`,
                  productData
            );
            return response.data;
      }
);

// Update product
export const updateProduct = createAsyncThunk(
      "products/updateProduct",
      async ({ productId, updatedData }) => {
            const response = await axios.put(
                  `${SERVER_URL}/api/objects/${productId}`,
                  updatedData
            );
            return response.data;
      }
);

// Delete product
export const deleteProduct = createAsyncThunk(
      "products/deleteProduct",
      async (productId) => {
            await axios.delete(`${SERVER_URL}/api/objects/${productId}`);
            return productId;
      }
);

// Add new thunk for editing shelf name
export const updateShelfName = createAsyncThunk(
      "products/updateShelfName",
      async ({ nid, newName }) => {
            const response = await axios.put(
                  `${SERVER_URL}/api/objects/${nid}/name`,
                  { name: newName }
            );
            return { nid, name: response.data.name };
      }
);

const productsSlice = createSlice({
      name: "products",
      initialState: {
            products: [],
            shelves: [],
            loading: false,
            error: null,
            userRole: null, // 'retailer' | 'customer' | null
            isRoleLoading: false,
            roleError: null,
      },
      reducers: {},
      extraReducers: (builder) => {
            builder
                  .addCase(fetchProducts.pending, (state) => {
                        state.loading = true;
                        state.error = null;
                  })
                  .addCase(fetchProducts.fulfilled, (state, action) => {
                        state.loading = false;
                        state.products = action.payload;
                  })
                  .addCase(fetchProducts.rejected, (state, action) => {
                        state.loading = false;
                        state.error = action.error.message;
                  })

                  // User role cases
                  .addCase(fetchUserRole.pending, (state) => {
                        state.isRoleLoading = true;
                        state.roleError = null;
                  })
                  .addCase(fetchUserRole.fulfilled, (state, action) => {
                        state.isRoleLoading = false;
                        state.userRole = action.payload;
                  })
                  .addCase(fetchUserRole.rejected, (state, action) => {
                        state.isRoleLoading = false;
                        state.roleError = action.error.message;
                  })

                  // Add product cases
                  .addCase(addProduct.fulfilled, (state, action) => {
                        state.products.push(action.payload);
                  })

                  // Update product cases
                  .addCase(updateProduct.fulfilled, (state, action) => {
                        const index = state.products.findIndex(
                              (product) => product._id === action.payload._id
                        );
                        if (index !== -1) {
                              state.products[index] = action.payload;
                        }
                  })

                  // Delete product cases
                  .addCase(deleteProduct.fulfilled, (state, action) => {
                        state.products = state.products.filter(
                              (product) => product._id !== action.payload
                        );
                  })

                  // Add cases for shelf info
                  .addCase(fetchShelfInfo.pending, (state) => {
                        state.loading = true;
                        state.error = null;
                  })
                  .addCase(fetchShelfInfo.fulfilled, (state, action) => {
                        state.loading = false;
                        state.shelves = action.payload;
                  })
                  .addCase(fetchShelfInfo.rejected, (state, action) => {
                        state.loading = false;
                        state.error = action.error.message;
                  })

                  // Add cases for updating shelf name
                  .addCase(updateShelfName.pending, (state) => {
                        state.loading = true;
                        state.error = null;
                  })
                  .addCase(updateShelfName.fulfilled, (state, action) => {
                        state.loading = false;
                        const { nid, name } = action.payload;
                        // Update name in shelves array
                        const shelfIndex = state.shelves.findIndex(
                              (shelf) => shelf.nid === nid
                        );
                        if (shelfIndex !== -1) {
                              state.shelves[shelfIndex].name = name;
                        }
                        // Update name in products array
                        state.products = state.products.map((product) =>
                              product.nid === nid
                                    ? { ...product, name }
                                    : product
                        );
                  })
                  .addCase(updateShelfName.rejected, (state, action) => {
                        state.loading = false;
                        state.error = action.error.message;
                  });
      },
});

// Selectors
export const selectUserRole = (state) => state.products.userRole;
export const selectIsRetailer = (state) =>
      state.products.userRole === "retailer";
export const selectProducts = (state) => state.products.products;
export const selectLoading = (state) => state.products.loading;
export const selectError = (state) => state.products.error;
export const selectShelves = (state) => state.products.shelves;

export default productsSlice.reducer;
