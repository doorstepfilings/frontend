import { useDispatch, useSelector, useStore } from "react-redux";
import type { AppDispatch, RootState } from "@/lib/store";
import { store } from "@/lib/store";

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
export const useAppStore = useStore.withTypes<typeof store>();
