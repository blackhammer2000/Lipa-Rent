import { createContext } from "react";

export const LoaderContext = createContext({
  loading: false,
  message: "",
  showLoader: () => {},
  hideLoader: () => {},
});
