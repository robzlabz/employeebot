import type { Metadata } from "next";

import { GroupView } from "@/components/chat/group-view";

export const metadata: Metadata = {
  title: "Grup",
  description: "Grup Bolu: beberapa Bolu dalam satu obrolan, dengan router yang memilih penjawab.",
};

export default function GroupsPage() {
  return <GroupView />;
}
