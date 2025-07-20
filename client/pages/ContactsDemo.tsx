import { ModernEmergencyContactManager } from "@/components/ModernEmergencyContactManager";

export default function ContactsDemo() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Guardian Emergency Contacts Demo
        </h1>
        <ModernEmergencyContactManager />
      </div>
    </div>
  );
}
