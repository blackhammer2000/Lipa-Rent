import { useContext } from "react";
import { ConfirmContext } from "../context/ConfirmContext";

export function useConfirm() {
  return useContext(ConfirmContext);
}
