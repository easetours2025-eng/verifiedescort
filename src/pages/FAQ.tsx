import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertCircle, HelpCircle, Shield, Star, ArrowLeft } from "lucide-react";
import NavigationHeader from "@/components/NavigationHeader";
import Footer from "@/components/Footer";

// FAQ Page Component
interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  display_order: number;
}

export default function FAQ() {
  const navigate = useNavigate();
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFAQs();
  }, []);

  // Add JSON-LD structured data for FAQ page SEO
  useEffect(() => {
    if (faqs.length > 0) {
      const faqPageData = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqs.map(faq => ({
          "@type": "Question",
          "name": faq.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.answer
          }
        }))
      };

      const breadcrumbData = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://royalescortsworld.com/"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "FAQ",
            "item": "https://royalescortsworld.com/faq"
          }
        ]
      };

      // Add FAQ structured data
      const existingScript = document.getElementById('faq-structured-data');
      if (existingScript) {
        existingScript.remove();
      }

      const script = document.createElement('script');
      script.id = 'faq-structured-data';
      script.type = 'application/ld+json';
      script.text = JSON.stringify(faqPageData);
      document.head.appendChild(script);

      // Add breadcrumb structured data
      const existingBreadcrumbScript = document.getElementById('breadcrumb-structured-data');
      if (existingBreadcrumbScript) {
        existingBreadcrumbScript.remove();
      }

      const breadcrumbScript = document.createElement('script');
      breadcrumbScript.id = 'breadcrumb-structured-data';
      breadcrumbScript.type = 'application/ld+json';
      breadcrumbScript.text = JSON.stringify(breadcrumbData);
      document.head.appendChild(breadcrumbScript);

      // Update page title and meta
      document.title = "FAQ - Royal Escorts | Frequently Asked Questions";
      
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute('content', 
        `Find answers to frequently asked questions about Royal Escorts. Learn about subscriptions, verification, safety, and how to connect with verified celebrity companions in Kenya.`
      );

      // Cleanup
      return () => {
        const script = document.getElementById('faq-structured-data');
        const breadcrumbScript = document.getElementById('breadcrumb-structured-data');
        if (script) script.remove();
        if (breadcrumbScript) breadcrumbScript.remove();
      };
    }
  }, [faqs]);

  const fetchFAQs = async () => {
    try {
      const { data, error } = await supabase
        .from("faq_items")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      setFaqs(data || []);
    } catch (error) {
      console.error("Error fetching FAQs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "getting_started":
        return <Star className="w-5 h-5" />;
      case "subscriptions":
        return <Shield className="w-5 h-5" />;
      case "verification":
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <HelpCircle className="w-5 h-5" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    return category.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const groupedFAQs = faqs.reduce((acc, faq) => {
    if (!acc[faq.category]) {
      acc[faq.category] = [];
    }
    acc[faq.category].push(faq);
    return acc;
  }, {} as Record<string, FAQItem[]>);

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl mt-16">
        
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Frequently Asked Questions
          </h1>
          <p className="text-muted-foreground text-lg">
            Find answers to common questions about our platform
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedFAQs).map(([category, categoryFAQs]) => (
              <Card key={category} className="border-2">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      {getCategoryIcon(category)}
                    </div>
                    <div>
                      <CardTitle className="text-2xl">
                        {getCategoryLabel(category)}
                      </CardTitle>
                      <CardDescription>
                        {categoryFAQs.length} questions
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {categoryFAQs.map((faq, index) => (
                      <AccordionItem key={faq.id} value={`item-${index}`}>
                        <AccordionTrigger className="text-left hover:no-underline">
                          <span className="font-semibold">{faq.question}</span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="text-muted-foreground whitespace-pre-line pt-2">
                            {faq.answer}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ))}

            {faqs.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <HelpCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    No FAQs available at the moment. Check back soon!
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <Card className="mt-12 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle>Still have questions?</CardTitle>
            <CardDescription>
              Can't find what you're looking for? Contact our support team for help.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Badge variant="outline" className="text-sm py-2 px-4">
                📧 Email: support@example.com
              </Badge>
              <Badge variant="outline" className="text-sm py-2 px-4">
                📱 WhatsApp: +254 XXX XXX XXX
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
