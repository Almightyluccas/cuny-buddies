import type { Metadata } from "next";
import MyWeek from "@/components/schedule/MyWeek";

export const metadata: Metadata = { title: "My week · CUNY Buddies" };

export default function MyWeekPage() {
  return <MyWeek />;
}
