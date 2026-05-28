import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./userSlice";
import workspaceReducer from "./workspaceSlice";
import fileTreeReducer from "./fileTreeSlice";

const store = configureStore({
  reducer: {
    user: userReducer,
    workspaces: workspaceReducer,
    fileTree: fileTreeReducer,
  },
});

export default store;
