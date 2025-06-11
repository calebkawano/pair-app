"use client";

import { Card } from "@/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/ui/collapsible";
import { useState } from "react";

export default function LearnPage() {
  const [openFaqs, setOpenFaqs] = useState<number[]>([]);

  const toggleFaq = (index: number) => {
    setOpenFaqs((current) => {
      const isOpen = current.includes(index);
      if (isOpen) {
        return current.filter((i) => i !== index);
      } else {
        return [...current, index];
      }
    });
  };

  return (
    <main className="container max-w-4xl mx-auto p-4 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Learn About pAIr</h1>
        <p className="text-muted-foreground">Discover how pAIr can help you with meal planning and grocery shopping</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Why We Built This</h2>
        <Card className="p-3">
          <p className="text-lg leading-relaxed">
            pAIr was created to solve the everyday challenges of meal planning and grocery shopping. 
            As broke college students, we understand that
            planning meals while considering dietary restrictions, budgets, and time constraints can just be too much.
            Our AI-powered solution helps you make informed decisions about your meals and shopping, saving you time
            and money while ensuring you eat well. We hope you find it useful!
          </p>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Frequently Asked Questions (FAQs)</h2>
        <div className="space-y-2">
          {faqs.map((faq, index) => (
            <Card key={index} className="overflow-hidden">
              <Collapsible open={openFaqs.includes(index)}>
                <CollapsibleTrigger 
                  onClick={() => toggleFaq(index)}
                  className="w-full p-2 hover:bg-accent/25 transition-colors"
                >
                  <h3 className="text-lg font-medium text-left">{faq.question}</h3>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <p className="text-muted-foreground px-1 pb-1">{faq.answer}</p>
                </CollapsibleContent>
              </Collapsible>
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
    answer: "pAIr uses your input andAI to suggest meals based on dietary and personal preferences, available ingredients, and time constraints. It learns from your choices to provide better recommendations over time."
  },
  {
    question: "Can I customize my dietary preferences?",
    answer: "Yes! You can set your dietary preferences, allergies, and restrictions in your account settings. All meal suggestions will take these into account."
  },
  {
    question: "How does the smart shopping feature work?",
    answer: "Smart shopping analyzes your meal plans and your suggestions in order to create optimized shopping lists. It considers your preferred stores and helps you find the best deals and the simpliest shopping trip."
  },
  {
    question: "Is my personal information secure?",
    answer: "We take your privacy seriously. All personal information is encrypted and stored securely. We never share your data with third parties without your explicit consent."
  },
  {
    question: "Can I use pAIr on my mobile device?",
    answer: "Yes! pAIr is designed to work seamlessly on both desktop and mobile devices, so you can plan meals and manage your shopping list on the go."
  },
  {
    question: "How does pAIr make money?",
    answer: "pAIr is a free service. We make money by partnering with grocery stores and restaurants to provide you with the best deals and the simpliest shopping trip."
  }
];