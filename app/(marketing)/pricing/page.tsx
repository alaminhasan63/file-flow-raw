import Link from "next/link";
import { CheckCircle, Star, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const packages = [
    {
        id: "basic",
        name: "Basic",
        description: "Essential LLC formation services",
        price: 99,
        originalPrice: null,
        popular: false,
        includes: [
            "Articles of Filing",
            "EIN Application",
            "Operating Agreement Template",
            "Email Support",
            "Digital Document Delivery"
        ],
        govtFee: 100, // Wyoming fee
        total: 199
    },
    {
        id: "premium",
        name: "Premium",
        description: "Complete LLC formation with extras",
        price: 199,
        originalPrice: null,
        popular: true,
        includes: [
            "Articles of Filing",
            "EIN Application",
            "Custom Operating Agreement",
            "Registered Agent (1 year)",
            "LLC Kit",
            "Priority Support",
            "Digital Document Delivery"
        ],
        govtFee: 100,
        total: 299
    },
    {
        id: "express",
        name: "Express",
        description: "Fast-track LLC formation",
        price: 299,
        originalPrice: null,
        popular: false,
        includes: [
            "Expedited Filing",
            "Articles of Filing",
            "EIN Application",
            "Custom Operating Agreement",
            "Registered Agent (1 year)",
            "Priority Support",
            "Digital Document Delivery",
            "24/7 Phone Support"
        ],
        govtFee: 150, // Expedited fee
        total: 449
    }
];

const addons = [
    {
        name: "Registered Agent (1 Year)",
        description: "Professional registered agent service for one year",
        price: 99
    },
    {
        name: "EIN Application",
        description: "Federal tax ID number application",
        price: 49
    },
    {
        name: "Custom Operating Agreement",
        description: "Professionally drafted operating agreement",
        price: 99
    },
    {
        name: "LLC Kit",
        description: "Physical LLC kit with seal and certificates",
        price: 49
    },
    {
        name: "Expedited Processing",
        description: "Rush processing for faster filing",
        price: 99
    }
];

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-background">
            {/* Hero Section */}
            <section className="py-20 text-center">
                <div className="container-wide">
                    <h1 className="text-4xl font-bold mb-4">
                        Simple, Transparent Pricing
                    </h1>
                    <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                        Form your LLC with confidence. No hidden fees, no surprises.
                        Choose the package that fits your business needs.
                    </p>
                    <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm">
                        <CheckCircle className="w-4 h-4" />
                        <span>Wyoming LLC formation starting at $199 total</span>
                    </div>
                </div>
            </section>

            {/* Pricing Cards */}
            <section className="py-16">
                <div className="container-wide">
                    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {packages.map((pkg) => (
                            <Card key={pkg.id} className={`relative ${pkg.popular ? 'border-primary shadow-lg scale-105' : ''}`}>
                                {pkg.popular && (
                                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                        <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                                            <Star className="w-3 h-3" />
                                            Most Popular
                                        </div>
                                    </div>
                                )}

                                <CardHeader className="text-center pb-4">
                                    <CardTitle className="text-2xl">{pkg.name}</CardTitle>
                                    <CardDescription className="text-sm">{pkg.description}</CardDescription>

                                    <div className="mt-4">
                                        <div className="text-3xl font-bold">${pkg.price}</div>
                                        <div className="text-sm text-muted-foreground">+ ${pkg.govtFee} state fee</div>
                                        <div className="text-lg font-semibold text-primary mt-1">
                                            ${pkg.total} total
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-4">
                                    <div className="space-y-3">
                                        {pkg.includes.map((feature, idx) => (
                                            <div key={idx} className="flex items-center gap-3">
                                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                <span className="text-sm">{feature}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="pt-4">
                                        <Button
                                            asChild
                                            className="w-full"
                                            variant={pkg.popular ? "primary" : "default"}
                                        >
                                            <Link href="/app/start">
                                                {pkg.id === 'express' && <Zap className="w-4 h-4 mr-2" />}
                                                Get Started
                                            </Link>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Add-ons Section */}
            <section className="py-16 bg-muted/30">
                <div className="container-wide">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold mb-4">Add-on Services</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            Enhance your LLC formation with additional services.
                            Add these to any package or purchase separately.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                        {addons.map((addon, idx) => (
                            <Card key={idx}>
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-lg">{addon.name}</CardTitle>
                                        <div className="text-right">
                                            <div className="text-xl font-bold">${addon.price}</div>
                                        </div>
                                    </div>
                                    <CardDescription className="text-sm">
                                        {addon.description}
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-16">
                <div className="container-wide max-w-4xl mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>

                    <div className="space-y-8">
                        <div>
                            <h3 className="text-lg font-semibold mb-2">What's included in the state fee?</h3>
                            <p className="text-muted-foreground">
                                The state fee covers the official government filing cost required by your chosen state.
                                Wyoming charges $100, Delaware $90, Nevada $75. This fee goes directly to the state.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-2">How long does LLC formation take?</h3>
                            <p className="text-muted-foreground">
                                Standard processing takes 3-7 business days depending on the state.
                                Express service can reduce this to 1-3 business days for an additional fee.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-2">Do I need a registered agent?</h3>
                            <p className="text-muted-foreground">
                                Yes, most states require a registered agent. We provide this service for $99/year,
                                or you can serve as your own registered agent if you have a physical address in the state.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-2">What if I need to make changes later?</h3>
                            <p className="text-muted-foreground">
                                We offer amendment services for name changes, address updates, and other modifications.
                                Contact our support team for pricing and assistance.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-primary text-primary-foreground">
                <div className="container-wide text-center">
                    <h2 className="text-3xl font-bold mb-4">
                        Ready to Start Your LLC?
                    </h2>
                    <p className="text-xl mb-8 opacity-90">
                        Join thousands of entrepreneurs who trust FileFlow for their business formation needs.
                    </p>
                    <Button asChild variant="ghost" className="bg-white text-primary hover:bg-white/90">
                        <Link href="/app/start">
                            Start Your LLC Today
                        </Link>
                    </Button>
                </div>
            </section>
        </div>
    );
}
