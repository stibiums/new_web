"use client";

import { useParams } from "next/navigation";
import { SearchModal } from "@/components/search/SearchModal";

export function SearchProvider() {
  const params = useParams();
  const locale = params.locale as string;

  return <SearchModal locale={locale} />;
}
