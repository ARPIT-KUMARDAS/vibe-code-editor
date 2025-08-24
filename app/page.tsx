import { Button } from "@/components/ui/button";
import UserButton from "@/modules/auth/components/user.button";
import { User } from "lucide-react";
import Image from "next/image";

export default async function Home() {
  return (
    <div className="flex flex-col items-center
     justify-center h-screen bg-gray-100">
      <Button >
        Get Start
      </Button>
      <UserButton>
        
      </UserButton>
    </div>
  );
}
