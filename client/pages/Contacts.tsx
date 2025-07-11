import { MagicNavbar } from "@/components/MagicNavbar";
import { EmergencyContactManager } from "@/components/EmergencyContactManager";

export default function Contacts() {
  const handleSOSPress = () => {
    console.log("SOS triggered from contacts");
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <main className="container px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Emergency Contacts</h1>
        </div>

        {/* Use the real Emergency Contact Manager */}
        <EmergencyContactManager />
      </main>

      <MagicNavbar onSOSPress={handleSOSPress} />
    </div>
  );
}
