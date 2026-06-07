import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./userSlice";
import workspaceReducer from "./workspaceSlice";
import fileTreeReducer from "./fileTreeSlice";
import githubReducer from "./githubSlice";

const store = configureStore({
  reducer: {
    user: userReducer,
    workspaces: workspaceReducer,
    fileTree: fileTreeReducer,
    github: githubReducer,
  },
});

export default store;
