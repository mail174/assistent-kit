import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { pageView } from "@/lib/meta-pixel";

/** Ein Meta-PageView je Routenwechsel; die SPA lädt die Seite sonst nur einmal. */
export default function MetaPageView() {
  const { pathname } = useLocation();
  useEffect(() => {
    pageView();
  }, [pathname]);
  return null;
}
