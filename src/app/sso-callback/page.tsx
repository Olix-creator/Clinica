import { redirect } from "next/navigation";

export default function SSOCallbackRedirect() {
  redirect("/login");
}
