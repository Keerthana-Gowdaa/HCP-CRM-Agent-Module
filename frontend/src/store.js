import { configureStore, createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// ── Async thunks ─────────────────────────────────────────────────────────────

export const fetchInteractions = createAsyncThunk(
  "crm/fetchInteractions",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get("/api/interactions");
      return res.data.interactions;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || "Failed to fetch interactions.");
    }
  }
);

export const submitInteraction = createAsyncThunk(
  "crm/submitInteraction",
  async (formData, { rejectWithValue }) => {
    try {
      const res = await axios.post("/api/log", formData);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || "Failed to log interaction.");
    }
  }
);

export const sendChatMessage = createAsyncThunk(
  "crm/sendChatMessage",
  async (message, { rejectWithValue }) => {
    try {
      const res = await axios.post("/api/chat", { message });
      return res.data.response;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || "AI agent encountered an error.");
    }
  }
);

// ── Slice ────────────────────────────────────────────────────────────────────

const crmSlice = createSlice({
  name: "crm",
  initialState: {
    interactions: [],
    chatHistory: [],
    loading: false,
    chatLoading: false,
    error: null,
    successMessage: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.successMessage = null;
    },
    addUserMessage: (state, action) => {
      state.chatHistory.push({ role: "user", content: action.payload });
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchInteractions
      .addCase(fetchInteractions.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchInteractions.fulfilled, (state, action) => {
        state.loading = false;
        state.interactions = action.payload;
      })
      .addCase(fetchInteractions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // submitInteraction
      .addCase(submitInteraction.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(submitInteraction.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = action.payload.message;
        if (action.payload.record) {
          state.interactions.unshift(action.payload.record);
        }
      })
      .addCase(submitInteraction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // sendChatMessage
      .addCase(sendChatMessage.pending, (state) => {
        state.chatLoading = true;
        state.error = null;
      })
      .addCase(sendChatMessage.fulfilled, (state, action) => {
        state.chatLoading = false;
        state.chatHistory.push({ role: "assistant", content: action.payload });
      })
      .addCase(sendChatMessage.rejected, (state, action) => {
        state.chatLoading = false;
        state.chatHistory.push({
          role: "assistant",
          content: `⚠️ Error: ${action.payload}`,
        });
      });
  },
});

export const { clearError, clearSuccess, addUserMessage } = crmSlice.actions;

// ── Store ────────────────────────────────────────────────────────────────────

export const store = configureStore({
  reducer: {
    crm: crmSlice.reducer,
  },
});
