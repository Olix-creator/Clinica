import { redirect } from "next/navigation";

// Sign-up is handled via OAuth (Google/Apple) on the sign-in page.
// Redirect there so users can sign in/up in one flow.
export default function SignUpPage() {
  redirect("/sign-in");
}
