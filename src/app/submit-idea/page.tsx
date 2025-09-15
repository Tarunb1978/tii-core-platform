import Navbar from "@/components/Navbar";
import SubmitIdeaForm from "./submitIdeaForm";
export default function SubmitIdeaPage() {
  return (
    <div>
      <Navbar />
      <div className="">
        <h1 className="text-2xl font-bold mb-4">Submit Investment Idea</h1>
        <SubmitIdeaForm />
      </div>
    </div>
  );
}
