import { Card } from "@/components/ui/card";

export default function LearnPage() {
  return (
    <main className="container max-w-4xl mx-auto p-4 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Learn About pAIr</h1>
        <p className="text-muted-foreground">Discover how pAIr can help you with meal planning and grocery shopping</p>
      </div>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Why We Built This</h2>
        <Card className="p-6">
          <p className="text-lg leading-relaxed">
            pAIr was created to solve the everyday challenges of meal planning and grocery shopping. We understand that
            planning meals while considering dietary restrictions, budgets, and time constraints can be overwhelming.
            Our AI-powered solution helps you make informed decisions about your meals and shopping, saving you time
            and money while ensuring you eat well.
          </p>
        </Card>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <Card key={index} className="p-6 space-y-2">
              <h3 className="text-lg font-medium">{faq.question}</h3>
              <p className="text-muted-foreground">{faq.answer}</p>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}

const faqs = [
  {
    question: "How does pAIr help with meal planning?",
    answer: "pAIr uses AI to suggest meals based on your dietary preferences, available ingredients, and cooking time constraints. It learns from your choices to provide better recommendations over time."
  },
  {
    question: "Can I customize my dietary preferences?",
    answer: "Yes! You can set your dietary preferences, allergies, and restrictions in your account settings. All meal suggestions will take these into account."
  },
  {
    question: "How does the smart shopping feature work?",
    answer: "Smart shopping analyzes your meal plans and current pantry to create optimized shopping lists. It considers your preferred stores and helps you find the best deals."
  },
  {
    question: "Is my personal information secure?",
    answer: "We take your privacy seriously. All personal information is encrypted and stored securely. We never share your data with third parties without your explicit consent."
  },
  {
    question: "Can I use pAIr on my mobile device?",
    answer: "Yes! pAIr is designed to work seamlessly on both desktop and mobile devices, so you can plan meals and manage your shopping list on the go."
  }
]; 