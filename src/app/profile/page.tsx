import Navbar from "@/components/Navbar";
import ProfileClient from "../../components/ProfileClient";

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="pt-24">
        <ProfileClient />
      </div>
    </div>
  );
}

